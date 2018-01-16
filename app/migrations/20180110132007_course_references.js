
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('locations', function(table) {
      table.integer('course_id').references('id').inTable('courses').notNullable().defaultTo(1);
    }),
    knex.schema.table('topics', function(table) {
      table.integer('course_id').references('id').inTable('courses').notNullable().defaultTo(1);
    }),
    knex.schema.table('questions', function(table) {
      table.integer('course_id').references('id').inTable('courses').notNullable().defaultTo(1);
    }),
    knex.schema.table('queue_meta', function(table) {
      table.integer('course_id').references('id').inTable('courses').notNullable().defaultTo(1);
    }),
  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.table('locations', function(table) {
      table.dropColumn('course_id');
    }),
    knex.schema.table('topics', function(table) {
      table.dropColumn('course_id');
    }),
    knex.schema.table('questions', function(table) {
      table.dropColumn('course_id');
    }),
    knex.schema.table('queue_meta', function(table) {
      table.dropColumn('course_id');
    }),
  ]);
};
