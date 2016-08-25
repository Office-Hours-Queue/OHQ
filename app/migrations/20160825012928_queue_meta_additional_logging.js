// adds additional fields to queue_meta to do more logging

exports.up = function(knex, Promise) {
  return Promise.all([

    knex.schema.table('queue_meta', function(table) {
      table.integer('user_id').references('id').inTable('users');
      table.dateTime('time').notNullable().defaultTo(knex.fn.now());
    })

  ]);
};

exports.down = function(knex, Promise) {
  
  return Promise.all([

    knex.schema.table('queue_meta', function(table) {
      table.dropColumn('user_id');
      table.dropColumn('time');
    })

  ]);
  
};
