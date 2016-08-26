
var ca_ctl = ["$scope","$rootScope","$db","$http",function($scope,$rootScope,$db,$http) {
	$rootScope.$db = $db;
	$rootScope.check_login();
	$rootScope.current_page = "ca";
	$scope.name = "ca";
	$("#sidenav-overlay").remove();

	$scope.answering = false;

	$scope.$watch(function () {
		return $db.model['current_question'].length
	}, function(newLength) {
		$scope.answering = newLength > 0;
	});

}];
