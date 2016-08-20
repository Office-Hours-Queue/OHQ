var router = require('express').Router();
var bcrypt = require('bcrypt');
var validate = require('express-jsonschema').validate;
var isAuthenticated = require('../../auth').isAuthenticated;
var db = require('../../db');
var cleanUser = require('./user').cleanUser;
var Promise = require('bluebird');

router.get('/', isAuthenticated.errorJson, function(req, res, next) {
  res.send(req.user);
});

var UserEditSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    email: {
      type: 'string',
      format: 'email',
      required: false
    },
    password: {
      type: 'string',
      minLength: 8,
      required: false
    }
  }
};

router.post('/edit', isAuthenticated.errorJson, validate({body: UserEditSchema}), function(req, res, next) {
  var newFields = { };
  var body = req.body;
  db.select('google_id')
    .from('users')
    .where('id', req.user.id)
    .first()
    .then(function(google_id) {
      google_id = google_id.google_id;
      if (google_id !== null) {
        throw { name: 'UserEditException', message: 'Use Google login' };
      } else {
        if (body.hasOwnProperty('password')) {
          // TODO: use async
          body.pw_bcrypt = bcrypt.hashSync(body.password, 12);
          delete body.password;
        }
        return db('users')
                    .where('id', req.user.id)
                    .update(body)
                    .returning('*');
      }
    })
    .then(function(updated_users) {
      res.send(cleanUser(updated_users[0])); 
    })
    .catch(function(err) {
      if (err.name === 'UserEditException') {
        res.status(400).send(err);
      } else {
        next(err);
      }
    });
});


var UserSchema = {
  type: 'object',
  properties: {
    andrew_id: {
      type: 'string',
      required: true
    },
    email: {
      type: 'string',
      format: 'email',
      required: false
    },
    password: {
      type: 'string',
      minLength: 8,
      required: true
    },
    first_name: {
      type: 'string',
      required: true
    },
    last_name: {
      type: 'string',
      required: true
    },
    registration_code: {
      type: 'string',
      required: true
    }
  }
};

router.post('/createlocal', validate({body: UserSchema}), function(req, res, next) {
  var body = req.body;
  body.email = typeof body.email === 'undefined' ? body.andrew_id + '@andrew.cmu.edu' : body.email;

  // first, check the registration code
  db.select('registration_code')
    .from('queue_meta')
    .first()
    .then(function(reg_code) {
      reg_code = reg_code.registration_code;
      if (reg_code !== body.registration_code) {
        throw { name: 'UserCreationException', message: 'Invalid registration code.' };
      } else {

  // check if andrewid is already registered
        return db.select('id')
                 .from('users')
                 .where('andrew_id', body.andrew_id)
                 .first();
      }
    })
    .then(function(existingUser) {
      if (typeof(existingUser) !== 'undefined') {
        throw { name: 'UserCreationException', message: 'Andrew ID already registered.' };
      } else {

  // find the role of this andrew id
        return db.select('role')
                 .from('valid_andrew_ids')
                 .where('andrew_id', body.andrew_id)
                 .first();
      }
    })
    .then(function(role) {
      if (typeof role === 'undefined') {
        throw { name: 'UserCreationException', message: 'Your Andrew ID is not marked as in 15-112.' };
      } else {

  // async hash password, then join with role
        var hashPromise = Promise.promisify(bcrypt.hash)(body.password, 12);
        var rolePromise = Promise.resolve(role.role);

        return Promise.join(rolePromise, hashPromise);
      }
    })
    .spread(function(role, hash) {

  // insert and return the new user
        return db.insert({
            andrew_id: body.andrew_id,
            email: body.email,
            first_name: body.first_name,
            last_name: body.last_name,
            pw_bcrypt: hash,
            role: role,
            is_temp_pw: false
          })
          .into('users')
          .returning('*');
    })
    .then(function(newUser) {
      res.send(cleanUser(newUser[0]));
    })
    .catch(function(err) {
      if (err.name === 'UserCreationException') {
        res.status(400).send(err);
      } else {
        next(err);
      }
    });
});

module.exports = router;
