var ca_ctl = ["$scope","$rootScope","$db","$http",function($scope,$rootScope,$db,$http) {
	$rootScope.$db = $db;

	//Get login user object
	$http.get('/user', {}).then(function (data) {
		if (data["data"]["first_name"] != undefined) {
			$rootScope.user = data["data"];
			console.log($rootScope.user)
		} else {
			window.location = "/";
		}
	}, function() {
		console.log("Failed to GET /user")
	});

	$scope.$watch(function () {
		if ($db.model['ca_meta'].length == 0) { return false }
		return $db.model['ca_meta'][0].answering_question
	},function () {
		if ($db.model['ca_meta'].length == 0) { return }
		if ($db.model['ca_meta'][0].answering_question) {
			$('#modalanswerquestion').openModal({
				dismissible: false
			});
		} else {
			$('#modalanswerquestion').closeModal();
		}
	});

	$scope.update_minute_rule = function () {
		var min_rule =  $("#minuteRule").val();
		$db.update_minute_rule(min_rule);
	}
}];
