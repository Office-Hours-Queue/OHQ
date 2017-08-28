exports.seed = function(knex, Promise) {
  
  return Promise.all([

                knex.insert([
                  
                        {andrew_id : "test_student", role: "student" },
       
    ]).into('valid_andrew_ids')
  ]);
};
