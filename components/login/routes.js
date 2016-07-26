var router = require('express').Router();
var config = require('../../config');
var auth = require('../../auth');

router.get('/', function(req, res) {
  res.send('<a href="/login/googleauth">login with google</a>' +
           '<br />' +
           '<a href="/login/localauth">login with username/pw</a>');
});

router.get('/localauth', function(req, res) {
  res.send(
'<form name="login" method="post">' +
'  <ul>' +
'    <li>' +
'      <label for="username">Andrew ID</label>' +
'      <input type="text" name="username" placeholder="username" required>' +
'    </li>' +
'    <li>' +
'      <label for="password">Password</label>' +
'      <input type="password" name="password" placeholder="password" required>' +
'    </li>' +
'    <li>' +
'      <input type="submit" value="Login">' +
'    </li>' +
'  </ul>' +
'</form>');
});

router.post('/localauth',
  auth.passport.authenticate('local', { successRedirect: '/',
                                        failureRedirect: '/login/localauth',
                                        failureFlash: true }));

router.get('/googleauth',
  auth.passport.authenticate('google', { scope: ['openid profile email'],
                                         hd: 'andrew.cmu.edu' }));

router.get('/success', 
  auth.passport.authenticate('google', { successRedirect: '/',
                                         failureRedirect: '/login',
                                         failureFlash: true }));

router.get('/endauth', function(req, res, next) {
  req.logout();
  res.redirect('/');
});

module.exports = router;
