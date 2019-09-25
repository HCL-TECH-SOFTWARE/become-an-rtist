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
var http = require('http');
var socketio = require('socket.io');
var fs = require('fs');
var busboy = require('connect-busboy');
var nconf = require('nconf');
var CONFIG_FILE = 'appconfig.json';

var path = require('path');

const port = 5000;
const env = process.env.NODE_ENV || 'development';
var io = null;

function ensureExists(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdir(dir, () => {console.log("Dir created: " + dir)});
    }
}

nconf.argv().env().file({ file: CONFIG_FILE });


const data_dir = __dirname + '/data';
ensureExists(data_dir);

// Initialize highscore list
const highscoreFile = data_dir + '/highscores.json';
var highscores = [];
const allGamesFile = data_dir + '/allGames.json';
var allGames = [];
if (fs.existsSync(highscoreFile)) {
    var highscores = JSON.parse(fs.readFileSync(highscoreFile));
}
else {
    console.log('No highscores found! Creating new highscore file at ' + highscoreFile);
    fs.writeFileSync(highscoreFile, JSON.stringify(highscores));
}
if (fs.existsSync(allGamesFile)) {
    var allGames = JSON.parse(fs.readFileSync(allGamesFile));
}
else {
    console.log('Creating new allGames file at ' + allGamesFile);
    fs.writeFileSync(allGamesFile, JSON.stringify(allGames));
}

if (!fs.existsSync(nconf.get("sample_images_dir"))) {
    console.error("Could not find sample images dir: " + nconf.get("sample_images_dir"));
    console.error("Set 'sample_imaged_dir' property in " + CONFIG_FILE);
}

// Static middleware for serving static files 
app.get('/', function(req, res) {
    res.contentType("text/html");
    res.sendFile(__dirname + '/public/html/main.html');
});
app.use('/css', express.static(__dirname + '/public/css'));
app.use('/audio', express.static(__dirname + '/public/audio'));
app.use('/js', express.static(__dirname + '/public/js'));
app.use('/images', express.static(__dirname + '/public/images'));
const uploadedImagesDir = __dirname + '/public/uploadedImages';
ensureExists(uploadedImagesDir);
app.use('/uploadedImages', express.static(uploadedImagesDir));

// Special routes for modules that are installed
app.get('/socket.io', function(req, res) {
    res.contentType("text/javascript");
    res.sendFile(__dirname + '/node_modules/socket.io-client/dist/socket.io.js');
});
app.get('/svg.js', function(req, res) {
    res.contentType("text/javascript");
    res.sendFile(__dirname + '/node_modules/svg.js/dist/svg.min.js');
});

// File upload support
app.use(busboy());

app.route('/uploadImage').post( function(req, res) {
    let score = req.query.score;       

    var fstream;
    req.pipe(req.busboy.on('file', function (fieldname, file, filename) {        
        console.log('Uploading: ' + filename);
        fstream = fs.createWriteStream(__dirname + '/public/uploadedImages/' + filename);
        file.pipe(fstream);
        fstream.on('close', function () {
            console.log('Finished uploading ' + filename);   
            io.emit('imageUploaded', {'path' : '/uploadedImages/' + filename});         
            res.redirect('back');
        })

        if (score != undefined) {
            // A hiscore photo was uploaded. Update the hiscore data for the new hiscore.
            highscores.push({'score' : parseInt(score), 'photo' : filename});
            highscores.sort((a,b) => (a.score > b.score) ? -1 : ((b.score > a.score) ? 1 : 0));
            fs.writeFileSync(highscoreFile, JSON.stringify(highscores));
        }
    }))
});

// Application routes
app.get('/word-image', function(req, res) {
    let word = req.query.word;
    let index = parseInt(req.query.index);
    let img_dir = path.join(
        nconf.get("sample_images_dir"),
        'all_images',
        word);
    if (!fs.existsSync(img_dir)) {
        console.error("Could not open images dir: " + img_dir);
        res.send(404);
        return;
    }

    res.contentType("image/jpeg");
    let filename = '';  
    let iterations = 0;  

    do {
        filename = path.join(img_dir,
            index + '.jpg');
        index++;
        if (index > 2200) {
            // start from the begining
            index = 0;
        }
        iterations++;
        if (iterations > 2200) {
            console.error("Could not find picture for " + word + " starting form " + req.query.index);
            res.send(404);
            return;
        }
            
    } while (!fs.existsSync(filename));    
    
    res.sendFile(filename);
});

var rtAppCallback = null;

// Messages from web application to RT application 
app.get('/start_game', function(req, res) {
    if (!rtAppCallback) {
        console.log('RT application not running!');
        res.status(500);
        res.end();
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

app.get('/hiscore_photo_ready', function(req, res) {
    if (!rtAppCallback) {
        console.log('RT application not running!');
        return;
    }

    rtAppCallback('hiscore_photo_ready');    
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
app.get('/readyForNewGame', function(req, res) {    
    // Send info to all connected web clients
    io.emit('readyForNewGame', {'hiscores' : highscores});

    res.contentType("text/plain");
    res.send('OK');
});

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

    // Delayed response with 3 seconds so the UI can play sound and show Game Over image.
    setTimeout(function () {
        // Return the lowest highscore among the top 5 so the game app can decide if the player 
        // made it to the highsscore list
        let lowestScore = 0;
        if (highscores.length >= 5) {
            lowestScore = highscores[4].score;
        }
        res.contentType("text/plain");
        res.send(lowestScore.toString());
    }, 3000);

    let today = new Date();
    let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    let dateTime = date+' '+time;
    allGames.push({'playDate' : dateTime});
    fs.writeFileSync(allGamesFile, JSON.stringify(allGames));
});

app.get('/newHighscore', function(req, res) {
    // Send info to all connected web clients
    io.emit('newHighscore', {});

    res.contentType("text/plain");
    res.send('OK');
});

app.get('/startImageAnalysis', function(req, res) {
    // Send info to all connected web clients
    io.emit('startImageAnalysis', {});

    res.contentType("text/plain");
    res.send('OK');
});

function parseJSON(json) {
    try {
        return JSON.parse(json);
    } catch(e) {
        console.log('JSON parse error: ' + e);
        console.log('JSON: ' + json);
    }
}

app.get('/failedToRecognizeImage', function(req, res) {
    let words = req.query.words;

    // Send info to all connected web clients
    io.emit('failedToRecognizeImage', parseJSON(words));

    res.contentType("text/plain");
    res.send('OK');
});

app.get('/imageSuccessfullyRecognized', function(req, res) {
    let words = req.query.words;
    
    // Send info to all connected web clients
    io.emit('imageSuccessfullyRecognized', parseJSON(words));

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

app.server = http.createServer(app);
app.server.setTimeout(0); // Disable timeout of requests since we use long-running requests (/command)
app.server.listen(port, function () {
    console.log(`Web app listening on port ${port}!`);
    io = socketio.listen(app.server); 
/*
    io.on('connect', (socket) => {
        io.emit('readyForNewGame', {'hiscores' : highscores});
    });*/
});
//http.listen(port, () => console.log(`Web app listening on port ${port}!`));
