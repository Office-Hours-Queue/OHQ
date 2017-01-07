var account_ctl = ["$scope","$rootScope","$db","$http",function($scope,$rootScope,$db,$http) {
	$rootScope.$db = $db;
	$rootScope.check_login();
	$rootScope.current_page = "account";

	$scope.update_name = function() {
		var new_first_name = $("#new_name").val();
		var payload = { first_name: new_first_name }
		$http.post("/api/user/edit_first_name",payload).then(
			function(successData) {
				$('#modaleditname').closeModal();
			}, function(failData) {
				Materialize.toast("Edit failed!");
				$('#modaleditname').closeModal();
			});
	};
}];
