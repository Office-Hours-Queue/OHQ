var config = require('./config');

var EventEmitter = require('events').EventEmitter;
var Client = require('pg').Client;

// we need a dedicated connection to the db to listen for notifications
var client = new Client(config.KNEX.connection);
client.connect();

// we'll unpack and forward notifications via these emitters
var emitters = {};
emitters.questions = new EventEmitter();
emitters.queueMeta = new EventEmitter();

// pg sends us events when certain tables get updated
client.on('notification', function(msg) {
  var payload = JSON.parse(msg.payload);
  var table = payload.table;
  var action = payload.action.toLowerCase();
  var id = payload.id;
  emitters[table].emit(action, id);
});

// subscribe to the update stream
client.query('LISTEN table_update');

module.exports = emitters;
