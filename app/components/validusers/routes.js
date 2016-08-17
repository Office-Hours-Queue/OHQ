var router = require('express').Router();
var validate = require('express-jsonschema').validate;
var auth = require('../../auth');
var db = require('../../db');

var ValiduserInsertSchema = {
  type: 'array',
  minItems: 1,
  uniqueItems: true,
  items: {
    type: 'object',
    additionalProperties: false,
    properties: {
      andrew_id: {
        type: 'string',
        required: 'true'
      }
    }
  }
};

router.post('/add/student',
            auth.hasRole('ca'),
            validate({body: ValiduserInsertSchema}),
            function(req, res, next) {

  var body = req.body;
  var newAndrewIds = [];
  for (var i = 0; i < body.length; i++) {
    newAndrewIds.push(body[i].andrew_id);
  }
  
  // check if andrewid is valid
  db.select('andrew_id')
    .from('valid_andrew_ids')
    .whereIn('andrew_id', newAndrewIds)
    .first()
    .then(function(validuser) {
      if (typeof validuser !== 'undefined') {
        throw { name: 'AddValidUserException',
                message: validuser.andrew_id + ' is already a valid student.' };
      }

  // is valid, insert it
      else {
        var toInsert = [];
        for (var i = 0; i < body.length; i++) {
          toInsert.push({
            andrew_id: body[i].andrew_id,
            role: 'student'
          });
        }
        return db.insert(toInsert)
          .into('valid_andrew_ids')
          .returning('*');
      }
    })
    .then(function(newValidUser) {
      res.send(newValidUser); 
    })
    .catch(function(err) {
      if (err.name === 'AddValidUserException') {
        res.status(400).send(err);
      } else {
        next(err);
      }
    });
});

module.exports = router;
