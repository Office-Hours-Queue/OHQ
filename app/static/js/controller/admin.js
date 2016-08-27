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
	$scope.add_andrew_id = function () {
    $http.post("/api/validusers/add/student", [{ andrew_id: $("#new_andrew_id").val() }]);
    Materialize.toast("Student added!",2000);
	}
}];
