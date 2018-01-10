var router = require('express').Router();
var validate = require('express-jsonschema').validate;
var auth = require('../../auth');
var db = require('../../db');

var ValidAddInitialCASchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    andrew_id : {
      type: 'string',
      minlength: 1,
      required: true,
    },
    course_number: {
      type: 'integer',
      required: true,
    }
  }
};

var ValidSetRoleSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    andrew_id : {
      type: 'string',
      minlength: 1,
      required: true,
    },
    course_id: {
      type: 'integer',
      required: true,
    },
    role: {
      type: 'string',
      minlength: 1,
      required: true,
      enum: ['ca', 'student']
    }
  }
};

var ValidSetBatchRoleSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    andrew_ids : {
      type: 'array',
      minItems: 1,
      required: true,
      uniqueItems: true,
      items: {
        type: 'string',
        minLength: 1,
      }
    },
    course_id: {
      type: 'integer',
      required: true,
    },
    role: {
      type: 'string',
      minlength: 1,
      required: true,
      enum: ['ca', 'student']
    }
  }
};

router.post('/add_initial_ca',
            auth.isAdmin,
            validate({body: ValidAddInitialCASchema}),
            function(req, res, next) {

  var body = req.body;

  // check if ta exists
  db.select('id')
    .from('users')
    .where('andrew_id', body.andrew_id)
    .first()
    .then(function(user) {
      if (typeof user === 'undefined') {
        throw { name: 'AddCAException',
                message: body.andrew_id + ' is not currently a user.' };
      }

      // ta does exist
      else {
        // check if ta has a role in the course
        return db.select('id')
                 .from('courses')
                 .where('number', body.course_number)
                 .first()
                 .then(function (course) {
                   if (typeof course === 'undefined') {
                     throw { name: 'AddCAException',
                             message: body.course_number + ' is not a valid course.' };
                   } else {
                     return db.select('role')
                              .from('roles')
                              .where({'user': user.id, 'course': course.id})
                              .first()
                              .then(function(role_row) {
                                // they don't, we can just insert a new row
                                if (typeof role_row === 'undefined') {
                                  return db.insert({'user': user.id, 'course': course.id,
                                                   'role': 'ca'})
                                          .into('roles')
                                          .returning('*');
                                } else {
                                  // they do, we have to update the row
                                  return db.update({'role': 'ca'})
                                           .into('roles')
                                           .where({'user': user.id, 'course': course.id})
                                           .returning('*');
                                }
                              })
                      }
                 })
      }
    })
    .then(function(newRoleRow) {
      res.send(newRoleRow);
    })
    .catch(function(err) {
      if (err.name === 'AddCAException') {
        res.status(400).send(err);
      } else {
        next(err);
      }
    });
});

router.post('/set_batch', validate({body: ValidSetBatchRoleSchema}),
            auth.hasCourseRole("ca").errorJson,
            function(req, res, next) {
  var body = req.body
  andrews_to_ids(body.andrew_ids)
  .then(function (ids) {
    return db.del().from('roles').whereIn('user', ids)
      .andWhere('course', body.course_id)
      .then(function (rows_affected) {
        var toInsert = [];
        for (var i = 0; i < ids.length; i++) {
          toInsert.push({
            user: ids[i],
            course: body.course_id,
            role: body.role
          });
        }

        return db.insert(toInsert).into('roles').returning('*');
      })
  })
  .then(function(newRoles) {
    res.send(newRoles);
  })
  .catch(function(err) {
    if (err.name === 'AndrewIdConversionException') {
      res.status(400).send(err);
    } else {
      next(err);
    }
  });
});

router.post('/set',
            validate({body: ValidSetRoleSchema}),
            auth.hasCourseRole("ca").errorJson,
            function(req, res, next) {

  var body = req.body;

  // check if ta exists
  db.select('id')
    .from('users')
    .where('andrew_id', body.andrew_id)
    .first()
    .then(function(user) {
      if (typeof user === 'undefined') {
        throw { name: 'AddCAException',
                message: body.andrew_id + ' is not currently a user.' };
        }

        // ta does exist
        else {
           return db.select('role')
            .from('roles')
            .where({'user': user.id, 'course': body.course_id})
            .first()
            .then(function(role_row) {
              // they don't, we can just insert a new row
              if (typeof role_row === 'undefined') {
                return db.insert({'user': user.id, 'course': body.course_id,
                                 'role': body.role})
                        .into('roles')
                        .returning('*');
              } else {
                // they do, we have to update the row
                return db.update({'role': body.role})
                         .into('roles')
                         .where({'user': user.id, 'course': body.course_id})
                         .returning('*');
              }
            })
        }
    })
    .then(function(newRoleRow) {
      res.send(newRoleRow);
    })
    .catch(function(err) {
      if (err.name === 'AddCAException') {
        res.status(400).send(err);
      } else {
        next(err);
      }
    });
});

function andrews_to_ids(andrew_ids) {
  return Promise.all(
    andrew_ids.map(e => db.select('id').from('users').where('andrew_id', e)
                          .first().then(
      function (user) {
        if (typeof user === 'undefined') {
          throw { name: 'AndrewIdConversionException',
                  message: e + ' is not currently a user.' };
        } else {
          return user.id;
        }
      }))
  )
}

module.exports = router;
