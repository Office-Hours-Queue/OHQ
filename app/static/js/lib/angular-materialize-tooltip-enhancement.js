// Angular directive to enhance the Materialize tooltip functionality.
// Allows a list of text to be dynamically placed as
//
//   <ul>
//     <li>Item 1</li>
//     <li>Item 2</li>
//     ...
//   </ul>
//
// inside a parent element with the directive. The contents of the <ul> are
// dynamically bound to the tooltip's data, so the tooltip will update
// when the list elements are updated.


(function(angular) {
  angular.module("materialize-tooltip-enhancement", ["materialize-tooltip-enhancement.tooltippedDynamic"]);

  angular.module("materialize-tooltip-enhancement.tooltippedDynamic", [])
        .directive("tooltippedDynamic", ["$compile", "$timeout", function ($compile, $timeout) {
            return {
                restrict: "A",
                link: function (scope, element, attrs) {

                    var rmDestroyListener = Function.prototype; //assigning to noop

                    function init() {
                        element.addClass("tooltipped");
                        $compile(element.contents())(scope);

                        $timeout(function () {
                            // https://github.com/Dogfalo/materialize/issues/3546
                            // if element.addClass("tooltipped") would not be executed, then probably this would not be needed
                            if (element.attr('data-tooltip-id')){
                                element.tooltip('remove');
                            }
                            element.tooltip();
                        });
                        rmDestroyListener = scope.$on('$destroy', function () {
                            element.tooltip("remove");
                        });
                    }

                    if (attrs['tooltippedDynamic'] !== 'false') {
                        init();
                    }

                    // just to be sure, that tooltip is removed when somehow element is destroyed, but the parent scope is not
                    element.on('$destroy', function() {
                        element.tooltip("remove");
                    });

                    scope.$watch(function () {
                        var c = element.find('ul').children().text();
                        return c;
                    }, function (oldVal, newVal) {
                        if (oldVal !== newVal && attrs.tooltippify !== 'false') {
                            $timeout(function () {
                               var contents = element.find('ul').children();
                               var tooltipContents = [];
                               for (var i = 0; i < contents.length; i++) {
                                 tooltipContents.push('<div>' + $(contents[i]).text() + '</div>');
                               }
                               var tooltipHtml = [
                                 '<div class="left-align" style="line-height: 130%">',
                                 tooltipContents.join(''),
                                 '</div>'
                               ].join('');
                               element.attr('data-tooltip', tooltipHtml);
                               element.tooltip();
                            });
                        }
                    });

                }
            };
        }]);

}(angular));
