var student_ctl = ["$scope","$rootScope","$db",function($scope,$rootScope,$db) {
	$rootScope.$db = $db;
	$scope.name = "student";


	$rootScope.check_login();

	$scope.selected = {
		"topic": "",
		"location":""
	};

	$scope.toggle_freeze = function() {
		if ($db.is_frozen()) {
			$db.unfreeze_question() 
		} else {
			if ($db.can_freeze()) {
				$db.freeze_question()
			}
		}
	}

	var unbind_topic_watch = $scope.$watch(function () {
		return $db.model['topics'].length;	
	},function() {
		if ($db.model['topics'].length > 0) {
			$scope.selected.topic = $db.model['topics'][0].id
			unbind_topic_watch();
		}
	});

	var unbind_location_watch = $scope.$watch(function () {
		return $db.model['locations'].length;	
	},function() {
		if ($db.model['locations'].length > 0) {
			$scope.selected.location = $db.model['locations'][0].id
			unbind_location_watch();
		}
	});

	$scope.ask_question = function () {
		//Check if question exists
		if (($db.model["questions"].length) != 0) {
			$('#modalnewquestion').closeModal();
			return 
		}

		//Add the question and close the modal
		$db.add_question({
			"location_id": parseFloat($scope.selected.location), 
			"topic_id": parseFloat($scope.selected.topic), 
			"help_text": $("#q_desc").val()
		})
		$('#modalnewquestion').closeModal();
	}

	$scope.update_question = function () {
		//Add the question and close the modal
		$db.update_question({
			"location_id": parseFloat($scope.selected.location), 
			"topic_id": parseFloat($scope.selected.topic), 
			"help_text": $("#q_desc_update").val()
		});
		$('#modaleditquestion').closeModal();
	}
}];
