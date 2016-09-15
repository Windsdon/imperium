"use strict";
const nunjucks = require('nunjucks');
const WebSocketServer = require('ws').Server;
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const randtoken = require('rand-token').generator({
    chars: "abcdefghijklmnopqrstuvwxyz0123456789"
});
const url = require('url');
const Routes = require('./Routes');
const Game = require('./Game');
const UserManager = require('./UserManager');
const fs = require('fs');

var server = require('http').createServer();

var VERSION = JSON.parse(fs.readFileSync('package.json')).version;

server.timeout = 5000;

var userManager = new UserManager();

var wss = new WebSocketServer({
    server: server,
    verifyClient: function(info) {
        cookieParser()(info.req, {}, function() {});
        var query = url.parse(info.req.url, true).query;
        userManager.use(info.req, {}, function(){});
        info.req.query = query;
        console.log("Accept connection");
        return true;
    }
});

var routes = new Routes();
var game = new Game(routes.router, wss, userManager);
var app = express();

var viewpath = path.resolve(path.join(__dirname, '../res/views'));

var env = nunjucks.configure(viewpath, {
    autoescape: true,
    express: app,
    noCache: true,
    tags: {
        blockStart: '<%',
        blockEnd: '%>',
        variableStart: '<$',
        variableEnd: '$>',
        commentStart: '<#',
        commentEnd: '#>'
    }
});

env.addGlobal('VERSION', VERSION);

app.use(express.static(path.join(__dirname, '../res/public')));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(userManager.middleware());

app.use('/', routes.router);

// Handle 404
app.use(function(req, res) {
    res.status(400);
    res.render('404.html');
});

// Handle 500
app.use(function(error, req, res, next) {
    res.status(500);
    res.render('500.html', {error: error});
});

server.on('request', app);
server.listen(80, function () { console.log('Listening on ' + server.address().port) });
