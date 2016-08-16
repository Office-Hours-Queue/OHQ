#Socket IO User Interface

This API applies to the `/user` socket.io namespace. It handles CA online/offline status updates. The `/user` namespace is accessible by CAs only.

##Some Notes Before Reading 

###Event Object Schema 
This is the expected event that the client receives. 

```javascript
{
	"type": "data" //can be data (upsert) or delete
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

##CA Events (Received on the Client)

```javascript
//event follows the schema explained above. 
//payload is this format: 
// [{
// 		"id": 0,
//    "count": 2
// 	}] 
.on("ca_count", event)
```

```javascript
//event follows the schema explained above. 
//payload is this format: 
// [{
// 		"id": 0,
//    "is_online": 2
// 	}] 
.on("ca_status", event)
```

##CA Methods (Sent to the Server)
```javascript
.emit('go_online')
.emit('go_offline')
```
