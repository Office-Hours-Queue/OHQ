var queue = require('./queue');
var auth = require('../../auth');
var debug = require('debug')('app:io');
var Promise = require('bluebird');

//
// Main queue update stream.
//
// This socket.io endpoint emits the current queue state on connect,
// then keeps the client updated with events.
//

module.exports.queue = function(io) {

  // make sure that this endpoint is protected
  io.use(auth.ioIsAuthenticated);

  // on client connection, join appropriate room, and
  // handle subsequent client -> server communications
  // students join room student_USERID
  // cas join room cas_USERID
  io.on('connection', function(socket) {
    var userid = socket.request.user.id;
    socket.on('join_course', function(course_id) {
      if (socket.request.user.roles[course_id] === 'ca') {
        socket.join(course_id + '_ca');
        socket.join(course_id + '_ca_' + socket.request.user.id);
        oncajoin(socket, userid, course_id);
        socket.emit('joined');
      } else {
        socket.join(course_id + '_student');
        socket.join(course_id + '_student_' + socket.request.user.id);
        onstudentjoin(socket, userid, course_id);
        socket.emit('joined');
      }
    });
  });

  // these helper utilities get a handle to the corresponding
  // socket.io room
  var cas = function(course_id) {
    return io.to(course_id + '_ca');
  };
  var ca = function(userid, course_id) {
    return io.to(course_id + '_ca_' + userid);
  };
  var students = function(course_id) {
    return io.to(course_id + '_student');
  };
  var student = function(userid, course_id) {
    return io.to(course_id + '_student_' + userid);
  };

  //
  // CA handling
  // client -> server
  //

  // when a ca joins, we need to listen for messages they send, and
  // send down the current data
  var oncajoin = function(socket, userid, course_id) {

    //
    // listen for CA events
    //

    socket.on('freeze_question', function() {
      queue.questions.freezeCa(userid, course_id);
    });

    socket.on('kick_question', function() {
      queue.questions.closeCa(userid, 'ca_kick', course_id);
    });

    socket.on('finish_question', function() {
      queue.questions.closeCa(userid, 'normal', course_id);
    });

    socket.on('answer_question', function() {
      queue.questions.answer(userid, course_id);
    });

    socket.on("return_question", function () {
      queue.questions.return(userid, course_id);
    });

    socket.on('close_queue', function() {
      queue.meta.close(userid, course_id);
    });

    socket.on('open_queue', function() {
      queue.meta.open(userid, course_id);
    });

    socket.on('update_minute_rule', function(minutes) {
      queue.meta.setTimeLimit(minutes, userid, course_id);
    });

    socket.on("enable_topic", function (topic) {
      queue.topics.enableTopic(topic, course_id);
    });

    socket.on("enable_location", function(loc) {
      queue.locations.enableLocation(loc, course_id);
    });

    socket.on('delete_topic', function (topic) {
      queue.topics.deleteTopic(topic, course_id);
    });

    socket.on("delete_location", function (location) {
      queue.locations.deleteLocation(location, course_id);
    });

    socket.on('add_topic', function (topic) {
      console.log(topic);
      queue.topics.addTopic(topic, course_id);
    });

    socket.on('add_location', function (location) {
      queue.locations.addLocation(location, course_id);
    });

    //
    // emit current ca data
    //

    queue.meta.getCurrent(course_id).then(function(meta) {
      socket.emit('queue_meta', makeMessage('data', [{
        id: 0,
        open: meta.open,
        time_limit: meta.time_limit
      }]));
    });

    queue.questions.getOpen(course_id).then(function(questions) {
      questions.forEach(function(question) {
        socket.emit('questions_initial', makeCaQuestion(question));
      });
    });

    queue.questions.getAnsweringUserId(userid, course_id).then(function(question) {
      if (typeof question !== 'undefined') {
        socket.emit('current_question', makeCaQuestion(question));
      }
    });

    queue.locations.getAll(course_id).then(function(locations) {
      socket.emit('locations', makeMessage('data', locations));
    });

    queue.topics.getAll(course_id).then(function(topics) {
      socket.emit('topics', makeMessage('data', topics));
    });

  };

  //
  // CA handling
  // server -> client
  //

  (function() {

    queue.questions.emitter.on('new_question', emitCaQuestion);
    queue.questions.emitter.on('question_frozen', emitCaQuestion);
    queue.questions.emitter.on('question_unfrozen', emitCaQuestion);
    queue.questions.emitter.on('question_answered', emitCaQuestion);
    queue.questions.emitter.on('question_update', emitCaQuestion);

    queue.questions.emitter.on('question_frozen', function(question) {
      if (question.initial_ca_user_id !== null) {
        ca(question.initial_ca_user_id, question.course_id).emit('current_question', makeMessage('delete', [question.id]));
      }
    });

    queue.questions.emitter.on('question_answered', function(question) {
      ca(question.ca_user_id, question.course_id).emit('current_question', makeCaQuestion(question));
    });

    queue.questions.emitter.on('question_closed', function(question) {
      ca(question.ca_user_id, question.course_id).emit('current_question', makeMessage('delete', [question.id]));
      cas(question.course_id).emit('questions', makeMessage('delete', [question.id]));
    });

    queue.questions.emitter.on("question_returned", function (ca_user_id,question_id,course_id) {
      ca(ca_user_id, course_id).emit('current_question', makeMessage('delete', [question_id]));
    });

    queue.meta.emitter.on('update', function(meta) {
      cas(meta.course_id).emit('queue_meta', makeMessage('data', [{
        id: 0,
        open: meta.open,
        time_limit: meta.time_limit
      }]));
    });

    queue.locations.emitter.on("new_location", function (loc) {
      cas(loc[0].course_id).emit("locations", makeMessage('data',loc));
    });

    queue.locations.emitter.on("update_location", function (loc) {
      cas(loc[0].course_id).emit("locations", makeMessage('data',loc));
    });

   queue.topics.emitter.on("new_topic", function (topic) {
      cas(topic[0].course_id).emit("topics", makeMessage('data',topic));
    });

    queue.topics.emitter.on("update_topic", function (topic) {
      cas(topic[0].course_id).emit("topics", makeMessage('data',topic));
    });


  })();


  //
  // Student handling
  // client -> server
  //

  // when a student joins, listen for messages they send, and
  // send down the current data
  var onstudentjoin = function(socket, userid, course_id) {

    //
    // listen for student events
    //

    socket.on('new_question', function(question) {
      question.student_user_id = userid;
      try {
        queue.questions.add(question);
      } catch(error) {
        console.log(error);
      }
    });

    socket.on('update_question', function(question) {
      try {
        queue.questions.updateMeta(userid, question, course_id);
      } catch (error) {
        console.log(error);
      }
    });

    socket.on('delete_question', function() {
      queue.questions.closeStudent(userid, course_id);
    });

    socket.on('freeze_question', function() {
      queue.questions.freezeStudent(userid, course_id);
    });

    socket.on('unfreeze_question', function() {
      queue.questions.unfreezeStudent(userid, course_id);
    });

    //
    // emit the current data on connect
    //

    getStudentMeta(course_id).then(function(meta) {
      socket.emit('queue_meta', makeMessage('data', [meta]));
    });

    queue.locations.getEnabled(course_id).then(function(locations) {
      socket.emit('locations', makeMessage('data', locations));
    });

    queue.topics.getEnabled(course_id).then(function(topics) {
      socket.emit('topics', makeMessage('data', topics));
    });

    queue.questions.getOpenUserId(userid, course_id).then(function(question) {
      if (typeof question !== 'undefined') {
        student(userid, course_id).emit('questions', makeStudentQuestion(question));
      }
    });

  };

  //
  // Student handling
  // server -> client
  //

  (function() {

    queue.questions.emitter.on('new_question', emitStudentQuestion);
    queue.questions.emitter.on('question_frozen', emitStudentQuestion);
    queue.questions.emitter.on('question_unfrozen', emitStudentQuestion);
    queue.questions.emitter.on('question_update', emitStudentQuestion);

    queue.questions.emitter.on('question_answered', function(question) {
      // tell everyone their new position on the queue
      queue.questions.getOpen(question.course_id).then(function(questions) {
        questions.forEach(emitStudentQuestion);
      });
      //notify student that ca is coming
      emitStudentQuestion(question);
    });

    queue.questions.emitter.on('question_closed', function(question) {
      // tell everyone their new position on the queue
      queue.questions.getOpen(question.course_id).then(function(questions) {
        questions.forEach(emitStudentQuestion);
      });
      // notify student their question was closed
      student(question.student_user_id, question.course_id).emit('questions', makeMessage('delete', [question.id]));
    });

    // listen for updates on queue_meta
    // all of the events below potentially affect the queue length, so send updates
    queue.meta.emitter.on('update', emitStudentMeta);
    queue.questions.emitter.on('question_answered', emitStudentMeta);
    queue.questions.emitter.on('new_question', emitStudentMeta);
    queue.questions.emitter.on('question_frozen', emitStudentMeta);
    queue.questions.emitter.on('question_closed', emitStudentMeta);

    queue.locations.emitter.on("new_location", function (loc) {
      students(loc[0].course_id).emit("locations", makeMessage('data',loc));
    });

    queue.locations.emitter.on("update_location", function (loc) {
      if (!(loc[0].enabled)) {
        students(loc[0].course_id).emit("locations",makeMessage('delete', [loc[0].id] ));
      } else {
        students(loc[0].course_id).emit("locations", makeMessage('data',loc));
      }
    });

   queue.topics.emitter.on("new_topic", function (topic) {
      students(topic[0].course_id).emit("topics", makeMessage('data',topic));
    });

    queue.topics.emitter.on("update_topic", function (topic) {
      if (!(topic[0].enabled)){
        students(topic[0].course_id).emit('topics', makeMessage('delete', [topic[0].id] ));
      } else {
        students(topic[0].course_id).emit("topics", makeMessage('data',topic));
      }
    });

  })();

  function getStudentMeta(course_id) {
    return Promise.join(
        queue.meta.getCurrent(course_id),
        queue.questions.getOpenCount(course_id),
        function(meta, count) {
          return Promise.resolve({
            id: 0,
            open: meta.open,
            num_questions: count,
            course_id: course_id
          });
        });
  }

  function emitStudentMeta(meta) {
    getStudentMeta(meta.course_id).then(function(meta) {
      students(meta.course_id).emit('queue_meta', makeMessage('data', [meta]));
    });
  }

  function emitCaQuestion(question) {
    cas(question.course_id).emit('questions', makeCaQuestion(question));
  };

  function emitStudentQuestion(question) {
    student(question.student_user_id, question.course_id).emit('questions', makeStudentQuestion(question));
  };

};

//
// Queue history endpoint
//
// This endpoint emits the past n questions, given by the 'count'
// querystring paramter. It then keeps clients updated on closed questions.
//
module.exports.history = function(io) {

  // make sure that this endpoint is protected
  io.use(auth.ioIsAuthenticated);

  // on client connection, join appropriate room, and
  // handle subsequent client -> server communications
  // students join room student_USERID
  // cas join room cas_USERID
  io.on('connection', function(socket) {
    var userid = socket.request.user.id;
    socket.on('join_course', function(course_id) {
      if (socket.request.user.roles[course_id] === 'ca') {
        socket.join(course_id + '_ca');
        socket.join(course_id + '_ca_' + socket.request.user.id);
        oncajoin(socket, userid, course_id);
        socket.emit('joined');
      } else {
        socket.join(course_id + '_student');
        socket.join(course_id + '_student_' + socket.request.user.id);
        onstudentjoin(socket, userid, course_id);
        socket.emit('joined');
      }
    });
  });

  // these helper utilities get a handle to the corresponding
  // socket.io room
  var cas = function(course_id) {
    return io.to(course_id + '_ca');
  };
  var ca = function(userid, course_id) {
    return io.to(course_id + '_ca_' + userid);
  };
  var students = function(course_id) {
    return io.to(course_id + '_student');
  };
  var student = function(userid, course_id) {
    return io.to(course_id + '_student_' + userid);
  };

  // on connect, send down the latest n closed questions
  var oncajoin = function(socket, userid, course_id) {
    socket.on('get_last_n', function(n) {
      if (Number.isInteger(n)) {
        queue.questions.getLatestClosed(n, course_id).then(function(questions) {
          questions.forEach(function(question) {
            socket.emit('questions', makeCaQuestion(question));
          });
        });
      }
    });
  };

  var onstudentjoin = function(socket, userid, course_id) {
    socket.on('get_last_n', function(n) {
      if (Number.isInteger(n)) {
        queue.questions.getLatestClosedUserId(n, userid, course_id).then(function(questions) {
          questions.forEach(function(question) {
            socket.emit('questions', makeStudentQuestion(question));
          });
        });
      }
    });
  };

  // listen for new closed questions, and send them to cas + student
  (function () {
    queue.questions.emitter.on('question_closed', function(question) {
      cas(question.course_id).emit('questions', makeCaQuestion(question));
    });
    queue.questions.emitter.on('question_closed', function(question) {
      student(question.student_user_id, question.course_id).emit('questions', makeStudentQuestion(question));
    });
  })();

};


// Queue wait time endpoint
//
// This endpoint emits the average wait time data for the past hour. Every
// 10 minutes, it sends the new average wait time data.
//
module.exports.waittime = function(io) {

  // make sure that this endpoint is protected
  io.use(auth.ioIsAuthenticated);

  // on client connection, join appropriate room, and
  // handle subsequent client -> server communications
  io.on('connection', function(socket) {
    var userid = socket.request.user.id;
    socket.on('join_course', function(course_id) {
      if (socket.request.user.roles[course_id] === 'ca') {
        socket.join(course_id + '_ca');
        socket.join(course_id + '_ca_' + socket.request.user.id);
        oncajoin(socket, userid, course_id);
        socket.emit('joined');
      } else {
        socket.emit('Not authorized')
      }
    });
  });

  var oncajoin = function(socket, userid, course_id) {
    var now = new Date();
    var tminus10 = new Date(now - 1000 * 60 * 10);
    var tminus60 = new Date(now - 1000 * 60 * 60);

    socket.on('get_latest', function() {
      Promise.join(queue.questions.getWaitTime(tminus60, now, course_id),
                queue.questions.getAverageWaitTime(tminus10, now, course_id),
                function(historic, current) {
                  for (var i = 0; i < historic.length; i++) {
                    historic[i].id = historic[i].time_period.getTime();
                    if (i == historic.length-1) {
                      historic[i].wait_time = current.wait_time;
                    }
                  }
                  socket.emit('wait_time', makeMessage('data', historic));
                });
    });

  };

};

//
// utilities
//

function getQuestionState(question) {
  if (question.off_time !== null) {
    return 'closed: ' + question.off_reason;
  } else if (question.is_frozen) {
    return 'frozen';
  } else if (question.help_time !== null) {
    return 'answering';
  } else {
    return 'on_queue';
  }
}

function makeMessage(type, payload) {
  return {
    type: type,
    payload: payload
  };
};

function makeCaQuestion(question) {
  return makeMessage('data', [{
    id: question.id,
    first_name: question.student_first_name,
    last_name: question.student_last_name,
    andrew_id: question.student_andrew_id,
    topic: question.topic,
    location: question.location,
    help_text: question.help_text,
    state: getQuestionState(question),
    can_freeze: question.can_freeze,
    queue_ps: parseInt(question.queue_position),
    on_time: question.on_time,
    off_time: question.off_time,
    help_time: question.help_time
  }]);
};

function makeStudentQuestion(question) {
  return makeMessage('data', [{
    id: question.id,
    topic_id: question.topic_id,
    topic: question.topic,
    location_id: question.location_id,
    location: question.location,
    help_text: question.help_text,
    queue_ps: parseInt(question.queue_position),
    is_frozen: question.is_frozen,
    frozen_end_time: question.frozen_end_time,
    can_freeze: question.can_freeze,
    state: getQuestionState(question),
    off_time: question.off_time,
    ca_first_name: question.ca_first_name,
    ca_last_name: question.ca_last_name
  }]);
};
