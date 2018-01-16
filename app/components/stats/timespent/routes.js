var router = require('express').Router();
var auth = require('../../../auth');
var timespent = require('./timespent');

// Get the nubmer of seconds total spent answering student questions
router.get('/answering', auth.hasCourseRole('ca').errorJson, function(req, res, next) {
  timespent.getTimeSpentAnsweringTotal(req.query.course_id).then(function(hours) {
    res.send({
      seconds: hours.date_part
    });
  });
});

module.exports = router;
