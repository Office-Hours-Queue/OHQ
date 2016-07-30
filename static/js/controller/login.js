var login_ctl = ["$scope","$rootScope","$db","$http", function($scope,$rootScope,$db,$http) {
	$rootScope.$db = $db;

	//Get login user object
	$http.get('/user', {}).then(function (data) {
		if (data["statusText"] == "OK") {
			$rootScope.user = data["data"];
			window.location = "/#/" + $rootScope.user["role"]
		} else {
			window.location = "/";
		}
	}, function() {
		console.log("Failed to GET /user")
	});
}];
