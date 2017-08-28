exports.seed = function(knex, Promise) {
  
  return Promise.all([

    knex.insert([
      { id:1, location: 'GHC Commons',  enabled: true },
      { id:2, location: 'NA',  enabled: true }
    ]).into('locations')

  ]);

};


