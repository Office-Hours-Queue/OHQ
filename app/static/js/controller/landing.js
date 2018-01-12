var landing_ctl = ["$scope","$rootScope","$db","$http","localStorageService",function($scope,$rootScope,$db,$http, lss) {
	$rootScope.$db = $db;
	$rootScope.current_page = "landing";
	$scope.name = "landing";
	$rootScope.check_login();

	$scope.is_pinned = function (course_id) {
		return lss.get(course_id) ? true : false;
	}

	$scope.pin = function (course_id) {
		var pinned = $scope.is_pinned(course_id);
		if (pinned) {
			lss.set(course_id, false);
  			Materialize.toast('Course Unpinned', 3000);
  		}
  		else {
  			lss.set(course_id, true);
    		Materialize.toast('Course Pinned!', 3000);
  		}
	}

	$scope.sort_courses = function (data) {
		$scope.courses = [];
		$scope.pinned_courses = [];

		for(var i = 0; i < data.length; i++) {
			if ($scope.is_pinned(data[i]['id'])) {
				$scope.pinned_courses.push(data[i]);
			}
			else {
				$scope.courses.push(data[i]);
			}
		}
		console.log($scope.courses);
	}

	$scope.get_courses = function () {
		$http.get("/api/course/get_all").then(function(success) {
			$scope.courses = success.data;
			$scope.sort_courses(success.data);
	    }, function(fail) {
			Materialize.toast('There was an error', 5000);
	    });

	    $http.get("/api/course/get_active").then(function(success) {
	    	$scope.active_courses = success.data;
	    }, function(fail) {
	    	Materialize.toast('There was an error', 5000);
	    });
	}
	$scope.get_courses();

	$scope.set_course = function (course_id) {
		$rootScope.current_course = course_id;
		$rootScope.check_login();
		// console.log($rootScope.user);
		window.location = "/#/" + $rootScope.user["role"]
	}
}];