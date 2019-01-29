/*******************************************************************************
 * (c) Copyright HCL Technologies Ltd. 2019.  MIT Licensed!
 *******************************************************************************/

/**
 * Server application entry point
 * @author Mattias Mohlin
 */
'use strict';

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

const port = 5000;
const env = process.env.NODE_ENV || 'development';

// Static middleware for serving static files 
app.get('/', function(req, res) {
    res.contentType("text/html");
    res.sendFile(__dirname + '/public/html/main.html');
});
app.get('/css', function(req, res) {
    res.contentType("text/css");
    res.sendFile(__dirname + '/public/css/styling.css');
});
/*app.get('/images/stop', function(req, res) {
    res.contentType("img/png");
    res.sendFile(__dirname + '/public/images/stop.png');
});
app.get('/images/walk', function(req, res) {
    res.contentType("img/png");
    res.sendFile(__dirname + '/public/images/walk.png');
});*/
app.get('/main', function(req, res) {
    res.contentType("text/javascript");
    res.sendFile(__dirname + '/public/js/main.js');
});
app.get('/jquery', function(req, res) {
    res.contentType("text/javascript");
    res.sendFile(__dirname + '/public/js/jquery/jquery.min.js');
});

var rtAppCallback = null;

// Messages from web application to RT application 
app.get('/start_game', function(req, res) {
    if (!rtAppCallback) {
        console.log('RT application not running!');
        return;
    }

    rtAppCallback('start_game');    
    res.end();
});

// Attempts to fetch a message to the RT application
app.get('/command', function(req, res) {
    console.log('Ready for command');
    rtAppCallback = function (cmd) {
        res.send(cmd);
    };
    // Let this request be pending until there is any command to send back
});

// Messages from RT application
app.get('/newWord', function(req, res) {
    let word = req.query.word;    

    // Send light info to all connected web clients
    io.emit('word', {'word' : word});

    res.contentType("text/plain");
    res.send('OK');
});

http.listen(port, () => console.log(`Web app listening on port ${port}!`));
