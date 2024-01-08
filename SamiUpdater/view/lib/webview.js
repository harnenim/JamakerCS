var showDrag = false;
function setShowDrag(dragging) {
	showDrag = dragging;
}
function setDroppable() {
	var doc = $(document);
	doc.on("dragleave", function () {
		return false;
	});
	doc.on("dragover", function () {
		if (!showDrag) {
			binder.showDragging();
		}
		return false;
	});
}

var windowName = "editor";

// alert 재정의
_alert = alert;
alert = function(msg) {
	binder.alert(windowName, msg);
}
// confirm 재정의
_confirm = confirm;
var afterConfirmYes = function() {};
var afterConfirmNo  = function() {};
confirm = function(msg, yes, no) {
	afterConfirmYes = yes ? yes : function() {};
	afterConfirmNo  = no  ? no  : function() {};
	binder.confirm(windowName, msg);
}
// prompt 재정의
_prompt = prompt;
var afterPrompt  = function(value) {};
prompt = function(msg, after) {
	afterPrompt = after ? after : function() {};
	binder.prompt(windowName, msg);
}

var ctrl  = false;

$(function () {
	var doc = $(document);
	var views = $(".view");
	views.css({"height": window.innerHeight});
	window.addEventListener("resize", function() {
		views.css({"height": window.innerHeight});
	});
	window.onkeydown = function() {
		switch(event.keyCode) {
			case 17: ctrl = true; break;
			case 116: return false; // F5 새로고침 방지
		}
	};
	window.onkeyup = function() {
		switch(event.keyCode) {
			case 17: ctrl = false; break;
		}
	};
	window.onmousewheel = function () {
		// 확대/축소 방지
		if (ctrl) {
			return false;
		}
	};

	// 우클릭 방지
	doc.on("contextmenu", function () {
		return false;
	});

	if (window.binder) binder.initAfterLoad();
});
