
exports.seed = function(knex, Promise) {
  
  return Promise.all([

    knex.insert([
      { andrew_id: 'edryer',role:'student'},
      { andrew_id: 'jdryer',role:'ca'},
      { andrew_id: 'aaa', role: 'ca' },
      { andrew_id: 'bbb', role: 'ca' },
      { andrew_id: 'ccc', role: 'ca' },
      { andrew_id: 'ddd', role: 'ca' },
      { andrew_id: 'eee', role: 'ca' },
      { andrew_id: 'fff', role: 'ca' },
      { andrew_id: 'ggg', role: 'ca' },
      { andrew_id: 'aa',  role: 'student' },
      { andrew_id: 'bb',  role: 'student' },
      { andrew_id: 'cc',  role: 'student' },
      { andrew_id: 'dd',  role: 'student' },
      { andrew_id: 'ee',  role: 'student' },
      { andrew_id: 'ff',  role: 'student' },
      { andrew_id: 'gg',  role: 'student' }
    ]).into('valid_andrew_ids')

  ]);

};
