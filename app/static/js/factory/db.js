/* 
 * Access to the database via socketio 
 *  attempts to model the actual schema as well as possible
 *  usable for both ca,student views 
 */
var db = ["$rootScope","$http","$route",function ($rootScope,$http,$route) {
	var d = {};

	/* Access to user object */
	$rootScope.check_login = function () {
		//Get login user object
		$http.get('/api/user', {}).then(function (data) {
			if (data["data"]["first_name"] != undefined) {
				$rootScope.user = data["data"];
				if ($rootScope.user["role"] == "ca" && $rootScope.current_page == "admin") { return; }
				window.location = "/#/" + $rootScope.user["role"]
			} 
		}, function() {
			if ($route.current.scope.name != "login") {
				window.location = "/#/"; 
			}
		});
	};

	/* Connect to socketio when the user exists */
	$rootScope.$watch(function () {
		return $rootScope.user;
	}, function (new_val,old_val) {
		if (old_val == undefined && new_val != undefined)  {
			/* Initialize SocketIO */
			d.qsio = io('/queue');
      d.usio = io('/user');
      d.hsio = io('/history');
			d.qsio.on("connect", function() {
        setEmptyModel();
				d.io_connected = true;
				$rootScope.$apply();
			});
			d.qsio.on("disconnect", function () {
				d.io_connected = false;
				$rootScope.$apply();
			})
      d.hsio.on("connect", function() {
        d.hsio.emit('get_last_n', 5);
      });
			d.qsio.on("questions",function (payload) { handle_db_update("questions",payload); });
			d.qsio.on("locations",function (payload) { handle_db_update("locations",payload); });
			d.qsio.on("topics",function (payload) { handle_db_update("topics",payload); });
			d.qsio.on("queue_meta",function (payload) { handle_db_update("queue_meta",payload); });
			d.qsio.on("current_question",function (payload) { handle_db_update("current_question",payload); });
			d.qsio.on("message", function (payload) { Materialize.toast(payload); });
      d.usio.on("ca_status", function (payload) { $rootScope.user.is_online = payload.payload[0].is_online; });
      d.usio.on("ca_count", function (payload) { handle_db_update("ca_count",payload); });
      d.hsio.on("questions", function(payload) { handle_db_update("closed_questions", payload); });
    }
	});

	d.io_connected = false

	/* Initialize Model of the database */
  var setEmptyModel = function() {
    d.model = {
      "questions":[],
      "topics":[],
      "locations":[],
      "queue_meta": [],
      "current_question": [],
      "ca_count": [],
      "closed_questions": []
    };
  };
  setEmptyModel();

	var handle_db_update = function(db_name,event) {
		var event_type = event["type"];
		var payload = event["payload"];
		console.log(event_type,payload,db_name)
		switch (event_type) {
			case "data": 
				for (var i = 0; i < payload.length; i++) {
					var db_index = get_index_by_id(d.model[db_name],payload[i].id)
					if (db_index == -1) {
						//Insert
						d.model[db_name].unshift(payload[i])
						continue
					}
					//Update
					d.model[db_name][db_index] = Object.assign(d.model[db_name][db_index],payload[i]);
				}
				break;
			case "delete": 
				for (var i = 0; i < payload.length; i++) {
					var qid = payload[i]
					var db_index = get_index_by_id(d.model[db_name],qid)
					if (db_index > -1) {
					  d.model[db_name].splice(db_index,1);
					}
				}
				break;
		}
		$rootScope.$apply();
	};
	
	/* Events to send */
	d.add_question = function(payload) {
		console.log(payload)
		d.qsio.emit("new_question",payload)
	}
	d.delete_question = function() { 
		console.log("delete")
		d.qsio.emit("delete_question", {})
	}
	d.freeze_question = function() {
		console.log("db freeze")
		d.qsio.emit("freeze_question", {})
	}
	d.unfreeze_question = function() {
		console.log("db un freeze")
		d.qsio.emit("unfreeze_question", {})
	}
	d.update_question = function(payload) {
		console.log(payload)
		d.qsio.emit("update_question",payload)
	}
	d.close_queue = function() {
		console.log("close_queue")
		d.qsio.emit('close_queue')
	}
	d.open_queue = function() {
		console.log("open_queue")
		d.qsio.emit("open_queue")
	}
	d.update_minute_rule = function(new_rule) {
		console.log("update min")
		//Assumes server side validation, send "message" event if invalid
		d.qsio.emit("update_minute_rule",new_rule);
	}
	d.kick_question = function() {
		console.log("db kick")
		d.qsio.emit("kick_question",{});
	}
	d.finish_question = function() {
		console.log("db finish")
		d.qsio.emit("finish_question",{});
	}
	d.answer_question = function () {
		console.log("Answer!")
		d.qsio.emit("answer_question",{})
	}
	d.go_online = function () {
		console.log("go online")
		d.usio.emit("go_online")
	}
	d.go_offline = function () {
		console.log("go offline")
		d.usio.emit("go_offline")
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
		return d.model["questions"][0].can_freeze
	}
	d.is_frozen = function () {
		if (d.model["questions"].length == 0) {
			return false	
		}
		return d.model["questions"][0].is_frozen
	}
	var on_queue = function (q) { return q.state == "on_queue" };
	var on_queue_or_frozen = function (q) { return on_queue(q) || q.state == "frozen" }
	d.n_open_questions = function () {
		return d.model["questions"].filter(on_queue).length;
	}
	d.get_question_list = function() {
		if ($rootScope.show_history) {
			return d.model["questions"]	
		} else {
			return d.model["questions"].filter(on_queue_or_frozen);
		}
	}
	d.has_active_question = function () {
		for (var i = 0; i < d.model["questions"].length; i++) {
			if (d.model["questions"][i].state == "on_queue" || d.model["questions"][i].state == "frozen") {
				return true; 
			}
		}
		return false
	}
	d.get_pretty_state = function(state) {
		switch (state) {
			case "answering":
				return "CA answering"
			case "frozen":
				return "Frozen"
			case "on_queue": 
				return "On the Queue"
			case "closed: self_kick":
				return "Self closed"
			case "closed: ca_kick":
				return "CA kicked"
			case "closed: normal":
				return "Answered"
			default:
				return ""
		}
	}


	return d 
}];
