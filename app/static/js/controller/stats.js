var stats_ctl = ['$scope', '$rootScope', '$db', '$http', function($scope, $rootScope, $db, $http) {

	$rootScope.$db = $db;
	$rootScope.check_login();

  // helper we need here
  $scope.range = function(n) {
    var result = [];
    for (var i = 0; i < n; i++) {
      result.push(i);
    }
    return result;
  };

  // handle the question count stats
  (function() {
    var socket = io('/stats/counts');
		socket.emit('join_course', sessionStorage.getItem('current_course'));

    $scope.ca_counts = [];
    $scope.questions_answered = 0;
    $scope.unique_student_count = 0;
    $scope.questions_answered_self = 0;

    $scope.ca_counts_map = {};

    socket.on('question_count', function(user) {
      $scope.ca_counts_map[user.user_id] = user;
      $scope.$apply(function() {
        $scope.ca_counts = [];
        $scope.questions_answered = 0;
        var userids = Object.keys($scope.ca_counts_map);
        for (var i = 0; i < userids.length; i++) {
          $scope.ca_counts.push($scope.ca_counts_map[userids[i]]);
          $scope.questions_answered += $scope.ca_counts_map[userids[i]].question_count;
        }
      });
    });

    socket.on('unique_student_count', function(user) {
      $scope.$apply(function() {
        $scope.unique_student_count = user.unique_student_count;
      });
    });

  })();

  // handle the hours stats
  (function() {
    $scope.time_spent_answering = 0;
    $http.get('/api/stats/timespent/answering', {params: {course_id: sessionStorage.getItem('current_course')}}).then(function(resp) {
      $scope.time_spent_answering = resp.data.seconds;
    });
  })();

}];
