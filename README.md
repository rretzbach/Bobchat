Bobchat
=======

web based irc client with node js backend

![](https://raw.github.com/rretzbach/BobChat/master/screenshot.png)

Setup
=====

    npm install socket.io
    npm install irc
	node bobchat.js
	
or optionally

	npm install supervisor -g
	supervisor -- bobchat.js mock

Configuration
=============

1. Edit the IP address in index.html

    var socket = io.connect('http://192.168.1.29');
    
2. Edit the connection details in bobchat.js

    var client = new irc.Client(...