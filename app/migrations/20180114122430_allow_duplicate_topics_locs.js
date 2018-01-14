
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('locations', function(table) {
      table.dropUnique('location');
    }),
    knex.schema.table('topics', function(table) {
      table.dropUnique('topic'   );
    }),
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('locations', function(table) {
      table.unique('location');
    }),
    knex.schema.table('topics', function(table) {
      table.unique('topic'   );
    }),
  ]);
};
