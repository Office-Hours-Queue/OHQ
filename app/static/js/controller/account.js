var account_ctl = ["$scope","$rootScope","$db","$http",function($scope,$rootScope,$db,$http) {
	$rootScope.$db = $db;
	$rootScope.check_login();
	$rootScope.current_page = "account";

  $scope.new_user = {
    first_name: ''
  };

  $scope.fix_caps = function(str) {
    if (str) {
      return str.replace(/\w\S*/g, function(txt){
        return txt.charAt(0).toUpperCase() + txt.substr(1);
      });
    } else {
      return '';
    }
  };

  if ($rootScope.user && $rootScope.user.first_name) {
    $scope.new_user.first_name = $rootScope.user.first_name;
  } else {
    $rootScope.$on('user_ready', function() {
      $scope.new_user.first_name = $rootScope.user.first_name;
    });
  }

  $scope.update_first_name = function() {
    var payload = {
      first_name: $scope.new_user.first_name
    };
    if (payload.first_name) {
      $http.post("/api/user/edit_first_name", payload)
           .then(function(success) {
             Materialize.toast('Saved', 5000);
						 $rootScope.user.first_name = payload.first_name;
             $('#modaleditname').closeModal();
           }, function(fail) {
             Materialize.toast('There was an error', 5000);
           });
    }
  };

	$scope.get_num = function (course_id) {
		if ($scope.courses) {
			for(var i = 0; i < $scope.courses.length; i++) {
				if ($scope.courses[i].id == course_id) {
					var prefix = String($scope.courses[i].number).slice(0,2);
					var suffix = String($scope.courses[i].number).slice(2);
					return prefix + "-" + suffix;
				}
			}
		}
	}

	$scope.get_courses = function () {
		$http.get("/api/course/get_all").then(function(success) {
			$scope.courses = success.data;
		}, function(fail) {
			Materialize.toast('There was an error', 5000);
		});
	}
	$scope.get_courses();

	$scope.ca_roles = function () {
		if ($rootScope.user) {
			return Object.entries($rootScope.user.roles)
									 .filter(e => e[1] === 'ca')
									 .map(e => parseInt(e[0]));
		}
	}

}];
