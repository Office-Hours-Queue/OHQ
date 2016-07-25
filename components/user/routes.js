var router = require('express').Router();
var bcrypt = require('bcryptjs');
var validate = require('express-jsonschema').validate;
var isAuthenticated = require('../../auth').isAuthenticated;
var db = require('../../db');
var cleanUser = require('./user').cleanUser;

router.get('/', isAuthenticated, function(req, res, next) {
  res.send(cleanUser(req.user));
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
        throw new Error('Invalid registration code');
      } else {

  // check if andrewid is already registered
        return db.select('id')
                 .from('users')
                 .where('andrew_id', body.andrew_id)
                 .first();
      }
    })
    .then(function(existingUser) {
      if (typeof existingUser !== 'undefined') {
        throw new Error('AndrewID already registered');
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
        throw new Error('Invalid AndrewID');
      } else {

  // insert and return the new user
        role = role.role;
        return db.insert({
            andrew_id: body.andrew_id,
            email: body.email,
            first_name: body.first_name,
            last_name: body.last_name,
            pw_bcrypt: bcrypt.hashSync(body.password, 10),
            role: role,
            is_temp_pw: false
          })
          .into('users')
          .returning('*');
      }
    })
    .then(function(newUser) {
      res.send(cleanUser(newUser[0]));
    })
    .catch(function(err) {
      next(err);
    });
});

module.exports = router;
