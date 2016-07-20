var login_ctl = ["$scope",function($scope) {
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
}];
