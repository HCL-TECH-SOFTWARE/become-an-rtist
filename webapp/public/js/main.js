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

    function showPopup(html) {   
        hidePopup(); // In case the popup is already shown.       
        $('#thePopup').append($(html));  
        $('#thePopup').addClass('show');       
    }

    function hidePopup() {
        $('#thePopup').empty();   
        $('#thePopup').removeClass('show');        
    }

    socket.on('newWord', function(msg) {
        currentWord = msg.word;              
        showPopup('<span>Draw this: <strong>' + msg.word + '</strong></span>');                
        $('#main-button').data('state', 'drawing');
        updateMainButton();
    });   
    socket.on('remainingTime', function(msg) {
        // Show a sample image of the current word and the remaining time 
        let index = Math.floor(Math.random() * Math.floor(2000));
        $('#drawing').attr('src', '/word-image?word=' + currentWord + '&index=' + index);
        $('#timer').show().text(msg.time);             
    });     
    socket.on('gameOver', function(msg) {    
        new Audio('/audio/game-over.mp3').play();    
        hidePopup();
        $('#drawing').attr('src', '/images/game-over.png');
        $('#main-button').data('state', 'start');
        updateMainButton();  
    });  
    socket.on('failedToRecognizeImage', function(msg) {        
        showPopup('<span>Failed to recognize the drawing. Try again!</span>');        
        setTimeout(function () {
            showPopup('<span>Draw this: <strong>' + currentWord + '</strong></span>');  
        }, 2000);
        $('#main-button').data('state', 'drawing');
        updateMainButton();
    });  
    socket.on('imageSuccessfullyRecognized', function(msg) {        
        showPopup('<span>Well done! Try another one!</span>');        
        setTimeout(function () {
            hidePopup();
        }, 2000);
        $('#main-button').data('state', 'start');
        updateMainButton();
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
            updateMainButton();
            $.get('/start_game', function () {

            });
        }
        else if ($('#main-button').data('state') == 'drawing') {
            $('#main-button').data('state', 'disabled');
            updateMainButton();
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

    // Update text and enablement of main button according to its current state
    function updateMainButton() {
        if ($('#main-button').data('state') == 'start') {
            $('#main-button').text('START NEW GAME');
        }
        else if ($('#main-button').data('state') == 'drawing') {
            $('#main-button').text('DRAWING READY');
        }
        else if ($('#main-button').data('state') == 'disabled') {
            $('#main-button').text('PLEASE WAIT');
        }
    }

    $('#test-button').click(function() {
        //increaseScore(4);

        /*
        let index = Math.floor(Math.random() * Math.floor(2000));
        $('#drawing').attr('src', '/word-image?word=' + currentWord + '&index=' + index);
        $('#timer').show().text(index);*/

        //$('#drawing').attr('src', '/images/game-over.png');
        //new Audio('/audio/game-over.mp3').play();       
        
        /*if ($('#thePopup').hasClass('show')) 
            hidePopup();
        else
            showPopup('<span>Draw a <strong>house</strong></span>');        */

        $('#drawing').attr('src', '/word-image?word=' + 'lightning' + '&index=' + 880);
    });

    /*
    let tooltip = $('#drawing').tooltipster({
        theme: 'tooltipster-light',
        content: $('#tooltip_content'),
        animation: 'fall'
    });*/         

    updateMainButton();
});