var login_ctl = ["$scope","$rootScope","$db","$http", function($scope,$rootScope,$db,$http) {
	$rootScope.$db = $db;

	var check_login = function () {
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
	};
	check_login();

	$scope.login_submit = function () {
		var username = $("#username").val();
		var pass = $("#password").val();
		if (username == "" || pass == "") { return }
		$http.post("/login/localauth").then(function (successData) {
			Materialize.toast("Success!")
			check_login()
		}, function (failData) {
			console.log(failData)
			Materialize.toast("There was an error logging in. Please see a CA.")
		});
	}

	
}];
