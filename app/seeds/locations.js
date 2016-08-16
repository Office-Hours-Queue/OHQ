exports.seed = function(knex, Promise) {
  
  return Promise.all([

    knex.insert([
      { id:1, location: 'GHC 5000',  enabled: true },
      { id:2, location: 'GHC 7000',  enabled: true }
    ]).into('locations')

  ]);

};


