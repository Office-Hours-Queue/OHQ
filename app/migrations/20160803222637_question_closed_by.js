// Log who closes a question

exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('questions', function(table) {
      table.integer('off_by').references('id').inTable('users');
    })
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('questions', function(table) {
      table.dropColumn('off_by');
    })
  ]);
};
