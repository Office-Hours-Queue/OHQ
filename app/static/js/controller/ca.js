
var ca_ctl = ["$scope","$rootScope","$db","$http",function($scope,$rootScope,$db,$http) {
	$rootScope.$db = $db;
	$rootScope.check_login();
	$rootScope.current_page = "ca";
	$scope.name = "ca";
	$("#sidenav-overlay").remove();

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


	$scope.toggle_history = function () {
		$rootScope.show_history = !($rootScope.show_history);
	}
}];
