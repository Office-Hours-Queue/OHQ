var student_ctl = ["$scope","$rootScope","$db",function($scope,$rootScope,$db) {
	$rootScope.$db = $db;
	$rootScope.current_page = "student";
	$scope.name = "student";

	$rootScope.check_login();

	var example_questions = [
	'Help me go over the code tracing from quiz 1.',
	'What does \'type affects semantics\' mean?',
	'Why do I need to use almostEquals?',
	'Should I use almostEquals in this function?',
	];

	function set_random_question() {
	var random_idx = Math.floor(Math.random()*example_questions.length);
	$scope.example_question = example_questions[random_idx];
	}

	set_random_question();

	$scope.selected = {
	"topic": "",
	"location":"",
	"help_text":""
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

  $scope.$watch(function() {
    return $db.model.questions[0];
  }, function() {
    if ($db.model.questions.length > 0) {
      $scope.selected = {
        "topic": $db.model.questions[0].topic_id.toString(),
        "location": $db.model.questions[0].location_id.toString(),
        "help_text": $db.model.questions[0].help_text
      };
    } else if (
        typeof $db.model.topics !== 'undefined' &&
        typeof $db.model.locations !== 'undefined' &&
        $db.model.topics.length > 0 &&
        $db.model.locations.length > 0) {
      $scope.selected = {
        "topic": $db.model.topics[0].id,
        "location": $db.model.locations[0].id,
        "help_text": ""
      };
    } else {
      $scope.selected = {
        "topic": "",
        "location":"",
        "help_text":""
      };
    }
  });

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
		if (($db.has_active_question())) {
			$('#modalnewquestion').closeModal();
			return
		}

		//Add the question and close the modal
		$db.add_question({
			"location_id": parseFloat($scope.selected.location), 
			"topic_id": parseFloat($scope.selected.topic), 
			"help_text": $scope.selected.help_text
		})
		$('#modalnewquestion').closeModal();
	}

	$scope.update_question = function () {
		//Add the question and close the modal
		$db.update_question({
			"location_id": parseFloat($scope.selected.location), 
			"topic_id": parseFloat($scope.selected.topic), 
			"help_text": $scope.selected.help_text
		});
		$('#modaleditquestion').closeModal();
	}

}];
