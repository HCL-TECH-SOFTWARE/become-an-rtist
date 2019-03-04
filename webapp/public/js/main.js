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
    const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];    

    function showPopup(html) {   
        hidePopup(); // In case the popup is already shown.       
        $('#thePopup').append($(html));  
        $('#thePopup').addClass('show');       
    }

    function hidePopup() {
        $('#thePopup').empty();   
        $('#thePopup').removeClass('show');        
    }

    function updateCards(msg) {
        // Set the guessed words on the "backside" of the flip cards
        let index = 0;
        for (var key in msg) {
            if (msg.hasOwnProperty(key) && key != "timeSpent") {
                index++;
                let card = $('#recog-word-' + index);                
                card.find('h1').text(key);                
                let f = parseFloat(msg[key]) * 100;
                card.find('p').text(f.toFixed(2));  
                
                if (currentWord == key)
                    card.addClass('correct');
            }            
        }

        // Then flip the cards
        $('.flip-card').addClass('flipped');
    }

    function showImage(path, frame) {
        $('#hiscore_table').hide();
        let separator = path.startsWith('/word-image') ? '&' : '?';
        //$('#drawing').attr('src', path + separator + new Date().getTime()); // Force browser to refresh image
        $('#drawing').remove();
        $('#drawing-container').append('<img id="drawing" src="' + path + separator + new Date().getTime() + '"/>');
        if (frame)
            $('#drawing').addClass('thick-frame');
        else
            $('#drawing').removeClass('thick-frame');
        $('#drawing').show();
    }    

    socket.on('readyForNewGame', function(msg) {                     
        $('#main-button').data('state', 'start');
        updateMainButton();
        $('#hiscorePrompt').hide();
        $('#drawing').hide();        

        // Show hiscores in table
        $('#hiscore_table').find('.hiscore_row').remove();
        let imgHeight = ($(window).height() - 380) / 7; // Approx vertical fit on common screen sizes        
        let scoreCount = 0;
        for (h of msg.hiscores) {
            let year = h.photo.substring(8,12);
            let month = monthNames[parseInt(h.photo.substring(12,14)) - 1];
            let day = h.photo.substring(14,16);
            let hour = h.photo.substring(17,19);
            let min = h.photo.substring(19,21);

            let scoreClass = '';
            if (scoreCount == 0)
                scoreClass = 'gold-score';
            else if (scoreCount == 1)
                scoreClass = 'silver-score';
            else if (scoreCount == 2)
                scoreClass = 'bronze-score';
            $('#hiscore_table').append('<tr class="hiscore_row"><td><img style="height:' + imgHeight + 'px;width:' + imgHeight + 'px" src="/uploadedImages/' + h.photo + '"/></td><td class="' + scoreClass + '">' + h.score + '</td><td>' + day + ' ' + month + ' ' + year + ' ' + hour + ':' + min + '</td></tr>');

            scoreCount++;

            if (scoreCount == 5)
                break; // Only show top 5 scores
        }
        // If we don't have 5 hiscores, fill out the list with placeholders
        for (let i = scoreCount; i < 5; i++) {
            $('#hiscore_table').append('<tr class="hiscore_row"><td><img style="height:' + imgHeight + 'px;width:' + imgHeight + 'px" src="/images/empty-score.jpg"/></td><td>N/A</td><td>N/A</td></tr>');
        }
        $('#hiscore_table').show();
    });  
    socket.on('newWord', function(msg) {
        currentWord = msg.word;              
        showPopup('<span>Draw this: <strong>' + msg.word + '</strong></span>');                
        $('#main-button').data('state', 'drawing');
        updateMainButton();
    });   
    socket.on('remainingTime', function(msg) {
        // Show a sample image of the current word and the remaining time 
        let index = Math.floor(Math.random() * Math.floor(2000));
        showImage('/word-image?word=' + currentWord + '&index=' + index, false);        
        $('#timer').show().text(msg.time);             
    });    
    socket.on('imageUploaded', function(msg) {
        $('#hiscorePrompt').hide();
        // Show the uploaded image in a thick frame 
        showImage(msg.path, true);               
    }); 
    socket.on('gameOver', function(msg) {    
        new Audio('/audio/game-over.mp3').play();    
        hidePopup();
        showImage('/images/game-over.png', false);        
        $('#main-button').data('state', 'start');
        updateMainButton();  
        
        $('#timer').hide();
    });  
    socket.on('newHighscore', function(msg) {            
        hidePopup();

        new Audio('/audio/hiscore.mp3').play(); 
        $('#hiscorePrompt').show();
        $('#main-button').data('state', 'upload-hiscore');
        updateMainButton();        
    });  
    socket.on('startImageAnalysis', function(msg) {    
        // Disable button while image recognition runs
        $('#main-button').data('state', 'disabled');
        updateMainButton();        
    });  
    socket.on('failedToRecognizeImage', function(msg) {
        updateCards(msg);        
        
        new Audio('/audio/fail-buzzer.mp3').play();  
        $('#failedPopup').show();        
        setTimeout(function () {            
            $('.flip-card').removeClass('flipped');
            $('#failedPopup').hide();        
        }, 3000);
        $('#main-button').data('state', 'drawing');
        updateMainButton();
    });  
    socket.on('imageSuccessfullyRecognized', function(msg) {       
        updateCards(msg);    

        setTimeout(function () {
            $('.flip-card').removeClass('flipped');     
            $('.correct').removeClass('correct')
        }, 3000);
        $('#main-button').data('state', 'drawing');
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
            // State of main button is changed in callbacks from RTist app so that it
            // also works in case the physical push button is used
            $.get('/start_game', function () {

            });
        }
        else if ($('#main-button').data('state') == 'drawing') {            
            $.get('/done_drawing', function () {

            });
        }
        else if ($('#main-button').data('state') == 'upload-hiscore') {            
            $.get('/hiscore_photo_ready', function () {

            });
        }    
    });    

    var scoreText = SVG('score-container').text("0").attr({'x': 100, 'y':12, 'font-size' : '28px', 'fill' : 'green'});

    function increaseScore(increment) {
        new Audio('/audio/tada.mp3').play();        
        scoreText.animate({ ease: '<>', duration: '0.5s' }).attr({'font-size': '48px'});        
        scoreText.text((parseInt(scoreText.text(), 10) + increment).toString());
        scoreText.animate({ ease: '<>', duration: '0.5s' }).attr({'font-size': '28px'});
    }    
    function decreaseScore(decrement) {               
        scoreText.animate({ ease: '<>', duration: '0.5s' }).attr({'font-size': '12px'});        
        scoreText.text((parseInt(scoreText.text(), 10) - decrement).toString());
        scoreText.animate({ ease: '<>', duration: '0.5s' }).attr({'font-size': '28px'});
    }
    function setScore(newScore) {        
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
        else if ($('#main-button').data('state') == 'upload-hiscore') {
            $('#main-button').text('UPLOAD HISCORE');
        }
    }

    $('#test-button').click(function() {
        $.get('/readyForNewGame');
        //$('#failedPopup').show();

        /*
        new Audio('/audio/hiscore.mp3').play();    
        $('#drawing').attr('src', '/images/game-over.png');
        hidePopup();
        $('#hiscorePrompt').show();
        $('#main-button').data('state', 'upload-hiscore');
        updateMainButton();        
        */
        //$('.flip-card').addClass('flipped');
        //increaseScore(4);

        /*
        let index = Math.floor(Math.random() * Math.floor(2000));
        $('#drawing').attr('src', '/word-image?word=' + currentWord + '&index=' + index);
        $('#timer').show().text(index);*/

        //$('#drawing').attr('src', '/images/game-over.png');
        //new Audio('/audio/game-over.mp3').play();       
        /*
        if ($('#thePopup').hasClass('show')) 
            hidePopup();
        else
            showPopup('<span>Draw a <strong>house</strong></span>');        
*/
        //$('#drawing').attr('src', '/word-image?word=' + 'lightning' + '&index=' + 880);
    });

    /*
    let tooltip = $('#drawing').tooltipster({
        theme: 'tooltipster-light',
        content: $('#tooltip_content'),
        animation: 'fall'
    });*/         

    updateMainButton();

    function resize_drawing() { // set body height = window height
        let imgHeight = $(window).height() - 350;
        //let imgWidth = imgHeight - 100;
        $('#drawing').height(imgHeight);
        $('#drawing').width(imgHeight);
    }

    $(window).bind('resize', resize_drawing);  
    resize_drawing();
});