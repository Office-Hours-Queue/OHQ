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
    getUserId: selectQuestionUserId,
    getOpenUserId: selectOpenQuestionUserId,
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

function selectDefaultQuestionFields() {
  return db.select(
      'q.id                  AS id',
      'us.first_name         AS student_first_name',
      'us.last_name          AS student_last_name',
      'uf.first_name         AS frozen_by_first_name',
      'uf.last_name          AS frozen_by_last_name',
      'uc.first_name         AS ca_first_name',
      'uc.last_name          AS ca_last_name',
      'ue.first_name         AS initial_ca_first_name',
      'ue.last_name          AS initial_ca_last_name',
      't.id                  AS topic_id',
      't.topic               AS topic',
      'l.id                  AS location_id',
      'l.location            AS location',
      'q.help_text           AS help_text',
      'q.on_time             AS on_time',
      'q.frozen_time         AS frozen_time',
      'q.frozen_end_max_time AS frozen_end_max_time',
      'q.frozen_end_time     AS frozen_end_time',
      'q.help_time           AS help_time',
      'q.initial_help_time   AS initial_help_time',
      'q.off_time            AS off_time',
      'q.off_reason          AS off_reason',
      function() {
        this.count('aq.id')
            .from('questions AS aq')
            .where('aq.off_time', null)
            .andWhere(db.raw('aq.on_time < q.on_time'))
            .as('queue_position');
      }
    )
    .from('questions AS q')
    .leftJoin('users AS us', 'us.id', 'q.student_user_id')
    .leftJoin('users AS uf', 'uf.id', 'q.frozen_by')
    .leftJoin('users AS uc', 'uc.id', 'q.ca_user_id')
    .leftJoin('users AS ue', 'ue.id', 'q.initial_ca_user_id')
    .leftJoin('topics AS t', 't.id', 'q.topic_id')
    .leftJoin('locations AS l', 'l.id', 'q.location_id');
}

// get question by id
function selectQuestionId(id) {
  return selectDefaultQuestionFields()
    .where('q.id', id)
    .first();
}

// get question by user id
function selectQuestionUserId(id) {
  return selectDefaultQuestionFields()
    .where('q.student_user_id', id);
}

// get active question by user id
function selectOpenQuestionUserId(id) {
  return selectQuestionUserId(id)
    .where(questionOpen())
    .first();
}

// get open questions
function selectQuestionsOpen() {
  return selectDefaultQuestionFields()
    .where(questionOpen())
    .orderBy('q.on_time', 'desc');
}

// condition for a question to be open
function questionOpen() {
  return db.raw('q.off_time IS NULL');
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

//
// locations
//
var locations = (function() {
  return {
    getAll: selectAllLocations,
    getEnabled: selectEnabledLocations
  };
})();

function selectAllLocations() {
  return db.select(
      'id',
      'location',
      'enabled'
    )
    .from('locations');
}

function selectEnabledLocations() {
  return selectAllLocations().where('enabled', true);
}

//
// topics
//
var topics = (function() {
  return {
    getAll: selectAllTopics,
    getEnabled: selectEnabledTopics
  };
})();

function selectAllTopics() {
  return db.select(
      'id',
      'topic',
      'enabled'
    )
    .from('topics');
}

function selectEnabledTopics() {
  return selectAllTopics().where('enabled', true);
}


module.exports.questions = questions;
module.exports.meta = meta;
module.exports.locations = locations;
module.exports.topics = topics;
