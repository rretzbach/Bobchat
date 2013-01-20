// helper
function padStr(i) {
    return (i < 10) ? "0" + i : "" + i;
}

function getTime() {
	var now = new Date();
	var timestamp = padStr(now.getHours()) + ':' +
			  padStr(now.getMinutes()) + ':' +
			  padStr(now.getSeconds());
	return timestamp;
}

// websocket
function serve(req, res){
var url = req.url;
  if (url == "/") {
    url = "/index.html";
  }
  fs.readFile(__dirname + url,
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading ' + url);
    }

    res.writeHead(200);
    res.end(data);
  });
};

var app = require('http').createServer(serve);
var io = require('socket.io').listen(app);
var fs = require('fs');

app.listen(8081);

// load config
var config = require('./config');

// mockmode is invoked when "mock" is passed as first argument
if (process.argv[2] ==  'mock') {
	console.log('Mock mode enabled');
	config.autoConnect = false;
	config.keepAlive = false;
	config.showDebugControls = true;
	config.sendMessages = false;
}

// irc
function ClientMessage(name, options) {
	this.name = name;
	this.options = options;
	this.timestamp = new Date();
}

var clientmessages = [];
var names = {};

var irc = require('irc');

var client = new irc.Client(config.network, config.nick, {
    debug: true,
    channels: config.channels,
	autoConnect: config.autoConnect,
	username: config.username,
	realName: config.realName,
	password: config.password,
});

// send a pong every 5min to cause a close connection event if no internet connectivity is available, which will trigger a reconnect
if (config.keepAlive) {
	setInterval(function(){client.send('PONG', 'empty');}, 5*60*1000);
}

client.addListener('error', function(message) {
    console.log('error: ', message);
});

// name is the bobchat event name
function wiretapMessage(name, options, sockets) {
	var msg = new ClientMessage(name, options);

	if (!clientmessages) {
		clientmessages = [];
	}

	clientmessages.push(msg);
	
	if (clientmessages.length >= 2) {
		var before = clientmessages[clientmessages.length-2].timestamp;
		var last = clientmessages[clientmessages.length-1].timestamp;
		if (before.getDay() != last.getDay() || before.getMonth() != last.getDay() || before.getYear() != last.getYear()) {
			var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
			var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
			var timestamp = getTime();
			var weekday = days[timestamp.getDay()];
			var month = months[timestamp.getMonth()];
			var text = 'it is now '+weekday+', '+timestamp.getDate()+' '+month+' '+timestamp.getFullYear();
			wiretapMessage('daychange', {timestamp: timestamp, text: text}, sockets);
		}
	}

	for (var i = 0; i < sockets.length; ++i) {
		var socket = sockets[i];
		socket.emit(msg.name, msg.options);
	}
}

// name is the node-irc event name
function autoRegister(sockets, client, name, callback) {
	client.addListener(name, callback);
}

function registerClientListener(client, sockets) {
	autoRegister(sockets, client, 'registered', function (message) {
	    wiretapMessage('registered', {nick: client.nick}, sockets);
		console.log('Connected to irc server');
	});
	autoRegister(sockets, client, 'names', function (channel, nicks) {
		names[channel] = nicks;
		wiretapMessage('names', { channel: channel, nicks: names[channel] }, sockets);
	});
	autoRegister(sockets, client, 'topic', function (channel, topic, nick, message) {
		wiretapMessage('topic', { channel: channel, topic: topic, nick: nick, message: message }, sockets);
	});
	autoRegister(sockets, client, 'join', function (channel, nick, message) {
		if (!names[channel]) {
			names[channel] = {};
		}
		names[channel][nick] = '';
		wiretapMessage('join', { channel: channel, nick: nick, timestamp: getTime() }, sockets);
		wiretapMessage('names', { channel: channel, nicks: names[channel] }, sockets);
	});
	autoRegister(sockets, client, 'part', function (channel, nick, reason, message) {
		delete names[channel][nick];
		wiretapMessage('part', { channel: channel, nick: nick, reason: reason, timestamp: getTime() }, sockets);
		wiretapMessage('names', { channel: channel, nicks: names[channel] }, sockets);
	});
	autoRegister(sockets, client, 'quit', function (nick, reason, channels, message) {
		wiretapMessage('quit', { nick: nick, reason: reason, channels: channels, timestamp: getTime() }, sockets);
		for (var i = 0; i < channels.length; ++i) {
			delete names[channels[i]][nick];
			wiretapMessage('names', { channel: channels[i], nicks: names[channels[i]] }, sockets);
		}
	});
	autoRegister(sockets, client, 'message#', function (nick, to, text, message) {
		wiretapMessage('message#', { nick: nick, channel: to, timestamp: getTime(), message: text }, sockets);
	});
	autoRegister(sockets, client, 'notice', function (nick, to, text, message) {
		if (to[0] == '#') {
			wiretapMessage('notice', { nick: nick, channel: to, timestamp: getTime(), message: text }, sockets);
		} else {
			wiretapMessage('notice-pm', { nick: nick, timestamp: getTime(), message: text }, sockets);
		}
	});
	autoRegister(sockets, client, 'pm', function (nick, text, message) {
		wiretapMessage('pm', { nick: nick, target: nick, timestamp: getTime(), message: text }, sockets);
	});
	autoRegister(sockets, client, 'nick', function (oldnick, newnick, channels, message) {
		for (var i = 0; i < channels.length; ++i) {
			var oldmod = names[channels[i]][oldnick];
			delete names[channels[i]][oldnick];
			names[channels[i]][newnick] = oldmod;
			wiretapMessage('names', { channel: channels[i], nicks: names[channels[i]] }, sockets);
		}
		
		wiretapMessage('nick', { oldnick: oldnick, newnick: newnick, channels: channels, message: message, timestamp: getTime() }, sockets);
		// TODO also change existing query windows
	});
	autoRegister(sockets, client, 'whois', function (info) {
		wiretapMessage('whois', { info: info }, sockets);
	});
	
	autoRegister(sockets, client, 'raw', function (message) {
                if (message.args[1]) {
			var match = message.args[1].match(/^\u0001ACTION (.+)\u0001$/);
			if (match) {
				wiretapMessage('action', { nick: message.nick, to: message.args[0], timestamp: getTime(),message: match[1] }, sockets);
			}
		}
	});
}

function mockAllMessages(client) {
	console.log('emitting mock messages');
	client.emit('registered', {});
	
	var mockChannel = function(channel) {
		client.emit('join', channel, 'osti', 'message');
		client.emit('names', channel, {'sisterofmercy':'', 'osti':'', 'crd':''});
		client.emit('topic', channel, 'topic', 'sisterofmercy', 'message');
		client.emit('join', channel, 'sister', 'message');
		client.emit('part', channel, 'sisterofmercy', 'reason', 'message');
		client.emit('quit', 'crd', 'reason', [channel], 'message');
		client.emit('notice', 'sisterofmercy', channel, 'text', 'message');
		client.emit('nick', 'sister', 'baku', [channel], 'message');
		client.emit('message#', 'baku', channel, 'text <b>text</b> text http://text.de.vu/path/file.jpg', 'message', 'message');
		client.emit('message#', 'baku', channel, '>greentext', 'message', 'message');
		client.emit('message#', 'baku', channel, 'hey osti *flausch*', 'message', 'message');
		client.emit('message#', 'osti', channel, 'hey osti', 'message', 'message');
		client.emit('raw', { prefix: 'baku!baku@baku.users.network.net',
			nick: 'baku',
			user: 'baku',
			host: 'baku.users.network.net',
			command: 'PRIVMSG',
			rawCommand: 'PRIVMSG',
			commandType: 'normal',
			args: [ channel, '\u0001ACTION action\u0001' ] }
		);
	}
	mockChannel('#bobchat');

	client.emit('notice', 'sisterofmercy', 'osti', 'text', 'message');
	client.emit('pm', 'sisterofmercy', 'text', 'message');
	client.emit('nick', 'sisterofmercy', 'afku', [], 'message');
}

function resendPreviousMessages(socket) {
	if (clientmessages && clientmessages.length != 0) {
		console.log('resending previous messages');
		socket.emit('resendmessages', {});
		for (var i = 0; i < clientmessages.length; ++i) {
			var msg = clientmessages[i];
			socket.emit(msg.name, msg.options);
		}
	}
}

function executeCommand(name, args) {
	if (name == 'msg') {
		var target = args.match(/(\S+) (.+)/)[1];
		var message = args.match(/(\S+) (.+)/)[2];
		sendTextMessage(target, message);
	} else {
		console.log('unknown command: ' + name + ' with args: ' + JSON.stringify(args));
	}
}

function sendTextMessage(target, message) {
	if (config.sendMessages) {
		client.say(target, message);
	}
	
	if (target.indexOf('#') == 0) {
		// channel message
		wiretapMessage('message#', { nick: client.nick, channel: target, timestamp: getTime(), message: message }, clientsockets);
	} else {
		// query message
		wiretapMessage('pm', { nick: client.nick, target: target, timestamp: getTime(), message: message }, clientsockets);
	}
}

var clientsockets = [];

// reduce number of log messages
io.set('log level', 1);

io.sockets.on('connection', function (socket) {
	clientsockets.push(socket);
	
	resendPreviousMessages(socket);
	
	if (config.showDebugControls) {
		socket.emit('showdebugcontrols', {});
	}

	socket.on('sendmessage', function (data) {
		if (data.message.indexOf('/') == 0 && data.message.indexOf('//') != 0) {
			// irc command
			var command = data.message.match(/^\/(\w+)/)[1];
			if (command) {
				executeCommand(command, data.message.substr(1+command.length+1));
			}
		} else {
			// text message
			
			if (data.message.indexOf('//') == 0) {
				// escaped command
				data.message = data.message.replace('/', '');
			}
			
			sendTextMessage(data.to, data.message);
		}		
	});
	
	socket.on('clearlog', function (data) {
		clientmessages = [];
	});

	// test only
	socket.on('mock', function (data) {
		mockAllMessages(client);
	});
	
	// remove socket from the list of all listening clients
	socket.on('disconnect', function () {
		var index = clientsockets.indexOf(socket);
		if (index != -1) {
			clientsockets.splice(index, 1);
		}
	});

});

registerClientListener(client, clientsockets);

console.log('Client successfully started');

