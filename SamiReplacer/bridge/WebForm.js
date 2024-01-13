_alert = alert;
_confirm = confirm;
_prompt = prompt;

function WebForm() {
	this.hwnd = window;
	this.windows = {};
}
WebForm.prototype.super_getHwnd =
WebForm.prototype.getHwnd = function(name) {
	return this.windows[name];
}
WebForm.prototype.focusWindow = function(target) {
	WinAPI.SetForegroundWindow(this.getHwnd(target));
}

WebForm.prototype.script = function(names, p) {
	var func = eval("this.mainView.contentWindow." + names);
	if (p) {
		return func(p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7], p[8], p[9]);
	} else {
		return func();
	}
}
WebForm.prototype.alert = function(name, msg) {
	this.getHwnd(name)._alert(msg);
}
WebForm.prototype.confirm = function(name, msg) {
	if (this.getHwnd(name)._confirm(msg)) {
		this.mainView.contentWindow.afterConfirmYes();
	} else {
		this.mainView.contentWindow.afterConfirmNo();
	}
}
WebForm.prototype.prompt = function(name, msg) {
	this.mainView.contentWindow.afterPrompt(this.getHwnd(name)._prompt(msg));
}

WebForm.prototype.showDragging = function(id) {
	this.layerForDrag.show();
	this.script("showDragging");
}
WebForm.prototype.hideDragging = function() {
	this.layerForDrag.hide();
	this.script("hideDragging");
}
WebForm.prototype.droppedFiles = null;
WebForm.prototype.drop = function(x, y) {
	this.script("drop", [ x, y ]);
}

WebForm.prototype.super_initializeComponent =
WebForm.prototype.initializeComponent = function() {
	$("body").append(this.mainView = $("<iframe>").css({
			position: "absolute"
		,	top: 0
		,	left: 0
		,	width: "100%"
		,	height: "100%"
		,	border: 0
	})[0]);
	
	$("body").append(this.layerForDrag = $("<div>").css({
			position: "fixed"
		,	top: 0
		,	left: 0
		,	right: 0
		,	bottom: 0
		,	background: "rgba(127,127,127,0)"
	}).hide());

	var self = this;
	document.addEventListener("dragenter", function(e) {
		e.preventDefault();
		self.showDragging();
	});
	var layerForDrag = self.layerForDrag[0];
	layerForDrag.addEventListener("dragleave", function(e) {
		e.preventDefault();
		self.hideDragging();
	});
	layerForDrag.addEventListener("dragover", function(e) {
		e.preventDefault();
		self.script("dragover", [ e.offsetX, e.offsetY ]);
	});
	layerForDrag.addEventListener("drop", async function(e) {
		e.preventDefault();
		if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
			self.droppedFiles = e.dataTransfer.files;
		}
		self.hideDragging();
		await self.drop(e.offsetX, e.offsetY);
	});
}

WebForm.prototype.super_initAfterLoad =
WebForm.prototype.initAfterLoad = function() {
	this.windows[this.mainView.contentWindow.windowName] = window;
};
WebForm.prototype.beforeExit = function(e) {}

function MenuStrip() {
	var self = this;
	this.view = $("<ol>").addClass("menustrip").css({
			position: "absolute"
		,	top: 0
		,	left: 0
		,	width: "100%"
	}).on("click", "li", function(e) {
		e.preventDefault();
		var menu = $(this);
		var submenu = menu.data("submenu");
		if (submenu.hasClass("open")) {
			submenu.removeClass("open");
		} else {
			self.openMenu(menu, submenu);
		}
	}).on("mouseover", "li", function() {
		if ($(".submenu.open").length) {
			self.openMenu($(this));
		}
	});
	
};
MenuStrip.prototype.openMenu = function(menu, submenu) {
	submenu = submenu ? submenu : menu.data("submenu");
	$(".submenu.open").removeClass("open");
	submenu.addClass("open").css({ left: menu.offset().left });
	submenu.find("li:eq(0)").focus();
};