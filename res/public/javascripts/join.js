"use strict";

var imperium = angular.module('imperium', []);

imperium.controller('Lobby', function($scope, $timeout) {
    var url = "ws://" + window.location.hostname + "?room=" + roomID;
    var ws = new WebSocketController(url, 'imperium');
    this.players = [];
    this.role = "spectator";
    this.ws = ws;

    var self = this;

    ws.events.on('connected', function() {
        console.log("Connected to the websocket");
    })

    ws.events.on('players', function(data) {
        console.log("Received player list", data);
        $timeout(function() {
            self.players = data;
        });
    });

    ws.events.on('start', function(data) {
        console.log("Received start");
        window.location = "/room/" + roomID;
    });

    this.changeRole = function() {
        if(this.role == "spectator") {
            this.role = "player";
        } else {
            this.role = "spectator";
        }

        ws.send('changeRole', this.role);
    }

    this.canStart = function() {
        return this.players.length >= 2;
    }

    this.startGame = function() {
        if(this.canStart()) {
            ws.send('start');
        }
    }
});
