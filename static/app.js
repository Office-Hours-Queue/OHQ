/* 
 * Initialize angular app
 */
var app = angular.module("queue", ["ngRoute","angular-blocks","ui.materialize"]);

/*
 * Register factories 
 */
app.factory("$db",db);

/* 
 * Register controllers 
 */
app.controller("student_ctl",student_ctl);
app.controller("ca_ctl",ca_ctl);

/*
 *  Setup routes
 */
app.config(function($routeProvider) {
    $routeProvider.when("/", {
        templateUrl : "html/login.html",
    });
    $routeProvider.when("/student", {
        templateUrl : "html/student.html",
        controller: "student_ctl"
    });
    $routeProvider.when("/ca", {
        templateUrl : "html/ca.html",
        controller: "ca_ctl"
    });
});

