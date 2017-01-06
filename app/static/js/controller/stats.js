var stats_ctl = ['$scope', '$rootScope', '$db', function($scope, $rootScope, $db) {

	$rootScope.$db = $db;
	$rootScope.check_login();

  var socket = io('/stats/questioncount');

  $scope.ca_counts = [];
  $scope.questions_answered = 0;

  var ca_counts = {};

  socket.on('question_count', function(user) {
    console.log('question_count', user);
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

}];
