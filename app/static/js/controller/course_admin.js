var course_admin_ctl = ["$scope","$rootScope","$db","$http",function($scope,$rootScope,$db,$http) {
	$rootScope.$db = $db;
	$rootScope.check_login();
	$rootScope.current_page = "course_admin";

  // model for editing user role
  $scope.edit_user = {
    role: ''
  }

  // variables for modifying a course
  $scope.selected_del_course = "unknown";
  $scope.selected_del_active = false;
  $scope.selected_del_id = -1;

  $scope.add_course = function () {
    var course_num = parseInt($("#new_course_num").val(), 10)
    var course_payload = {
      number: course_num,
      name: $("#new_course_name").val()
    }

    $http.post("/api/course/add", course_payload).then(function(success) {
			$('#modal_add_course').closeModal();
			Materialize.toast('Saved', 5000);
			$scope.get_courses();
    }, function(fail) {
      Materialize.toast('There was an error', 5000);
    });
  }

  $scope.edit_course = function () {
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

  $scope.edit_role = function () {
    var course_num = parseInt($("#course_num").val(), 10);
    var course_id;

    for(var i = 0; i < $scope.courses.length; i++) {
      if ($scope.courses[i].number == course_num) {
        course_id = $scope.courses[i].id;
      }
    }

    var payload = {
      andrew_id: $("#edit_role_andrew_id").val(),
      course_id: course_id,
      role: $scope.edit_user.role
    }

    $http.post("/api/role/set", payload).then(function(success) {
      Materialize.toast('Saved', 5000);
    }, function(fail) {
      Materialize.toast('There was an error', 5000);
    });
  }

  $scope.submit_roles = function(people) {
    for(var person in people) {
      var payload = {

      }
      console.log(people[person]);
    }
  }

  $scope.batch_role = function () {
    var input, file, fr, result;
    input = document.getElementById('csv_input');
    file = input.files[0]
    fr = new FileReader();
    fr.onload = function(e) {
      $scope.submit_roles(e.target.result.split("\n"));
    }
    fr.readAsText(file);

  }
}];
