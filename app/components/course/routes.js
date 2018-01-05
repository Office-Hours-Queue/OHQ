var router = require('express').Router();
var validate = require('express-jsonschema').validate;
var auth = require('../../auth');
var db = require('../../db');

router.get('/get_all', auth.isAuthenticated.errorJson, function(req, res, next) {
  return db.select('*')
  .from('courses')
  .orderBy('id')
  .then(function(courses) {
    return res.send(courses);
  })
  .catch(function(err) {
    if (err.name === 'GetCoursesExcept') {
      return res.status(400).send(err);
    } else {
      next(err);
    }
  });
});

router.get('/get_active', auth.isAuthenticated.errorJson, function(req, res, next) {
  return db.select('*')
  .from('courses')
  .orderBy('id')
  .where('active', true)
  .then(function(courses) {
    res.send(courses);
    //return null so that the promise has a return value
    return null;
  })
  .catch(function(err) {
    if (err.name === 'GetActiveCoursesException') {
      res.status(400).send(err);
    } else {
      next(err);
    }
  });
});

var ValidCourseSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    number : {
      type: 'integer',
      required: true,
    },
    name : {
      type: 'string',
      minlength: 1,
      required: true,
    },
    color: {
      type: 'string',
      minlength: 1,
    }
  }
};

var CourseEditSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    id: {
      type: 'integer',
      required: true,
    },
    number : {
      type: 'integer',
    },
    name : {
      type: 'string',
      minlength: 1,
    },
    color: {
      type: 'string',
      minlength: 1,
    },
    active: {
      type: 'boolean',
    }
  }
}

router.post('/add',
            auth.isAdmin,
            validate({body: ValidCourseSchema}),
            function(req, res, next) {

  var body = req.body;

  // check if course number is valid
  db.select('number')
    .from('courses')
    .where('number', body.number)
    .first()
    .then(function(course) {
      if (typeof course !== 'undefined') {
        throw { name: 'AddCourseException',
                message: course.number + ' already has a queue.' };
      }

  // is valid, insert it
      else {
        return db.insert(body)
          .into('courses')
          .returning('*');
      }
    })
    .then(function(newCourse) {
      res.send(newCourse);
    })
    .catch(function(err) {
      if (err.name === 'AddCourseException') {
        res.status(400).send(err);
      } else {
        next(err);
      }
    });
});

router.post("/edit",
            auth.isAdmin,
            validate({ body : CourseEditSchema }),
            function (req,res,next) {

  var id = req.body.id;
  var body = req.body;
  delete body.id;

  db('courses').where('id',id).update(body).then(function(success) {
        return res.send({"success": true});
  }).catch(function(err) {
        return res.status(400).send(err);
    });
});

module.exports = router;
