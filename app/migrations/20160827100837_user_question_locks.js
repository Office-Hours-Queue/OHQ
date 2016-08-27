// Create a table of per-user locks for atomic question insertions
// Includes a trigger to automatically insert new users into this lock table

exports.up = function(knex, Promise) {
  var fn = '' +
    'CREATE OR REPLACE FUNCTION\n' +
    '  sync_users_user_question_locks()\n' +
    'RETURNS trigger AS\n' +
    '  $$\n' +
    'BEGIN\n' +
    '  IF TG_OP = \'INSERT\' THEN\n' +
    '    INSERT INTO user_question_locks (user_id) VALUES (NEW.id);\n' +
    '  END IF;\n' +
    '  RETURN NEW;\n' +
    'END;\n' +
    '$$ LANGUAGE plpgsql;';

  var trigger = '' +
    'DROP TRIGGER IF EXISTS\n' +
    '  sync_users_user_question_locks\n' +
    'ON\n' +
    '  user_question_locks;\n' +
    'CREATE TRIGGER\n' +
    '  sync_users_user_question_locks\n' +
    'AFTER INSERT ON\n' +
    '  users\n' +
    'FOR EACH ROW EXECUTE PROCEDURE\n' +
    '  sync_users_user_question_locks();';

  return Promise.all([

    knex.schema.createTable('user_question_locks', function(table) {
      table.integer('user_id')
           .references('id')
           .inTable('users')
           .onDelete('CASCADE')
           .onUpdate('CASCADE')
           .primary();
    }).then(function() {
      return knex.insert(function() {
          this.select('id').from('users');
        })
        .into('user_question_locks')
    }),

    knex.raw(fn),
    knex.raw(trigger)

  ]);
};

exports.down = function(knex, Promise) {
 
  return Promise.all([
    knex.raw('DROP TRIGGER sync_users_user_question_locks ON users'),
    knex.raw('DROP FUNCTION sync_users_user_question_locks()'),
    knex.schema.dropTable('user_question_locks')
  ]);
  
};
