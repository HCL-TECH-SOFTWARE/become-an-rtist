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
app.use('/css', express.static(__dirname + '/public/css'));
app.use('/audio', express.static(__dirname + '/public/audio'));
app.use('/js', express.static(__dirname + '/public/js'));
app.use('/images', express.static(__dirname + '/public/images'));
// Special routes for modules that are installed
app.get('/socket.io', function(req, res) {
    res.contentType("text/javascript");
    res.sendFile(__dirname + '/node_modules/socket.io-client/dist/socket.io.js');
});
app.get('/svg.js', function(req, res) {
    res.contentType("text/javascript");
    res.sendFile(__dirname + '/node_modules/svg.js/dist/svg.min.js');
});

app.get('/word-image', function(req, res) {
    let word = req.query.word;
    let index = req.query.index;

    res.contentType("image/jpeg");
    res.sendFile('D:\\quickdraw\\all_images\\' + word + '\\' + index + '.jpg');
});

var rtAppCallback = null;

// Messages from web application to RT application 
app.get('/start_game', function(req, res) {
    if (!rtAppCallback) {
        console.log('RT application not running!');
        return;
    }

    rtAppCallback('start_game');    
//    res.end();
});

app.get('/done_drawing', function(req, res) {
    if (!rtAppCallback) {
        console.log('RT application not running!');
        return;
    }

    rtAppCallback('done_drawing');    
//    res.end();
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

    // Send info to all connected web clients
    io.emit('newWord', {'word' : word});

    res.contentType("text/plain");
    res.send('OK');
});

app.get('/remainingTime', function(req, res) {
    let time = req.query.time;    

    // Send info to all connected web clients
    io.emit('remainingTime', {'time' : time});

    res.contentType("text/plain");
    res.send('OK');
});

app.get('/gameOver', function(req, res) {
    // Send info to all connected web clients
    io.emit('gameOver', {});

    res.contentType("text/plain");
    res.send('OK');
});

app.get('/failedToRecognizeImage', function(req, res) {
    let words = req.query.words;

    // Send info to all connected web clients
    io.emit('failedToRecognizeImage', JSON.parse(words));

    res.contentType("text/plain");
    res.send('OK');
});

app.get('/imageSuccessfullyRecognized', function(req, res) {
    let words = req.query.words;
    
    // Send info to all connected web clients
    io.emit('imageSuccessfullyRecognized', JSON.parse(words));

    res.contentType("text/plain");
    res.send('OK');
});

app.get('/score', function(req, res) {
    let inc = req.query.inc;
    let dec = req.query.dec;
    let set = req.query.set;
    
    let obj = {};
    if (inc != undefined)
        obj.inc = parseInt(inc);
    else if (dec != undefined)
        obj.dec = parseInt(dec);
    else if (set != undefined)
        obj.set = parseInt(set);

    // Send info to all connected web clients
    io.emit('score', obj);

    res.contentType("text/plain");
    res.send('OK');
});

http.listen(port, () => console.log(`Web app listening on port ${port}!`));
