
exports.up = function(knex, Promise) {
  return Promise.all([

    knex.schema.createTable('future_roles', function(table) {
      table.string    ('andrew_id'        ).notNullable();
      table.integer   ('course'      ).references('id').inTable('courses').notNullable();
      table.enum      ('role', ['student', 'ca']).notNullable();
      table.primary   (['andrew_id', 'course']);
    }),

  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([

    knex.schema.dropTable('future_roles'),

  ]);
};
