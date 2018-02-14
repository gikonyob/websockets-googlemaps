# Real-time Tracking with WebSockets and GoogleMaps

<img align="center" src="https://github.com/GikonyoBrian/websockets-googlemaps/raw/master/icon.png" alt ="Websockets and Google Maps" width="300" height="300">

This is a demo project demonstrating the use of WebSockets
and GoogleMaps to perform real-time tracking of clients.

## Installation

You will make sure you have php and composer installed and that the sqlite extension for php is installed and enabled in php.ini, then run the following commands;

````
	git clone https://github.com/GikonyoBrian/websockets-googlemaps.git
	cd ./websockets-googlemaps/server
	composer install
````

## Configuration and Running
You will need to get a [Google Maps API](https://developers.google.com/maps/) key and then enable the Google Maps Javascript API.
Then go to line 138 of ./client/webmap.js and replace API_KEY with the key you get.

```
$.getScript("https://maps.googleapis.com/maps/api/js?key=API_KEY&callback=initMap", function() {
```

Finally, run the following commands to start the websocket server;

````
	cd ./server
	php bin/track-server.php
````
    
Then run the following commands to start the http server;

````
	cd ./client
	sudo php -S localhost:80
````

Launch different browsers and go to [http://localhost/websocket-googlemaps.html](http://localhost/websocket-googlemaps.html) and register and login as different users.
