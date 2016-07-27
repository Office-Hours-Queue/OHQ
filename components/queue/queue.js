var db = require('../../db');
var dbEvents = require('../../db-events');
var EventEmitter = require('events');

//
// Queue questions
//

var questions = (function() {
  var result = {
    get: selectQuestion,
    openQuestions: selectOpenQuestions,
    emitter: new EventEmitter()
  };
  dbEvents.questions.on('update', function(id) {
    selectQuestion(id).then(function(question) {
      result.emitter.emit('update', question);
    });
  });
  dbEvents.questions.on('insert', function(id) {
    selectQuestion(id).then(function(question) {
      result.emitter.emit('insert', question);
    });
  });
  dbEvents.questions.on('delete', function(id) {
    result.emitter.emit('delete', id);
  });
  return result;
})();

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

function selectQuestion(id) {
  return selectQuestionFields()
    .where('q.id', id)
    .first();
}

function selectOpenQuestions() {
  return selectQuestionFields()
    .where('q.off_time', null)
    .andWhere(function() {
      // not frozen: end_max_time < now() && end_time < now()
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


//
// Queue meta state
//

var meta = (function() {
  var result = {
    get: selectMeta,
    getCurrent: selectCurrentMeta,
    emitter: new EventEmitter()
  };
  dbEvents.queueMeta.on('update', function(id) {
    selectMeta(id).then(function(queueMeta) {
      result.emitter.emit('update', queueMeta);
    });
  });
  dbEvents.queueMeta.on('insert', function(id) {
    selectMeta(id).then(function(queueMeta) {
      result.emitter.emit('insert', queueMeta);
    });
  });
  dbEvents.queueMeta.on('delete', function(id) {
    result.emitter.emit('delete', id);
  });
  return result;
})();

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
