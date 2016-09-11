"use strict";

const uuidgen = require('node-uuid');

class User {
    constructor(data) {
        this.uuid = data.uuid;
        this.ready = data.ready || false;
        this.username = data.username || "guest";
    }

    setUsername(username) {
        username = username || "guest";
        username = username.replace(/[^\w ]/g, "");
        this.username = username || "guest";
        this.ready = this.username.length > 0;
    }

    static create() {
        var uuid = uuidgen.v4();
        return new User({uuid: uuid});
    }
}

module.exports = class UserManager {
    constructor() {
        this.users = {};
        this.sessions = {};
    }

    createUser() {
        var user = User.create();
        this.users[user.uuid] = user;
        return user;
    }

    getUsername(uuid) {
        if(this.users[uuid]) {
            return this.users[uuid].username;
        }
        return "#";
    }

    use(req, res, next) {
        var sessionID = req.cookies.sessionID;
        if(sessionID === undefined) {
            var str = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            var sessionID = ""
            for(var i = 0; i < 256; i++) {
                sessionID += str[~~(Math.random() * str.length)];
            }
            res.cookie('sessionID', sessionID, { maxAge: 900000 });
        }

        var uuid = this.sessions[sessionID];
        var user = this.users[uuid];
        if(!uuid || !user) {
            var user = this.createUser();

            this.sessions[sessionID] = user.uuid;
        }

        req.user = user;

        next();
    }

    middleware() {
        var self = this;
        return function(req, res, next) {
            self.use(req, res, next);
        }
    }
}
