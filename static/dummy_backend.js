var Server = require('socket.io');
var io = new Server(7000);
var student_room = io.of('/student')

//Normally do this on student connect
setInterval(function(){
	// student_room.emit("questions",{
	// 	"type": "insert",
	// 	"payload": [{
	// 		"id": 121,
	// 		"topic_id":123,
	// 		"location_id":125,
	// 		"help_text":"woo need help",
	// 	}]
	// })
	student_room.emit('locations',{
		"type": "insert", 
		"payload": [{ "id": 125,"location": "GHC 5000"}]
	})
	student_room.emit('topics',{
		"type": "insert",
		"payload": [{ "id": 123, "topic": "Recursion"},{ "id": 124, "topic": "OOP"}]
	})
	student_room.emit('queue_meta', {
		"type": "insert",
		"payload": [{ "open": true }]
	})
	student_room.emit('student_meta',{
		"type": "insert",
		"payload": [{ //not actually a table in the database
			'queue_ps': 2,
			"is_frozen": false,
			"can_freeze": true,
		}]
	})
	// student_room.emit('message',"woo")
}, 5000);



// //CA Room 
// var ca_room = io.of('/ca')
// setInterval(function(){
// 	ca_room.emit("questions",{
// 		"type":"insert",
// 		"payload": [{
// 			"id": 121,
// 			"first_name": "Joey",
// 			"andrew_id":"jdryer",
// 			"topic":"Recursion",
// 			"location":"GHC 5000",
// 			"help_text":"woo need help",
// 		}]
// 	})
// 	ca_room.emit('queue_meta', {
// 		"type": "insert",
// 		"payload": [{ 
// 			"open": true,
// 			"time_limit": 5
// 		}]
// 	})
// 	ca_room.emit('ca_meta',{
// 		"type": "insert",
// 		"payload": [{
// 			"n_questions":10,
// 			"n_cas": 5,
// 			"answering_question":  false,
// 			"question": {
// 				"id": 121,
// 				"first_name": "Joey",
// 				"topic":"Recursion",
// 				"location":"GHC 5000",
// 				"help_text":"woo need help",
// 			} 
// 		}]
// 	})
// 	// ca_room.emit('message',"woo")
// },5000)

//CA Client -> Server
// .on("kick_question",primary_key)
// .on("finish_question",primary_key)
// .on("freeze_question",primary_key)
// .on("update_queue_open",bool)
// .on("update_minute_rule",int)
