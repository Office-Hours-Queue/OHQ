exports.seed = function(knex, Promise) {
  
  return Promise.all([

    knex.insert([
      { id:3, topic: 'OOP',  enabled: true },
      { id:4, topic: 'Recursion',  enabled: true }
    ]).into('topics')

  ]);

};

