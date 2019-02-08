/*******************************************************************************
 * (c) Copyright HCL Technologies Ltd. 2019.  MIT Licensed!
 *******************************************************************************/

/**
 * Client application entry point
 * @author Mattias Mohlin
 */

$(function () {
    var socket = io();   
    var currentWord = 'The Eiffel Tower';

    socket.on('newWord', function(msg) {
        currentWord = msg.word;        
        $('#tooltip_content > strong').text(msg.word);
        $('#drawing').tooltipster('open');
    });   
    socket.on('remainingTime', function(msg) {
        // Show a sample image of the current word and the remaining time 
        let index = Math.floor(Math.random() * Math.floor(2000));
        $('#drawing').attr('src', '/word-image?word=' + currentWord + '&index=' + index);
        $('#timer').show().text(msg.time);
        //$('#timer').show();
        //$('#timer').text(msg.time);        
    });     
    socket.on('gameOver', function(msg) {        
        $('#drawing').attr('src', '/images/game-over.png');        
    });  
    socket.on('failedToRecognizeImage', function(msg) {        
        $('#popup').show().text('Failed to recognize the drawing. Try again!');
        setTimeout(function () {
            $('#popup').hide();
        }, 2000);
    });  
    socket.on('imageSuccessfullyRecognized', function(msg) {        
        $('#popup').show().text('You guessed correctly ' + msg.currentWord);
        setTimeout(function () {
            $('#popup').hide();
        }, 2000);
    });
    socket.on('score', function(msg) {
        if (msg.hasOwnProperty('inc'))
            increaseScore(msg.inc);
        else if (msg.hasOwnProperty('dec'))
            decreaseScore(msg.dec);
        else if (msg.hasOwnProperty('set'))
            setScore(msg.set);
    });
    
    $('#main-button').click(function() {
        if ($('#main-button').data('state') == 'start') {
            $('#main-button').data('state', 'drawing');
            $('#main-button').text('DRAWING READY');
            $.get('/start_game', function () {

            });
        }
        else if ($('#main-button').data('state') == 'drawing') {
            $('#main-button').data('state', 'disabled');
            $('#main-button').text('PLEASE WAIT');
            $.get('/done_drawing', function () {

            });
        }
    });    

    var scoreText = SVG('score-container').text("0").attr({'x': 100, 'y':-7, 'font-size' : '28px', 'fill' : 'green'});

    function increaseScore(increment) {
        new Audio('/audio/tada.mp3').play();        
        scoreText.animate({ ease: '<>', duration: '0.5s' }).attr({'font-size': '48px'});        
        scoreText.text((parseInt(scoreText.text(), 10) + increment).toString());
        scoreText.animate({ ease: '<>', duration: '0.5s' }).attr({'font-size': '28px'});
    }    
    function decreaseScore(decrement) {
        //new Audio('/audio/tada').play();        
        scoreText.animate({ ease: '<>', duration: '0.5s' }).attr({'font-size': '12px'});        
        scoreText.text((parseInt(scoreText.text(), 10) - decrement).toString());
        scoreText.animate({ ease: '<>', duration: '0.5s' }).attr({'font-size': '28px'});
    }
    function setScore(newScore) {
        //new Audio('/audio/tada').play();        
        scoreText.text(newScore.toString());
    }

    $('#test-button').click(function() {
        //increaseScore(4);

        /*
        let index = Math.floor(Math.random() * Math.floor(2000));
        $('#drawing').attr('src', '/word-image?word=' + currentWord + '&index=' + index);
        $('#timer').show().text(index);*/

        $('#drawing').attr('src', '/images/game-over.png');
        new Audio('/audio/game-over.mp3').play();        
    });

    let tooltip = $('#drawing').tooltipster({
        theme: 'tooltipster-light',
        content: $('#tooltip_content'),
        animation: 'fall'
    });     
    tooltip.tooltipster('open');
});