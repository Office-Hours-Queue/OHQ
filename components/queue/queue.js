var db = require('../../db');
var dbEvents = require('../../db-events');
var EventEmitter = require('events');
var validator = require('jsonschema').validate;

//
// Queue questions
//

var questions = (function() {
  var result = {
    getId: selectQuestionId,
    getOpen: selectQuestionsOpen,
    add: addQuestion,
    update: updateQuestion,
    close: closeQuestion,
    freeze: freezeQuestion,
    emitter: new EventEmitter()
  };
  dbEvents.questions.on('update', function(id) {
    selectQuestionId(id).then(function(question) {
      result.emitter.emit('update', question);
    });
  });
  dbEvents.questions.on('insert', function(id) {
    selectQuestionId(id).then(function(question) {
      result.emitter.emit('insert', question);
    });
  });
  dbEvents.questions.on('delete', function(id) {
    result.emitter.emit('delete', id);
  });
  return result;
})();

// get question by id
function selectQuestionId(id) {
  return selectQuestionFields()
    .where('q.id', id)
    .first();
}

// get open questions
function selectQuestionsOpen() {
  return selectQuestionFields()
    .where('q.off_time', null)
    .andWhere(function() {
      // not frozen: frozen_end_max_time < now() && frozen_end_time < now()
      this
        .where(function() {
          this.where('q.frozen_end_max_time', null)
              .orWhere('q.frozen_end_max_time', '<', db.fn.now());
        })
        .andWhere(function() {
          this.where('q.frozen_end_time', null)
              .orWhere('q.frozen_end_time', '<', db.fn.now());
        });
    })
    .orderBy('q.on_time', 'desc');
}

// add a new question
function addQuestion(question) {
  // do some validation
  var questionInsertionSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      student_user_id: {
        type: 'integer',
        required: true
      },
      topic_id: {
        type: 'integer',
        required: true
      },
      location_id: {
        type: 'integer',
        required: true
      },
      help_text: {
        type: 'string',
        required: true
      }
    }
  };

  var valid = validator(question, questionInsertionSchema);

  if (!valid.valid) {
    throw new Error('Invalid input');
  }

  // prepare the full object
  var insertQuestion = {
    student_user_id: question.student_user_id,
    topic_id: question.topic_id,
    location_id: question.location_id,
    help_text: question.help_text,
    on_time: db.fn.now()
  };

  // insert the question
  db.count('*')
    .from('questions')
    .where('student_user_id', insertQuestion.student_user_id)
    .first()
    .then(function(activeQuestions) {
      if (parseInt(activeQuestions.count) !== 0) {
        throw new Error('Student has question already');
      } else {
        db.insert(insertQuestion)
          .into('questions')
          .return(null);
      }
    })
    .catch(function(error) {
      console.log(error);
    });
}

// update a question's details
function updateQuestion(userId, question) {
  var questionUpdateSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      location_id: {
        type: 'integer',
        required: false
      },
      topic_id: {
        type: 'integer',
        required: false
      },
      help_text: {
        type: 'string',
        required: false
      }
    }
  };

  var valid = validator(question, questionUpdateSchema);
  
  if (!valid.valid) {
    throw new Error('Invalid input');
  }

  db('questions')
    .update(question)
    .where('student_user_id', userId)
    .andWhere('off_time', null)
    .return(null);
}

// close a question
function closeQuestion(userId, userRole) {
  db('questions')
    .update({
      off_time: db.fn.now(),
      off_reason: userRole === 'student' ? 'self_kick' : 'ca_kick'
    })
    .where('student_user_id', userId)
    .andWhere('off_time', null)
    .return(null);
}

// freeze a question
function freezeQuestion(userId) {
  db('questions')
    .update({
      frozen_by: userId,
      frozen_time: db.fn.now(),
      frozen_end_max_time: db.raw(
        'NOW() + INTERVAL \'1 second\' * (SELECT max_freeze FROM queue_meta ORDER BY id DESC LIMIT 1)')
    })
    .where('student_user_id', userId)
    .andWhere('off_time', null)
    .andWhere('frozen_time', null)
    .return(null);
}

function selectQuestionFields() {
  return db.select(
      'us.first_name AS studentFirstName',
      'us.last_name AS studentLastName',
      'uf.first_name AS frozenByFirst_name',
      'uf.last_name AS frozenByLastName',
      'uc.first_name AS caFirstName',
      'uc.last_name AS caLastName',
      'ue.first_name AS initialCaFirstName',
      'ue.last_name AS initialCaLastName',
      't.topic AS topic',
      'l.location AS location',
      'q.help_text AS helpText',
      'q.on_time AS onTime',
      'q.frozen_time AS frozenTime',
      'q.frozen_end_max_time AS frozenEndMaxTime',
      'q.frozen_end_time AS frozenEndTime',
      'q.help_time AS helpTime',
      'q.initial_help_time AS initialHelpTime',
      'q.off_time AS offTime',
      'q.off_reason AS offReason')
    .from('questions AS q')
    .leftJoin('users AS us', 'us.id', 'q.student_user_id')
    .leftJoin('users AS uf', 'uf.id', 'q.frozen_by')
    .leftJoin('users AS uc', 'uc.id', 'q.ca_user_id')
    .leftJoin('users AS ue', 'ue.id', 'q.initial_ca_user_id')
    .leftJoin('topics AS t', 't.id', 'q.topic_id')
    .leftJoin('locations AS l', 'l.id', 'q.location_id');
}


//
// Queue meta state
//

var meta = (function() {
  var result = {
    get: selectMeta,
    getCurrent: selectCurrentMeta,
    close: setQueueState(false),
    open: setQueueState(true),
    setTimeLimit: setTimeLimit,
    emitter: new EventEmitter()
  };
  dbEvents.queue_meta.on('update', function(id) {
    selectCurrentMeta().then(function(meta) {
      result.emitter.emit('update', cleanMeta(meta));
    });
  });
  return result;
})();

function setTimeLimit(minutes) {
  if (Number.isInteger(parseInt(minutes)) && minutes > 0) {
    db('queue_meta')
      .update({ time_limit: minutes })
      .return(null);
  }
}

function cleanMeta(meta) {
  delete meta.registration_code;
  delete meta.id;
  return meta;
}

function setQueueState(state) {
  return function() {
    db('queue_meta')
      .update({ open: state })
      .return(null);
  }
}

function selectMeta(id) {
  return db.select(
      'open',
      'max_freeze AS maxFreeze',
      'time_limit AS timeLimit'
    )
    .from('queue_meta')
    .where('id', id)
    .first();
}

function selectCurrentMeta() {
  return db.select(
      'open',
      'max_freeze AS maxFreeze',
      'time_limit AS timeLimit'
    )
    .from('queue_meta')
    .orderBy('id', 'asc')
    .first();
}

module.exports.questions = questions;
module.exports.meta = meta;
