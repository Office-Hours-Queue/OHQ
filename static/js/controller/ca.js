var ca_ctl = ["$scope","$rootScope","$db",function($scope,$rootScope,$db) {
	$rootScope.$db = $db;

	$scope.close_queue = function () {
		$db.close_queue()
	}

	$scope.open_queue = function () {
		$db.open_queue()
	}

	$scope.update_minute_rule = function () {
		var min_rule =  $("#minuteRule").val();
		$db.update_minute_rule(min_rule);
	}
}];
