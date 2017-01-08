var users = require('./user');
var auth = require('../../auth');

module.exports = function(io) {

  // make sure that this endpoint is protected
  io.use(auth.ioIsAuthenticated);

  // on client connection, join appropriate room, and
  // handle subsequent client -> server communications
  // students join room student_USERID
  // cas join room cas_USERID
  io.on('connection', function(socket) {
    var userid = socket.request.user.id;
    if (socket.request.user.role === 'ca') {
      socket.join('ca');
      socket.join('ca_' + socket.request.user.id);
      oncajoin(socket, userid);
    } else if (socket.request.user.role === 'student') {
      socket.join('student');
      socket.join('student_' + socket.request.user.id);
      onstudentjoin(socket, userid);
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

  var student = function(userid) {
    return io.to('student_' + userid);
  };


  // when a ca joins, send down the current data.
  // there is nothing to listen for.
  var oncajoin = function(socket, userid) {

    // emit the current data
    users.users.getActiveCas().then(function(activeCas) {
      socket.emit('cas_active', makeMessage('data', makeActiveCas(activeCas)));
    });
    
  };

  // there's nothing to do on student join
  var onstudentjoin = function(socket, userid) {

  };

  //
  // server -> client
  //

  (function() {
    
    users.users.emitter.on('cas_active', function(activeCas) {
      cas().emit('cas_active', makeMessage('data', makeActiveCas(activeCas)));
    });

    users.users.emitter.on('name_change', function(new_user) {
      switch (new_user.role) {
        case 'student':
          student(new_user.id).emit('name_change', makeMessage('data', [{
            id : new_user.id,
            first_name: new_user.first_name
          }]));
          break;
        case 'ca':
          ca(new_user.id).emit('name_change', makeMessage('data', [{
            id : new_user.id,
            first_name: new_user.first_name
          }]));
          break;
      }
    });

  })();



  function makeMessage(type, payload) {
    return {
      type: type,
      payload: payload
    };
  };

  function makeActiveCas(cas) {
    return [{
      id: 0,
      cas: cas.map(function(ca) {
        return {
          first_name: ca.first_name,
          last_name: ca.last_name,
        };
      }),
    }];
  };

};
