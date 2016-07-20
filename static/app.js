/* 
 * Initialize angular app
 */
var app = angular.module("queue", ["ngRoute","angular-blocks"]);

/*
 * Register factories 
 */
app.factory("student_model",student_model);
app.factory("ca_model",ca_model);
app.factory("admin_model",admin_model);


/* 
 * Register controllers 
 */
app.controller("student_ctl",student_ctl);
app.controller("ca_ctl",ca_ctl);
app.controller("admin_ctl",admin_ctl);
app.controller("login_ctl",login_ctl);

/*
 *  Setup routes
 */
app.config(function($routeProvider) {
    $routeProvider.when("/", {
        templateUrl : "views/login.html",
        controller: "login_ctl"
    });
    $routeProvider.when("/student", {
        templateUrl : "views/student.html",
        controller: "student_ctl"
    });
    $routeProvider.when("/ca", {
        templateUrl : "views/ca.html",
        controller: "ca_ctl"
    });
    $routeProvider.when("/admin", {
        templateUrl : "views/admin.html",
        controller: "admin_ctl"
    });
});

