
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('courses', function(table) {
      table.string('label').notNullable().defaultTo('');
    }),
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('locations', function(table) {
      table.dropColumn('label');
    }),
  ]);
};
