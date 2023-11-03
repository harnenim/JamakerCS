function Binder(editor) {
	var _ = this._ = editor;

	var init = false;
	this.initAfterLoad = function() {
		if (this.init) return;
		this.init = true;
		_.initAfterLoad();
	}
	this.setMenus = function(menus) {
		_.setMenus(menus);
	}
	
	this.moveWindow = function(name, x, y, w, h, resize) {
		_.moveWindow(name, x, y, w, h, resize);
	}
	this.focus = function(target) {
		_.focusWindow(target);
	}
	this.setFollowWindow = function(follow) {
		_.setFollowWindow(follow);
	}

	this.showDragging = function(id) {
		_.showDragging(id);
	}
	this.hideDragging = function() {
		_.hideDragging();
	}
	
	this.focusToMenu = function(keyCode) {
		//_.focusToMenu(keyCode);
	}

	this.saveSetting = function(setting) {
		_.saveSetting(setting);
	}
	this.setVideoExts = function(exts) {
		_.setVideoExts(exts);
	}
	this.setPlayer = function(dll, exe, withRun) {
		_.setPlayer(dll, exe, withRun);
	}
	this.runPlayer = function(path) {
		_.runPlayer(path);
	}

	this.save = function(text, path) {
		_.save(text, path);
	}
	this.saveTemp = function(text, path) {
		_.saveTemp(text, path);
	}
	this.openFile = function() {
		_.openFile();
	}
	this.openFileForVideo = function() {
		_.openFileForVideo();
	}
	this.checkLoadVideoFile = function(smiPath) {
		_.checkLoadVideoFile(smiPath);
	}
	this.loadVideoFile = function(path) {
		_.loadVideoFile(path);
	}
	this.openTempDir = function() {
		_.openTempDir();
	}
	this.doExit = function(resetPlayer, exitPlayer) {
		_.doExit(resetPlayer, exitPlayer);
	}
	
	// 팝업 통신
	this.sendMsg = function(target, msg) {
		_.sendMsg(target, msg);
	}
	
	// setting.html
	this.getWindows = function(targets) { _.getWindows(targets); }
	this.selectPlayerPath = function() { alert("C#에서 동작합니다."); }
	
	// addon 설정 용
	this.loadAddonSetting = function(path) { _.loadAddonSetting(path); }
	this.saveAddonSetting = function(path, text) { _.saveAddonSetting(path, text); }
	
	// viewer/finder opener 못 쓰게 될 경우 고려
	this.updateViewerSetting  = function() { _.updateViewerSetting(); };
	this.updateViewerLines = function(lines) { _.updateViewerLines(lines); };
	
	this.onloadFinder  = function(last  ) { _.onloadFinder (last  ); };
	this.runFind	   = function(params) { _.runFind      (params); };
	this.runReplace    = function(params) { _.runReplace   (params); };
	this.runReplaceAll = function(params) { _.runReplaceAll(params); };

	this.alert   = function(target, msg) { _.alert  (target, msg); }
	this.confirm = function(target, msg) { _.confirm(target, msg); }
	this.prompt  = function(target, msg) { _.prompt (target, msg); }

	// 플레이어
	this.playOrPause = function() { _.player.playOrPause(); }
	this.play        = function() { _.player.play(); }
	this.stop        = function() { _.player.stop(); }
	this.moveTo  = function(time) { _.player.moveTo(time); }

	// 부가기능
	this.runColorPicker = function() { alert("C#에서 동작합니다."); }
	this.normalize = function(text) {
		var smi = new Subtitle.SmiFile();
		var input = smi.fromTxt(text).body;
		Subtitle.Smi.normalize(input);
		smi.body = input;
		output = smi.toTxt().trim();
		_.afterTransform(output);
	}
	this.fillSync = function(text) {
		var smi = new Subtitle.SmiFile();
		var input = smi.fromTxt(text).body;
		Subtitle.Smi.fillEmptySync(input);
		smi.body = input;
		output = smi.toTxt().trim();
		_.afterTransform(output);
	}
	this.toAss = function(text, afterFunc) {
		_.toAss(text, afterFunc);
	}
};