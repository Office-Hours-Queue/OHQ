exports.seed = function(knex, Promise) {
  
  return Promise.all([

                knex.insert([
                  
                        { andrew_id: "nanakis", role: "ca" },
                        { andrew_id: "xinhuig", role: "ca" },
                        { andrew_id: "cemery", role: "ca" },
                        { andrew_id: "abhagira", role: "ca" },
                        { andrew_id: "dongqiw", role: "ca" },
                        { andrew_id: "nflowers", role: "ca" },
                        { andrew_id: "rishabhc", role: "ca" },
                        { andrew_id: "aschreff", role: "ca" },
                        { andrew_id: "kdchin", role: "ca" },
                        { andrew_id: "nle", role: "ca" },
                        { andrew_id: "rkaufman", role: "ca" },
                        { andrew_id: "rmorina", role: "ca" },
                        { andrew_id: "edryer", role: "ca" }

    ]).into('valid_andrew_ids')
  ]);
};
