
exports.up = function(knex, Promise) {
  return Promise.all([

    knex.schema.createTable('courses', function(table) {
      table.increments('id'        )              .primary();
      table.integer   ('number'    ).notNullable().unique();
      table.string    ('name'      ).notNullable();
      table.string    ('color'     );
      table.boolean   ('active'    ).notNullable().defaultTo(true);
    }),

  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('courses'),
  ]);
};
