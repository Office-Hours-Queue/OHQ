var db = require('../../db');
var dbEvents = require('../../db-events');
var EventEmitter = require('events');

module.exports.cleanUser = function(user) { 
  user.auth_method = user.google_id === null ? 'local' : 'google';
  delete user.pw_bcrypt;
  delete user.is_temp_pw;
  delete user.google_id;
  return user;
};

//
// Users model
// events emitted:
//  ca_status, { id : int, is_online : bool }
//  ca_count, count : int
//

var users = (function() {
  var result = {
    getUser: selectUserId,
    getOnlineCas: selectOnlineCas,
    setCaOnline: setCaOnline,
    setCaOffline: setCaOffline,
    emitter: new EventEmitter()
  };

  dbEvents.users.on('update', function(new_user, old_user) {
    if (new_user.role === 'ca') {

      if (new_user.first_name !== old_user.first_name) {
        //name change
        result.emitter.emit('name_change', { id: new_user.id, first_name: new_user.first_name });
      }

      // ca's online status changed
      if (new_user.is_online !== old_user.is_online) {

        // tell that ca
        result.emitter.emit('ca_status', { id: new_user.id, is_online: new_user.is_online });

        // tell everyone the new count
        selectOnlineCas().then(function(onlineCas) {
          result.emitter.emit('ca_count', onlineCas.length);
        });
      }
    }
  });

  return result;
})();

function selectDefaultUserFields() {
  return db.select(
      'u.id         AS id',
      'u.andrew_id  AS andrew_id',
      'u.email      AS email',
      'u.first_name AS first_name',
      'u.last_name  AS last_name',
      'u.role       AS role',
      'u.is_online  AS is_online'
    )
    .from('users AS u');
}

function selectUserId(userid) {
  return selectDefaultUserFields()
    .where('u.id', userid)
    .first();
}

function selectOnlineCas() {
  return selectDefaultUserFields()
    .where('u.role', 'ca')
    .andWhere('u.is_online', true);
}

function setCaOnline(userid) {
  return setCaStatus(userid, true);
}

function setCaOffline(userid) {
  return setCaStatus(userid, false);
}

function setCaStatus(userid, online) {
  if (typeof online !== 'boolean') {
    throw "Invalid online state";
  }
  return db('users')
    .update({
      is_online: online
    })
    .where('id', userid)
    .andWhere('role', 'ca')
    .then();
}

module.exports.users = users;
