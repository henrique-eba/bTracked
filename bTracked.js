jQuery.fn.center = function () {
    this.css("position", "absolute");
    this.css("top", Math.max(0, (($(window).height() - $(this).outerHeight()) / 2) + $(window).scrollTop()) + "px");
    this.css("left", Math.max(0, (($(window).width() - $(this).outerWidth()) / 2) + $(window).scrollLeft()) + "px");
    return this;
}

var app = angular.module('Tracker', ['ngSanitize', 'ngAnimate', 'infinite-scroll']);

app.directive('numericbinding', function () {
    return {
        restrict: 'A',
        require: 'ngModel',
        scope: {
            model: '=ngModel',
        },
        link: function (scope, element, attrs, ngModelCtrl) {
            if (scope.model && typeof scope.model == 'string' && scope.model != '-') {
                scope.model = parseInt(scope.model);
            }
            scope.$watch('model', function (val, old) {
                if (typeof val == 'string' && val != '-') {
                    scope.model = parseInt(val);
                }
            });
        }
    };
});

app.directive('moreInfoButton', function () {
    return {
        templateUrl: 'moreInfoButton.html',
        scope: { monster: '=', showInfo: "&" },
        link: function (scope, elm, attrs) {
            scope.showInfoCall = function () {
                scope.showInfo()(scope.monster);
            }
        }
    };
});

app.directive('attackDescription', function () {
    return {
        templateUrl: 'attackDescription.html',
        scope: { attack: '=' }
    };
});

app.directive('statsBlock', function () {
    return {
        templateUrl: 'statsBlock.html'
    };
});

app.directive('sortDirection', function () {
    return {
        templateUrl: 'sortDirection.html',
        scope: { col: '@', header: '@' }
    };
});

app.controller("trackerController", function ($scope, $filter, $sce) {
    $(document).ready(function () {

        $.getJSON("monsters.json", function (data) {
            $scope.adjustInfo(data);
            $scope.monsterListData = data;
            $scope.$apply();
        });

        $(document).click(function () {
            $scope.hideAll();
        });

        $("#addDiv").click(function (event) {
            $scope.hideInfo();
            event.stopPropagation();
        });

        $("#optionsPanel").click(function (event) {
            event.stopPropagation();
        });

        $("#statBlock").click(function (event) {
            event.stopPropagation();
        });

        $("#createBlankPanel").click(function (event) {
            $scope.hideInfo();
            event.stopPropagation();
        });

        $scope.resetCreature();

    });//fim doc ready

    $scope.currentMonsterInfo = null;
    $scope.trackList = [];
    $scope.minCR = 0;
    $scope.maxCR = 30;
    $scope.maxResults = 15;
    $scope.filterText = "";
    $scope.selectedItem = null;
    $scope.resultsLog = [];
    $scope.askRemoval = true;
    $scope.filterActionsWithtouDice = true;
    $scope.ignoreTurnOnDeath = true;
    $scope.columnToSort = "challenge_rating";
    $scope.reverseSort = false;

    $scope.xpTable = {
        '0': '10',
        '1/8': '25',
        '1/4': '50',
        '1/2': '100',
        '1': '200',
        '2': '450',
        '3': '700',
        '4': '1100',
        '5': '1800',
        '6': '2300',
        '7': '2900',
        '8': '3900',
        '9': '5000',
        '10': '5900',
        '11': '7200',
        '12': '8400',
        '13': '10000',
        '14': '11500',
        '15': '13000',
        '16': '15000',
        '17': '18000',
        '18': '20000',
        '19': '22000',
        '20': '25000',
        '21': '33000',
        '22': '41000',
        '23': '50000',
        '24': '62000',
        '25': '75000',
        '26': '90000',
        '27': '105000',
        '28': '120000',
        '29': '135000',
        '30': '155000',
    };

    $scope.hideAll = function () {
        $($scope.lastFloatDiv).finish().fadeOut();
        $scope.hideInfo();
        $scope.lastFloatDiv = null;
        $scope.monsterList = null;
    }

    $scope.adjustInfo = function (data) {
        data.forEach(function (monster) {
            $scope.calculateMod(monster, "strength");
            $scope.calculateMod(monster, "dexterity");
            $scope.calculateMod(monster, "constitution");
            $scope.calculateMod(monster, "intelligence");
            $scope.calculateMod(monster, "wisdom");
            $scope.calculateMod(monster, "charisma");
        });
    }

    $scope.calculateMod = function (monster, ability) {
        var value = parseInt(monster[ability]);
        value = Math.floor((value - 10) / 2);
        monster[ability + "_mod"] = value;
        if (monster[ability + "_save"] == null) {
            monster[ability + "_save"] = value;
        }
    }

    $scope.postData = function (url, dataToSend, successCallback, errorCallback = undefined) {
        $.ajax({
            url: url,
            type: 'POST',
            cache: false,
            contentType: false,
            processData: false,
            data: dataToSend,
            success: function (data) {
                successCallback(data);
                $scope.busy = false;
            },
            error: function (data) {
                $scope.busy = false;
                if (errorCallback !== undefined) {
                    errorCallback(data);
                }
            }
        });
    }

    $scope.parseJSON = function (data) {
        var response = undefined;
        try {
            response = JSON.parse(data);
        }
        catch (err) {
            console.error(err);
            console.log(data);
        }
        return response;
    }

    $scope.showAdd = function () {
        $scope.maxResults = 15;
        $scope.monsterList = $scope.monsterListData;
        $scope.showFloatDiv('#addDiv');
        event.stopPropagation();
    }

    $scope.loadMore = function () {
        if ($scope.monsterListData != null && $scope.maxResults < $scope.monsterListData.length) {
            $scope.maxResults += 50;
        }
    }

    $scope.dataIsInvalid = function (data) {
        return (data === null || data === "" || data === undefined || isNaN(data));
    }

    $scope.addCreature = function (creature = null) {
        $scope.monsterList = null;
        event.stopPropagation();
        if (creature) {
            $scope.blankCreature = creature;
            creature.isEdit = true;
        }
        else {
            $scope.resetCreature();
        }
        $scope.showFloatDiv("#createBlankPanel");
    }

    $scope.resetCreature = function () {
        if ($scope.blankCreature) {
            $scope.blankCreature.isEdit = false;
        }
        $scope.blankCreature = { actions: [] };
    }

    $scope.addMonster = function (monster, clone = true) {
        if (monster.isEdit) {
            return;
        }

        if (!monster.nickname) {
            monster.nickname = monster.name;
        }

        if (monster.actions != null) {
            var action = monster.actions[0];
            monster.actions.some(function (obj) {
                if (obj.damage_dice != null) {
                    action = obj;
                    return true;
                }
            });
            monster.selected_attack = action;
        }

        if (clone) {
            monster = jQuery.extend(true, {}, monster);
        }

        $scope.trackList.push(monster);
    }

    $scope.showInfo = function (monster) {
        if ($scope.currentMonsterInfo == monster) {
            $scope.hideInfo();
        }
        else {
            $scope.currentMonsterInfo = monster;
            $scope.showFloatDiv("#statBlock", $(event.currentTarget), false);
        }
        event.stopPropagation();
    }

    $scope.hideInfo = function () {
        $("#statBlock").fadeOut(function () { $scope.currentMonsterInfo = null; });
    }

    $scope.safeEval = function (val) {
        try {
            return eval(val);
        }
        catch (e) {
            if (e instanceof SyntaxError) {
                //alert(e.message);
            }
        }
    }

    $scope.greaterThan = function (prop, val) {
        return function (item) {
            return $scope.safeEval(item[prop]) >= $scope.safeEval(val);
        }
    }

    $scope.lesserThan = function (prop, val) {
        return function (item) {
            return $scope.safeEval(item[prop]) <= $scope.safeEval(val);
        }
    }

    $scope.randomIntFromInterval = function (min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    $scope.rollDice = function (dice) {

        function creatResult(calculated, verbose) {
            var result = {};
            result.calculated = calculated;
            result.verbose = verbose;
            result.getFull = function () {
                return calculated + (verbose ? " (" + verbose + ")" : "");
            }
            //console.log(dice);
            //console.log(result);
            return result;
        }

        if (dice == null) {
            return creatResult(0, 0);
        }

        var regex = /(\d{1,3})[d](\d{1,3})([\+\-]\d*(?:[^d\d]|$))?/gi;
        var matches = regex.exec(dice);

        if (matches == null) {
            var v = eval(dice);
            return creatResult(v, v);
        }

        //console.log(matches);
        var total = 0;
        var bonus = undefined;

        while (matches != null) {
            var number = matches[1];
            var die = matches[2];
            for (var j = 0; j < number; j++) {
                total += $scope.randomIntFromInterval(1, die);
            }

            if (bonus == null) {
                bonus = matches[matches.length - 1];
            }

            matches = regex.exec(dice);
            //console.log(matches);
        }

        var calculated = eval(total + (bonus == null ? 0 : bonus));
        var verbose = (bonus == null ? "" : + total + " " + bonus);
        var result = creatResult(calculated, verbose);
        return result;
    }

    $scope.rollInitiative = function (all = false) {
        if ($scope.allRollInitiative) {
            all = true;
        }
        $scope.trackList.forEach(function (item) {
            if (all || !item.isPC === true) {
                var init = $scope.rollDice("1d20").calculated;
                var bonus = (item.initiative_bonus ? item.initiative_bonus : 0);
                item.initiative = init + bonus;
                //$scope.addLog(item.nickname + " got initiative of " + item.initiative + (bonus > 0 ? " ("+ init + "+" + bonus +")" : ""));
            }
        });
        $scope.sortByInitiative();
    }

    $scope.sortByInitiative = function () {
        $scope.trackList = $filter('orderBy')($scope.trackList, '-initiative', false);
    }

    $scope.sortByCol = function (monster) {
        var val = monster[$scope.columnToSort];
        try {
            return eval(val);
        }
        catch (e) {
            return val;
        }
    }

    $scope.sortBy = function (prop) {
        if ($scope.columnToSort.toLowerCase() == prop.toLowerCase()) {
            $scope.reverseSort = !$scope.reverseSort;
        }
        $scope.columnToSort = prop;
    }

    // $scope.filterByName = function(monster){

    // return $scope.filterByProp(monster, "name", $scope.filterText);

    // if($scope.filterText.trim() == "" || 
    // monster.name == null){
    // return true;
    // }
    // return monster.name.toLowerCase().indexOf($scope.filterText.toLowerCase()) >= 0;
    // }

    $scope.filterByProp = function (prop, value) {
        return function (monster) {
            var val = monster[prop];
            if (value == null || value.trim() == "" || val == null) {
                return true;
            }
            return val.toLowerCase().indexOf(value.toLowerCase()) >= 0;
        }
    }

    $scope.removeMonster = function (monster) {
        if ($scope.askRemoval && !confirm("Remove?")) {
            return;
        }
        var index = $scope.trackList.indexOf(monster);
        if (index >= 0) {
            $scope.trackList.splice(index, 1);
        }
    }

    $scope.adjustBonus = function (bonus) {
        return (bonus ? (bonus > 0 ? "+" : "") + bonus : "");
    }

    $scope.attack = function (attackingCreature, creature) {

        var selectedAttack = attackingCreature.selected_attack;

        if (selectedAttack == null) {
            return 0;
        }

        var result = {};
        result.hitSuccess = false;
        result.creature = creature;

        var hitRoll = $scope.rollDice("1d20" + $scope.adjustBonus(selectedAttack.attack_bonus));
        result.hitRoll = hitRoll;

        var damageRoll = $scope.rollDice((selectedAttack.damage_dice ? selectedAttack.damage_dice : '') + $scope.adjustBonus(selectedAttack.damage_bonus));
        result.damageRoll = damageRoll;


        if (result.hitRoll.calculated >= creature.armor_class) {
            result.hitSuccess = true;
        }

        var id = result.hitSuccess && $scope.askDamage ? $scope.uuidv4() : undefined;

        var log = "<b>" + attackingCreature.nickname + "</b> attacked <b>" + creature.nickname + "</b> (" + hitRoll.getFull() + "). It " + (result.hitSuccess ? "<b>HIT</b> (" + damageRoll.getFull() + " dmg)" : "<b>MISSED!</b>") + "!";
        $scope.addLog($sce.trustAsHtml(log), id);

        if (result.hitSuccess) {
            if (!$scope.askDamage) {
                $scope.performDamage(creature, result.damageRoll.calculated);
            }
            else {
                var damage = {};
                damage.points = result.damageRoll.calculated;
                damage.creature = creature;
                $scope.damageList[id] = damage;
            }
        }

        return result;
    }

    $scope.uuidv4 = function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    $scope.damageList = {};

    $scope.confirmDamage = function (id) {
        var damage = $scope.damageList[id];
        if (damage != null) {
            $scope.performDamage(damage.creature, damage.points);
            delete $scope.damageList[id];
        }
    }

    $scope.performDamage = function (creature, points) {
        creature.hit_points -= points;
        creature.isHit = true;
        setTimeout(function () {
            creature.isHit = false;
            $scope.$apply();
        }, 1000);
        $scope.checkDead(creature);
    }

    $scope.checkDead = function (creature) {
        if (creature.hit_points <= 0) {
            creature.isDead = true;
            $scope.addLog("<b>" + creature.nickname + "</b> died!");
            if ($scope.removeFromListOnDeath) {
                var index = $scope.trackList.indexOf(creature);
                if (index >= 0) {
                    $scope.trackList.splice(index, 1);
                }
            }
        }
        else {
            creature.isDead = false;
        }
    }

    $scope.showFloatDiv = function (id, ele = undefined, hideLast = true, rightDiv = false) {
        if (hideLast && $scope.lastFloatDiv != null) {
            $($scope.lastFloatDiv).fadeOut();
        }

        if (hideLast) {
            $scope.lastFloatDiv = id;
        }

        if (ele != null) {
            if (ele.currentTarget != null) {
                ele = $(ele.currentTarget);
            }
            var pos = ele.offset();
            var h = ele.outerHeight();
            var w = ele.outerWidth();
            pos.top += h;
            if (rightDiv) {
                $(id).css({ top: pos.top + "px", right: 4 + "px" });
            }
            else {
                $(id).css({ top: pos.top + "px", left: pos.left + "px" });
            }
        }
        else {
            $(id).center();
        }
        $(id).finish().fadeIn();
    }

    $scope.addLog = function (data, damageID = null) {
        var log = {};
        log.timestamp = new Date();
        log.data = data;
        log.damageID = damageID;
        $scope.resultsLog.push(log);
    }

    $scope.clearResultsLog = function () {
        $scope.resultsLog = [];
    }

    $scope.trackRoll = function (dice, fullResult = false) {
        var roll = $scope.rollDice(dice);
        $scope.addLog(dice + ' = ' + fullResult ? roll.getFull() : roll.calculated);
    }

    $scope.toogleVisibility = function (id) {
        var ele = $(id);
        if (ele.css("display") == "block") {
            ele.fadeOut();
        }
        else {
            ele.fadeIn();
        }
    }

    $scope.currentTurn = 0;
    $scope.currentRound = 0;
    $scope.currentTime = 0;

    $scope.clearTurn = function () {
        if ($scope.trackList[$scope.currentTurn]) {
            $scope.trackList[$scope.currentTurn].isTurn = false;
        }
    }

    $scope.nextRound = function (newBattle) {
        $scope.clearTurn();
        $scope.currentRound++;
        $scope.currentTime += 6;
        $scope.currentTurn = -1;
        $scope.nextTurn();
        if (newBattle) {
            $scope.currentRound = 0;
            $scope.currentTime = 0;
        }
    }

    $scope.secondsToHms = function (d) {
        d = Number(d);
        var h = Math.floor(d / 3600);
        var m = Math.floor(d % 3600 / 60);
        var s = Math.floor(d % 3600 % 60);

        var hDisplay = h > 0 ? h + (h == 1 ? " hour" : " hours") : "";
        var mDisplay = m > 0 ? m + (m == 1 ? " minute" : " minutes") : "";
        var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";

        if (m > 0 && h > 0) {
            hDisplay += ", ";
        }

        if (s > 0 && m > 0) {
            mDisplay += ", ";
        }
        if (s <= 0 && m <= 0 && h <= 0) {
            return "0 seconds";
        }
        return hDisplay + mDisplay + sDisplay;
    }

    $scope.nextTurn = function () {
        if ($scope.trackList.length == 0) {
            return;
        }

        $scope.clearTurn();

        $scope.currentTurn++;

        if ($scope.currentTurn >= $scope.trackList.length) {
            $scope.nextRound();
        }

        if ($scope.ignoreTurnOnDeath && $scope.trackList[$scope.currentTurn].hit_points <= 0) {
            $scope.nextTurn();
        }

        $scope.trackList[$scope.currentTurn].isTurn = true;
    }

    $scope.showSavedMessage = function () {
        $('#savedMessage').fadeIn().fadeOut(1500);
    }

    $scope.load = function () {
        var files = event.target.files;
        var reader = new FileReader();
        reader.onload = function () {
            var obj = JSON.parse(reader.result);
            $scope.trackList = obj.trackList;
            $scope.currentTurn = obj.currentTurn;
            $scope.currentRound = obj.currentRound;
            $scope.currentTime = obj.currentTime;
            $scope.$apply();
        };
        reader.readAsText(files[0]);
    }

    $scope.save = function () {

        var fileName = prompt("Please enter the file name", "battle");

        var objToSave = {};
        objToSave.trackList = $scope.trackList;
        objToSave.currentTurn = $scope.currentTurn;
        objToSave.currentRound = $scope.currentRound;
        objToSave.currentTime = $scope.currentTime;

        var content = JSON.stringify(objToSave);
        fileName += ".bTracked";

        var blob = new Blob([content], { type: "application/json" });
        var fileURL = URL.createObjectURL(blob);

        var downloadLink = document.createElement("a");
        downloadLink.download = fileName;
        downloadLink.innerHTML = "Download File";
        downloadLink.href = fileURL;
        if (window.webkitURL != null) {
            // Chrome allows the link to be clicked
            // without actually adding it to the DOM.
            downloadLink.href = fileURL;
        }
        else {
            // Firefox requires the link to be added to the DOM
            // before it can be clicked.
            downloadLink.onclick = function () { document.removeChild(downloadLink); };
            downloadLink.style.display = "none";
            document.body.appendChild(downloadLink);
        }

        downloadLink.click();
        setTimeout(function () { URL.revokeObjectURL(fileURL); }, 2000);
    }

});