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

function showDragging() {
	$("body").addClass("drag-file");
}
function hideDragging() {
	$("body").removeClass("drag-file");
}

// 각각에서 재정의 필요
function dragover(x, y) {}
function drop(x, y) {}
function beforeExit() {}

$(function () {
	window.onkeydown = function() {
		switch(event.keyCode) {
			case 116: return false; // F5 새로고침 방지
		}
	};
	
	// 우클릭 방지
	$(document).on("contextmenu", function () {
		return false;
	});
	
	if (window.binder) {
		setTimeout(function() {
			binder.initAfterLoad();
		}, 1);
	}
});
