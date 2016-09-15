"use strict";
const EventEmitter = require('events');
const roomNameGen = require('rand-token').generator({
    chars: "abcdefghijklmnopqrstuvwxyz0123456789"
});

const async = require('async');

function resolvePosition(index, size) {
    size = size || 9;
    return String.fromCharCode("a".charCodeAt(0) + Math.floor(index/size)) + (index % size + 1);
}

function toi(p, size) {
    size = size || 9;
    p = ij(p);
    return p.i * size + p.j;
}

function ij(p) {
    if(typeof p == "object") {
        return {
            i: p.i,
            j: p.j
        };
    }

    var m = p.match(/([a-z]+)([0-9]+)/);
    return {
        i: m[1].charCodeAt(0) - "a".charCodeAt(0),
        j: +m[2] - 1
    }
}

function an(p) {
    return String.fromCharCode("a".charCodeAt(0) + p.i) + (p.j + 1);
}

/**
* Returns you something like: up-left
*/
function relativePosition(s, d) {
    s = ij(s);
    d = ij(d);

    var a = s.i == d.i ? (false) : (s.i > d.i ? "up" : "down");
    var b = s.j == d.j ? (false) : (s.j > d.j ? "left" : "right");

    return (a && b) ? (a + "-" + b) : (a || b);
}

function dist(s, d, manhattan) {
    s = ij(s);
    d = ij(d);

    var xd = Math.abs(s.j - d.j);
    var yd = Math.abs(s.i - d.i);

    if(manhattan) {
        return xd + yd;
    }

    return Math.max(xd, yd);
}

function rel(f, i, j, size) {
    size = size || 9;
    f = ij(f);
    f.i += i;
    f.j += j;

    if(f.i >= size || f.j >= size) {
        return null;
    }

    return an(f);
}

/**
 * Randomize array element order in-place.
 * Using Durstenfeld shuffle algorithm.
 */
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}


class Client extends EventEmitter {
    constructor(ws) {
        super();
        this.uuid = ws.upgradeReq.user.uuid;
        this.ws = ws;
        ws.on('message', this.handleMessage.bind(this))
    }

    handleMessage(data) {
        console.log(data);
        data = JSON.parse(data);
        this.emit(data.e, this.uuid, data.d);
    }

    send(e, d) {
        try {
            this.ws.send(JSON.stringify({
                e: e,
                d: d
            }));
            return true;
        } catch (e) {
            return false;
        }
    }
}

class Player extends EventEmitter {
    constructor(manager, uuid, callback) {
        super();
        callback = callback || () => {};

        this.manager = manager;
        this.uuid = uuid;

        this.info = {
            badges: [],
            name: "#notloaded",
            owner: false
        }

        manager.onUserUpdate(uuid, this.update.bind(this));

        this.update().then(callback);
    }

    update() {
        var self = this;
        return new Promise(function(resolve, reject) {
            self.info.name = self.manager.getUsername(self.uuid);
            console.log("Player updated: " + self.uuid);
            self.emit('updated');
            resolve();
        });
    }

    setOwner() {
        this.info.owner = true;
        this.info.badges.push({
            fa: "star-empty"
        });
    }
}

class Room {
    constructor(id, manager, data) {
        this.manager = manager;
        this.id = id;
        this.clients = []; // everyone with a connection
        this.players = data.players || []; // uuids of people that are actually playing
        this.owner = data.owner || null;
        this.moves = [];

        console.log("Created room. Owner: " + this.owner);
    }

    init() {
        var self = this;
        return new Promise(function(resolve, reject) {
            try {
                // var user = self.manager.createUser();
                // user.setUsername('batata');
                // self.onChangeRole(user.uuid, 'player');
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }

    numPlayers() {
        return this.players.length;
    }

    randomizePlayers() {
        this.players = shuffleArray(this.players);
        console.log(this.players);
        this.sendPlayers();
        this.sendSelfInfo();
    }

    newGame() {
        var n = this.numPlayers();
        if(n < 2) {
            throw new Error("Cannot start game: too few players");
        }

        this.moves = [];

        var str = "";
        var starts = ["a1", "a9", "i9", "i1"];
        var trees = ["c3", "c7", "g3", "g7"];
        var middle = "e5";
        var treeChance = 0.05;
        starts.length = n;
        var pos = ["k", "t", "w"];
        for (var i = 0; i < 9 * 9; i++) {
            var k = resolvePosition(i);
            starts.forEach(function(a, v) {
                var d = dist(a, k, true);
                if(d <= 2) {
                    str += "@" + k + ":" + pos[d] + (v + 1) + " ";
                }
            });

            if(trees.indexOf(k) != -1 || (dist(middle, k, true) < 5 && Math.random() <= treeChance)) {
                str += "@" + k + "+ ";
            }
        }

        this.randomizePlayers();

        this.pushMove(str);
    }

    pushMove(move) {
        this.moves.push(move);
        this.sendMoves();
    }

    sendMoves(uuid) {
        this.broadcast("moves", this.moves, uuid);
    }

    sendPlayers(uuid) {
        var manager = this.manager;
        this.broadcast("players", this.players.map(v => v.info), uuid);
    }

    sendStart(uuid) {
        this.broadcast('start', undefined, uuid);
    }

    sendSelfInfo(uuid) {
        var self = this;
        if(!uuid) {
            this.players.forEach(p => self.sendSelfInfo(p.uuid));
        } else {
            var info = {
                number: -1,
                owner: uuid === this.owner
            }
            this.players.forEach((v, i) => {
                if(v.uuid == uuid) {
                    info.number = i;
                }
            })
            console.log("Send player info: ", info);
            if(info.number == -1) {
                console.log(uuid + " is not a player on ", this.players);
            }
            this.broadcast('selfInfo', info, uuid);
        }
    }

    broadcast(e, d, uuid) {
        this.clients.forEach(client => {
            if(uuid && client.uuid != uuid) {
                return;
            }
            client.send(e, d);
        });
    }

    addClient(ws) {
        var client = new Client(ws);
        console.log("Register client");
        client.on('changeRole', this.onChangeRole.bind(this));
        client.on('start', this.onStart.bind(this));
        client.on('restart', this.onRestart.bind(this));
        client.on('move', this.onMove.bind(this));
        this.clients.push(client);
        this.sendPlayers();

        this.sendSelfInfo(client.uuid);

        if(!this.started) {
            return;
        }

        this.sendMoves(client.uuid);
    }

    onChangeRole(uuid, role) {
        if(this.started) {
            return;
        }
        var self = this;
        if(role == "player" && !this.players.find(v => v.uuid == uuid)) {
            console.log("Join: " + uuid);

            var player = new Player(this.manager, uuid, function() {
                if(player.uuid == self.owner) {
                    player.setOwner();
                }
                player.on('updated', function() {
                    console.log("Received player update. Sending players.")
                    self.sendPlayers();
                });

                self.players.push(player);
                self.sendPlayers();
            });
        }
    }

    onStart(uuid) {
        if(this.started) {
            return;
        }

        this.started = true;

        this.sendStart();
        // clear clients since the ws will reset
        this.clients = [];
        this.newGame();
    }

    onRestart(uuid) {
        if(!this.started) {
            return;
        }

        this.newGame();

        this.broadcast('restart');
    }

    onMove(uuid, move) {
        // this needs to change
        // verification would be nice
        this.pushMove(move);
    }

    static create(options, manager) {
        var id = roomNameGen.generate(8)

        return new Promise(function(resolve, reject) {
            var room = new Room(id, manager, {
                owner: options.owner
            });
            room.init().then(() => {
                resolve(room);
            }, reject);
        });
    }
}


module.exports = class Game {
    constructor(router, wss, manager) {
        var self = this;

        this.rooms = {};

        this.wss = wss;

        this.manager = manager;

        router.get('/create', function(req, res, next) {
            console.log("Create called by " + req.user.uuid);
            Room.create({
                owner: req.user.uuid
            }, self.manager).then(room => {
                self.addRoom(room);
                res.redirect(302, '/join/' + room.id);
            }).catch(err => {
                console.error(err);
                res.status(500).render("500.html", {error: err});
            });
        });

        router.get('/join/:id', function(req, res, next) {
            var room = self.getRoom(req.params.id);
            if(!room) {
                res.redirect(302, '/');
                return;
            }

            if(!req.user.ready) {
                res.redirect(302, '/u?room=' + req.params.id);
                return;
            }

            if(room.started) {
                res.redirect(301, '/room/' + room.id);
                return;
            }

            res.render('join.html', {
                roomID: req.params.id
            });
        });

        router.get('/room/:id', function(req, res, next) {
            var room = self.getRoom(req.params.id);
            if(!room) {
                res.redirect(302, '/');
                return;
            }

            if(!room.started) {
                res.redirect(302, '/join/' + req.params.id);
                return;
            }

            res.render('room.html', {
                roomID: req.params.id
            });
        });

        wss.on('connection', function(ws) {
            var req = ws.upgradeReq;
            var room = self.getRoom(req.query.room);

            console.log("uuid: " + req.user.uuid + ", room: " + room.id);

            if(!room) {
                ws.close();
                return;
            }

            req.room = room;

            room.addClient(ws);
        });
    }

    addRoom(room) {
        this.rooms["room_" + room.id] = room;
    }

    getRoom(id) {
        return this.rooms["room_" + id] || null;
    }
}
