
exports.up = function(knex, Promise) {

  var table_update_notify_fn =
          '-- this function notifies which row was changed when\n' +
          '-- called by a trigger\n' +
          'CREATE OR REPLACE FUNCTION\n' +
          '  table_update_notify()\n' +
          'RETURNS trigger AS\n' +
          '  $$\n' +
          'DECLARE\n' +
          '  id int;\n' +
          'BEGIN\n' +
          '  -- get the updated row\'s id\n' +
          '  IF TG_OP = \'INSERT\' OR TG_OP = \'UPDATE\' THEN\n' +
          '    id = NEW.id;\n' +
          '  ELSE\n' +
          '    id = OLD.id;\n' +
          '  END IF;\n' +
          '  -- emit some json\n' +
          '  PERFORM pg_notify(\'table_update\',\n' +
          '                json_build_object(\n' +
          '                  \'table\', TG_TABLE_NAME,\n' +
          '                  \'action\', TG_OP,\n' +
          '                  \'id\', id\n' +
          '                )::text);\n' +
          '  RETURN NEW;\n' +
          'END;\n' +
          '$$ LANGUAGE plpgsql;';

  var triggers =
          '-- listen to the questions,users and queue_meta tables\n' +
          'DROP TRIGGER IF EXISTS\n' +
          '  questions_notify\n' +
          'ON\n' +
          '  questions;\n' +
          'CREATE TRIGGER\n' +
          '  questions_notify\n' +
          'AFTER UPDATE OR INSERT OR DELETE ON\n' +
          '  questions\n' +
          'FOR EACH ROW EXECUTE PROCEDURE\n' +
          '  table_update_notify();\n' +
          '\n' +
          'DROP TRIGGER IF EXISTS\n' +
          '  queue_meta_notify\n' +
          'ON\n' +
          '  queue_meta;\n' +
          'CREATE TRIGGER\n' +
          '  queue_meta_notify\n' +
          'AFTER UPDATE OR INSERT OR DELETE ON\n' +
          '  queue_meta\n' +
          'FOR EACH ROW EXECUTE PROCEDURE\n' +
          '  table_update_notify();\n' + 
          '\n' +
          'DROP TRIGGER IF EXISTS\n' +
          '  users_notify\n' +
          'ON\n' +
          '  users;\n' +
          'CREATE TRIGGER\n' +
          '  users_notify\n' +
          'AFTER UPDATE OR INSERT OR DELETE ON\n' +
          '  users\n' +
          'FOR EACH ROW EXECUTE PROCEDURE\n' +
          '  table_update_notify();';;

  return Promise.all([
    knex.raw(table_update_notify_fn),
    knex.raw(triggers)
  ]);
  
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.raw('DROP TRIGGER users_notify ON users;'),
    knex.raw('DROP TRIGGER questions_notify ON questions;'),
    knex.raw('DROP TRIGGER queue_meta_notify ON queue_meta;'),
    knex.raw('DROP FUNCTION table_update_notify();')
  ]);
};
