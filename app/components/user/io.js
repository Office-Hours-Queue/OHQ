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
    socket.on('join_course', function(course_id) {
      if (socket.current_rooms != undefined) {
        socket.current_rooms.forEach(socket.leave)
      }
      socket.current_rooms = [];
      if (socket.request.user.roles[course_id] === 'ca') {
        socket.join(course_id + '_ca');
        socket.join(course_id + '_ca_' + socket.request.user.id);
        socket.current_rooms.push(course_id + '_ca');
        socket.current_rooms.push(course_id + '_ca_' + socket.request.user.id);
        oncajoin(socket, userid, course_id);
        socket.emit('joined');
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

    // emit the current data
    users.users.getActiveCas(course_id).then(function(activeCas) {
      socket.emit('cas_active', makeMessage('data', makeActiveCas(activeCas)));
    });

  };

  // there's nothing to do on student join
  var onstudentjoin = function(socket, userid, course_id) {

  };

  //
  // server -> client
  //

  (function() {

    users.users.emitter.on('cas_active', function(activeCas, course_id) {
      cas(course_id).emit('cas_active', makeMessage('data', makeActiveCas(activeCas)));
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
