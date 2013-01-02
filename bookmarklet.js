
;var mangaReader = function(args){
"use strict";

var DEFAULT_ARGS = {
    'debug': false,
    'viewport-plugin-url': 'https://raw.github.com/sametmax/manga-reader.js/master/jquery.viewport.mini.js',
    'jquery-url': 'http://code.jquery.com/jquery-1.8.3.min.js',
    'loading-gif-url': 'https://raw.github.com/sametmax/manga-reader.js/master/loading.gif',
    'scroll-limit': 0.4,
    'min-image-number': 5,
};

args = args || {};
for (var key in DEFAULT_ARGS) {
    if (!(key in args)) {
        args[key] = DEFAULT_ARGS[key];
    }
}

var DEBUG = args['debug'];
var log = DEBUG && console ? console.log : function(){};
var startUrl = window.location.href;

log('############# RESTART #############')

/* Check that local storage is available */
var msg = 'Your browser is too old to use this script. Update to the last version of Firefox or Chromium.';
if (!localStorage) {
    alert(msg);
    window.location.reload()
}

/* Check that the full screen API is available */
var doc = document.documentElement;

if (!(('requestFullscreen' in doc) ||
      ('mozRequestFullScreen' in doc && document.mozFullScreenEnabled) ||
      ('webkitRequestFullScreen' in doc))) {
     alert(msg);
     window.location.reload()
}

var startReader = function($) {

log('BM is started with jquery version', $().jquery)

/* Display a very visible non modal message to the user*/
var displayAlert = function(message, color) {
    log('Display alert:', message)
    $('#bm-alert').fadeOut();
    var color = color || 'red';
    var messageBox = $('<div id="bm-alert" style="z-index:9999999; background:' + color + '; color:white; font-size:1.5em; text-align:center; padding:10px; position:fixed; bottom:auto; top:0; width:100%">' + message + '</div>');
    $(messageBox).prependTo('body').fadeIn();
}

displayAlert('Please wait...');

log('Load view jQuery viewport plugin and wait for DOM ready')

$.getScript(args['viewport-plugin-url'] + '?' + (new Date).getTime(), function(){ $(function(){

log('jQuery viewport plugin and DOM loaded. Starting init.')


/* Save the current location and return to it the next time we visit the page */
var manga = $('title').text().split('-')[0].replace(/\d/g, '');
if (!localStorage[manga]) {
    localStorage[manga] = window.location.href;
}


/* Create the references and containers for all the images and pages */
var $canvas = $('<div style="width:100%; overflow:auto; text-align:center;"></div>'),
    image_stack = [],
    next_page = localStorage[manga],
    current_image,
    loaded = {};

/* Is the canvas scroll bar level under the minimal limit ? */
var isScrollLimitReached = function($canvas) {
    var scrollLevel = ($canvas.prop('scrollHeight') - $canvas.scrollTop());
    var min = ($canvas.prop('scrollHeight') * args['scroll-limit']);

    log('Scrolling state is', $canvas.prop('scrollHeight'), $canvas.scrollTop());
    log('Level / Min', scrollLevel, min);

    return scrollLevel < min;
};

var parseUrl = (function(){

    var div = document.createElement('div');
    div.innerHTML = "<a></a>";

    return function(url){
      div.firstChild.href = url;
      div.innerHTML = div.innerHTML;
      return div.firstChild;
    };

})();


/* Extract the biggest image in one HTML
   (which is the one we want to read) */
var findBiggestImage = function(html){

    log('Looking for biggest image in given HTML')

    var $biggest_image,
        biggest_image_size = 0;

    $.each($('img', html), function(i, img){
        var $img = $(img);

        log('Examining image', img, $img.width(), $img.height());

        var size = $img.width() + $img.height();
        if (size > biggest_image_size) {
            if ($img.parents('a').prop('href')) {
                $biggest_image = $img;
            }
        }
    });

    return $biggest_image;

};

/*
    Download the next image and add it to the image stack. If the stack
    is full, remove the oldest one.
*/
var downloadNextImage = function(url, retry, $loading_gif) {


    if (retry) {
       log('[Retry] Download next image from', url, 'and get next link');
    } else {
        log('Download next image from', url, 'and get next link');
    }

    if (!(url in loaded) && !retry) {

        if (parseUrl(url).host != window.location.host){
            alert('This site may be inserting ads ad places that prevent this script from working')
        }

        if (!$loading_gif) {
            $loading_gif = $("<img src='" + args['loading-gif-url'] + "' />")
            $canvas.append($loading_gif.css({'margin': '50px auto',
                                             'display': 'block'}));
        }

        loaded[url] = false;

        log('Send GET request to URL')
        $.get(url).success(function(data, textStatus, jqXHR){

            log('Get request to', url, 'succeded')
            loaded[url] = true;

            var $image = findBiggestImage(data);
            log('Attaching url to image:', url);
            $image.attr('class', url);
            var link = $image.parents('a').prop('href');

            /* If the link is not an HTTP link, then use an alternative mean of getting the URL */
            if (link.indexOf('http') === -1) {

                log('URL ', url, 'is not an HTTP address. Falling back to iframe.')

                setTimeout(function(){

                    log('Creating iframe')

                    var $iframe = $('<iframe></iframe>').css({
                                    'width':'1px', 'height':'1px',
                                    'position': 'absolute', 'top': '-2'
                                    }).appendTo('body');

                    var iframe = $iframe[0];

                    $iframe.one('load', function(){

                        log('Iframe from', url, 'has loaded')

                        setTimeout(function(){

                            log('Clicking on link')

                            $iframe.one('load', function(){
                                link = iframe.contentWindow.location.href;
                                addImageAndLink($image, link, $loading_gif);
                                $iframe.remove()
                                log('Link extracted from iframe is', link)
                            });

                            var $html = $(iframe.contentWindow.document || iframe.contentDocument);
                            findBiggestImage($html).parents('a').click();

                        }, 200);

                    });
                    iframe.contentWindow.location.href = window.location.href;

                }, 200);


            } else {
                addImageAndLink($image, link, $loading_gif);
            }



        }).error(function(xhr, textStatus, errorThrown){
            log('GET request to', url, 'failed')
            setTimeout(function() {
                downloadNextImage(url, true, $loading_gif);
            }, 2000);
        });
    } else {
        log('Url is already been downloaded. Abort');
    }

}


var addImageAndLink = function($image, link, $loading_gif) {

        log('Append image', $image, ' and link', link)

        next_page = link;

        $image.load(function(){
            var width = $image.width() >  $image.height() ? '100%' : '75%';
            $image.css({'margin': "auto", 'width': width, 'display': 'block'})
        });


        if (!$loading_gif){
            $canvas.append($image);
        } else {
            log('Replacing loading gif')
            $loading_gif.replaceWith($image);
        }

        var $images = $('img');

        if (isScrollLimitReached($canvas) || $images.length < args['min-image-number']) {
            log('Recursive call to add another image because of scrolling state')
            downloadNextImage(next_page)
        }

}


/* Extract the main image and next page link in the current page */
var $biggest_image = findBiggestImage($('html'));

if (!$biggest_image || !$biggest_image.parents('a').prop('href')){
    alert('This site is not compatible with this script')
    window.location.reload();

}


/* Prompt for a user action to trigger fullscreen */
displayAlert('Click on the biggest picture on the screen to activate the manga reader', 'green');



$biggest_image.one('click', function(e){

    e.preventDefault();
    e.stopPropagation();

    /* Request full screen.*/
    $canvas.css('overflow', "auto");
    if ($canvas[0].requestFullscreen) {
        $canvas[0].requestFullscreen();
    } else if ($canvas[0].mozRequestFullScreen) {
        $canvas[0].mozRequestFullScreen();
    } else if ($canvas.webkitRequestFullScreen) {
        $canvas[0].webkitRequestFullScreen();
    }

    /* Remove the clutter and put only the canvas*/
    $('body *').remove();

    $('html *').css('background', 'black');

    /* Adding escape buttons and link following iframe*/
    $('<p><a href="#" id="quit">QUIT</a> | <a href="#" id="reset">Reset</a></p>')
      .css({'position': 'fixed', 'top': 0, 'border': '1px solid black',
           'background': 'grey', 'padding': '3px'})
      .appendTo($canvas)
      .find('a').css('color', 'white');

    $('#quit').live('click', function(e){
        e.preventDefault();
        window.location.href = localStorage[manga];
    });

    $('#reset').live('click', function(e){
        e.preventDefault();
        if (confirm('Are you sure ? You will loose your bookmarks for ' + manga)) {
            localStorage[manga] = "";
            window.location.href = startUrl;
        }
    });


    $('body').append($canvas);


    /* start downloading the images and reacting to scroll */
    downloadNextImage(next_page);

    setTimeout(function(){
        $canvas.scrollTop(0);
    }, 1000)

    $canvas.scroll(function(e){

        /* We use jQUery here because the viewport plugin may have attached
            to another jQuery inside the page.
        */
        var url = jQuery('img:in-viewport').first().attr('class');

        log('In viewport', url)

        if (url.indexOf('http') > -1) {
            localStorage[manga] = url;
        }


        if (!(next_page in loaded)) {

            console.log('reload');

            if (isScrollLimitReached($canvas)) {
                setTimeout(function(){downloadNextImage(next_page);}, 2000)
            }
        }

    });

    $(document).on("fullscreenchange mozfullscreenchange webkitfullscreenchange", function(){
        log('Fullscreenchange. Status:', !!(document.fullscreen || document.mozFullScreen || document.webkitIsFullScreen));
        if (!(document.fullscreen || document.mozFullScreen || document.webkitIsFullScreen || false)){
            if (!DEBUG) {
                window.location.href = localStorage[manga];
                log('Switching back to', localStorage[manga]);
            }

        }
    });

})


})})};


/* Loading jquery and making sure we don't enter in conflict with
another js lib or another jquery */
var oldJquery;

if (typeof jQuery !== "undefined") {
    log('jQuery is present. Setting noConflict() on', jQuery().jquery)
    oldJquery = jQuery.noConflict(true);
} else {
    oldJquery= false;
}

log('Starting to load jQuery')
var head = document.getElementsByTagName('head')[0];
var script = document.createElement('script');
script.type = 'text/javascript';
script.src = args['jquery-url'] + '?' + (new Date().getTime());
script.onreadystatechange = function() {
    log('jQuery is loaded. Starting BM with', $().jquery)
    startReader(jQuery.noConflict(true))
    if (oldJquery){
        log('Restore old jQuery reference')
        jQuery = oldJquery;
        $ = jQuery;
    }

};
script.onload = script.onreadystatechange
head.appendChild(script);

};

