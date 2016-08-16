var users = require('./user');
var auth = require('../../auth');

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

  // when a ca joins, we need to listen for messages they send, and
  // send down the current data
  var oncajoin = function(socket, userid) {

    // listen for online/offline updates
    socket.on('go_online', function() {
      users.users.setCaOnline(userid);
    });

    socket.on('go_offline', function() {
      users.users.setCaOffline(userid);
    });

    // emit the current data
    users.users.getOnlineCas().then(function(onlineCas) {
      socket.emit('ca_count', makeMessage('data', [{ id: 0, count: onlineCas.length }]));
    });
    
    users.users.getUser(userid).then(function(user) {
      socket.emit('ca_status', makeMessage('data', [{ id: 0, is_online: user.is_online }]));
    });

  };

  //
  // server -> client
  //

  (function() {
    
    users.users.emitter.on('ca_status', function(newStatus) {
      ca(newStatus.id).emit('ca_status', makeMessage('data', [{ id: 0, is_online: newStatus.is_online }]));
    });

    users.users.emitter.on('ca_count', function(count) {
      cas().emit('ca_count', makeMessage('data', [{ id: 0, count: count }])); 
    });

  })();


  function makeMessage(type, payload) {
    return {
      type: type,
      payload: payload
    };
  };

};
