var userListApp = angular.module('userListApp', ['ui.bootstrap']);

userListApp.controller('UserListCtrl', function ($scope, $http, $uibModal) {
    $scope.users = [];
    $scope.sortType = 'name';
    $scope.sortReverse = false;
    $scope.loadDataMsg = 'false';
    $scope.alerts = [];
    getData();
    var rad = function (x) {
        return x * Math.PI / 180;
    };
    var getDistance = function (p1, p2) {
        var R = 6378137; // Earth’s mean radius in meter
        var dLat = rad(p2.lat - p1.lat);
        var dLong = rad(p2.lng - p1.lng);
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(rad(p1.lat)) * Math.cos(rad(p2.lat)) *
            Math.sin(dLong / 2) * Math.sin(dLong / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c;
        return d; // returns the distance in meter
    };

    function getData() {
        if (localStorage.getItem("user")) {
            $scope.users = JSON.parse(localStorage.getItem("user"));
            $scope.loadDataMsg = 'true';
            $scope.alerts.push({message: "Successefuly loaded from local storage"});
            setTimeout(function () {
                $scope.alerts.splice(0);
                $scope.$apply();
            }, 3000);
        }
        else {
            $http.get("https://jsonplaceholder.typicode.com/users").then(function (response) {
                $scope.users = response.data;
                if ("geolocation" in navigator) {
                    navigator.geolocation.getCurrentPosition(function (position) {
                        p1 = {lat: position.coords.latitude, lng: position.coords.longitude};
                        for (user in $scope.users) {
                            p2 = {lat: user.address.geo.lat, lng: user.address.geo.lng}
                            user.address.distance = getDistance(p1, p2);
                        }
                    });


                } else {
                    for (user in $scope.users) {
                        user.address.distance = 'Геолокация недоступна';
                    }
                }
                console.log($scope.users);
                localStorage.setItem("user", JSON.stringify($scope.users));
                $scope.alerts.push({message: "Successefuly loaded from rest"});
                setTimeout(function () {
                    $scope.alerts.splice(0);
                    $scope.$apply();
                }, 3000);
            })
        }
    }

    $scope.deleteUser = function (user) {
        var index = $scope.users.indexOf(user)
        $scope.users.splice(index, 1);
        localStorage.setItem("user", JSON.stringify($scope.users));
    }
    $scope.open = function () {
        var modalWindow = $uibModal.open({
            templateUrl: 'addmodal.html',
            controller: 'userCreateController',
            backdrop: 'static',
            resolve: {
                users: function () {
                    return $scope.users;
                }
            }
        });
        modalWindow.result.then(function (newUser) {
            console.log(newUser);
            $scope.users.push(newUser);
            localStorage.setItem("user", JSON.stringify($scope.users));
        }, function () {
        });
    };
    $scope.openEdit = function (user) {
        var modalWindow = $uibModal.open({
            templateUrl: 'editmodal.html',
            controller: 'userEditController',
            backdrop: 'static',
            resolve: {
                user: function () {
                    return user;
                },
                users: function () {
                    return $scope.users;
                }
            }
        });
        modalWindow.result.then(function (newUser) {
            localStorage.setItem("user", JSON.stringify($scope.users));
        }, function () {
        });
    };
    $scope.search = function (item) {
        if ($scope.searchType && $scope.searchValue) {
            return item[$scope.searchType.toLowerCase()].includes($scope.searchValue);
        } else {
            return true;
        }
    };

    $scope.myFunc = function ($event) {
        console.log(event.target);
        if (event.target.children.length == 0) {
            id = event.target.parentElement.id + "email";
        } else {
            id = event.target.id + "email";
        }
        var range = document.createRange();

        var selection = window.getSelection();
        range.selectNodeContents(document.getElementById(id));

        selection.removeAllRanges();
        selection.addRange(range);
        // Copy to the clipboard
        document.execCommand('copy');
        selection.removeAllRanges();
    };
});
userListApp.controller('userCreateController', function ($scope, $uibModalInstance, users) {
    $scope.newUser = {name: ''};
    $scope.usernameUnique = true;
    $scope.emailUnique = true;
    $scope.emailReg = true;
    $scope.phoneReg = true;
    generateId();
    console.log(users)
    $scope.submit = function () {
        if ($scope.usernameUnique == true && $scope.emailUnique == true && $scope.emailReg == true && $scope.phoneReg == true && $scope.newUser.name != '' && $scope.newUser.username != '' && $scope.newUser.name && $scope.newUser.username) {
            $scope.newUser.id = generateId();
            $uibModalInstance.close($scope.newUser);
        }
    };
    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
    function generateId() {
        maxid = Math.max.apply(Math, users.map(function (user) {
            return user.id;
        }))
        console.log(maxid)
        return ++maxid;
    }

    $scope.usernameValidation = function () {
        $scope.usernameUnique = !users.filter(function (user) {
                return user.username == $scope.newUser.username
            }).length > 0
    }

    $scope.emailValidation = function () {
        $scope.emailUnique = !users.filter(function (user) {
                return user.email == $scope.newUser.email
            }).length > 0
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        $scope.emailReg = re.test($scope.newUser.email);
    }
    $scope.phoneValidation = function () {
        var re = /(\(?\d{1,4}[-\.\(\)\s]?){3,4}(x\d{3,5})?/;
        $scope.phoneReg = re.test($scope.newUser.phone);
    }
});
userListApp.controller('userEditController', function ($scope, $uibModalInstance, user, users) {
    $scope.user = user;
    $scope.users = users;
    $scope.emailUnique = true;
    $scope.usernameUnique = true;
    $scope.emailReg = true;
    $scope.phoneReg = true;
    $scope.submit = function () {
        if ($scope.usernameUnique == true && $scope.emailUnique == true && $scope.emailReg == true && $scope.phoneReg == true && $scope.user.name != '' && $scope.user.username != '' && $scope.user.name && $scope.user.username) {
            $uibModalInstance.close($scope.user);
        }
    };
    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
    $scope.usernameValidation = function () {
        $scope.usernameUnique = !users.filter(function (user) {
                if (user === $scope.user) {
                    return false;
                }
                return user.username == $scope.user.username
            }).length > 0
    }
    $scope.emailValidation = function () {
        $scope.emailUnique = !users.filter(function (user) {
                if (user === $scope.user) {
                    return false;
                }
                return user.email == $scope.user.email
            }).length > 0
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        $scope.emailReg = re.test($scope.user.email);
    }
    $scope.phoneValidation = function () {
        var re = /(\(?\d{1,4}[-\.\(\)\s]?){3,4}(x\d{3,5})?/;
        $scope.phoneReg = re.test($scope.user.phone);
    }
});