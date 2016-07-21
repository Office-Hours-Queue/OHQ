var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var auth = require('./auth');

// import the routes we've written
var index = require('./routes/index');
var queue = require('./routes/queue');

var app = express();


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  secret: 'supersecret',
  resave: false,
  saveUninitialized: false
}));
app.use(auth.passport.initialize());
app.use(auth.passport.session());
app.use(express.static(path.join(__dirname, 'public')));

// hook up routes
app.use('/', index);
app.use('/queue', queue);
app.use('/login', require('./routes/login'));
app.use('/user', require('./routes/user'));

// custom error handlers (404, 500, ...) should go here when they're ready

module.exports = app;
