exports.seed = function(knex, Promise) {
  
  return Promise.all([

    knex.insert([
		{'role': 'student', 'andrew_id': '24354b46-f67d-4a81-be2b-bbf7a5457081'},
		{'role': 'student', 'andrew_id': '7649da9f-4471-4ba1-a35b-30f166455545'},
		{'role': 'student', 'andrew_id': 'e975bda5-3f67-40ce-b0de-afbfd5442d7b'},
		{'role': 'student', 'andrew_id': '879887a0-c956-49a7-8f4a-fbbc5775e6f6'},
		{'role': 'student', 'andrew_id': '4ee7f0ec-e96f-4ac8-87f4-d91d84e1b50d'},
		{'role': 'student', 'andrew_id': 'ef52b58e-13e0-4cac-8a37-90fc9fc6b90e'},
		{'role': 'student', 'andrew_id': 'aa7831f7-b572-47fc-9fc9-b5754b997c47'},
		{'role': 'student', 'andrew_id': 'c8339bd4-2601-4ff0-bf8a-9c8fadaf2f6f'},
		{'role': 'student', 'andrew_id': '8f590d34-b1b0-41d6-affd-daa7d9b7a6f5'},
		{'role': 'student', 'andrew_id': '794b41e3-8168-4676-93a8-bdfe9fc1aead'}
	]).into('valid_andrew_ids')

  ]);

};
