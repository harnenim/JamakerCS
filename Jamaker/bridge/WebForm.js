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

WebForm.prototype.script = function(names, ...args) {
	// WebView2에선 eval 가능한 형태로 넘겨야 함
	let script = `this.mainView.contentWindow.${names}(`;
	for (let i = 0; i < args.length; i++) {
		if (i > 0) {
			script += ',';
		}
		const arg = args[i];
		switch (typeof arg) {
			case "number":
			case "boolean":
				script += arg;
				break;
			default:
				script += JSON.stringify(arg);
		}
	}
	script += ")";
	eval(script);
}
WebForm.prototype.alert = function(name, msg) {
	let hwnd = this.getHwnd(name);
	if (hwnd.iframe) hwnd = hwnd.iframe.contentWindow;
	hwnd._alert(msg);
}
WebForm.prototype.confirm = function(name, msg) {
	let hwnd = this.getHwnd(name);
	if (hwnd.iframe) hwnd = hwnd.iframe.contentWindow;
	if (hwnd._confirm(msg)) {
		this.mainView.contentWindow.afterConfirmYes();
	} else {
		this.mainView.contentWindow.afterConfirmNo();
	}
}
WebForm.prototype.prompt = function(name, msg, def) {
	let hwnd = this.getHwnd(name);
	if (hwnd.iframe) hwnd = hwnd.iframe.contentWindow;
	this.mainView.contentWindow.afterPrompt(hwnd._prompt(msg, def));
}

WebForm.prototype.showDragging = function(id) {
	this.layerForDrag.style.display = "block";
	this.script("showDragging");
}
WebForm.prototype.hideDragging = function() {
	this.layerForDrag.style.display = "none";
	this.script("hideDragging");
}
WebForm.prototype.droppedFiles = null;
WebForm.prototype.drop = function(x, y) {
	this.script("drop", x, y);
}

WebForm.prototype.super_initializeComponent =
WebForm.prototype.initializeComponent = function() {
	this.mainView = document.createElement("iframe");
	this.mainView.style.position = "absolute";
	this.mainView.style.top = 0;
	this.mainView.style.left = 0;
	this.mainView.style.width = "100%";
	this.mainView.style.height = "100%";
	this.mainView.style.border = 0;
	document.body.append(this.mainView);
	
	this.layerForDrag = document.createElement("div");
	this.layerForDrag.style.position = "fixed";
	this.layerForDrag.style.top = 0;
	this.layerForDrag.style.left = 0;
	this.layerForDrag.style.right = 0;
	this.layerForDrag.style.bottom = 0;
	this.layerForDrag.style.background = "rgba(127,127,127,0)";
	this.layerForDrag.style.display = "none";
	document.body.append(this.layerForDrag);

	const self = this;
	document.addEventListener("dragenter", (e) => {
		e.preventDefault();
		self.showDragging();
	});
	this.layerForDrag.addEventListener("dragleave", (e) => {
		e.preventDefault();
		self.hideDragging();
	});
	this.layerForDrag.addEventListener("dragover", (e) => {
		e.preventDefault();
		self.script("dragover", e.offsetX, e.offsetY);
	});
	this.layerForDrag.addEventListener("drop", async (e) => {
		e.preventDefault();
		if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
			self.droppedFiles = e.dataTransfer.files;
		}
		self.hideDragging();
		await self.drop(e.offsetX, e.offsetY);
	});
	this.layerForDrag.addEventListener("click", async (e) => {
        // 레이어가 클릭됨 -> 드래그 끝났는데 안 사라진 상태
		self.hideDragging();
	});
}

WebForm.prototype.super_initAfterLoad =
WebForm.prototype.initAfterLoad = function() {
	this.windows[this.mainView.contentWindow.windowName] = window;
};
WebForm.prototype.beforeExit = (e) => {}

{
	window.onloads = [];
	window.ready = (fn) => {
		if (window.onloads != null) {
			window.onloads.push(fn);
			if (window.onloads.length == 1) {
				window.addEventListener("load", () => {
					afterReady();
				});
			}
		} else {
			try { fn(); } catch (e) {};
		}
	}
	window.afterReady = () => {
		window.onloads && onloads.forEach((fn) => {
			try { fn(); } catch (e) {};
		});
		window.onloads = null;
	}
}