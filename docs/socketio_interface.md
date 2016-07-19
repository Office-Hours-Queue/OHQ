#CA Room 

Note: events that have lists can be updates or inserts. If the primary key exists .update() will be called, otherwise it will be considered a new item. 

###Events that CA Room Client Receives
```javascript
//only send questions that are unanswered
.on("question",[json dump of question row, json dump of question row,...])
.on("queue_meta",{JSON dump of queue_meta table})
.on("ca_count", int)
```

###Events that CA can send 
```
.emit("kick_question",primary_key)
.emit("finish_question",primary_key)
.emit("freeze_question",primary_key)
.emit("update_queue_open",bool)
.emit("update_minute_rule",int)
```


#Student Room

###Events that student can receive 
```javascript
.on("my_question",{json dump of current question})
.on("message",string)
.on("position",int) 
.on("topic",[string,...])
.on("room",[string,...])
```

###Events that student can send 
```javascript
.on("add_question"{topic,room,desc})
```






