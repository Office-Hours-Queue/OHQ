var login_ctl = ["$scope","$rootScope","$db","$http", function($scope,$rootScope,$db,$http) {
	$rootScope.$db = $db;
	$rootScope.current_page = "login";
	$scope.name = "login";

	//Forward them to their page if they're already logged in 
	$rootScope.check_login();

	$scope.login_submit = function () {
		var username = $("#username").val();
		var pass = $("#password").val();
		if (username == "" || pass == "") { return }
		var payload = {
			"username": username,
			"password": pass,
		};
		$http.post("/api/login/localauth",payload).then(function (successData) {
			$("#non-google-modal").closeModal()
			$rootScope.check_login();
		}, function (failData) {
			console.log(failData)
			Materialize.toast("Login Failed.",3000)
		});
	}

	
}];
