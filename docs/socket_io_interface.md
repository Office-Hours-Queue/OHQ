#Socket IO Interface

##Some Notes Before Reading 

###Event Object Schema 
This is the expected event that the client receives. 

```javascript
{
	"type": "insert" //can be insert, update, delete
	"payload": //list of objects 
}
```

For example,
```javscript
{
	"type": "insert", 
	"payload": [{ "id": 125,"location": "GHC 5000"}]
}
```
#####Why is every payload a list? 
The client has a single function that handles all of these events (for both ca and student page), so having the type be consistent makes that easy. I chose lists because it matches the rows of the database well, it's also good for ng-repeats.

##Student Events (Received on the Client)
```javascript
//event follows the schema explained above. 
//payload is this format: 
// [{
// 		"id": 121,
// 		"topic_id":123,
// 		"location_id":125,
// 		"help_text":"woo need help",
// 	}] 
.on("questions", event)
```

```javascript
//event follows the schema explained above. 
//payload is this format: [{ "id": 125,"location": "GHC 5000"}]
.on('locations',event)
```

```javascript
//event follows the schema explained above. 
//payload is this format: [{ "id": 123, "topic": "Recursion"},{ "id": 124, "topic": "OOP"}]
.on('topics',event)
```

```javascript 
//event follows the schema explained above. 
//payload is this format: [{ "open": true }]
.on('queue_meta',event)
```

```javascript 

//event follows the schema explained above. 
//payload is this format: [{ 'queue_ps': 2,"is_frozen": false,"can_freeze": true}] 
.on('student_meta')
```

```javascript
// calls Materialize.toast(string)
.on('message',string)
```

##Student Methods (Sent to the Server)

```javascript
//Expects a "questions" event soon after
.emit('add_question', {
	"location_id": int, 
	"topic_id": int,
	"help_text": string
})
```

```javascript
//expects 'questions' event soon after
.emit('delete_question')
```

```javascript
//expects a change in student_meta soon after
.emit('freeze_question')
```

```javascript
//payload is the same as add question except it includes an id
//expects a 'questions' event soon after
.emit('update_question', payload)
```

##CA Events (Received on the Client)

The message event is the same as the student one.

```javascript 
//event follows the schema explained above. 
//payload is this format:
//		[{
// 			"id": 121,
// 			"first_name": "Joey",
// 			"andrew_id":"jdryer",
// 			"topic":"Recursion",
// 			"location":"GHC 5000",
// 			"help_text":"woo need help",
// 		}]
.on('questions',event)
```

```javascript 
//event follows the schema explained above. 
//payload is this format:
//		[{ 
// 			"open": true,
// 			"time_limit": 5
// 		}]
.on('queue_meta',event)
```

```javascript
//event follows the schema explained above.
//payload is this format:
//		[{
// 			"id": 121,
// 			"first_name": "Joey",
// 			"topic":"Recursion",
// 			"location":"GHC 5000",
// 			"help_text":"woo need help"
//		}]
.on('current_question',event)
```

```javascript
//event follows the schema explained above. 
//payload is this format:
//		[{
// 			"n_cas": 5,
// 		}]
.on('ca_meta',event)
```

##CA Methods (Sent to the Server)

```javascript
//these 3 are with respect to the question that the ca is answering
.emit('freeze_question')
.emit('kick_question')
.emit('finish_question')
```

```javascript
//pull question off queue, and send off ca_meta event with info
.emit('answer_question')
```

```javascript
//with respect to queue_meta, expects change event from there 
.emit('close_queue')
.emit('open_queue')
```

```javascript
//expects queue_meta soon after
.emit('update_minute_rule',int)
```
