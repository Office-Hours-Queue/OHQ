
var ca_ctl = ["$scope","$rootScope","$db","$http",function($scope,$rootScope,$db,$http) {
	$rootScope.$db = $db;
	$rootScope.check_login();
	$rootScope.current_page = "ca";
	$scope.name = "ca";
	$("#sidenav-overlay").remove();

	function check_open_modal(new_val,old_val) {
		if (old_val == 0 && new_val == 1) {
			$('#modalanswerquestion').openModal({
				dismissible: false
			});
		}
		if (new_val == 0 && old_val == 1) {
			$('#modalanswerquestion').closeModal();
		}
	}

	$scope.$watch(function () {
		return $db.model['current_question'].length
	},check_open_modal);	

	$scope.toggle_history = function () {
		$rootScope.show_history = !($rootScope.show_history);
	}
}];
