// helper
function padStr(i) {
    return (i < 10) ? "0" + i : "" + i;
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

// irc

function ClientMessage(name, options) {
	this.name = name;
	this.options = options;
}

var clientmessages = [];
var names = {};

var irc = require('irc');

var client = new irc.Client('irc.iz-smart.net', 'Ostwind', {
    debug: true,
    channels: ['#teaparty', '#vegan'],
	autoConnect: true,
	username: 'Ostwind',
	realName: 'Ostwind nodeJS IRC client',
	password: '',
});

// send a pong every 5min to cause a close connection event if no internet connectivity is available, which will trigger a reconnect
setInterval(function(){client.send('PONG', 'empty');}, 5*60*1000);

client.addListener('error', function(message) {
    console.log('error: ', message);
});


function getTime() {
	var now = new Date();
	var timestamp = padStr(now.getHours()) + ':' +
			  padStr(now.getMinutes()) + ':' +
			  padStr(now.getSeconds());
	return timestamp;
}

function wiretapMessage(name, options, sockets) {
	var msg = new ClientMessage(name, options);

	if (!clientmessages) {
		clientmessages = [];
	}
	clientmessages.push(msg);

	for (var i = 0; i < sockets.length; ++i) {
		var socket = sockets[i];
		socket.emit(msg.name, msg.options);
	}
}

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
		wiretapMessage('pm', { nick: nick, timestamp: getTime(), message: text }, sockets);
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
}

function mockAllMessages(client) {
	console.log('emitting mock messages');
	client.emit('registered', {});
	
	var mockChannel = function(channel) {
		client.emit('join', channel, 'osti', 'message');
		client.emit('names', channel, {'baku':'', 'osti':'', 'crd':''});
		client.emit('topic', channel, 'topic', 'baku', 'message');
		client.emit('join', channel, 'sister', 'message');
		client.emit('part', channel, 'baku', 'reason', 'message');
		client.emit('quit', 'crd', 'reason', [channel], 'message');
		client.emit('notice', 'baku', channel, 'text', 'message');
		client.emit('nick', 'sister', 'sisterofmercy', [channel], 'message');
		client.emit('message#', 'sisterofmercy', channel, 'text', 'message');
	}
	mockChannel('#bobchat');

	client.emit('notice', 'baku', 'osti', 'text', 'message');
	client.emit('pm', 'baku', 'text', 'message');
	client.emit('nick', 'baku', 'afku', [], 'message');
	//client.emit('whois', { info: info });
}

function resendPreviousMessages(socket) {
	if (clientmessages && clientmessages.length != 0) {
		console.log('resending previous messages');
		for (var i = 0; i < clientmessages.length; ++i) {
			var msg = clientmessages[i];
			socket.emit(msg.name, msg.options);
		}
	}
}

var clientsockets = [];

// reduce number of log messages
io.set('log level', 1);

io.sockets.on('connection', function (socket) {
	clientsockets.push(socket);
	
	resendPreviousMessages(socket);

	socket.on('sendmessage', function (data) {
		client.say(data.to, data.message);
		// TODO could also be a privmsg or a command
		wiretapMessage('message#', { nick: client.nick, channel: data.to, timestamp: getTime(), message: data.message }, clientsockets);
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

