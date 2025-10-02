function Binder(editor) {
	const _ = this._ = editor;
	
	this.focus = function(target) {
		_.focusWindow(target);
	}
	
	this.init = false;
	this.initAfterLoad = function() {
		if (this.init) return;
		this.init = true;
		_.initAfterLoad();
	}

	this.showDragging = function(id) {
		_.showDragging(id);
	}
	this.hideDragging = function() {
		_.hideDragging();
	}

	this.alert   = function(target, msg) { _.alert  (target, msg); }
	this.confirm = function(target, msg) { _.confirm(target, msg); }
	this.prompt  = function(target, msg, def) { _.prompt (target, msg, def); }
}