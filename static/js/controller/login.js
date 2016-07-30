var login_ctl = ["$scope","$rootScope","$db","$http", function($scope,$rootScope,$db,$http) {
	$rootScope.$db = $db;

	//Get login user object
	$http.get('/user', {}).then(function (data) {
		console.log(data)
		if (data["data"]["first_name"] != undefined) {
			$rootScope.user = data["data"];
			window.location = "/#/" + $rootScope.user["role"]
		} 
	}, function() {
		console.log("Failed to GET /user")
	});
}];
