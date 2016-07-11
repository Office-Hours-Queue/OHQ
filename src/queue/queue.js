var queue_ctl = function($scope, $firebaseObject,$firebaseArray,$firebaseAuth) {
	$scope.auth = $firebaseAuth();

	$scope.auth.$onAuthStateChanged(function(firebaseUser) {
		$scope.user = firebaseUser;
		if ($scope.user == null) {
			document.location = "/"
		} else {
			$scope.user_name = $scope.user.providerData[0].displayName
		}
	});

	var messagesRef = firebase.database().ref().child("messages");
    $scope.messages = $firebaseArray(messagesRef);

	$scope.add_msg = function(msg) {
		$scope.messages.$add({
	  		text: msg 
		});
	}

	$scope.logout = function () {
		$scope.auth.$signOut()
	}
}
