$(document).on("keydown", function(e) {
	switch (e.keyCode) {
		case 27: { // Esc
			requestClose();
			break;
		}
	}
});

window._close = window.close;
window.close = function() {
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
	,	function() {
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
alert = function(msg) {
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
window.afterConfirmYes = function() {};
window.afterConfirmNo  = function() {};
confirm = function(msg, yes, no) {
	if (windowName) {
		if (opener) {
			opener.afterConfirmYes = yes ? yes : function() {};
			opener.afterConfirmNo  = no  ? no  : function() {};
			opener.binder.confirm(windowName, msg);
		} else {
			afterConfirmYes = yes ? yes : function() {};
			afterConfirmNo  = no  ? no  : function() {};
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

// opener가 있는 addon에서만 쓰임
let loadAddonSetting;
let saveAddonSetting;
if (opener) {
	opener.afterLoadAddonSetting = function(){};
	loadAddonSetting = function(name, afterLoad) {
		opener.afterLoadAddonSetting = afterLoad ? afterLoad : function(){};
		opener.binder.loadAddonSetting(name);
	}
	
	opener.afterSaveAddonSetting = function(){};
	saveAddonSetting = function(name, text, afterSave) {
		opener.afterSaveAddonSetting = afterSave ? afterSave : function(){};
		opener.binder.saveAddonSetting(name, text);
	}
}

$(function () {
	$("textarea").attr({ spellcheck: false });
});
