var student_ctl = ["$scope","$rootScope","$db","localStorageService",function($scope,$rootScope,$db,lss) {
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

  $scope.toggle_freeze = function(state) {
    if (state == 'answering') {return;}
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
    } else if (!$db.has_active_question() &&
                $scope.new_selected.location == '' &&
                $scope.new_selected.topic == '') {
      Materialize.toast("Please enter a location and a topic", 3000)
			return
    } else if (!$db.has_active_question() &&
                $scope.new_selected.location !== '' &&
                $scope.new_selected.topic == '') {
      Materialize.toast("Please enter a topic", 3000)
			return
    } else if (!$db.has_active_question() &&
                $scope.new_selected.location == '' &&
                $scope.new_selected.topic !== '') {
      Materialize.toast("Please enter a location", 3000)
			return
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

  // intialize saved notify on/off settings from localstorage
  var Notify = window.Notify.default;
  var ls_key = 'student_notify_enabled';
  if (lss.get(ls_key) === null) {
    lss.set(ls_key, false);
  }
  (function() {
    $scope.notify = {
      enabled: lss.get(ls_key),
      error: false,
      show_settings: false,
      supported: true
    };
    // this sometimes crashes
    try {
      $scope.notify.supported = Notify.isSupported();
    } catch(e) {
      // oh well
    }
  })();

  // enable/disable the notifications flag as needed
  // this is needlessly complicated because of the weird notification
  // api that exists, even with a wrapper library
  $scope.$watch(function() {
    return $scope.notify.enabled;
  }, function() {
    if ($scope.notify.enabled) {
      // want to turn on notifications

      if (!Notify.needsPermission) {
        // don't need permission
        lss.set(ls_key, true);
        $scope.notify.error = false;

      } else if (Notify.isSupported()) {
        // needs permission and is supported
        var success = function() {
          $scope.$apply(function() {
            lss.set(ls_key, true);
            $scope.notify.error = false;
            $scope.notify.enabled = lss.get(ls_key);
          });
        };
        var fail = function() {
          $scope.$apply(function() {
            lss.set(ls_key, false);
            $scope.notify.error = true;
            $scope.notify.enabled = lss.get(ls_key);
          });
        };
        Notify.requestPermission(success, fail);

      } else {
        // notifications not supported
        lss.set(ls_key, false);
        $scope.notify.error = true;
        $scope.notify.supported = false;
      }

    } else {
      // turn off notification
      lss.set(ls_key, false);
    }

    $scope.notify.enabled = lss.get(ls_key);
  });

  // handle the actual notifications by watching for changes
  // in the current question
  var curNotification = null;
  $scope.$watchCollection(function() {
    return $db.model.questions;
  }, function(newQ, oldQ) {

    if (newQ.length > 0) {
      if (newQ[0].state !== 'answering') {
        if (newQ[0].queue_ps == 0) {
          document.title = "112Q - next in line";
        } else {
          var pos = String(newQ[0].queue_ps+1) + $scope.ordinal(newQ[0].queue_ps+1);
          document.title = "112Q - " + pos + " in line";
        }
      } else {
        var ta_name = newQ[0].ca_first_name + ' ' + newQ[0].ca_last_name;
        document.title = "112Q - TA " + ta_name + " is on the way"
      }
    } else {
      document.title = "112Q";
    }

    // question answered - show notification
    if (newQ.length > 0 && oldQ.length > 0 &&
        oldQ[0].state !== 'answering' &&
        newQ[0].state === 'answering' &&
        lss.get(ls_key)) {
      var ta_name = newQ[0].ca_first_name + ' ' + newQ[0].ca_last_name;
      curNotification = new Notify('15-112 Office Hours', {
        icon: '/images/site-icons/notification-512.png',
        body: 'TA ' + ta_name + ' is on the way',
        closeOnClick: true,
        tag: '112_student_notification',
        timeout: 15
      });
      curNotification.show();
    }

    // question un-answered - hide notification if it's still there
    if ((oldQ.length > 0 && oldQ[0].state === 'answering') &&
        (newQ.length === 0 || newQ[0].state !== 'answering') &&
        lss.get(ls_key) && curNotification !== null) {
      curNotification.close();
    }

  });

  $scope.getOffTime = function(question) {
    return new Date(question.off_time);
  };

  $scope.getOnTime = function(question) {
    return new Date(question.on_time);
  };

  $scope.ordinal = function(num) {
    if (isNaN(num)) {
      return '';
    }
    if (Math.floor(num / 10) === 1) {
      return 'th';
    }
    switch (num % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  };

}];
