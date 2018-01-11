var course_admin_ctl = ["$scope","$rootScope","$db","$http",function($scope,$rootScope,$db,$http) {
	$rootScope.$db = $db;
	$rootScope.check_login();
	$rootScope.current_page = "course_admin";

  // variables for modifying a course   
  $scope.selected_del_course = "unknown";
  $scope.selected_del_active = false;
  $scope.selected_del_id = -1;

  $scope.add_course = function () {
    var payload = {
      number: parseInt($("#new_course_num").val(), 10),
      name: $("#new_course_name").val()
    }
    $http.post("/api/course/add", payload).then(function(success) {
           Materialize.toast('Saved', 5000);
           $('#modal_add_course').closeModal();
         }, function(fail) {
           Materialize.toast('There was an error', 5000);
         });
  }

  $scope.edit_course = function () {
    // TODO: add other fields
    var payload = {
      id: parseInt($("#course_id").val(), 10),
      active: $scope.selected_del_active
    }

    $http.post("/api/course/edit", payload).then(function(success) {
           Materialize.toast('Saved', 5000);
           $('#modal_edit_course').closeModal();
         }, function(fail) {
           Materialize.toast('There was an error', 5000);
         });
  }

  $scope.get_courses = function () {
    $http.get("/api/course/get_all").then(function(success) {
      $scope.courses = success.data;
    }, function(fail) {
        Materialize.toast('There was an error', 5000);
    });
  }
  $scope.get_courses();

  
  $scope.select = function (del_item, del_id, del_active) {
    $scope.selected_del_course = del_item;
    $scope.selected_del_id = del_id;
    $scope.selected_del_active = del_active;
  }

  $scope.enable_disable_course = function () {
    var payload = {
      id: $scope.selected_del_id,
      active: !($scope.selected_del_active)
    }

    $http.post("/api/course/edit", payload).then(function(success) {
           Materialize.toast('Saved', 5000);
           $('#modal_edit_course').closeModal();
         }, function(fail) {
           Materialize.toast('There was an error', 5000);
         });
  }
}];
