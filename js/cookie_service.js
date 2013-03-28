function cookie_service() {
	var base = 'bobchat-layout';
	return {
		load_window_geometry: function(window_model) {
			var prefix = base + '-' + window_model.id;
			
			var geometry = {
				postop: $.cookie(prefix + '-pos-top'),
				posleft: $.cookie(prefix + '-pos-left'),
				sizewidth: $.cookie(prefix + '-size-width'),
				sizeheight: $.cookie(prefix + '-size-height'),
			};
			
			if (geometry.postop != null) {
				window_model.top = geometry.postop;
			}
			if (geometry.posleft != null) {
				window_model.left = geometry.posleft;
			}
			if (geometry.sizewidth != null) {
				window_model.width = geometry.sizewidth;
			}
			if (geometry.sizeheight != null) {
				window_model.height = geometry.sizeheight;
			}
		},
		store_window_geometry: function(window_model) {
			var prefix = base + '-' + window_model.id;

			var defaultExpire = 365;

			$.cookie(prefix + '-pos-top', window_model.top, { expires: defaultExpire });
			$.cookie(prefix + '-pos-left', window_model.left, { expires: defaultExpire });
			$.cookie(prefix + '-size-width', window_model.width, { expires: defaultExpire });
			$.cookie(prefix + '-size-height', window_model.height, { expires: defaultExpire });
		},
	};
}