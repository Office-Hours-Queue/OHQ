import uuid
import pickle

#Generate knex file
file_text = """exports.seed = function(knex, Promise) {
  
  return Promise.all([

    knex.insert([\n"""
n = 5000
ids = []
for i in range(n):
	andrew_id = str(uuid.uuid4())
	ids.append(andrew_id)
	payload = {'andrew_id': andrew_id, "role": "student"}
	file_text += "		%s,\n" % str(payload)
file_text = file_text[:-2]
file_text += """
	]).into('valid_andrew_ids')

  ]);

};
"""

#Write knex file
f = "test_andrew_ids.js"
fd = open(f,"wt")
fd.write(file_text)
fd.close()

#Write pickle file of andrew ids
p = open( "andrew_ids.p", "wb" )
pickle.dump(ids,p)
p.close()




