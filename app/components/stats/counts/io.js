var auth = require('../../../auth');
var counts = require('./counts').counts;

module.exports = function(io) {

  // make sure that this endpoint is protected
  io.use(auth.ioHasRole('ca'));

  // on client connection, join appropriate room, and
  // handle subsequent client -> server communications
  // cas join room cas_USERID
  io.on('connection', function(socket) {
    var userid = socket.request.user.id;
    if (socket.request.user.role === 'ca') {
      socket.join('cas');
      socket.join('ca_' + socket.request.user.id);
      oncajoin(socket, userid);
    } else {
      throw new Error('Not authorized');
    }
  });

  var ca = function(userid) {
    return io.to('ca_' + userid);
  };

  var cas = function() {
    return io.to('cas');
  };

  // when a ca joins, send down the current data.
  // there is nothing to listen for.
  var oncajoin = function(socket, userid) {
    counts.getQuestionCountAllCas().then(function(users) {
      users.forEach(function(user) {
        user.question_count = parseInt(user.question_count);
        socket.emit('question_count', user);
      });
    });

    counts.getUniqueStudentCountCa(userid).then(function(user) {
      user.unique_student_count = parseInt(user.unique_student_count);
      socket.emit('unique_student_count', user);
    });
  };


  //
  // server -> client
  //

  (function() {
    counts.emitter.on('ca_question_count', function(user) {
      user.question_count = parseInt(user.question_count);
      cas().emit('question_count', user);
    });
  })();

};
