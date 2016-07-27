var router = require('express').Router();
var isAuthenticated = require('../../auth').isAuthenticated;
var db = require('../../db');

router.get('/', isAuthenticated, function(req, res, next) {
  res.send('This is the queue.');
});

function selectQuestion(id) {
  return db.select(
      'us.first_name AS studentFirstName',
      'us.last_name AS studentLastName',
      'uf.first_name AS frozenByFirst_name',
      'uf.last_name AS frozenByLastName',
      'uc.first_name AS caFirstName',
      'uc.last_name AS caLastName',
      'ue.first_name AS initialCaFirstName',
      'ue.last_name AS initialCaLastName',
      't.topic AS topic',
      'l.location AS location',
      'q.help_text AS helpText',
      'q.on_time AS onTime',
      'q.frozen_time AS frozenTime',
      'q.frozen_end_max_time AS frozenEndMaxTime',
      'q.frozen_end_time AS frozenEndTime',
      'q.help_time AS helpTime',
      'q.initial_help_time AS initialHelpTime',
      'q.off_time AS offTime',
      'q.off_reason AS offReason')
    .from('questions AS q')
    .leftJoin('users AS us', 'us.id', 'q.student_user_id')
    .leftJoin('users AS uf', 'uf.id', 'q.frozen_by')
    .leftJoin('users AS uc', 'uc.id', 'q.ca_user_id')
    .leftJoin('users AS ue', 'ue.id', 'q.initial_ca_user_id')
    .leftJoin('topics AS t', 't.id', 'q.topic_id')
    .leftJoin('locations AS l', 'l.id', 'q.location_id')
    .where('q.id', id)
    .first();
}

function selectMeta(id) {
  return db.select(
      'open',
      'max_freeze AS maxFreeze',
      'time_limit AS timeLimit'
    )
    .from('queue_meta')
    .where('id', id)
    .first();
}

module.exports = router;
