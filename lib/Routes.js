"use strict";
const EventEmitter = require('events');
const express = require('express');

module.exports = class Routes extends EventEmitter {
    constructor() {
        super();
        var router = express.Router();
        this.router = router;

        router.get('/', function(req, res, next) {
            res.render('index.html');
        });

        router.get('/u', function(req, res, next) {
            res.render('user.html', {
                user: req.user
            });
        });

        router.post('/u', function(req, res, next) {
            req.user.setUsername(req.body.username);
            if(req.query.room) {
                res.redirect(302, '/join/' + req.query.room);
                return;
            }
            res.render('user.html', {
                user: req.user
            });
        });

        router.get('/error', function(req, res, next) {
            throw new Error("ded");
        });
    }
}
