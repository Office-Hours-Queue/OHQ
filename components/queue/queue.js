var db = require('../../db');
var dbEvents = require('../../db-events');
var EventEmitter = require('events');
var validator = require('jsonschema').validate;
var diff = require('deep-diff').diff;

//
// Queue questions
//

var questions = (function() {
  var result = {
    getId: selectQuestionId,
    getOpen: selectQuestionsOpen,
    getUserId: selectQuestionUserId,
    getOpenUserId: selectOpenQuestionUserId,
    getAnsweringUserId: selectAnsweringQuestionCaUserId,
    getNumQuestions: getNumberQuestions,
    add: addQuestion,
    answer: answerQuestion,
    freezeStudent: freezeStudentQuestion,
    unfreezeStudent: unfreezeStudentQuestion,
    freezeCa: freezeCaQuestion,
    freeze: freezeQuestionId,
    updateMeta: updateQuestionMeta,
    closeStudent: closeStudentQuestion,
    closeCa: closeCaQuestion,
    emitter: new EventEmitter()
  };

  dbEvents.questions.on('update', function(newQuestion, oldQuestion) {
    // something happened to an existing question. find out what happened,
    // then emit an appropriate event
    var id = newQuestion.id;
    var changes = diff(oldQuestion, newQuestion);
    for (var i in changes) {
      var change = changes[i];

      // there shouldn't be any adds/deletes
      if (['A', 'N', 'D'].indexOf(change.kind) !== -1) {
        throw new Error("Consistency error - row has added/deleted fields");
      }

      // the path shouldn't be nested
      if (change.path.length !== 1) {
        throw new Error("Consistency error - row is nested");
      }

      var emitEvent = function(eventName) {
        selectQuestionId(id).then(function(question) {
          result.emitter.emit(eventName, question);
        });
      };

      //number of questions updates 
      getNumberQuestions()

      // check which field was updated, and emit an event
      var field = change.path[0];
      switch (field) {
        case 'frozen_time':
          console.log('question_frozen');
          emitEvent('question_frozen');
          break;
        case 'frozen_end_time':
          console.log("question unfrozen");
          emitEvent('question_unfrozen');
          break;
        case 'frozen_end_max_time':

          break;
        case 'help_time':
          console.log('question_answered');
          emitEvent('question_answered');
          break;
        case 'off_time':
          console.log('question_closed');
          emitEvent('question_closed');
          break;
        case "topic_id":
          emitEvent('question_update');
          break;
        case "location_id":
          emitEvent('question_update');
          break;
        case "help_text":
          emitEvent('question_update');
          break;
      }
    }

  });

  dbEvents.questions.on('insert', function(newQuestion) {
    // emit the full inserted object
    selectQuestionId(newQuestion.id).then(function(question) {
      result.emitter.emit('new_question', question);
      getNumberQuestions()
    });
  });

  dbEvents.questions.on('delete', function(oldQuestion) {
    // this shouldn't happen, so let's log it
    throw new Error('Question deleted');
  });

  return result;
})();

//
// Question selectors
//

function selectDefaultQuestionFields() {
  return db.select(
      'q.id                  AS id',
      'us.id                 AS student_user_id',
      'us.first_name         AS student_first_name',
      'us.last_name          AS student_last_name',
      'us.andrew_id          AS student_andrew_id',
      'uf.first_name         AS frozen_by_first_name',
      'uf.last_name          AS frozen_by_last_name',
      'uc.id                 AS ca_user_id',
      'uc.first_name         AS ca_first_name',
      'uc.last_name          AS ca_last_name',
      'ue.id                 AS initial_ca_user_id',
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
      },
      function() {
        this.select(questionFrozen())
          .first()
          .as('is_frozen');
      },
      function() {
        this.select(questionCanFreeze())
          .first()
          .as('can_freeze');
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
  return selectDefaultQuestionFields()
    .where('q.student_user_id', id)
    .andWhere(questionOpen())
    .first();
}

// get currently answering question by user id
function selectAnsweringQuestionCaUserId(caUserId) {
  return selectDefaultQuestionFields()
    .where('q.ca_user_id', caUserId)
    .andWhere(questionAnswering())
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
  return db.raw('(q.help_time IS NULL AND q.off_time IS NULL)');
}

// condition for a question to be closed
function questionClosed() {
  return db.raw('(q.off_time IS NOT NULL)');
}

// condition for a question to be answering
function questionAnswering() {
  return db.raw('(q.help_time IS NOT NULL AND q.off_time IS NULL)');
}

// condition for a question to be frozen
function questionFrozen() {
  return db.raw(
        '(q.frozen_time IS NOT NULL AND ' +
        'q.frozen_end_time > NOW() AND ' +
        'q.frozen_end_max_time > NOW())'
    );
}

// condition for a question to be not frozen
// (apply demorgan's to questionFrozen)
function questionNotFrozen() {
  return db.raw(
        '(q.frozen_time IS NULL OR ' +
        ' q.frozen_end_time < NOW() OR ' +
        ' q.frozen_end_max_time < NOW())'
    );
}

// condition for whether a question can be frozen
function questionCanFreeze() {
  return db.raw(
        '(q.frozen_time IS NULL AND ' +
        ' q.off_time IS NULL)');
}


//
// Question creators
//


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
    .from('questions AS q')
    .where('q.student_user_id', insertQuestion.student_user_id)
    .where(questionOpen())
    .first()
    .then(function(activeQuestions) {
      if (parseInt(activeQuestions.count) !== 0) {
        throw new Error('Student has question already');
      } else {
        return db.insert(insertQuestion)
          .into('questions')
          .return(null);
      }
    })
    .catch(function(error) {
      console.log(error);
    });
}

//
// Question updates
//

// n_question update
function getNumberQuestions() {
    db.count('q.id').from('questions AS q')
    .where(questionNotFrozen()).andWhere(questionOpen())
    .first().then(function(res) {
      questions.emitter.emit("n_question_update",res.count);
    }); 
}

// answer a question
function answerQuestion(caUserId) {
  db('questions')
    .update({
      help_time: db.fn.now(),
      ca_user_id: caUserId
    })
    .whereIn('id', function() {
      this.select('id')
          .from('questions AS q')
          .where(questionNotFrozen())
          .andWhere(questionOpen())
          .orderBy('on_time', 'asc')
          .first();
    })
    .then();
}

// update a question's details
function updateQuestionMeta(userId, question) {
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

// close the student's active question
function closeStudentQuestion(studentId) {
  return closeQuestion('self_kick', studentId)
    .where('q.student_user_id', studentId)
    .andWhere(questionOpen())
    .then();
}

// close the ca's active question
function closeCaQuestion(caUserId, reason) {
  return closeQuestion(reason, caUserId)
    .where('q.ca_user_id', caUserId)
    .andWhere(questionAnswering())
    .then();
}

// close an arbitary question
function closeQuestionId(userid, reason, questionId) {
  return closeQuestion(reason, userid)
    .where('q.id', questionId)
    .andWhere('q.off_time', null)
    .then();
}

// update clause for question close
function closeQuestion(reason, offBy) {
  return db('questions AS q')
    .update({
      off_time: db.fn.now(),
      off_reason: reason,
      off_by: offBy
    });
}

// freeze a student's question
function freezeStudentQuestion(studentId) {
  return freezeQuestion(studentId)
    .where(questionOpen())
    .andWhere('q.student_user_id', studentId)
    .then();
}

// unfreeze a student's question
function unfreezeStudentQuestion(studentId) {
  return unfreezeQuestion(studentId)
    .where(questionOpen())
    .andWhere('q.student_user_id', studentId)
    .then();
}

// freeze a ca's current question
function freezeCaQuestion(caUserId) {
  return freezeQuestion(caUserId)
    .where(questionAnswering())
    .andWhere('q.ca_user_id', caUserId)
    .then();
}

// freeze a specific question
function freezeQuestionId(questionId, freezeByUserId) {
  return freezeQuestion(freezeByUserId)
    .where('q.id', questionId)
    .then();
}

// update clause for question freeze
function freezeQuestion(frozenById) {
  return db('questions AS q')
    .update({
      frozen_by: frozenById,
      frozen_time: db.fn.now(),
      frozen_end_max_time: db.raw(
        'NOW() + INTERVAL \'1 second\' * (SELECT max_freeze FROM queue_meta ORDER BY id DESC LIMIT 1)'),
      frozen_end_time: db.raw(
        'NOW() + INTERVAL \'1 second\' * (SELECT max_freeze FROM queue_meta ORDER BY id DESC LIMIT 1)'),
      initial_help_time: db.raw('help_time'),
      initial_ca_user_id: db.raw('ca_user_id'),
      help_time: null,
      ca_user_id: null
    })
    .where('q.frozen_time', null);
}

// update clause for question unfreeze
function unfreezeQuestion(frozenById) {
  return db('questions AS q')
    .update({ frozen_end_time: db.fn.now()});
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
  dbEvents.queue_meta.on('update', function(newMeta, oldMeta) {
    result.emitter.emit('update', cleanMeta(newMeta));
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
  };
}

function selectMeta(id) {
  return db.select(
      'open',
      'max_freeze',
      'time_limit'
    )
    .from('queue_meta')
    .where('id', id)
    .first();
}

function selectCurrentMeta() {
  return db.select(
      'open',
      'max_freeze',
      'time_limit'
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
