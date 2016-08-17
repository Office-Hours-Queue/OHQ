var admin_ctl = ["$scope","$rootScope","$db","$http",function($scope,$rootScope,$db,$http) {
	$rootScope.$db = $db;
	$rootScope.check_login();
	$rootScope.current_page = "admin";
	$scope.add_andrew_id = function () {
    $http.post("/api/validusers/add/student", [{ andrew_id: $("#new_andrew_id").val() }]);
	}
}];
