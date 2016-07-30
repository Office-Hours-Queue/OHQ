var student_ctl = ["$scope","$rootScope","$db",function($scope,$rootScope,$db) {
	$rootScope.$db = $db;

	$scope.selected = {
		"topic": "",
		"location":""
	};

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
			"location_id": $scope.selected.location, 
			"topic_id": $scope.selected.topic, 
			"help_text": $("#q_desc").val()
		})
		$('#modalnewquestion').closeModal();
	}

	$scope.update_question = function () {
		//Add the question and close the modal
		$db.update_question({
			"id": $db.model["questions"][0].id,
			"location_id": $scope.selected.location, 
			"topic_id": $scope.selected.topic, 
			"help_text": $("#q_desc_update").val()
		});
		$('#modaleditquestion').closeModal();
	}
}];
