var http = require('http');
var express = require('express');
var socketio = require('socket.io');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var dbSessionStore = require('connect-session-knex')(session);
var auth = require('./auth');
var db = require('./db');

var app = express();
var server = http.Server(app);
var io = socketio(server);

var sessionMiddleware = session({
  secret: 'supersecret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60  // 1 hour
  },
  store: new dbSessionStore({
    knex: db,
    tablename: 'sessions'
  })
});

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(sessionMiddleware);
app.use(auth.passport.initialize());
app.use(auth.passport.session());
app.use(express.static(path.join(__dirname, 'public')));

// socket.io middleware checks session auth status
io.use(function(socket, next) {
  sessionMiddleware(socket.request, {}, next);
});
io.use(function(socket, next) {
  auth.passport.initialize()(socket.request, {}, next);
});
io.use(function(socket, next) {
  auth.passport.session()(socket.request, {}, next);
});

// hook up routes
app.use('/', require('./components/index').routes);
app.use('/queue', require('./components/queue').routes);
app.use('/login', require('./components/login').routes);
app.use('/user', require('./components/user').routes);

// hook up socket handlers
require('./components/queue').io(io.of('/queue'));

// custom error handlers (404, 500, ...) should go here when they're ready

// handle json schema validation failures
app.use(function(err, req, res, next) {
  if (err.name === 'JsonSchemaValidation') {
    res.status(400);
    var responseData = {
      errors: err.validations
    };
    res.send(responseData);
  } else {
    next(err);
  }
});

module.exports = { app: app, server: server };
