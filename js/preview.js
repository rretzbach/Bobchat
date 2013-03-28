function preview_entry(link, target, timestamp, nick, message) {
	return {
		link: link,
		target: target,
		timestamp: timestamp,
		nick: nick,
		message: message,
	};
}

function preview_model(id, name, limit) {
	var that = window_model(id, name);

	that.links = [];
	that.index = null;
	that.limit = limit;

	that.add_entry = function(entry) {
		that.links.push(entry);
		if (this.links.length > that.limit) {
			this.links.splice(0, this.links.length - that.limit);
		}
	};

	that.prev_entry = function() {
		if (that.links.length == 0) {
			return null;
		}

		if (that.index == null) {
			that.index = 0;
		}

		that.index -= 1;

		// lower bound overflows to last element
		if (that.index < 0) {
			that.index = that.links.length - 1;
		}

		return that.links[that.index];
	};

	that.next_entry = function() {
		if (that.links.length == 0) {
			return null;
		}

		if (that.index == null) {
			that.index = 0;
		}

		that.index += 1;

		// upper bound overflows to first element
		if (that.index >= that.links.length) {
			that.index = 0;
		}

		return that.links[that.index];
	};

	return that;
}

function preview_presenter(model, view, cookie_service) {
	var that = window_presenter(model, view, cookie_service);

	var super_init = that.init;
	that.init = function() {
		super_init();

		view.on_image_click(function(){
			that.prevImage();
		});
	};

	that.previewLink = function(link, data) {
		if (link.match(new RegExp('(jpe?g)|(png)|(gif)$', 'i'))) {
			var target;
			if (data.channel) {target = data.channel;}
			if (!target) {target = 'query';}
			
			model.add_entry(preview_entry(link, target, data.timestamp, data.nick, data.message));
			
			this.nextImage();
		}
	};

	that.prevImage = function() {
		view.display_entry(model.next_entry());	
	};

	that.nextImage = function() {
		view.display_entry(model.prev_entry());
	};

	return that;
}

function preview_view() {
	var that = window_view();
	
	var super_init = that.init;
	that.init = function(id, name) {
		super_init(id, name);

		var html = '<div class="chatwindow-img-container">'+
				'<img class="chatwindow-img"/>'+
			'</div>';
		that.add_content(html);

		that.image_element = that.element.find('.chatwindow-img');
	};
	
	that.display_entry = function(entry) {
		if (entry == null) {
			return;
		}

		var altText = 'posted by ' + entry.nick + ' via ' + entry.target + ' at ' + entry.timestamp + ' by posting: \"'+escapeHTML(entry.message)+'\"';
		that.image_element.attr('src', entry.link);
		that.image_element.attr('alt', altText);
		that.image_element.attr('title', altText);
	};

	that.on_image_click = function (func) {
		that.image_element.click(func);
	}

	return that;
}