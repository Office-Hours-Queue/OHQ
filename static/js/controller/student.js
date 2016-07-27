var student_ctl = ["$scope","$rootScope","$db",function($scope,$rootScope,$db) {
	$rootScope.$db = $db;

	$scope.freeze_question = function() {
		if (($db.model["questions"].length) == 0) { return }
		var q = $db.model["questions"][0]
		$db.freeze_question(q.id)	
	}

	$scope.delete_question = function () {
		if (($db.model["questions"].length) == 0) { return }
		var q = $db.model["questions"][0]
		$db.delete_question(q.id)	
	}

	$scope.ask_question = function () {
		//Check if question exists
		if (($db.model["questions"].length) != 0) {
			$('#modalnewquestion').closeModal();
			return 
		}

		//Get fields
		var topic = $($("input[name=topic]:checked")[0]).attr("tid")
		var location = $($("input[name=location]:checked")[0]).attr("lid")
		var q_desc = $("#q_desc").val()

		//Check fields
		if (topic == undefined) {
			Materialize.toast("Please select a topic.")
			return
		}
		if (location == undefined) {
			Materialize.toast("Please select a location.")
			return
		}

		//Add the question and close the modal
		$db.add_question({"location_id": location, "topic_id": topic, "help_text": q_desc})
		$('#modalnewquestion').closeModal();
	}
}];
