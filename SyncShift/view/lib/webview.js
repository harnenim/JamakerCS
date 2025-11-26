let showDrag = false;
function setShowDrag(dragging) {
	showDrag = dragging;
}
function setDroppable() {
	const doc = $(document);
	doc.on("dragleave", function() {
		return false;
	});
	doc.on("dragover", function() {
		if (!showDrag) {
			binder.showDragging();
		}
		return false;
	});
}

window.windowName = "editor";

// alert 재정의
window._alert = alert;
alert = (msg) => {
	binder.alert(windowName, msg);
}
// confirm 재정의
window._confirm = confirm;
window.afterConfirmYes = () => {};
window.afterConfirmNo  = () => {};
confirm = (msg, yes, no) => {
	afterConfirmYes = yes ? yes : () => {};
	afterConfirmNo  = no  ? no  : () => {};
	binder.confirm(windowName, msg);
}
// prompt 재정의
window._prompt = prompt;
window.afterPrompt  = (value) => {};
prompt = (msg, after, def) => {
	afterPrompt = after ? after : () => {};
	binder.prompt(windowName, msg, def);
}

// JSON.stringify 보기 좋게 커스터마이징
function stringify(obj, depth=0, pad=2, isChild=false) {
	let str = "";
	switch (typeof obj) {
		case "object": {
			let padLine = "";
			for (let i = 0; i < pad * depth; i++) {
				padLine += " ";
			}
			
			if (Array.isArray(obj)) {
				for (let i = 0; i < obj.length; i++) {
					str += (i == 0 ? (isChild ? "\n" + padLine + "[" : "[") : "\n" + padLine + ",");
					for (let j = 1; j < pad; j++) { str += " "; }
					str += stringify(obj[i], depth + 1, pad);
				}
				if (str.length > 0) {
					str += "\n" + padLine + "]";
				} else {
					str = "[]";
				}
			} else {
				for (let key in obj) {
					str += (str.length == 0 ? (isChild ? "\n" + padLine + "{" : "{") : "\n" + padLine + ",");
					for (let j = 1; j < pad; j++) { str += " "; }
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

let DPI = 1;
function setDpi(dpi) {
	DPI = dpi;
}

$(() => {
	// 우클릭 방지
	$(document).on("contextmenu", function() {
		return false;
	});
	window.onkeydown = (e) => {
		switch(e.keyCode) {
			case 116: return false; // F5 새로고침 방지
		}
	};
	window.addEventListener("mousewheel", (e) => {
		// 확대/축소 방지
		if (e.ctrlKey) {
			e.preventDefault();
		}
	}, { passive: false });
	
	// WebView2 전환 시 활용
	if (window.chrome.webview) {
		// 각 프로그램에서 필요한 경우 override 정의
		window.sharedBufferReceived = (e) => {
			// C#: PostSharedBufferToScript
			// new Uint8Array(e.getBuffer());
		}
		window.chrome.webview.addEventListener("sharedbufferreceived", (e) => {
			sharedBufferReceived(e);
		});
		// CefSharp에서와 동일하게 호출
		if (chrome.webview.hostObjects && chrome.webview.hostObjects.binder) {
			window.binder = chrome.webview.hostObjects.binder;
		}
	}
	
	if (window.binder) {
		setTimeout(() => {
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
	
	$("[title]").each((_, el) => {
		const obj = $(el);
		const title = obj.attr("title").split("\\n");
		if (title.length > 1) {
			obj.attr("title", title.join("\n"));
		}
	});
	
	$("input").attr({ autocomplete: "off" });
});

// 팝업 재정의
window.popup = function(url, name, w=1, h=1) {
	window.open(url, name, ["scrollbar=no", "location=no", "width=" + w, "height=" + h].join(","));
	
	// TODO: window.open 말고 다른 걸 쓰려고 해봤는데, 이러면 opener 호출이 되나...?
	// WebView2를 먼저 만져봐야 할 듯
}

window.Progress = function() {
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
	this.last = 0;
};
Progress.prototype.set = function (value, total) {
	if (0 < ratio && ratio < 1) { // 0, 1일 땐 무조건 실행
		// 과도한 UI 갱신 방지
		const now = new Date().getTime();
		if (now - this.last < 15) {
			return;
		}
		this.last = now;
	}
	this.bar.css({ width: "calc(" + (value / total * 100) + "%)"});
	this.text.text(value + "/" + total);
	this.div.show();
}
Progress.prototype.hide = function() {
	this.div.hide();
}
// Progress 객체 없이 직접 다루는 경우
Progress.bars = {};
Progress.last = 0;
Progress.set = (selector, ratio, unit="calc([ratio] * 100%)") => {
	if (0 < ratio && ratio < 1) { // 0, 1일 땐 무조건 실행
		// 과도한 UI 갱신 방지
		const now = new Date().getTime();
		if (now - Progress.last < 15) {
			return;
		}
		Progress.last = now;
	}
	let bar = Progress.bars[selector];
	if (bar == null) {
		const area = $(selector);
		Progress.bars[selector] = bar = $("<div>").addClass("progress-bar");
		area.addClass("progress").prepend(bar);
	}
	bar.width(unit.split("[ratio]").join(ratio));
}