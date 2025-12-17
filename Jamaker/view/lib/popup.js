document.addEventListener("keydown", function(e) {
	switch (e.key) {
		case "Escape": {
			requestClose();
			break;
		}
	}
});

window._close = window.close;
window.close = () => {
	if (windowName != "finder") {
		(opener ? opener.binder : binder).focus("editor");
	}
	if (opener) {
		window._close();
	}
};

// 종료 전 확인 필요한 경우 override
function requestClose() {
	window.close();
}

function confirmCancel() {
	confirm("작업을 취소하시겠습니까?"
	,	() => {
			window.close();
		}
	);
}

// 메인 폼에서 보내주는 메시지, 경우에 따라 override
function sendMsg(msg) {
	alert(msg);
}

window.windowName = null;

// alert 재정의
window._alert = alert;
alert = (msg) => {
	if (windowName && opener && opener.binder) {
		opener.binder.alert(windowName, msg);
	} else if (windowName && window.binder) {
		binder.alert(windowName, msg);
	} else {
		_alert(msg);
	}
}
// confirm 재정의
window._confirm = confirm;
window.afterConfirmYes = () => {};
window.afterConfirmNo  = () => {};
confirm = (msg, yes, no) => {
	if (windowName) {
		if (opener) {
			opener.afterConfirmYes = yes ? yes : () => {};
			opener.afterConfirmNo  = no  ? no  : () => {};
			opener.binder.confirm(windowName, msg);
		} else {
			afterConfirmYes = yes ? yes : () => {};
			afterConfirmNo  = no  ? no  : () => {};
			if (window.binder) {
				binder.confirm(windowName, msg);
			} else {
				if (_confirm(msg)) {
					afterConfirmYes();
				} else {
					afterConfirmNo();
				}
			}
		}
	} else {
		const result = _confirm(msg);
		if (result) {
			if (yes) yes();
		} else {
			if (no) no();
		}
		return result;
	}
}

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
ready(() => {
	// 우클릭 방지
	document.addEventListener("contextmenu", (e) => {
		e.preventDefault();
	});
	[...document.getElementsByTagName("textarea")].forEach((input) => {
		input.setAttribute("spellcheck", false);
	});
	[...document.getElementsByTagName("input")].forEach((input) => {
		input.setAttribute("autocomplete", "off");
	});
});

// opener가 있는 addon에서만 쓰임
window.loadAddonSetting = null;
window.saveAddonSetting = null;
if (opener) {
	opener.afterLoadAddonSetting = () => {};
	loadAddonSetting = (name, afterLoad) => {
		opener.afterLoadAddonSetting = afterLoad ? afterLoad : () => {};
		opener.binder.loadAddonSetting(name);
	}
	
	opener.afterSaveAddonSetting = () => {};
	saveAddonSetting = (name, text, afterSave) => {
		opener.afterSaveAddonSetting = afterSave ? afterSave : () => {};
		opener.binder.saveAddonSetting(name, text);
	}
} else {
	// 프레임 샘플에선 opener가 나중에 추가됨
	ready(() => {
		if (opener) {
			opener.afterLoadAddonSetting = () => {};
			loadAddonSetting = (name, afterLoad) => {
				opener.afterLoadAddonSetting = afterLoad ? afterLoad : () => {};
				opener.binder.loadAddonSetting(name);
			}
			
			opener.afterSaveAddonSetting = () => {};
			saveAddonSetting = (name, text, afterSave) => {
				opener.afterSaveAddonSetting = afterSave ? afterSave : () => {};
				opener.binder.saveAddonSetting(name, text);
			}
		}
	});
}

function setColor(color) {
	fetch("lib/popup.color.css").then(async (response) => {
		let preset = await response.text();
		for (let name in color) {
			preset = preset.replaceAll("[" + name + "]", color[name]);
		}
		if (!window.$style) {
			document.head.append($style = document.createElement("style"));
		}
		$style.innerHTML = preset;
	});
}
