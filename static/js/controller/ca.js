var ca_ctl = ["$scope","$rootScope","$db","$http",function($scope,$rootScope,$db,$http) {
	$rootScope.$db = $db;
	$rootScope.check_login();
	$scope.name = "ca";

	$scope.$watch(function () {
		return $db.model['current_question'].length
	},function () {
		if ($db.model['current_question'].length == 1) {
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
