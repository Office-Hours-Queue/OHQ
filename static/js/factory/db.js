/* 
 * Access to the database via socketio 
 *  attempts to model the actual schema as well as possible
 *  usable for both ca,student views 
 */
var db = ["$rootScope", function ($rootScope) {
	var d = {};

	/* Initialize SocketIO */
	d.sio = io('http://localhost:7000/student'); //@TODO CHANGE THIS
	d.io_connected = false
	d.sio.on("connect", function() {
		d.io_connected = true;
		$rootScope.$apply();
	});
	d.sio.on("disconnect", function () {
		d.io_connected = false;
		$rootScope.$apply();
	})

	/* Initialize Model of the database */
	d.model = {
		"questions":[],
		"topics":[],
		"locations":[],
		"student_meta":[],
		"queue_meta": []
	}

	/* Setup events to receive */
	d.sio.on("questions",function (payload) { handle_db_update("questions",payload)})
	d.sio.on("locations",function (payload) { handle_db_update("locations",payload)})
	d.sio.on("topics",function (payload) { handle_db_update("topics",payload)})
	d.sio.on("student_meta",function(payload) { handle_db_update("student_meta",payload)});
	d.sio.on("queue_meta",function (payload) { handle_db_update("queue_meta",payload)})
	d.sio.on("message", function (payload) { Materialize.toast(payload) })
	var handle_db_update = function(db_name,event) {
		var event_type = event["type"];
		var payload = event["payload"];
		switch (event_type) {
			case "insert":
				//check for repeats because they crash angular
				for (var i = 0; i < payload.length; i++) {
					var db_index = get_index_by_id(d.model[db_name],payload[i].id)
					if (db_index != -1) {
						console.log("repeated insert")
						return
					}
				}
				d.model[db_name] = d.model[db_name].concat(payload);
				break;
			case "delete":
				for (var i = 0; i < payload.length; i++) {
					var db_index = get_index_by_id(d.model[db_name],payload[i].id)
					d.model[db_name] = d.model[db_name].splice(db_index)
				}
				break;
			case "update":
				for (var i = 0; i < payload.length; i++) {
					var db_index = get_index_by_id(d.model[db_name],payload[i].id)
					d.model[db_name][db_index] = payload[i]	
				}
				break;
		}
		console.log(d.model)
		$rootScope.$apply();
	};
	
	/* Events to send */
	d.add_question = function(payload) {
		d.sio.emit("new_question",payload)
	}
	d.delete_question = function(qid) { 
		d.sio.emit("delete_question", qid)
	}
	d.freeze_question = function(qid) {
		d.sio.emit("freeze_question", qid)
	}
	d.update_question = function(payload) {
		console.log(payload)
		d.sio.emit("update_question",payload)
	}

	/* Helpers */
	d.get_field_by_id = function(fields,name,id) {
		for (var i = 0; i < fields.length; i++) {
			if (fields[i].id == id) {
				return fields[i][name]
			}
		}	
		return ""	
	}
	d.get_topic_by_id = function(id) { return d.get_field_by_id(d.model["topics"],"topic",id)}
	d.get_location_by_id = function(id) { return d.get_field_by_id(d.model["locations"],"location",id) }
	d.can_freeze = function () {
		if (d.model["questions"].length == 0) {
			return false
		}
		if (d.model["student_meta"].length == 1) {
			return d.model["student_meta"][0].can_freeze
		}
		return false
	}
	d.is_frozen = function () {
		if (d.model["questions"].length == 0) {
			return false	
		}
		if (d.model["student_meta"].length == 0) {
			return false
		}
		return d.model["student_meta"][0].is_frozen
	}

	return d 
}];