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
             $('#modaleditname').closeModal();
           }, function(fail) {
             Materialize.toast('There was an error', 5000);
           });
    }
  };
}];
