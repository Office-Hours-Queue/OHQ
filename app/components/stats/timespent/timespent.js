var db = require('../../../db');

// Exported functions
var timespent = (function() {
  var result = {
    getTimeSpentAnsweringTotal: selectTimeSpentAnsweringTotal,
  };
  return result;
})();


// Get the number of seconds spent answering student questions
function selectTimeSpentAnsweringTotal() {
  return db.select(db.raw('EXTRACT(EPOCH FROM SUM(q.off_time - q.help_time))'))
           .from('questions AS q')
           .where('q.off_reason', 'normal')
           .andWhere(db.raw('q.off_time - q.help_time < interval \'1 hour\''))
           .first();
}

module.exports = timespent;
