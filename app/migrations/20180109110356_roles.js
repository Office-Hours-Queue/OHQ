
exports.up = function(knex, Promise) {
  return Promise.all([

    knex.schema.createTable('roles', function(table) {
      table.integer   ('user'        ).references('id').inTable('users').notNullable();
      table.integer   ('course'      ).references('id').inTable('courses').notNullable();
      table.enum      ('role', ['student', 'ca']).notNullable();
      table.primary   (['user', 'course']);
    }),

  ]);
};

exports.down = function(knex, Promise) {
  return Promise.all([

    knex.schema.dropTable('roles'),

  ]);
};
