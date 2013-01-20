function Emoticon(name, triggers, image) {
	this.name = name;
	this.triggers = triggers;
	this.image = image;
}

function EmoticonRegistry() {
	this.emoticonMap = {};
	this.add = function(emoticon) {
		for (var i = 0; i < emoticon.triggers.length; ++i) {
			var trigger = emoticon.triggers[i];
			this.emoticonMap[trigger] = emoticon;
		}
	}
}

var emoticonRegistry = new EmoticonRegistry();
emoticonRegistry.add(new Emoticon('*flausch*', ['*flausch*',':glitter',':fluff'], 'red_unicorn_glitter.gif'));

emoticonRegistry.add(new Emoticon(':runicorn', [':runicorn', ':runicorn:'], 'red_unicorn.gif'));
emoticonRegistry.add(new Emoticon(':bunicorn', [':bunicorn', ':bunicorn:'], 'blue_unicorn.gif'));
emoticonRegistry.add(new Emoticon(':shun', [':shun',':shun:'], 'blue_unicorn_shun.gif'));
emoticonRegistry.add(new Emoticon(':wiesel', [':wiesel',':weasel',':wiesel:',':weasel:'], 'ferret.gif'));
emoticonRegistry.add(new Emoticon(':albino', [':albino'], 'albino.gif'));
emoticonRegistry.add(new Emoticon('y3', [':y3','y3'], 'heart.gif'));
emoticonRegistry.add(new Emoticon(':h2o2', [':h2o2',':h2o2:'], 'h2o23.png'));
emoticonRegistry.add(new Emoticon('x_X', ['x_X','X_x','x_x','X_X'], 'fluffy_emoticons_dead.gif'));
emoticonRegistry.add(new Emoticon('<<', ['<<','>>'], 'fluffy_emoticons_shifty.gif'));
emoticonRegistry.add(new Emoticon(':(', [':(',':((',':(((',':(((('], 'fluffy_emoticons_sad.gif'));
emoticonRegistry.add(new Emoticon(":'(", [":'("], 'fluffy_emoticons_cry.gif'));
emoticonRegistry.add(new Emoticon(':)', [':)',':))',':)))',':))))'], 'fluffy_emoticons_happy.gif'));
emoticonRegistry.add(new Emoticon(':>', [':>',':>>',':>>>',':>>>>'], 'fluffy_emoticons_cheeky.gif'));
emoticonRegistry.add(new Emoticon(':]', [':]',':]]',':]]]',':]]]]','qed'], 'fluffy_emoticons_proud.gif'));
emoticonRegistry.add(new Emoticon('>:)', ['>:)'], 'fluffy_emoticons_evil.gif'));
emoticonRegistry.add(new Emoticon('._.', ['._.',':/',':\\'], 'fluffy_emoticons_meh.gif'));
emoticonRegistry.add(new Emoticon('???', ['???'], 'fluffy_emoticons_confused.gif'));
emoticonRegistry.add(new Emoticon(';)', [';)',';))',';)))',';))))'], 'fluffy_emoticons_wink.gif'));
emoticonRegistry.add(new Emoticon('^^', ['^^','^_^'], 'fluffy_emoticons_circonflex.gif'));
emoticonRegistry.add(new Emoticon('-_-', ['-_-'], 'fluffy_emoticons_disappointed.gif'));
emoticonRegistry.add(new Emoticon('`_´', ['`_´','grrr'], 'fluffy_emoticons_angry.gif'));
emoticonRegistry.add(new Emoticon(':D', [':D',':DD',':DDD',':DDDD'], 'fluffy_emoticons_grin.gif'));
emoticonRegistry.add(new Emoticon('D:', ['D:','DD:','DDD:','DDDD:'], 'fluffy_emoticons_shocked.gif'));
emoticonRegistry.add(new Emoticon(':O', [':o',':O'], 'fluffy_emoticons_surprise.gif'));
emoticonRegistry.add(new Emoticon('O_o', ['O_o','o_O','O_O','o_o'], 'fluffy_emoticons_weird.gif'));
emoticonRegistry.add(new Emoticon(':omg:', ['omg',':omg',':omg:'], 'fluffy_emoticons_omg.gif'));
emoticonRegistry.add(new Emoticon(':P', [':P'], 'fluffy_emoticons_tongue.gif'));
emoticonRegistry.add(new Emoticon(':rolleyes:', [':rolleyes',':rolleyes:'], 'fluffy_emoticons_rolleyes.gif'));
emoticonRegistry.add(new Emoticon(':suizid:', [':suizid',':suicide',':suizid:',':suicide:'], 'fluffy_emoticons_suizid.gif'));
emoticonRegistry.add(new Emoticon(":')", [":')"], 'fluffy_emoticons_happytears.gif'));
