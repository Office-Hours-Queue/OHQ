var db = require('../../../db');
var question_emitter = require('../../queue/queue').questions.emitter;
var EventEmitter = require('events');

// Exported functions for question count
//
// Emitter events:
//
//   // When CA's question count changes
//   .on('ca_question_count', {
//     user_id,
//     first_name,
//     last_name,
//     count,
//   })
//
var counts = (function() {
  var result = {
    getQuestionCountAllCas: selectQuestionCountAllCas,
    getQuestionCountCa: selectQuestionCountCa,
    getUniqueStudentCountCa: selectUniqueStudentCountCa,
    emitter: new EventEmitter(),
  };

  question_emitter.on('question_closed', function(question) {
    if (question.ca_user_id !== null) {
      selectQuestionCountCa(question.ca_user_id, question.course_id).first().then(function(user) {
        result.emitter.emit('ca_question_count', user, question.course_id);
      });
    }
  });

  return result;
})();

function selectDefaultUserFields() {
  return db.select(
      'u.id AS user_id',
      'u.first_name AS first_name',
      'u.last_name AS last_name'
    );
}

// Get the question count for each CA
function selectQuestionCountAllCas(course_id) {
  return selectQuestionCount(course_id);
}


// Get the question count for one CA
function selectQuestionCountCa(userid, course_id) {
  return selectQuestionCount(course_id).where('u.id', userid);
}

function selectQuestionCount(course_id) {
  return selectDefaultUserFields()
    .count('q AS question_count')
    .from('users AS u')
    .leftJoin('questions AS q', function() {
      this.on('u.id', 'q.ca_user_id')
          .andOn(db.raw('q.off_reason = \'normal\''));
    })
    .leftJoin('roles AS r', function () {
      this.on('u.id', 'r.user')
          .andOn('q.course_id', 'r.course');
    })
    .where({'r.role': 'ca', 'r.course': course_id})
    .groupBy('u.id');
}

// Get the number of unique students helped for a CA
function selectUniqueStudentCountCa(userid, course_id) {
  return selectUniqueStudentCount(course_id)
    .where('u.id', userid)
    .first();
}

// Get the number of unique students helped
function selectUniqueStudentCount(course_id) {
  return selectDefaultUserFields()
    .countDistinct('q.student_user_id AS unique_student_count')
    .from('users AS u')
    .leftJoin('questions AS q', function() {
      this.on('u.id', 'q.ca_user_id')
          .andOn(db.raw('q.off_reason = \'normal\''));
    })
    .leftJoin('roles AS r', function () {
      this.on('u.id', 'r.user')
          .andOn('q.course_id', 'r.course');
    })
    .where({'r.role': 'ca', 'r.course': course_id})
    .groupBy('u.id');
}

module.exports.counts = counts;
