
var ca_ctl = ["$scope","$rootScope","$db","$http",function($scope,$rootScope,$db,$http) {
	$rootScope.$db = $db;
	$rootScope.current_page = "ca";
	$scope.name = "ca";

	$rootScope.check_login();

      $scope.clicked_faq = function () {
        ga('send', 'event','FAQ','TA clicked',$rootScope.user["andrew_id"])
      };
	

	$scope.answering = false;

	$scope.$watch(function () {
		return $db.model['current_question'].length
	}, function(newLength) {
		$scope.answering = newLength > 0;
	});

  $scope.getOffTime = function(question) {
    return new Date(question.off_time);
  };

  $scope.getOnTime = function(question) {
    return new Date(question.on_time);
  };

  $scope.$watchCollection(function() {
    return $db.model.wait_time;
  }, function(waitTimes) {
    if (waitTimes.length === 0) {
      return;
    }
    $scope.waitTimeLabels = [];
    $scope.waitTimeData[0] = [];
    for (var i = 0; i < waitTimes.length; i++) {
      $scope.waitTimeLabels.push(new Date(waitTimes[i].time_period));
      $scope.waitTimeData[0].push(waitTimes[i].wait_time / 60);
    }
  });

  $scope.waitTimeData = [[]];
  $scope.waitTimeLabels = [];
  $scope.waitTimeSeries = ['Wait Time'];
  $scope.waitTimeOptions = {
    scales: {
      xAxes: [{
        type: 'time',
        time: {
          displayFormats: {
             'millisecond': 'h:mm',
             'second': 'h:mm',
             'minute': 'h:mm',
             'hour': 'h:mm',
             'day': 'h:mm',
             'week': 'h:mm',
             'month': 'h:mm',
             'quarter': 'h:mm',
             'year': 'h:mm',
          },
          unit: 'minute',
          unitStepSize: 30
        },
        ticks: {
          fontFamily: 'Roboto, sans-serif',
          fontColor: '#9e9e9e'
        },
        gridLines: {
          display: false
        }
      }],
      yAxes: [{
        ticks: {
          beginAtZero: true,
          mirror: true,
          fontFamily: 'Roboto, sans-serif',
          fontColor: '#9e9e9e',
          padding: -10
        },
        gridLines: {
          color: '#efefef',
          drawBorder: false
        }
      }]
    },
    title: {
      display: true,
      fontSize: 16,
      fontFamily: 'Roboto, sans-serif',
      fontColor: '#9e9e9e',
      fontStyle: 'normal',
      text: 'Wait time, last hour'
    },
    tooltips: {
      enabled: false
    },
    elements: {
      border: {
        color: '#000000'
      },
      point: {
        radius: 0
      }
    },
    maintainAspectRatio: false
  };

}];
