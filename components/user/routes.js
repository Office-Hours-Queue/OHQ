var router = require('express').Router();
var isAuthenticated = require('../../auth').isAuthenticated;

router.get('/', isAuthenticated, function(req, res, next) {
  res.send(req.user);
});

module.exports = router;
