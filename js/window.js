function window_model(id, name) {
	return {
		id: id,
		name: name,

		top: 10,
		left: 10,
		width: 640,
		height: 320,

		hidden: false,
	};
}

function window_presenter(model, view, cookie_service) {
	var that = {
		init: function() {
			view.init(model.id, model.name);

			view.element.draggable({handle: ".chatwindow-title",
				stop: function(event, ui){
					console.log("before store after drag");
					that.store_window_geometry();
					console.log("after store after drag");
				}
			});
			view.element.resizable({stop: function(event, ui){
				that.store_window_geometry();
			}});

			if (model.hidden) {
				view.hide();
			}

			that.load_window_geometry();
		},

		load_window_geometry: function() {
			cookie_service.load_window_geometry(model);
			view.update_geometry(model.top, model.left, model.width, model.height);
		},

		store_window_geometry: function() {
			var geometry = view.get_geometry();
			model.top = geometry.top;
			model.left = geometry.left;
			model.width = geometry.width;
			model.height = geometry.height;
			cookie_service.store_window_geometry(model);
		},
	};

	return that;
}

function window_view() {
	var that = {
		init: function(id, name) {
			that.element = $('<div id="' + id + '" class="chatwindow">' +
				'<div style="position: absolute;top: 0;bottom: 0;left: 0;right: 0;">' +
					'<div class="chatwindow-title">' +
						name +
					'</div>' +
				'</div>' +
			'</div>');

			$('#tint').append(that.element);
		},

		add_content: function(html) {
			that.element.children().first().append(html);
		},

		hide: function() {
			that.element.hide();
		},

		update_geometry: function(top, left, width, height) {
			that.element.css('top', top);
			that.element.css('left', left);
			that.element.width(width);
			that.element.height(height);
		},

		get_geometry: function() {
			return {
				top: that.element.css('top'),
				left: that.element.css('left'),
				width: that.element.width(),
				height: that.element.height(),
			};
		},

		escapeHTML: function(text) {
			return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&#34;");
		}
	};

	return that;
}