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

// JSON.stringify 보기 좋게 커스터마이징
function stringify(obj, depth=0, pad=2, isChild=false) {
	var str = "";
	switch (typeof obj) {
		case "object": {
			var padLine = "";
			for (var i = 0; i < pad * depth; i++) {
				padLine += " ";
			}
			
			if (Array.isArray(obj)) {
				for (var i = 0; i < obj.length; i++) {
					str += (i == 0 ? (isChild ? "\n" + padLine + "[" : "[") : "\n" + padLine + ",");
					for (var j = 1; j < pad; j++) { str += " "; }
					str += stringify(obj[i], depth + 1, pad);
				}
				if (str.length > 0) {
					str += "\n" + padLine + "]";
				} else {
					str = "[]";
				}
			} else {
				for (var key in obj) {
					str += (str.length == 0 ? (isChild ? "\n" + padLine + "{" : "{") : "\n" + padLine + ",");
					for (var j = 1; j < pad; j++) { str += " "; }
					str += "\"" + key + "\": " + stringify(obj[key], depth + 1, pad, true);
				}
				if (str.length > 0) {
					str += "\n" + padLine + "}";
				} else {
					str = "{}";
				}
			}
			break;
		}
		default: {
			str = JSON.stringify(obj);
			if (typeof str != "string") {
				str = "null";
			}
		}
	}
	return str;
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
	// 우클릭 방지
	$(document).on("contextmenu", function() {
		return false;
	});
	window.onkeydown = function(e) {
		switch(e.keyCode) {
			case 116: return false; // F5 새로고침 방지
		}
	};
	window.addEventListener("mousewheel", function(e) {
		// 확대/축소 방지
		if (e.ctrlKey) {
			e.preventDefault();
		}
	}, { passive: false });
	
	if (window.binder) {
		setTimeout(function() {
			binder.initAfterLoad($("title").text());
		}, 1);
	}
	$("body").append($("<div>").attr({ id: "cover" }).css({
			position: "fixed"
		,	top: "0"
		,	left: "0"
		,	width: "100%"
		,	height: "100%"
		,	background: "rgba(127,127,127,0.2)"
		,	zIndex: "9999"
	}));
});

var Progress = function() {
	this.div = $("<div>").css({
			position: "fixed"
		,	top: "calc(50% - 20px)"
		,	left: "calc(50% - 100px)"
		,	width: "200px"
		,	height: "40px"
		,	textAlign: "center"
		,	background: "rgba(242,242,242,0.7)"
		,	zIndex: "99999"
	});
	this.bar = $("<div>").css({
			height: "100%"
		,	background: "#69f"
	});
	this.text = $("<span>").css({ lineHeight: "20px" });
	this.div.append($("<div>").css({
				height: "20px"
			,	border: "1px solid #000"
			,	padding: "2px"
			,	background: "#fff"
		}).append(this.bar)
	).append(this.text);
	$("body").append(this.div.hide());
};
Progress.prototype.set = function(value, total) {
	this.bar.css({ width: "calc(" + (value / total * 100) + "%)"});
	this.text.text(value + "/" + total);
	this.div.show();
}
Progress.prototype.hide = function() {
	this.div.hide();
}
