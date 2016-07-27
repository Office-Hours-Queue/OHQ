var router = require('express').Router();
var isAuthenticated = require('../../auth').isAuthenticated;
var db = require('../../db');

router.get('/', isAuthenticated, function(req, res, next) {
  res.send('This is the queue.');
});

module.exports = router;
