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
	$scope.add_student_andrew_id = function () {
	    $http.post("/api/validusers/add/student", [{ andrew_id: $("#new_student_andrew_id").val() }]);
	    Materialize.toast("Student added!",2000);
	}
	$scope.add_ca_andrew_id = function () {
		$http.post("/api/validusers/add/ca", [{ andrew_id: $("#new_ca_andrew_id").val() }]);
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
	$scope.batch_role = function () {
    
  	}
}];
