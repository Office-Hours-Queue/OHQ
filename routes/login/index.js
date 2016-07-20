var express = require('express');
var config = require('../../config');
var auth = require('../../auth');
var router = express.Router();

router.get('/', function(req, res) {
  res.send('<a href="/login/googleauth">login with google</a>');
});

router.get('/googleauth',
  auth.passport.authenticate('google', { scope: ['openid profile email'],
                                         hd: 'andrew.cmu.edu' }));

router.get('/success', 
  auth.passport.authenticate('google', { successRedirect: '/',
                                         failureRedirect: '/login',
                                         failureFlash: true }));

module.exports = router;
