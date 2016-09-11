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

        router.get('/error', function(req, res, next) {
            throw new Error("ded");
        });
    }
}
