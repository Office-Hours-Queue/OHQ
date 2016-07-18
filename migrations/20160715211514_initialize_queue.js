
exports.up = function(knex, Promise) {
  return Promise.all([

    knex.schema.createTable('users', function(table) {
      // identification columns
      table.increments('id'        )              .primary();
      table.string    ('andrew_id' ).notNullable().unique();
      table.string    ('email'     ).notNullable();
      table.string    ('first_name').notNullable();
      table.string    ('last_name' ).notNullable();
      table.enum      ('role', ['student', 'ca', 'admin']).notNullable();

      // google auth
      table.string    ('google_id').unique();

      // local auth
      table.binary    ('pw_bcrypt', 60);
      table.boolean   ('is_temp_pw');

      // ca additional info
      table.boolean   ('is_online');
    }),

    knex.schema.createTable('valid_andrew_ids', function(table) {
      table.string    ('andrew_id').primary();
    }),

    knex.schema.createTable('questions', function(table) {
      // identification
      table.increments('id'                 )                                      .notNullable().primary();
      table.integer   ('student_user_id'    ).references('id').inTable('users'    ).notNullable();
      table.integer   ('topic_id'           ).references('id').inTable('topics'   ).notNullable();
      table.integer   ('location_id'        ).references('id').inTable('locations').notNullable();
      table.text      ('help_text'          )                                      .notNullable().defaultTo('');
      table.dateTime  ('on'                 )                                      .notNullable().defaultTo(knex.fn.now());
      table.dateTime  ('frozen_start'       );    // freeze times are null if not frozen
      table.dateTime  ('frozen_end'         );    // null until unfrozen
      table.dateTime  ('frozen_end_max'     );
      table.dateTime  ('helped_start'       );    // null if not helped
      table.integer   ('ca_user_id'         ).references('id').inTable('users'   );
      table.dateTime  ('off'                );    // null indicates an open queston
      table.enum      ('off_reason', ['normal', 'self_kick', 'ca_kick']);
    }),

    knex.schema.createTable('topics', function(table) {
      table.increments('id'   ).notNullable().primary();
      table.string    ('topic').notNullable().unique();
    }),

    knex.schema.createTable('locations', function(table) {
      table.increments('id'      ).notNullable().primary();
      table.string    ('location').notNullable().unique();
    }),

    knex.schema.createTable('queue_meta', function(table) {
      table.integer   ('id'  )      .primary()    .defaultTo(1);
      table.boolean   ('open')      .notNullable();
      table.integer   ('max_freeze').unsigned().notNullable();
    }),

  ]);
};

exports.down = function(knex, Promise) {
  return null;
};
