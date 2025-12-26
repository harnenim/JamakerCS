{
	const src = document.currentScript.src;
	const link = document.createElement("link");
	link.rel = "stylesheet";
	link.href = src.substring(0, src.length - 2) + "css";
	document.head.append(link);
}

let showDrag = false;
function setShowDrag(dragging) {
	showDrag = dragging;
}
function setDroppable() {
	document.addEventListener("dragleave", () => {
		return false;
	});
	document.addEventListener("dragover", () => {
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

{	const dataMap = new WeakMap();
	window.eData = (el=null, key=null, value=null) => {
		if (!el) return null;
		
		let map = dataMap.get(el);
		if (!map) {
			dataMap.set(el, map = {});
		}
		if (key != null) {
			if (typeof key == "string") {
				if (value == null) {
					return map[key];
				}
				map[key] = value;
			} else if (typeof key == "object") {
				const paramMap = key;
				for (key in paramMap) {
					map[key] = paramMap[key];
				}
			}
		}
		return map;
	}
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
	document.body.classList.add("drag-file");
}
function hideDragging() {
	document.body.classList.remove("drag-file");
}

// 각각에서 재정의 필요
function dragover(x, y) {}
function drop(x, y) {}
function beforeExit() {}

window.DPI = 1;
function setDpi(dpi) {
	window.DPI = dpi;
}

{
	window.onloads = [];
	window.ready = (fn) => {
		if (window.onloads != null) {
			window.onloads.push(fn);
			if (window.onloads.length == 1) {
				window.addEventListener("load", () => {
					if (window.binder) {
						// CefSharp인 경우 실행
						afterReady();
					} else if (window.chrome && window.chrome.webview) {
						// WebView2인 경우 실행
						afterReady();
					}
					// 웹샘플 iframe일 경우 부모창에서 binder 등록 후 onload로 실행
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

ready(() => {
	// 우클릭 방지
	document.addEventListener("contextmenu", (e) => {
		// TODO: 우클릭 메뉴 뭐라도 만들까?
		e.preventDefault();
	});
	window.onkeydown = (e) => {
		switch(e.key) {
			case "F5": return false; // F5 새로고침 방지
		}
	};
	window.addEventListener("mousewheel", (e) => {
		if (e.ctrlKey) {
			// 확대/축소 방지
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
			binder.initAfterLoad(document.title);
		}, 1);
	}
	{	const cover = document.createElement("div");
		cover.id = "cover";
		cover.style.position   = "fixed";
		cover.style.top        = 0;
		cover.style.left       = 0;
		cover.style.width      = "100%";
		cover.style.height     = "100%";
		cover.style.background = "rgba(127,127,127,0.2)";
		cover.style.zIndex     = 9999;
		document.body.append(cover);
		
	}
	
	document.querySelectorAll("[title]").forEach((obj) => {
		const title = obj.title.split("\\n");
		if (title.length > 1) {
			obj.title = title.join("\n");
		}
	});

	[...document.getElementsByTagName("textarea")].forEach((input) => {
		input.setAttribute("spellcheck", false);
	});
	[...document.getElementsByTagName("input")].forEach((input) => {
		input.setAttribute("autocomplete", "off");
	});
});

// 팝업 재정의
window.popup = function(url, name, w=1, h=1) {
	window.open(url, name, ["scrollbar=no", "location=no", "width=" + w, "height=" + h].join(","));
}

window.Progress = function() {
	// TODO: 설정에서 CSS 크기 조절 필요한가?
	{	this.div = document.createElement("div");
		this.div.style.position   = "fixed";
		this.div.style.top        = "calc(50% - 20px)";
		this.div.style.left       = "calc(50% - 100px)";
		this.div.style.width      = "200px";
		this.div.style.height     = "40px";
		this.div.style.textAlign  = "center";
		this.div.style.background = "rgba(242,242,242,0.7)";
		this.div.style.zIndex     = "99999";
		this.div.style.display    = "none";
	}
	{	this.bar = document.createElement("div");
		this.bar.style.height     = "100%";
		this.bar.style.background = "#69f";
	}
	{	this.text = document.createElement("span");
		this.text.style.lineHeight = "20px";
	}
	{	this.inner = document.createElement("div");
		this.inner.style.height     = "20px";
		this.inner.style.border     = "1px solid #000";
		this.inner.style.padding    = "2px";
		this.inner.style.background = "#fff";
		this.inner.append(this.bar);
	}
	this.div.append(this.inner, this.text);
	document.body.append(this.div);
	this.last = 0;
};
Progress.prototype.set = function (value, total) {
	const ratio = (total == 0) ? 1 : (value / total);
	if (0 < ratio && ratio < 1) { // 0, 1일 땐 무조건 실행
		// 과도한 UI 갱신 방지
		const now = new Date().getTime();
		if (now - this.last < 15) {
			return;
		}
		this.last = now;
	}
	this.bar.style.width = `calc(${ ratio * 100 }%)`;
	this.text.innerText = `${value}/${total}`;
	this.div.style.display = "block";
}
Progress.prototype.hide = function() {
	this.div.style.display    = "none";
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
	if (!bar) {
		let area = null;
		if (selector.indexOf(":eq(") > 0) {
			const parts = selector.split(":eq(");
			const index = Number(parts[1].split(")")[0]);
			area = document.querySelectorAll(parts[0])[index];
		} else {
			area = document.querySelector(selector);
		}
		Progress.bars[selector] = bar = document.createElement("div");
		bar.classList.add("progress-bar");
		area.classList.add("progress");
		area.prepend(bar);
	}
	bar.style.width = (unit.replaceAll("[ratio]", ratio));
}