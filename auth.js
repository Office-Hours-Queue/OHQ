/**
 * Configuration for the passport authentication module
 */

var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt');
var db = require('./db');
var config = require('./config');
var cleanUser = require('./components/user/user').cleanUser;


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
        done(null, cleanUser(user));
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

      // see if user already exists
      db.select()
        .from('users')
        .where('google_id', profile.id)
        .first()
        .then(function(user) {

          // the user exists already - pass it back up
          if (typeof user !== 'undefined') {
            return Promise.resolve(user);
          }

          // user doesn't exist already
          else {

            // first, check user's role
            return db.select('role')
                     .from('valid_andrew_ids')
                     .where('andrew_id', getUserInfo(profile, 'student').andrew_id)
                     .first()
                     .then(function(validUser) {

                       // user isn't in our roster
                       if (typeof validUser === 'undefined') {
                         throw { name: 'UserCreationException',
                                 message: 'Your Andrew ID is not marked as in 15-112' };
                       }

                       // user is ok - insert and pass it back up
                       else {
                         return db.insert(getUserInfo(profile, validUser.role))
                                  .into('users')
                                  .returning('*');
                       }
                     })
                     .then(function(insertedUser) {
                        return Promise.resolve(insertedUser[0]);
                     });
          }
        })
        .then(function(dbUser) {
          done(null, dbUser);
        })
        .catch(function(err) {
          if (err.name === 'UserCreationException') {
            done();
          } else {
            done(err);
          }
        });
    }
  )
);

function getUserInfo(googleProfile,role) {
  var result = {};
  
  for (var i = 0; i < googleProfile.emails.length; i++) {
    if (googleProfile.emails[i].type === 'account') {
      result.email = googleProfile.emails[i].value;
    }
  }

  result.andrew_id = result.email.split('@andrew.cmu.edu')[0];
  result.last_name = googleProfile.name.familyName;
  result.first_name = googleProfile.name.givenName;
  result.role = role;
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

function hasRole(role) {
  return function(req, res, next) {
    if (req.isAuthenticated() &&
        req.user.role === role) {
      return next();
    }
    res.redirect('/login');
  };
}

function ioIsAuthenticated(socket, next) {
  if (socket.request.isAuthenticated()) {
    next();
  } else {
    next(new Error('Not authorized'));
  }
}

function ioHasRole(role) {
  return function(socket, next) {
    if (socket.request.isAuthenticated()) {
      if (Array.isArray(role) &&
          role.indexOf(socket.request.user.role) !== -1) {
        next();
        return;
      } else if (socket.request.user.role === role) {
        next();
        return;
      }
    }
    next(new Error('Not authorized'));
  };
}

module.exports = {
  passport: passport,
  isAuthenticated: isAuthenticated,
  hasRole: hasRole,
  ioIsAuthenticated: ioIsAuthenticated,
  ioHasRole: ioHasRole
};
