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

var server = require('http').createServer();

server.timeout = 5000;

var wss = new WebSocketServer({
    server: server
});

var routes = new Routes();
var game = new Game(routes.router, wss);
var app = express();

var viewpath = path.resolve(path.join(__dirname, '../res/views'));

nunjucks.configure(viewpath, {
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

app.use(express.static(path.join(__dirname, '../res/public')));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

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
