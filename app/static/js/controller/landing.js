var landing_ctl = ["$scope","$rootScope","$db","$http","localStorageService",function($scope,$rootScope,$db,$http, lss) {
	$rootScope.$db = $db;
	$rootScope.current_page = "landing";
	$scope.name = "landing";

	/* clearing course related variables */
	$rootScope.unset_course();

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
		$scope.sort_courses($scope.courses);
	}

	var courseCompare = function (course1, course2) {
	  if (course1.number < course2.number) { return -1; }
	  if (course1.number > course2.number) { return 1; }
	  return 0;
	}

	$scope.sort_courses = function (data) {
		data.sort(courseCompare);

		$scope.all_courses = [];
		$scope.pinned_courses = [];

		for(var i = 0; i < data.length; i++) {
			if ($scope.is_pinned(data[i]['id'])) {
				$scope.pinned_courses.push(data[i]);
			}
			else {
				$scope.all_courses.push(data[i]);
			}
		}

	}

	$scope.get_courses = function () {
		$http.get("/api/course/get_active").then(function(success) {
			$scope.courses = success.data;
			$scope.sort_courses($scope.courses);
	    }, function(fail) {
			Materialize.toast('There was an error', 5000);
	    });
	}
	$scope.get_courses();

	$scope.set_course = function (course_id, course_number) {
			var prefix = String(course_number).slice(0,2);
			var suffix = String(course_number).slice(2);
			sessionStorage.setItem('current_course_number', prefix + "-" + suffix);
			sessionStorage.setItem('current_course', course_id);
			$rootScope.set_course();
	}
}];
