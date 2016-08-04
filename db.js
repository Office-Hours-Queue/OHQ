var config = require('./config');
var knex = require('knex');
var db = knex(config.KNEX);

module.exports = db;
