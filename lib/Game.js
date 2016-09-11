"use strict";

const roomNameGen = require('rand-token').generator({
    chars: "abcdefghijklmnopqrstuvwxyz0123456789"
});

class Player {
    constructor() {

    }
}

class Room {
    constructor(id) {

    }

    static create() {
        var id = roomNameGen.generate(8);

        return new Promise(function(resolve, reject) {
            var room = new Room(id);
            room.init().then(() => {
                resolve(room);
            }, reject);
        });
    }
}


module.exports = class Game {
    constructor(router, wss) {
        router.get('/create', function(req, res, next) {
            
        });

        router.get('/join/:id', function(req, res, next) {
            res.render('join.html', {
                roomID: req.params.id
            });
        });

        router.get('/room/:id', function(req, res, next) {
            res.render('room.html', {
                roomID: req.params.id
            });
        });
    }
}
