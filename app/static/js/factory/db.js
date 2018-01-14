/*
 * Access to the database via socketio
 *  attempts to model the actual schema as well as possible
 *  usable for both ca,student views
 */
var db = ["$rootScope","$http","$route","localStorageService",function ($rootScope,$http,$route,lss) {
	var d = {};

	$rootScope.set_course = function () {
		if (sessionStorage.getItem('current_course') != undefined) {
			$rootScope.current_course = sessionStorage.getItem('current_course')
			$rootScope.current_role = ($rootScope.user["roles"][$rootScope.current_course] || "student");
			$rootScope.$broadcast("user_ready");
			if ($rootScope.current_page == "landing") {
				window.location = "/#/" + ($rootScope.user["roles"][sessionStorage.getItem('current_course')] || "student");
			}
		}
	}

	$rootScope.unset_course = function () {
		console.log("DISCONNECTING FROM SIO");

		if (d.qsio != undefined) {d.qsio.disconnect();}
		if (d.usio != undefined) {d.usio.disconnect();}
		if (d.hsio != undefined) {d.hsio.disconnect();}
		if (d.wsio != undefined) {d.wsio.disconnect();}
	}

	/* Access to user object */
	$rootScope.check_login = function () {
		//Get login user object
		$http.get('/api/user', {}).then(function (data) {
			if (data["data"]["first_name"] != undefined && $rootScope.user == undefined) {
				$rootScope.user = data["data"];
				if (sessionStorage.getItem('current_course') == undefined) {
					window.location = "/#/courses";
					return;
				}
				$rootScope.set_course();
			}
			if (["admin", "ca", "stats"].includes($rootScope.current_page)
					&& $rootScope.current_role !== 'ca') {
					window.location = "/#/" + ($rootScope.current_role || "courses");
			}
			if (["student"].includes($rootScope.current_page)
					&& $rootScope.current_role !== 'student') {
						window.location = "/#/" + ($rootScope.current_role || "courses");
			}
			if (["course_admin"].includes($rootScope.current_page)
					&& !user.is_admin) {
					window.location = "/#/" + ($rootScope.current_role || "courses");
			}
		}, function() {
			if ($route.current.scope.name != "login") {
				window.location = "/#/";
			}
		});
	};

	/* Connect to socketio when the user exists */
	/* Initialize SocketIO */
	$rootScope.$on("user_ready", function (course_id) {
		console.log("CONNECTING TO SIO")

		var sio_opts = {
			"reconnection":true,
			"reconnectionDelay":200,
			"reconnectionDelayMax": 200,
		};
		d.qsio = io('/queue',sio_opts);
		d.usio = io('/user',sio_opts);
		d.hsio = io('/history',sio_opts);
    d.wsio = io('/waittime',sio_opts);
		d.n_history = 5;
		d.io_connected = false
		d.qsio.on("questions",function (payload) {
			for (var i = 0; i < payload.payload.length; i++) {
				payload.payload[i].is_new = true;
			}
			handle_db_update("questions",payload);
		});
		d.qsio.on("questions_initial",function (payload) {
			for (var i = 0; i < payload.payload.length; i++) {
				payload.payload[i].is_new = false;
			}
			handle_db_update("questions",payload);
		});
		d.qsio.on("locations",function (payload) { handle_db_update("locations",payload); });
		d.qsio.on("topics",function (payload) { handle_db_update("topics",payload); });
		d.qsio.on("queue_meta",function (payload) { handle_db_update("queue_meta",payload); });
		d.qsio.on("current_question",function (payload) { handle_db_update("current_question",payload); });
		d.qsio.on("message", function (payload) { Materialize.toast(payload); });
		d.usio.on("name_change", function (payload) { $rootScope.user.first_name = payload.payload[0].first_name;});
		d.usio.on("cas_active", function (payload) { handle_db_update("cas_active",payload); });
		d.hsio.on("questions", function(payload) { handle_db_update("closed_questions", payload); });
    d.wsio.on("wait_time", function(payload) { handle_db_update("wait_time", payload); });
		d.qsio.on("joined", function() {
      $rootScope.$apply(function() {
			  setEmptyModel();
			  d.io_connected = true;
      });
		});
		d.qsio.on("disconnect", function () {
			if (sessionStorage.getItem('current_course')) {
				$rootScope.$apply(function() {
					d.io_connected = false;
				});
			} else {
				d.io_connected = false;
			}
		});
		d.qsio.on("error", function(reason) {
			if (reason === 'Not authorized') {
				window.location = '/api/login/endauth';
			}
		});
		d.hsio.on("joined", function() {
			d.hsio.emit('get_last_n', d.n_history);
		});
    d.wsio.on("joined", function() {
      var req = function() {
        d.wsio.emit('get_latest');
      };
      req();
      setInterval(req, 1000 * 60 * 10);
    });

		d.qsio.emit('join_course', sessionStorage.getItem('current_course'));
		d.hsio.emit('join_course', sessionStorage.getItem('current_course'));
		d.wsio.emit('join_course', sessionStorage.getItem('current_course'));
		d.usio.emit('join_course', sessionStorage.getItem('current_course'));
	});

	/* Initialize Model of the database */
  var setEmptyModel = function() {
    d.model = {
      "questions":[],
      "topics":[],
      "courses":[],
      "locations":[],
      "queue_meta": [],
      "current_question": [],
      "cas_active": [],
      "closed_questions": [],
      "wait_time": []
    };
  };
  setEmptyModel();

	var handle_db_update = function(db_name,event) {
		console.log("DB updated")
		var event_type = event["type"];
		var payload = event["payload"];
		console.log(event_type,payload,db_name)
		switch (event_type) {
			case "data":
				for (var i = 0; i < payload.length; i++) {
					var db_index = get_index_by_id(d.model[db_name],payload[i].id)
					if (db_index == -1) {
						//Insert
						d.model[db_name].unshift(payload[i]);
					} else {
						//Update
						d.model[db_name][db_index] = payload[i];
					}
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
	d.return_question = function () {
		console.log("db return")
		d.qsio.emit("return_question",{});
	}
	d.answer_question = function () {
		console.log("Answer!")
		d.qsio.emit("answer_question",{})
	}
	d.add_n_history = function(n) {
    	d.n_history = d.n_history + 5;
    	d.hsio.emit('get_last_n', d.n_history);
	}
	d.add_new_topic = function () {
		var topic = $("#new_topic").val()
		if (topic == "") { return }
		for (var i = 0; i < d.model.topics.length; i++) {
			if (topic == d.model.topics[i].topic) {
				return;
			}
		}
		d.qsio.emit("add_topic",topic);
	}
	d.add_new_location = function () {
		var loc = $("#new_location").val()
		if (loc == "") { return }
		for (var i = 0; i < d.model.locations.length; i++) {
			if (loc== d.model.locations[i].location) {
				return;
			}
		}
		d.qsio.emit("add_location",loc);
	}
	d.delete_topic = function (topic) {
		d.qsio.emit("delete_topic", topic);
	}
	d.delete_loc = function (loc) {
		d.qsio.emit('delete_location', loc)
	}
	d.enable_topic = function(topic) {
		d.qsio.emit("enable_topic", topic);
	}
	d.enable_loc = function (loc) {
		d.qsio.emit('enable_location', loc);
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
				return "TA answering"
			case "frozen":
				return "Frozen"
			case "on_queue":
				return "On the Queue"
			case "closed: self_kick":
				return "Self closed"
			case "closed: ca_kick":
				return "TA kicked"
			case "closed: normal":
				return "Answered"
			default:
				return ""
		}
	}

	return d
}];
