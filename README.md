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

Edit config.js to set the connection details and runtime options.