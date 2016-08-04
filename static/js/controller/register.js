var register_ctl = ["$scope","$rootScope","$db","$http", function($scope,$rootScope,$db,$http) {
	$rootScope.$db = $db;

	$scope.register_info = {};
	$scope.register = function() {
		var required = ["andrew_id","email","password","conf_password","first_name","last_name","registration_code"];
		for (var i = 0; i < required.length; i++) {
			var field = required[i];
			if ($scope.register_info[field] == undefined) {
				console.log("not complete")
				return 
			}
		}
		if (!(/.+@.+\..+/.test($scope.register_info["email"]))) {
			Materialize.toast("Invalid email.")
			return
		}
		if ($scope.register_info["password"].length <= 8) {
			Materialize.toast("Password must have more than 8 characters!")
			return
		}
		if ($scope.register_info["password"] != $scope.register_info["conf_password"]) {
			Materialize.toast("Passwords did not match!")
			return
		}
		var payload = $scope.register_info
		$http.post("/user/createlocal",payload).then(
			function(successData) {
				Materialize.toast("Success! Click &nbsp <a href='/#/'>here</a> &nbsp to return to the login page.")
			}, function(failData) {
				console.log(failData)
				if (failData.data.message == undefined) {
					Materialize.toast("Registration Failed")
					return
				}
				Materialize.toast(failData.data.message)
		});
	}
}];


 
