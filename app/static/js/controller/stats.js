var stats_ctl = ['$scope', '$rootScope', '$db', '$http', function($scope, $rootScope, $db, $http) {

	$rootScope.$db = $db;
	$rootScope.check_login();

  // handle the question count stats
  (function() {
    var socket = io('/stats/questioncount');

    $scope.ca_counts = [];
    $scope.questions_answered = 0;

    var ca_counts = {};

    socket.on('question_count', function(user) {
      ca_counts[user.user_id] = user;
      $scope.$apply(function() {
        $scope.ca_counts = [];
        $scope.questions_answered = 0;
        var userids = Object.keys(ca_counts);
        for (var i = 0; i < userids.length; i++) {
          $scope.ca_counts.push(ca_counts[userids[i]]);
          $scope.questions_answered += ca_counts[userids[i]].question_count;
        }
      });
    });
  })();

  // handle the hours stats
  (function() {
    $scope.time_spent_answering = 0;
    $http.get('/api/stats/timespent/answering').then(function(resp) {
      $scope.time_spent_answering = resp.data.seconds;
    });
  })();

}];
