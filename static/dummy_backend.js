/* 
 * Dummy SocketIO server for testing
 * Missing features:
 * 		- a real database
 * 		- security
 * 			- it assumes the client knows who it is 
 * 		- input sanitizing (json schema maybe)
 * Note: 
 * 		- This is designed to mirror the database (except where it can't, like student_meta)
 * 		- everything is a list because I plan to use the same code 
 		  to store questions that come in whether for CA or student
 		  (student will just be missing some fields). Something is a list instead of an object
 		   if it is only used for a student (like student_meta)
 * 		- leaving timing serverside cause clients could have weird time
 			 zones issues + security we basically want everything serverside. 
 */

//Init server
var Server = require('socket.io');
var io = new Server(7000);

//Student Room -> Student Client 
var student_room = io.of('/student')
student_room.emit('questions',[ //only send student's question
	{"id":122,"topic_id": 123,"location_id": 125,"help_text":"woo help text"}
]);
student_room.emit('topics',[ //only send active ones
	{ "id": 123,"topic": "Recursion"},
	{ "id": 124,"topic": "OOP"},
]);
student_room.emit('locations',[ //only send active ones
	{ "id": 125,"location": "GHC 5000"}
	{ "id": 126,"location": "GHC 7000"}
]);
student_room.emit('student_meta',{ //not actually a table in the database
		'queue_ps': 2,
		"ca_on_way": false,
		"is_frozen": false,
		"can_freeze": true
})
student_room.emit('queue_meta',[{ 
	"id": 127,
	"open": true,
}]);

//Student Client -> Server
// student_room.on("add_question",{})
// student_room.("update_question",{})
// student_room.("freeze",primary_key)


//CA Room 
var ca_room = io.of('/ca')
ca_room.emit('questions',[ //send non frozen/non off questions
	{
		"id": 121,
		"student_andrew_id":"jdryer",
		"topic_id":"123",
		"location_id":"125",
		"help_text":"woo need help",
		"is_frozen":false
	}
]);
ca_room.emit('topics',[ //only send active ones
	{ "id": 123,"topic": "Recursion"},
	{ "id": 124,"topic": "OOP"},
]);
ca_room.emit('locations',[ //only send active ones
	{ "id": 125,"location": "GHC 5000"}
	{ "id": 126,"location": "GHC 7000"}
]);
ca_room.emit('queue_meta',[{ 
	'id': 127,
	"open": true,
	"time_limit": 5
}])

//CA Client -> Server
// .on("kick_question",primary_key)
// .on("finish_question",primary_key)
// .on("freeze_question",primary_key)
// .on("update_queue_open",bool)
// .on("update_minute_rule",int)

//Admin Room
var admin_room = io.of('/admin')
//might not make this page
//can easily hook up R to sql for analytics 
//might still need way to add rooms and such  (maybe just a db admin interface like php my admin?)
