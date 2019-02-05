/*******************************************************************************
 * (c) Copyright HCL Technologies Ltd. 2019.  MIT Licensed!
 *******************************************************************************/

/**
 * Client application entry point
 * @author Mattias Mohlin
 */

$(function () {
    var socket = io();    

    socket.on('newWord', function(msg) {
        $('#word-label').text('Draw a ' + msg.word);        
    });   
    socket.on('remainingTime', function(msg) {
        $('#timer').show();
        $('#timer').text(msg.time);        
    });     
    socket.on('gameOver', function(msg) {        
        $('#timer').text('GAME OVER! (score = ' + msg.score + ')');
    });  
    socket.on('failedToRecognizeImage', function(msg) {        
        $('#popup').show().text('Failed to recognize the drawing. Try again!');
        setTimeout(function () {
            $('#popup').hide();
        }, 2000);
    });  
    
    $('#start-button').click(function() {
        $.get('/start_game', function () {

        });
    });

    $('#done-drawing-button').click(function() {
        $.get('/done_drawing', function () {

        });
    });
});