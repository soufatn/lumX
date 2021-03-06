/* global angular */
'use strict'; // jshint ignore:line


angular.module('lumx.select', [])
    .controller('LxSelectController', ['$scope', '$compile', '$filter', '$interpolate', '$sce',
                                       function($scope, $compile, $filter, $interpolate, $sce)
    {
        var self = this;

        // Link methods
        this.init = function(element, attrs)
        {
            $scope.multiple = angular.isDefined(attrs.multiple);
            $scope.tree = angular.isDefined(attrs.tree);
        };

        this.registerTransclude = function(transclude)
        {
            $scope.selectedTransclude = transclude;
        };

        this.getScope = function()
        {
            return $scope;
        };

        // Selection management
        function select(choice)
        {
            if ($scope.multiple)
            {
                if ($scope.selected.indexOf(choice) === -1)
                {
                    $scope.selected.push(choice);
                }
            }
            else
            {
                $scope.selected = [choice];
            }
        }

        function unselect(element, event)
        {
            if (!$scope.allowClear && !$scope.multiple)
            {
                return;
            }

            if (angular.isDefined(event) && !$scope.multiple)
            {
                event.stopPropagation();
            }

            var index = $scope.selected.indexOf(element);
            if (index !== -1)
            {
                $scope.selected.splice(index, 1);
            }
        }

        function toggle(choice, event)
        {
            if (angular.isDefined(event) && $scope.multiple)
            {
                event.stopPropagation();
            }

            if ($scope.multiple && isSelected(choice))
            {
                unselect(choice);
            }
            else
            {
                select(choice);
            }
        }

        // Getters
        function isSelected(choice)
        {
            return angular.isDefined($scope.selected) && $scope.selected.indexOf(choice) !== -1;
        }

        function hasNoResults()
        {
            return angular.isUndefined($scope.choices) || $filter('filter')($scope.choices, $scope.data.filter).length === 0;
        }

        function filterNeeded()
        {
            return angular.isDefined($scope.minLength) && $scope.data.filter.length < $scope.minLength;
        }

        function isHelperVisible()
        {
            return $scope.loading !== 'true' && (filterNeeded() || (hasNoResults() && !filterNeeded()));
        }

        function isChoicesVisible()
        {
            return $scope.loading !== 'true' && !hasNoResults() && !filterNeeded();
        }

        /**
         * Return the array of selected elements. Always return an array (ie. returns an empty array in case
         * selected list is undefined in the scope).
         */
        function getSelectedElements()
        {
            return angular.isDefined($scope.selected) ? $scope.selected : [];
        }

        function getSelectedTemplate()
        {
            return $sce.trustAsHtml($scope.selectedTemplate);
        }

        // Watchers
        $scope.$watch('selected', function(newValue, oldValue)
        {
            if (angular.isDefined(newValue) && angular.isDefined($scope.selectedTransclude))
            {
                var newScope = $scope.$new();
                $scope.selectedTemplate = '';

                angular.forEach(newValue, function(selectedElement)
                {
                    newScope.$selected = selectedElement;

                    $scope.selectedTransclude(newScope, function(clone)
                    {
                        var div = angular.element('<div/>'),
                            element = $compile(clone)(newScope),
                            content = $interpolate(clone.html())(newScope);

                        element.html(content);

                        div.append(element);

                        if ($scope.multiple)
                        {
                            div.find('span').addClass('lx-select__tag');
                        }

                        $scope.selectedTemplate += div.html();
                    });
                });

                // Exec function callback if set
                $scope.change({ newValue: newValue, oldValue: oldValue });
            }
        }, true);

        $scope.$watch('data.filter', function(newValue, oldValue)
        {
            if(angular.isUndefined($scope.minLength) || (newValue && $scope.minLength <= newValue.length))
            {
                $scope.filter({ newValue: newValue, oldValue: oldValue });
            }
        });

        // Public API
        $scope.select = select;
        $scope.unselect = unselect;
        $scope.toggle = toggle;
        $scope.isChoicesVisible = isChoicesVisible;
        $scope.isHelperVisible = isHelperVisible;
        $scope.isSelected = isSelected;
        $scope.filterNeeded = filterNeeded;
        $scope.getSelectedElements = getSelectedElements;
        $scope.getSelectedTemplate = getSelectedTemplate;
        $scope.hasNoResults = hasNoResults;
    }])
    .directive('lxSelect', function()
    {
        return {
            restrict: 'E',
            controller: 'LxSelectController',
            scope: {
                selected: '=',
                placeholder: '@',
                choices: '=',
                loading: '@',
                minLength: '@',
                allowClear: '@',
                change: '&', // Parameters: newValue, oldValue
                filter: '&' // Parameters: newValue, oldValue
            },
            templateUrl: 'lumx.select.html',
            transclude: true,
            replace: true,
            link: function(scope, element, attrs, ctrl)
            {
                ctrl.init(element, attrs);
                scope.data = {
                    filter: ''
                };
            }
        };
    })
    .directive('lxSelectSelected', function()
    {
        return {
            restrict: 'E',
            require: '^lxSelect',
            templateUrl: 'lumx.select_selected.html',
            transclude: true,
            link: function(scope, element, attrs, ctrl, transclude)
            {
                ctrl.registerTransclude(transclude);
                scope.data = ctrl.getScope();
            }
        };
    })
    .directive('lxSelectChoices', function()
    {
        return {
            restrict: 'E',
            require: '^lxSelect',
            templateUrl: 'lumx.select_choices.html',
            transclude: true,
            link: function(scope, element, attrs, ctrl)
            {
                scope.data = ctrl.getScope();
            }
        };
    });
