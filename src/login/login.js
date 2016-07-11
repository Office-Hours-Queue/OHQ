var login_ctl = function($scope,$firebaseAuth) {
	//Setup materialize
	$(document).ready(function() {
		$(".button-collapse").sideNav();
		$('.scrollspy').scrollSpy();
		$('.parallax').parallax();
		$('.modal-trigger').leanModal({
			dismissible: true
		});
		$('select').material_select();
	});

	$scope.auth = $firebaseAuth();

	//Bind login button
	$("#lets_begin").click(function () {
		if (!($scope.auth.$getAuth())) {
			var provider = new firebase.auth.GoogleAuthProvider();
			provider.addScope('https://www.googleapis.com/auth/userinfo.profile');			
			$scope.auth.$signInWithRedirect(provider).then(function() {}).catch(function(error) {
				console.error("Authentication failed:", error);
			});
		}
	});

	//Check if logged in 
	$scope.auth.$onAuthStateChanged(function(firebaseUser) {
		$scope.user = firebaseUser; 
		if ($scope.user) {
			$(document).attr("location","/#/queue")
		}
    });
}
