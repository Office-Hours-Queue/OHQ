var auth = require('../../../auth');
var counts = require('./counts').counts;

module.exports = function(io) {
  // on client connection, join appropriate room, and
  // handle subsequent client -> server communications
  // cas join room cas_USERID
  io.on('connection', function(socket) {
    var userid = socket.request.user.id;

    socket.on('join_course', function(course_id) {
      // make sure that this endpoint is protected
      socket.use(auth.ioHasCourseRole('ca', course_id));
      if (socket.request.user.roles[course_id] === 'ca') {
        socket.join(course_id + '_ca');
        socket.join(course_id + '_ca_' + socket.request.user.id);
        oncajoin(socket, userid, course_id);
      } else {
        throw new Error('Not authorized');
      }
    });
  });

  var cas = function(course_id) {
    return io.to(course_id + '_ca');
  };
  var ca = function(userid, course_id) {
    return io.to(course_id + '_ca_' + userid);
  };

  // when a ca joins, send down the current data.
  // there is nothing to listen for.
  var oncajoin = function(socket, userid, course_id) {
    counts.getQuestionCountAllCas(course_id).then(function(users) {
      users.forEach(function(user) {
        user.question_count = parseInt(user.question_count);
        socket.emit('question_count', user);
      });
    });

    counts.getUniqueStudentCountCa(userid, course_id).then(function(user) {
      user.unique_student_count = parseInt(user.unique_student_count);
      socket.emit('unique_student_count', user);
    });
  };


  //
  // server -> client
  //

  (function() {
    counts.emitter.on('ca_question_count', function(user, course_id) {
      user.question_count = parseInt(user.question_count);
      cas(course_id).emit('question_count', user);
    });
  })();

};
