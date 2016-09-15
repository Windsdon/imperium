"use strict";

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

function fadeAll(board) {
    for (var i in board) {
        if (board.hasOwnProperty(i)) {
            board[i].faded = true;
        }
    }
}

/**
* These make in-place modifications on the board
*/
var moveParsers = [
    { // board state
        test: /^@([a-z]+[0-9]+)(?::([wtk])(\d)|(\+))$/,
        proc: function(match, board, showLast) {
            var sprites = {
                "w": "knight",
                "t": "thief",
                "k": "king"
            }

            var p = match[1];
            var sprite = match[2] ? sprites[match[2]] : null;
            var player = typeof(match[3]) != "undefined" ? (match[3] - 1) : null;
            var terrain = match[4] ? "tree" : board[p].terrain;

            if(showLast) {
                fadeAll(board);
            }
            board[p] = $.extend(board[p], {
                sprite: sprite,
                player: player,
                terrain: terrain,
                faded: false
            });

            var ps = {};

            if(sprite == "king") {
                ps[player] = true;
            }

            return {
                setPlayerStatus: ps,
                nextPlayer: false
            }
        }
    }, { // move or win
        test: /^([a-z]+[0-9]+)([a-z]+[0-9]+)(#)?$/,
        proc: function(match, board, showLast) {
            var middle = "e5";

            var f = match[1]; // from
            var t = match[2]; // to
            var won = !!match[3];

            if(won) {
                won = board[f].player;
            }

            if(showLast) {
                fadeAll(board);

                board[t] = $.extend(board[t], {
                    overlay: "move",
                    moveDirection: relativePosition(f, t),
                    faded: false
                });

                board[f] = $.extend(board[f], {
                    faded: false
                });
            } else {
                board[t] = $.extend(board[t], {
                    sprite: board[f].sprite,
                    player: board[f].player,
                    noPower: !!board[f].noPower
                });

                board[f] = $.extend(board[f], {
                    sprite: null,
                    player: null
                });
            }

            return {
                nextPlayer: true,
                won: won
            }
        }
    }, { // capture or win
        test: /^([a-z]+\d+)([a-z]+\d+)!(#)?$/,
        proc: function(match, board, showLast) {
            var middle = "e5";

            var f = match[1]; // from
            var t = match[2]; // to
            var won = !!match[3];

            if(won) {
                won = board[f].player;
                console.log(match[0] + " makes " + won + " win");
            }

            if(showLast) {
                fadeAll(board);

                board[t] = $.extend(board[t], {
                    overlay: "destroy",
                    faded: false
                });

                board[f] = $.extend(board[f], {
                    faded: false
                });
            } else {
                board[t] = $.extend(board[t], {
                    sprite: board[f].sprite,
                    player: board[f].player,
                    noPower: !!board[f].noPower
                });

                board[f] = $.extend(board[f], {
                    sprite: null,
                    player: null
                });
            }

            return {
                nextPlayer: true,
                won: won
            }
        }
    }, { // power move
        test: /^([a-z]+\d+)([a-z]+\d+)(!)?\*(?:([a-z]+\d+)\$)?(?:([a-z]+\d+)\+)?(?:([a-z]+\d+)%)?(~)?$/,
        proc: function(match, board, showLast) {
            var f = match[1]; // from
            var t = match[2]; // to
            var captured = !!match[3]; // captured?
            var d = match[4]; // destroy
            var p = match[5]; // tree
            var up = match[6]; // remove tree
            var extra = !!match[7]; // extra turn

            if(showLast) {
                fadeAll(board);

                board[t] = $.extend(board[t], {
                    faded: false,
                    overlay: captured ? "destroy" : "move",
                    moveDirection: relativePosition(f, t)
                });

                board[f] = $.extend(board[f], {
                    faded: false
                });

                if(d) {
                    board[d] = $.extend(board[d], {
                        faded: false,
                        overlay: "destroy"
                    });
                }

                if(p) {
                    board[p] = $.extend(board[p], {
                        faded: false,
                        terrain: "tree"
                    });
                }

                if(up) {
                    board[up] = $.extend(board[up], {
                        faded: false,
                        terrain: "tree-cut"
                    });
                }

            } else {
                board[t] = $.extend(board[t], {
                    sprite: board[f].sprite,
                    player: board[f].player,
                    noPower: true
                });

                board[f] = $.extend(board[f], {
                    sprite: null,
                    player: null
                });

                if(d) {
                    board[d] = $.extend(board[d], {
                        sprite: null,
                        player: null
                    });
                }

                if(p) {
                    board[p] = $.extend(board[p], {
                        terrain: "tree"
                    });
                }

                if(up) {
                    board[up] = $.extend(board[up], {
                        terrain: null
                    });
                }
            }

            return {
                nextPlayer: !extra
            }
        }
    }, { // eliminate
        test: /^([a-z]+\d+)([a-z]+\d+)!-(#)?$/,
        proc: function(match, board, showLast) {
            var f = match[1]; // from
            var t = match[2]; // to
            var k = board[t].player; // player killed
            var won = !!match[3];

            if(won) {
                won = board[f].player;
            }

            if(showLast) {
                fadeAll(board);

                for (var i in board) {
                    if (board.hasOwnProperty(i) && board[i].player === k) {
                        board[i] = $.extend(board[i], {
                            overlay: "destroy",
                            faded: false
                        })
                    }
                }

                board[t] = $.extend(board[t], {
                    overlay: "destroy",
                    faded: false
                });

                board[f] = $.extend(board[f], {
                    faded: false
                });
            } else {
                for (var i in board) {
                    if (board.hasOwnProperty(i) && board[i].player === k) {
                        board[i] = $.extend(board[i], {
                            sprite: null,
                            player: null
                        })
                    }
                }

                board[t] = $.extend(board[t], {
                    sprite: board[f].sprite,
                    player: board[f].player
                });

                board[f] = $.extend(board[f], {
                    sprite: null,
                    player: null
                });
            }

            var ps = {};
            ps[k] = false;

            return {
                setPlayerStatus: ps,
                nextPlayer: true,
                won: won
            }
        }
    }
]

/**
* Applies the moves to the board, and return the new one
* Makes a deep copy, so the original is not modified
* showLast adds overlays showing the last movement
*/
function resolve(board, moves, showLast) {
    var b = $.extend(true, {}, board);

    var player = 0;  // current player number, always starts at 0
    var players = [false, false, false, false]; // current player alive status
    var won = false; // winner

    moves.forEach(function(v, j, arr) {
        v.split(/ +/).forEach(function(m, k, v2) {
            var last = (j == arr.length - 1 && k == v2.length - 1);
            var results = null;
            var flagIgnoreNextTurn = last && showLast;
            if(m[0] == "~") {
                flagIgnoreNextTurn = true;
                m = m.substring(1);
            }
            for (var i = 0; i < moveParsers.length; i++) {
                var matched = m.match(moveParsers[i].test);
                if(matched) {
                    results = moveParsers[i].proc(matched, b, last && showLast);
                    break;
                }
            }

            // after each move has been processed, we check the results
            if(results) {
                // apply them to the player status
                if(results.setPlayerStatus) {
                    for (var i in results.setPlayerStatus) {
                        players[i] = results.setPlayerStatus[i];
                    }
                }

                // check if this moves advances turns
                if(results.nextPlayer && !flagIgnoreNextTurn) {
                    var playersLeft = players.filter(function(v) {
                        return v;
                    }).length;

                    do {
                        player = (player + 1) % players.length;
                    } while(!players[player]);

                    if(playersLeft == 1) {
                        won = player;
                    }
                }

                if(results.won !== false && results.won !== undefined) {
                    won = results.won;
                }
            }
        });
    });

    return {
        board: b,
        state: {
            player: player,
            players: players,
            won: won
        }
    };
}

/**
* Modifies the board in-place and adds overlays for movement options
*/
function calculateMovementOptions(board, f, player) {
    var patterns = {
        knight: [[1, 0], [0, 1], [-1, 0], [0, -1]],
        king: [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]],
        thief: [[1, 1], [-1, -1], [1, -1], [-1, 1]]
    }

    var middle = "e5";

    var o = board[f];

    if(o.player != player || o.sprite == null) {
        return false;
    }

    patterns[o.sprite].forEach(function(v) {
        var d = rel(f, v[0], v[1]);
        if(d == null) {
            return;
        }

        var dd = board[d];

        if(!dd || dd.player === o.player || dd.terrain == "tree") {
            return;
        }

        if(dd.sprite != null) {
            dd.overlay = "destroy";
            dd.result = f + d + "!";
            if(dd.sprite == "king") {
                dd.result += "-";

                // calculate victory by elimination
                var players = [false, false, false, false];
                for(var i in board) {
                    // add kings but not the one being killed
                    if(board[i].sprite == "king" && i != d) {
                        players[board[i].player] = true;
                    }
                }

                if(players.filter(p => p).length == 1) {
                    dd.result += "#";
                }
            }
        } else {
            dd.overlay = "move";
            dd.result = f + d;
            dd.moveDirection = relativePosition(f, d);
        }

        if(d == middle) {
            if(o.sprite == "king") {
                dd.result += "#";
                dd.win = true;
            } else if(!o.noPower){
                // ~ is a "ignore next turn" flag
                dd.result = "~" + dd.result;
                dd.power = true;
            }
        }

        dd.validDrop = true;
    });

    return true;
}

function makeMoveInit() {
    var str = "";
    var starts = ["a1", "a9", "i9", "i1"];
    var pos = ["k", "t", "w"];
    for (var i = 0; i < 9 * 9; i++) {
        var k = resolvePosition(i);
        starts.forEach(function(a, v) {
            var d = dist(a, k, true);
            if(d <= 2) {
                str += "@" + k + ":" + pos[d] + (v + 1) + " ";
            }
        })
    }

    return str;
}


window.dist = dist;
window.ij = ij;
window.makeMoveInit = makeMoveInit;

var imperium = angular.module('imperium', []);

imperium.filter('reverse', function() {
    return function(items) {
        return items.slice().reverse();
    };
});

imperium.filter('moveList', function() {
    return function(items) {
        return items.join(" ");
    };
});

imperium.controller('GameField', function($scope, $timeout) {
    this.playerColors = ["#f00", "#0a0", "#00f", "#cc0"];
    this.cells = {};
    this.base = {};
    this.moves = [];
    this.showCoords = true;
    this.colors = ["red", "green", "blue", "yellow"];
    this.sprites = ["king", "knight", "thief"];
    this.lastMove = this.moves.length - 1;
    this.state = "move";
    this.moveSource = null;
    this.lastMoveSource = null;

    this.isOwner = false;

    // the current player
    this.player = 0;

    // player names, in the order RGBY
    this.players = [];

    // players alive status, in order
    this.playerStatus = [];

    // this client's player number
    this.playerNumber = -1;

    var url = "ws://" + window.location.hostname + "?room=" + roomID;
    var ws = new WebSocketController(url, 'imperium');
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

    ws.events.on('moves', function(data) {
        console.log("Received moves", data);
        $timeout(function() {
            self.moves = data;
            self.lastMove = self.moves.length - 1;
            self.redraw();
        });
    });

    ws.events.on('selfInfo', function(data) {
        console.log("Received self info", data);
        $timeout(function() {
            self.playerNumber = data.number;
            self.isOwner = data.owner;
            self.redraw();
        });
    });

    ws.events.on('restart', function(data) {
        console.log("restart");
        $timeout(function() {
            self.notYou = null;
            self.redraw();
        });
    });

    // initial draw;
    for (var i = 0; i < 9 * 9; i++) {
        var k = resolvePosition(i);
        this.base[k] = {
            center: k == "e5" ? true : false,
            position: k,
            faded: false,
            sprite: null,
            terrain: null,
            overlay: null,
            moveDirection: null,
            player: null
        }
    }

    this.redraw = function(nodrags) {
        var self = this;
        var showLast = this.lastMove != (this.moves.length - 1);
        var r = resolve(this.base, this.moves.slice(0, this.lastMove + 2), showLast);
        this.cells = r.board;
        this.player = r.state.player;
        this.playerStatus = r.state.players;
        this.won = r.state.won;

        if(showLast) {
            // just to make rendering nicer
            this.hideWon = true;
        }

        if(this.won !== false) {
            console.log(this.won, "won the game");
            // this needs to be called after the update cycles
            // because the previous updates may still be processing
            $timeout(function functionName() {
                self.destroyDrags();
            });
            return;
        }

        if(!showLast || this.notYou === null) {
            this.notYou = this.playerNumber !== null && this.player != this.playerNumber;
        }

        var middle = "e5";

        // it's not your turn!
        if(this.notYou) {
            return;
        }

        if(this.state == "move") {
            if(!showLast && this.moveSource && !calculateMovementOptions(this.cells, this.moveSource, this.player)) {
                if(this.lastMoveSource) {
                    // handle persitent move ui
                    var cells2 = $.extend(true, {}, this.cells);
                    calculateMovementOptions(cells2, this.lastMoveSource, this.player);
                    if(cells2[this.moveSource].overlay) {
                        this.cells = cells2;
                    }
                }
            }
        }

        if(this.killCursor) {
            var at = this.cells[this.killCursor];
            if(at.sprite && at.sprite != "king") {
                this.cells[this.killCursor] = $.extend(at, {
                    tempOverlay: "destroy"
                });
            }
        }

        if(this.treeCursor) {
            var at = this.cells[this.treeCursor];
            if(at.terrain == null && this.treeCursor != middle) {
                this.cells[this.treeCursor] = $.extend(at, {
                    tempTerrain: "tree"
                });
            }
        }

        if(this.treeCutCursor) {
            var at = this.cells[this.treeCutCursor];
            if(at.terrain == "tree") {
                this.cells[this.treeCutCursor] = $.extend(at, {
                    tempTerrain: "tree-cut"
                });
            }
        }

        if(nodrags || this.state != "move") {
            return;
        }

        $timeout(function() {
            self.prepareDrags();
        });
    }

    this.destroyDrags = function() {
        // destroy current drop targets
        $(".game-cell").each(function() {
            try {
                $(this).droppable("destroy");
            } catch(err) {

            }
        });
        $(".sprite").css("z-index", "auto").each(function() {
            try {
                $(this).css({
                    top: 0,
                    left: 0
                }).draggable("destroy");
            } catch(err) {

            }
        });
    }

    this.prepareDrags = function() {
        var self = this;
        this.destroyDrags();
        for (var i in this.cells) {
            if (this.cells.hasOwnProperty(i)) {
                var o = this.cells[i];
                if(o.player === this.player) {
                    $("#cell-" + i).children(".sprite").data("pos", i).css("z-index", 1).draggable({
                        revert: "invalid",
                        revertDuration: 200,
                        start: function() {
                            var pos = $(this).data("pos");
                            $(".sprite").not("#cell-" + pos + " > sprite").each(function() {
                                try {
                                    $(this).draggable("destroy")
                                } catch(err) {

                                }
                            });
                            $timeout(function() {
                                self.moveSource = pos;
                                self.dragging = true;
                                self.redraw(true);
                                $timeout(function() {
                                    $(".droppable").droppable({
                                        drop: function() {
                                            var e = $(this);
                                            var c = self.cells[e.data("pos")];
                                            $timeout(function() {
                                                self.handleDrop(c);
                                            });
                                        }
                                    });
                                });
                            });
                        },
                        stop:  function() {
                            $timeout(function() {
                                self.dragging = false;
                                self.moveSource = null;
                                self.redraw(false);
                            });
                        }
                    });
                }
            }
        }
    }

    this.mouseOver = function(source) {
        if(this.dragging || source == this.moveSource) {
            return;
        }

        if(this.state == "move" && !this.cells[source].sprite
            && this.lastMoveSource && dist(this.lastMoveSource, source, true) < 3) {
            return;
        }

        this.lastMoveSource = this.moveSource;
        this.moveSource = null;

        switch (this.state) {
            case "move":
                this.moveSource = source;
                break;
            case "pmkill":
                this.killCursor = source;
                break;
            case "pmtree":
                this.treeCursor = source;
                break;
            case "pmtreecut":
                this.treeCutCursor = source;
                break;
            default:
                return;
        }

        this.redraw();
    }

    this.setPlayer = function(p) {
        this.player = p;
        this.redraw();
    }

    this.addMove = function(move) {
        this.moves.push(move);
        if(move[0] != '~') { // hue
            ws.send('move', move);
        }
        this.lastMove = this.moves.length - 1;
        this.redraw();
    }

    this.handleClick = function(cell) {
        switch (this.state) {
            case "move":
                var c = this.cells[cell];
                if(c.result) {
                    this.handleDrop(c);
                }
                break;
            case "pmkill":
                this.killCallback(cell);
                break;
            case "pmtree":
                this.treeCallback(cell);
                break;
            case "pmtreecut":
                this.treeCutCallback(cell);
                break;
            default:
                return;
        }
    }

    this.resolvePowerMove = function(c, type, at) {
        var self = this;

        self.treeCursor = false;
        self.treeCutCursor = false;
        self.killCursor = false;

        self.state = "move";

        // remove the temporary movement
        self.moves.pop();

        switch (type) {
            case "pmkill":
                self.addMove(c.result.substring(1) + "*" + at + "$");
                break;
            case "pmtree":
                self.addMove(c.result.substring(1) + "*" + at + "+");
                break;
            case "pmtreecut":
                self.addMove(c.result.substring(1) + "*" + at + "%");
                break;
            case "pmextra":
                self.addMove(c.result.substring(1) + "*~");
                break;
        }
    }

    this.selectPowerMove = function(type) {
        if(!this.powerMoveCallback) {
            console.error("No power move callback!");
            return;
        }
        this.powerMoveCallback(type);
    }

    this.handleDrop = function(c) {
        var self = this;
        var middle = "e5";
        this.destroyDrags();
        if(c.power) {
            this.state = "pmselect";

            // add temporary move
            self.addMove(c.result);

            // this callback should be called on an angular loop
            this.powerMoveCallback = function(type) {
                if(type == "pmextra") {
                    this.resolvePowerMove(c, "pmextra");
                    return;
                }
                // set state
                self.state = type;

                self.killCallback = function(k) {
                    var at = k;
                    k = self.cells[k];

                    if(!k.sprite || k.sprite == "king") {
                        return;
                    }

                    self.resolvePowerMove(c, self.state, at);
                }

                self.treeCallback = function(tree) {
                    var at = tree;
                    var t = self.cells[tree];

                    if(tree == middle || t.terrain) {
                        return;
                    }

                    self.resolvePowerMove(c, self.state, at);
                }

                self.treeCutCallback = function(tree) {
                    var at = tree;
                    var t = self.cells[tree];

                    if(t.terrain !== "tree") {
                        return;
                    }

                    self.resolvePowerMove(c, self.state, at);
                }
            }

        } else {
            self.addMove(c.result);
        }
    }

    this.restart = function() {
        ws.send('restart');
    }

    this.redraw();
})

function resize() {
    $(".game-field").height($(".game-field").width() + "px");
}

$(window).resize(resize);
$(document).ready(function() {
    resize();
})
