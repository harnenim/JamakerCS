function RECT() {
	this.top = 0;
	this.left = 0;
	this.right = 0;
	this.bottom = 0;
}

//윈도우 메시지 가상으로 구현
var WinAPI = {};
WinAPI.SendMessage = function(process, msg, wParam, lParam) {
	if (process && process.wndProc) {
		return process.wndProc({
				msg: msg
			,	wParam: wParam
			,	lParam: lParam
		});
	}
};
WinAPI.PostMessage = WinAPI.SendMessage;
WinAPI.SetForegroundWindow = function() {}
WinAPI.GetWindowRect = function(hwnd, offset) {
	if (!hwnd) return;
	if (hwnd.getOffset) {
		hwnd.getOffset(offset);
	} else if (hwnd.window) {
		if (hwnd.window.document) {
			offset.top = hwnd.window.screenTop;
			offset.left = hwnd.window.screenLeft;
			offset.right = offset.left + hwnd.window.outerWidth;
			offset.bottom = offset.top + hwnd.window.outerHeight;
		} else {
			hwnd.window.getOffset(offset);
		}
	}
}
WinAPI.MoveWindow = function(hwnd, x, y, w, h) {
	if (!hwnd ) return;
	if (h != null) {
		if (hwnd.resizeTo) {
			hwnd.resizeTo(w, h);
			hwnd.moveTo(x, y);
		} else if (hwnd.window) {
			hwnd.window.resizeTo(w, h);
			//hwnd.window.moveTo(x, y); // 왜 플레이어에서 moveTo가 동작 안 하지??
			if (hwnd.window.document) {
				hwnd.window.moveBy(x - hwnd.window.screenLeft, y - hwnd.window.screenTop);
			} else {
				hwnd.window.moveTo(x, y);
			}
		}
	} else {
		var offset = w ? w : new RECT();
		WinAPI.GetWindowRect(hwnd, offset);
		offset.left += x;
		offset.top += y;
		offset.right += x;
		offset.bottom += y;
		WinAPI.MoveWindow(hwnd
			,	offset.left
			,	offset.top
			,	offset.right - offset.left
			,	offset.bottom - offset.top
			,	true
		);
	}
}