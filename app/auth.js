/**
 * Configuration for the passport authentication module
 */

var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
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
        db.select('course', 'role')
          .from('roles')
          .where({'user': user.id})
          .then(function(roleList) {
            roles = {}
            for (var i = 0; i < roleList.length; i++) {
              roles[roleList[i].course] = roleList[i].role;
            }
            user.roles = roles;
            done(null, cleanUser(user));
          });
      }
      // returning null here prevents bluebird from complaining
      // about an unreturned promise
      return null;
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

            //TODO: remove roles from here
            // first, check user's role
            return db.select('role')
                     .from('valid_andrew_ids')
                     .where('andrew_id', getUserInfo(profile, 'student').andrew_id)
                     .first()
                     .then(function(validUser) {

                       // user isn't in our roster
                       if (typeof validUser === 'undefined') {
                          validUser = {"role": "student"};
                       }

                       // user is ok - insert and pass it back up
                         return db.insert(getUserInfo(profile, validUser.role))
                                  .into('users')
                                  .returning('*');
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

  result.andrew_id = result.email;
  result.last_name = googleProfile.name.familyName;
  result.first_name = googleProfile.name.givenName;
  result.role = role;
  result.google_id = googleProfile.id;

  return result;
}

var isAuthenticated = {

  redirect: function(req, res, next) {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.redirect('/');
    }
  },

  errorJson: function(req, res, next) {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.status(401).send({ name: 'AuthenticationError',
                             message: 'Not authenticated' });
    }
  }

};

var hasRole = function(role) {
  return {

    redirect: function(req, res, next) {
      if (req.isAuthenticated() &&
          req.user.role === role) {
        next();
      } else {
        res.redirect('/');
      }
    },

    errorJson: function(req, res, next) {
      if (req.isAuthenticated() &&
          req.user.role === role) {
        next();
      } else {
        res.status(401).send({ name: 'AuthorizationError',
                               message: 'Not authorized' });
      }
    }

  };
};


var hasCourseRole = function(role) {
  return {

    redirect: function(req, res, next) {
      if (req.isAuthenticated() &&
          req.user.roles[req.body.course_id] === role) {
        next();
      } else {
        res.redirect('/');
      }
    },

    errorJson: function(req, res, next) {
      if (req.isAuthenticated() &&
          req.user.roles[req.body.course_id] === role) {
        next();
      } else {
        res.status(401).send({ name: 'AuthorizationError',
                               message: 'Not authorized' });
      }
    }

  };
};

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

function ioHasCourseRole(role, course_id) {
  return function(socket, next) {
    if (socket.request.isAuthenticated()) {
      if (socket.request.user.roles[course_id] === role) {
        next();
        return;
      } else {
        next(new Error('Not authorized'));
      }
    }
  };
}

function isAdmin(req, res, next) {
  if (req.isAuthenticated() && config.ADMIN_USERS.includes(req.user.andrew_id)) {
    next();
  } else {
    res.redirect('/');
  }
}

module.exports = {
  passport: passport,
  isAuthenticated: isAuthenticated,
  hasRole: hasRole,
  ioIsAuthenticated: ioIsAuthenticated,
  ioHasRole: ioHasRole,
  isAdmin: isAdmin,
  hasCourseRole: hasCourseRole
};
