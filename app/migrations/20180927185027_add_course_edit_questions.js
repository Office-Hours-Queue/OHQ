
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('courses', function(table) {
      table.string('edit_questions').notNullable().defaultTo(true);
    }),
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('locations', function(table) {
      table.dropColumn('edit_questions');
    }),
  ]);
};
