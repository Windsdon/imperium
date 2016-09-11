"use strict";

function WebSocketController(url, protocol) {
    var wsCtor = window['MozWebSocket'] ? MozWebSocket : WebSocket;
    console.log("Connecting to " + url);
	this.socket = new wsCtor(url, protocol);
    this.events = new EventEmitter();

    var self = this;

	this.socket.onopen = function() {
		self.events.emit("connected");
	}

    this.socket.onclose = function() {
        self.events.emit("disconnected");
    }

    this.handleWebsocketMessage = function(message) {
        var data = JSON.parse(message.data);
        self.events.emit(data.e, data.d);
    }

    this.send = function(e, d) {
        self.socket.send(JSON.stringify({
            e: e,
            d: d
        }));
    }

	this.socket.onmessage = this.handleWebsocketMessage.bind(this);
}

window.WebSocketController = WebSocketController;
