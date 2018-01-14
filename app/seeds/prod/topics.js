exports.seed = function(knex, Promise) {
  
  return Promise.all([

    knex.insert([
      { id:1, topic: 'Homework',  enabled: true },
      { id:2, topic: 'Conceptual',  enabled: true },
      { id:3, topic: 'NA',  enabled: true },
    ]).into('topics')

  ]);

};

