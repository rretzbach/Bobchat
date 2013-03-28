function dialog_message(timestamp, nick, message) {
	return {
		timestamp: timestamp,
		nick: nick,
		message: message,
	};
}

function dialog_model(network, name) {
	var that = window_model(network + '#' + name, name);

	that.network = network;
	that.messages = [];

	that.add_message = function(entry) {
		that.links.push(entry);
		if (this.links.length > that.limit) {
			this.links.splice(0, this.links.length - that.limit);
		}
	};

	that.clear = function() {
		that.messages = [];
	};

	return that;
}

function dialog_presenter(model, view, cookie_service, socket) {
	var that = window_presenter(model, view, cookie_service);

	var super_init = that.init;
	that.init = function() {
		super_init();
		
		view.inputElement.find('button').click(function(){
			that.sendText();
		});
		
		view.inputElement.keyup(function(event) {
			if (event.keyCode==13) {
				that.sendText();
			}
		});
	};

	that.nicklistcontainer = function() {
		return view.nicklistcontainer;
	};

	that.sendText = function() {
		var message = view.inputElement.val();
		socket.emit('sendmessage', { to: model.name, message: message });
		view.inputElement.val('');
	};
	
	that.addMessage = function(data, template, doRender) {
		var willScroll = true;
		if (!view.isScrolledDown()) {
			willScroll = false;
		}

		if (doRender) {
			data.message = renderMessage(data);
		}
		
		var message = $(template.render(data));
		view.msgTableElement.append(message);

		if ('string' == typeof data.message) {
			// highlight
			var highlight = /\b(?:osti|Ostwind)\b/i;
			if (data.message.match(highlight)) {
				message.addClass('highlight');
			}
			
			// greentext
			if (data.message.indexOf(">") == 0 && data.message.indexOf(">>") != 0) {
				message.find('.message').addClass('greentext');
			}
		}

		if (willScroll) {
			view.scrollDown();
		}
	};
	
	that.clear = function() {
		model.clear();
		view.clear();
	};

	return that;
}

function dialog_view() {
	var that = window_view();
	
	var super_init = that.init;
	that.init = function(id, name) {
		super_init(id, name);

		var html = '<div class="chatwindow-msgtable-container">'+
								'<table class="chatwindow-msgtable"/>'+
							'</div>'+
						'<div class="nicklistcontainer">'+
							'<ul class="nicklist"/>'+
						'</div>' +
				'<input/>';
		that.add_content(html);

		that.messageTableContainer = that.element.find('.chatwindow-msgtable-container');
		that.nicklistcontainer = that.element.find('.nicklistcontainer');
		that.msgTableElement = that.element.find('.chatwindow-msgtable');
		that.inputElement = that.element.find('input');
	};

	that.scrollDown = function() {
		that.messageTableContainer[0].scrollTop = that.messageTableContainer[0].scrollHeight;
	};
	
	that.isScrolledDown = function() {
		var scrolledDown = true;
		// 20px offset
		if (that.messageTableContainer.height()+that.messageTableContainer[0].scrollTop < that.messageTableContainer[0].scrollHeight - 20) {
			scrolledDown = false;
		}
		return scrolledDown;
	};

	that.clear = function() {
		that.msgTableElement.empty();
		that.nicklistcontainer.empty();
	};

	return that;
}