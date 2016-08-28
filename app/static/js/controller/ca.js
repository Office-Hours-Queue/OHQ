
var ca_ctl = ["$scope","$rootScope","$db","$http",function($scope,$rootScope,$db,$http) {
	$rootScope.$db = $db;
	$rootScope.current_page = "ca";
	$scope.name = "ca";

	$rootScope.check_login();
	

	$scope.answering = false;

	$scope.$watch(function () {
		return $db.model['current_question'].length
	}, function(newLength) {
		$scope.answering = newLength > 0;
	});

}];
