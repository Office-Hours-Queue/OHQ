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

var NameEditSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    first_name : {
      type: 'string',
      minLength: 1
    }
  }
};

router.post("/edit_first_name", isAuthenticated.errorJson, validate({ body : NameEditSchema }), function (req,res,next) {
  var body = req.body;
  db('users').where('id',req.user.id).update(body).then(function(success) {
        return res.send({"success": true});
  }).catch(function(err) {
        return res.status(400).send(err);
    });
});

module.exports = router;
