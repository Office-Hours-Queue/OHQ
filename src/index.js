// Initialize Firebase
$(document).ready(function() {
	var config = {
	apiKey: "AIzaSyCARC3THfpV8q6JRFWfndOZ7-tuT7i_gBY",
	authDomain: "queue-95598.firebaseapp.com",
	databaseURL: "https://queue-95598.firebaseio.com",
	storageBucket: "queue-95598.appspot.com",
	};
	firebase.initializeApp(config);
});


//Initialize angular app
var app = angular.module("queue", ["firebase","ngRoute"]);

//Setup routes
app.config(function($routeProvider) {
    $routeProvider.when("/", {
        templateUrl : "login/login.html",
        controller: login_ctl
    }).when("/queue", {
        templateUrl : "queue/queue.html",
        controller: queue_ctl
    });
});



