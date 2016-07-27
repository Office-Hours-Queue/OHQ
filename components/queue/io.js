var queue = require('./queue');

module.exports = function(io) {

  //
  // CA handling
  //

  // listen for future questions, and send to all cas
  var sendQuestion = function(question) {
    io.ca.emit('question', question);
  };

  queue.questions.emitter.on('update', sendQuestion);
  queue.questions.emitter.on('insert', sendQuestion);
  queue.questions.emitter.on('delete', function(id) {
    io.ca.emit('questionDelete', { id: id });
  });

  var sendMeta = function(meta) {
    io.ca.emit('meta', meta);
  };

  queue.meta.emitter.on('update', sendMeta);
  queue.meta.emitter.on('insert', sendMeta);

  // handle individual ca comms
  io.ca.on('connection', function(socket) {

    // send all open questions
    queue.questions.openQuestions().then(function(questions) {
      for (var i = 0; i < questions.length; i++) {
        socket.emit('question', questions[i]);
      }
    });

    // send over queue status
    queue.meta.getCurrent().then(function(meta) {
      socket.emit('meta', meta);
    });

  });


  //
  // Student handling
  //
  io.student.on('connection', function(socket) {

  });

};
