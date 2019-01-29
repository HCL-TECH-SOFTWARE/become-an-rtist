/*******************************************************************************
 * (c) Copyright HCL Technologies Ltd. 2019.  MIT Licensed!
 *******************************************************************************/

/**
 * Client application entry point
 * @author Mattias Mohlin
 */

$(function () {
    var socket = io();    

    socket.on('word', function(msg) {
        $('#word-label').text('Draw a ' + msg.word);        
    });        

    $('#start-button').click(function() {
        $.get('/start_game', function () {

        });
    });
});