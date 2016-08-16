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
app.controller("login_ctl",login_ctl);
app.controller("register_ctl",register_ctl);
app.controller("admin_ctl",admin_ctl);

/*
 *  Setup routes
 */
app.config(function($routeProvider) {
    $routeProvider.when("/", {
        templateUrl : "html/login.html",
        controller: "login_ctl"
    });
    $routeProvider.when("/student", {
        templateUrl : "html/student.html",
        controller: "student_ctl"
    });
    $routeProvider.when("/ca", {
        templateUrl : "html/ca.html",
        controller: "ca_ctl"
    });
    $routeProvider.when("/admin", {
        templateUrl : "html/admin.html",
        controller: "admin_ctl"
    });
    $routeProvider.when("/register", {
        templateUrl : "html/register.html",
        controller: "register_ctl"
    });
    $routeProvider.when("/google_deny", {
        templateUrl : "html/google_deny.html",
    });
});

