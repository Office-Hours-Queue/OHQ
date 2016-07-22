/**
 * Configuration for the passport authentication module
 */

var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcryptjs');
var db = require('./db');
var config = require('./config');


passport.serializeUser(function(user, done) {
  done(null, user.id);
});


passport.deserializeUser(function(id, done) {
  if (typeof id === 'undefined') {
    done('Invalid session cookie');
  }
  db.select().from('users')
    .where('id', id)
    .first()
    .then(function(user) {
      if (typeof user === 'undefined') {
        done('Invalid session cookie');
      } else {
        delete user.pw_bcrypt;
        delete user.is_temp_pw;
        delete user.google_id;
        done(null, user);
      }
    })
    .catch(function(err) {
      done(err);
    });
});


passport.use(
  new GoogleStrategy(
    config.GOOGLE_OAUTH2_CONFIG,
    function(accessToken, refreshToken, profile, done) {
      db.select().from('users')
        .where('google_id', profile.id)
        .first()
        .then(function(user) {
          if (typeof user === 'undefined') {
            done(null, false);
          } else {
            done(null, user);
          }
        })
        .catch(function(err) {
          done(err);  
        });
    }
  )
);

function getUserInfo(googleProfile) {
  var result = {};
  
  for (var i = 0; i < googleProfile.emails.length; i++) {
    if (googleProfile.emails[i].type === 'account') {
      result.email = googleProfile.emails[i].value;
    }
  }

  result.andrew_id = result.email.split('@andrew.cmu.edu')[0];
  result.last_name = googleProfile.name.familyName;
  result.first_name = googleProfile.name.givenName;
  result.role = 'ca';
  result.google_id = googleProfile.id;

  return result;
}

passport.use(new LocalStrategy(
  function(andrewid, password, done) {
    db.select().from('users')
      .where('andrew_id', andrewid)
      .first()
      .then(function(user) {
        if (typeof user === 'undefined') {
          done(null, false);
        } else if (user.pw_bcrypt === null) {
          done(null, false);
        } else {
          bcrypt.compare(password, user.pw_bcrypt, function(err, res) {
            if (err) {
              done(err);
            } else if (res) {
              done(null, user);
            } else {
              done(null, false);
            }
          });
        }
      })
      .catch(function(err) {
        done(err);
      });
  })
);

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

module.exports = {
  passport: passport,
  isAuthenticated: isAuthenticated
};
