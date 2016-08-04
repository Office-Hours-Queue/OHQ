var router = require('express').Router();
var config = require('../../config');
var auth = require('../../auth');

router.post('/localauth',auth.passport.authenticate('local'),function(req, res) {
  res.redirect('/#/' + req.user.role);
});

router.get('/googleauth',
  auth.passport.authenticate('google', { scope: ['openid profile email'],
                                         hd: 'andrew.cmu.edu' }));

router.get('/success',auth.passport.authenticate('google'), function(req,res) {
  res.redirect('/#/' + req.user.role);
});

router.get('/endauth', function(req, res, next) {
  req.logout();
  res.redirect('/');
});

module.exports = router;
