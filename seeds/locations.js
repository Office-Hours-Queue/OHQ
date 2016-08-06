exports.seed = function(knex, Promise) {
  
  return Promise.all([

    knex.insert([
      { location: 'GHC 5000',  enabled: true },
      { location: 'GHC 7000',  enabled: true }
    ]).into('locations')

  ]);

};


