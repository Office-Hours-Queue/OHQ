// enhance table_update_fn by including the new/old rows in the event

exports.up = function(knex, Promise) {
  var table_update_fn =
    'CREATE OR REPLACE FUNCTION' +
    '  table_update_notify()' +
    'RETURNS trigger AS' +
    '  $$' +
    'BEGIN' +
    '  -- emit the touched rows on insert/update/delete' +
    '  IF TG_OP = \'INSERT\' THEN' +
    '    PERFORM pg_notify(\'table_update\',' +
    '                  json_build_object(' +
    '                    \'table\', TG_TABLE_NAME,' +
    '                    \'action\', lower(TG_OP),' +
    '                    \'new\', row_to_json(NEW)' +
    '                  )::text);' +
    '  ELSIF TG_OP = \'UPDATE\' THEN' +
    '    PERFORM pg_notify(\'table_update\',' +
    '                  json_build_object(' +
    '                    \'table\', TG_TABLE_NAME,' +
    '                    \'action\', lower(TG_OP),' +
    '                    \'old\', row_to_json(OLD),' +
    '                    \'new\', row_to_json(NEW)' +
    '                  )::text);' +
    '  ELSIF TG_OP = \'DELETE\' THEN' +
    '    PERFORM pg_notify(\'table_update\',' +
    '                  json_build_object(' +
    '                    \'table\', TG_TABLE_NAME,' +
    '                    \'action\', lower(TG_OP),' +
    '                    \'old\', row_to_json(OLD)' +
    '                  )::text);' +
    '  END IF;' +
    '  RETURN NEW;' +
    'END;' +
    '$$ LANGUAGE plpgsql;';

  return Promise.all([
    table_update_fn
  ]);
  
};

exports.down = function(knex, Promise) {
  var old_table_update_notify_fn =
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
  
  return Promise.all([
    old_table_update_notify_fn
  ]);
  
};
