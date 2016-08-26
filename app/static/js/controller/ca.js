
var ca_ctl = ["$scope","$rootScope","$db","$http",function($scope,$rootScope,$db,$http) {
	$rootScope.$db = $db;
	$rootScope.check_login();
	$rootScope.current_page = "ca";
	$scope.name = "ca";
	$("#sidenav-overlay").remove();

	function check_open_modal() {
		if ($db.model['current_question'].length == 1) {
			$('#modalanswerquestion').openModal({
				dismissible: false
			});
		} else {
			$('#modalanswerquestion').closeModal();
		}
	}

	$scope.$watch(function () {
		return $db.model['current_question'].length
	},function () {
		check_open_modal();
	});

	$scope.$watch(function () {
		return $db.io_connected;
	}, function () {
		check_open_modal();
	});


	$scope.toggle_history = function () {
		$rootScope.show_history = !($rootScope.show_history);
	}
}];
