var config = require('./config');

var EventEmitter = require('events').EventEmitter;
var Client = require('pg').Client;

// we need a dedicated connection to the db to listen for notifications
var client = new Client(config.KNEX.connection);
client.connect();

// we'll unpack and forward notifications via these emitters
var emitters = {};
emitters.questions = new EventEmitter();
emitters.queue_meta = new EventEmitter();

// pg sends us events when certain tables get updated.
// unpack them and forward them to the right emitter.
client.on('notification', function(msg) {
  var payload = JSON.parse(msg.payload);
  var table = payload.table;
  var action = payload.action;
  var emitter = emitters[table];
  switch (action) {
    case 'insert':
      emitter.emit(action, payload.new);
      break;
    case 'update':
      emitter.emit(action, payload.new, payload.old);
      break;
    case 'delete':
      emitter.emit(action, payload.old);
      break;
  }
});

// subscribe to the update stream
client.query('LISTEN table_update');

module.exports = emitters;
