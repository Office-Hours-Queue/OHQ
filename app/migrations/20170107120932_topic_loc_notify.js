//add triggers to location/topic tables 
exports.up = function(knex, Promise) {

  var new_triggers =
          '-- listen to the questions,users and queue_meta tables\n' +
          'DROP TRIGGER IF EXISTS\n' +
          '  topic_notify\n' +
          'ON\n' +
          '  topics;\n' +
          'CREATE TRIGGER\n' +
          '  topic_notify\n' +
          'AFTER UPDATE OR INSERT OR DELETE ON\n' +
          '  topics\n' +
          'FOR EACH ROW EXECUTE PROCEDURE\n' +
          '  table_update_notify();\n' + 
          '\n' +
          'DROP TRIGGER IF EXISTS\n' +
          '  loc_notify\n' +
          'ON\n' +
          '  locations;\n' +
          'CREATE TRIGGER\n' +
          '  loc_notify\n' +
          'AFTER UPDATE OR INSERT OR DELETE ON\n' +
          '  locations\n' +
          'FOR EACH ROW EXECUTE PROCEDURE\n' +
          '  table_update_notify();';;

  return Promise.all([
    knex.raw(new_triggers)
  ]);
  
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.raw('DROP TRIGGER topic_notify ON topics;'),
    knex.raw('DROP TRIGGER loc_notify ON locations;'),
  ]);
};


