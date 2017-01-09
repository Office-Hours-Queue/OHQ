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


  $scope.clicked_faq = function () {
    ga('send', 'event','FAQ','student clicked',$rootScope.user["andrew_id"])
  };

  $scope.clicked_debugging_tips = function () {
    ga('send', 'event','Debugging Tips','student clicked',$rootScope.user["andrew_id"])
  };

  function set_random_question() {
  var random_idx = Math.floor(Math.random()*example_questions.length);
  $scope.example_question = example_questions[random_idx];
  }

  set_random_question();

  $scope.toggle_freeze = function() {
    if ($db.is_frozen()) {
      $db.unfreeze_question();
    } else if ($db.can_freeze()) {
      $db.freeze_question();
    }
  }

  // the current data in the new question form
  $scope.new_selected = {
    topic: '',
    location: '',
    help_text: ''
  };

  // the current data in the edit question form
  $scope.edit_selected = {
    topic: '',
    location: '',
    help_text: ''
  };

  // when the current question changes, update the edit form model and save
  // the location for the next question
  $scope.$watchCollection(function() {
    return $db.model.questions;
  }, function() {
    if ($db.model.questions.length > 0) {
      $scope.edit_selected.topic = $db.model.questions[0].topic_id.toString();
      $scope.edit_selected.location = $db.model.questions[0].location_id.toString();
      $scope.edit_selected.help_text = $db.model.questions[0].help_text;
      $scope.new_selected.location = $db.model.questions[0].location_id.toString();
    }
  });

  // set the location to the ghc 5 commons when it comes down
  var stopLocationDefault = $scope.$watchCollection(function() {
    return $db.model.locations;
  }, function() {
    var locs = $db.model.locations;
    for (var i = 0; i < locs.length; i++) {
      if (locs[i].location.toLowerCase().indexOf('common') !== -1) {
        $scope.new_selected.location = locs[i].id.toString();
        stopLocationDefault();
      }
    }
  });

  // Add the question
  $scope.ask_question = function() {
    if (!$db.has_active_question() &&
          $scope.new_selected.location !== '' &&
          $scope.new_selected.topic !== '') {
      $db.add_question({
        "location_id": parseInt($scope.new_selected.location),
        "topic_id": parseInt($scope.new_selected.topic),
        "help_text": $scope.new_selected.help_text
      });
      $scope.new_selected.help_text = '';
      $scope.new_selected.topic = '';
    }
  };

  // Update the question and close the modal
  $scope.update_question = function() {
    $db.update_question({
      "location_id": parseInt($scope.edit_selected.location),
      "topic_id": parseInt($scope.edit_selected.topic),
      "help_text": $scope.edit_selected.help_text
    });
    $('#modaleditquestion').closeModal();
  };

  // hack to force topics to correctly load
  // angular materialize selects don't update correctly if there's a disabled
  // element within the select. the code below circumvents this by forcing an
  // update of the model backing the select, causing angular materialize to
  // correctly refresh the select.
  $scope.$watchCollection(function() {
    return $db.model.topics;
  }, function() {
    $scope.new_selected.topic = null;
    $scope.$evalAsync(function() {
      $scope.new_selected.topic = '';
    });
  });

  $scope.getOffTime = function(question) {
    return new Date(question.off_time);
  };

  $scope.getOnTime = function(question) {
    return new Date(question.on_time);
  };

}];
