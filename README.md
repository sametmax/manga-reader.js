manga-reader.js
===============

A bookmarklet that ease Manga reading on sites like mangareader.net, mangafox.me, mangahere.com, etc.

It will putthe browser in full screen, remove all the rest of the site but the images, and download the next pages as you scroll so you can spend hours just reading without reloading the page.

To use it, create a new bookmark in your browser (Chrome, Firefox, Safari...) and in the URL address field, copy / paste this:

```
javascript:(function(){(function(url,callback){var%20head=document.getElementsByTagName('head')[0];var%20script=document.createElement('script');script.type='text/javascript';script.src=url+'%3F'+(new%20Date().getTime());script.onreadystatechange=callback%20||%20function(){};script.onload=script.onreadystatechange;head.appendChild(script);})('http://127.0.0.1:8000/scratchpad.js', function()(mangaReader()))})();
```

Now, go to the manga hosting web site, click on a manga you wish to read, and click on the bookmark.

Wait a bit (it should say it's loading), then when you see a green message telling you to click on the biggest image on the page, click on the image that is tha scan of the manga you are currently reading.

The manga will switch to reader view, and you can now enjoy a confy reading.

To quit, just click on the "QUIT" link on the rigth top corner.

The bookmarklet will save you position in the manga. When you'll go back, it will take you to the page you were. You can cancel that by clicking on the "RESET" link.

Disclaimer
===========

This this over beta-alpha-buggy-dirty software, so it will crash. It will have bugs.

Because it aims manga readers, it will bring complains from non techy-life-leecher type of persons, and I don't want to deal with those. So exceptionnally, I will not answer to bug report or support requests for this script, unless you have a technical profile and can give me technical informations.

Oh, I haven't decide which licence put this under. If it's a concern to you, open an issue and I'll choose one.