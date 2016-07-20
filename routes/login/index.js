var express = require('express');
var config = require('../../config');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.send('login here');
});

router.post('/', function(req, res, next) {
  res.send(req.body);
});

module.exports = router;
