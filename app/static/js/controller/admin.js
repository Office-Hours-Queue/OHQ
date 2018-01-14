var admin_ctl = ["$scope","$rootScope","$db","$http",function($scope,$rootScope,$db,$http) {
	$rootScope.$db = $db;
	$rootScope.check_login();
	$rootScope.current_page = "admin";
	$scope.update_minute_rule = function () {
		var min_rule =  $("#minuteRule").val();
		if (isNaN(min_rule)) {
			Materialize.toast("Invalid minute rule!")
			return
		}
		$db.update_minute_rule(min_rule);
		Materialize.toast("Minute rule updated!",2000);
	}

	$scope.add_ca_andrew_id = function () {
		$http.post("/api/role/set", { "andrew_ids": [$("#new_ca_andrew_id").val()],
																	 "course_id": parseInt(sessionStorage.getItem('current_course')),
																	 "role": "ca"});
		Materialize.toast("CA added!",2000);
	}

	$scope.selected_del = "Topic";
	$scope.selected_del_item = "unkown";
	$scope.selected_del_id = -1;
	$scope.select = function (del_item, del,del_id) {
		$scope.selected_del = del;
		$scope.selected_del_item = del_item;
		$scope.selected_del_id = del_id;
	}
	$scope.delete_topic_or_loc = function () {
		if ($scope.selected_del == "Topic"){
			$db.delete_topic($scope.selected_del_id);
		}
		if ($scope.selected_del == "Location") {
			$db.delete_loc($scope.selected_del_id);
		}
	}

	$scope.enable_topic_or_loc = function()  {
		if ($scope.selected_del == "Topic"){
			$db.enable_topic($scope.selected_del_id);
		}
		if ($scope.selected_del == "Location") {
			$db.enable_loc($scope.selected_del_id);
		}
	}

	$scope.submit_roles = function(people) {
			console.log("in submit roles");
			people = people.filter((person) => person != "");
			var payload = {
				"andrew_ids": people,
				"course_id": parseInt(sessionStorage.getItem('current_course')),
				"role": "ca"
			}
			console.log(payload)
			$http.post("/api/role/set", payload).then(function(success) {
				Materialize.toast('TAs Added', 5000);
			}, function(fail) {
				Materialize.toast('There was an error', 5000);
			});
	}

	$scope.batch_role = function () {
		console.log("pressed");
		var input, file, fr, result;
		input = document.getElementById('csv_input');
		file = input.files[0]
		fr = new FileReader();
		fr.onload = function(e) {
			console.log("read file");
			$scope.submit_roles(e.target.result.split("\n"));
		}
		fr.readAsText(file);
	}

	$scope.get_tas = function () {
		$http.get("/api/course/get_tas",
							{params: {course_id: parseInt(sessionStorage.getItem('current_course'))}})
			.then(function(success) {
				$scope.tas = success.data;
				console.log($scope.tas);
	    },
			function(fail) {
				Materialize.toast('There was an error', 5000);
	    });
	}
	$scope.get_tas();

	$scope.selected_ta = "unknown";
	$scope.select_ta = function (andrew_id) {
		$scope.selected_ta = andrew_id;
	}

	$scope.delete_ta = function () {
		var payload = {
			andrew_ids: [$scope.selected_ta],
			course_id: parseInt(sessionStorage.getItem("current_course")),
			role: 'student'
		}

		$http.post("/api/role/set", payload).then(function(success) {
	      Materialize.toast('TA Removed', 5000);
	    }, function(fail) {
	      Materialize.toast('There was an error', 5000);
	    });
	}
}];
