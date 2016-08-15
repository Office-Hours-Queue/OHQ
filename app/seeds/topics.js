exports.seed = function(knex, Promise) {
  
  return Promise.all([

    knex.insert([
      { topic: 'OOP',  enabled: true },
      { topic: 'Recursion',  enabled: true }
    ]).into('topics')

  ]);

};

