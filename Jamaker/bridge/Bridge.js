// 팟플레이어 SDK 값 가져옴
const WM_USER = 0x0400;
const POT_COMMAND = WM_USER;

const POT_GET_CURRENT_TIME = 0x5004;
const POT_SET_CURRENT_TIME = 0x5005;
const POT_SET_PLAY_STATUS  = 0x5007;
const POT_SET_PLAY_CLOSE   = 0x5009;

const POT_GET_VIDEO_FPS    = 0x6032;

const POT_GET_PLAYFILE_NAME= 0x6020;
const POT_SET_PLAYFILE     =   1000;

function WebPlayerBridge() {
	this.hwnd = this.findPlayer();
	this.initialOffset = new RECT();
	this.currentOffset = new RECT();
}
{	// abstract class PlayerBridge
	WebPlayerBridge.prototype.sendMessage = function(wMsg, wParam, lParam) {
		return this.hwnd ? WinAPI.SendMessage(this.hwnd, wMsg, wParam, lParam) : 0;
	}
	
	WebPlayerBridge.prototype.checkAndRefreshPlayer = function() {
		// 샘플에선 플레이어 값 무조건 존재
		return true;
	}
	
	WebPlayerBridge.prototype.getWindowInitialPosition = function() {
		WinAPI.GetWindowRect(this.hwnd, this.initialOffset);
		return (this.initialOffset.top + 100 < this.initialOffset.bottom) ? this.initialOffset : null;
	}
	WebPlayerBridge.prototype.getWindowPosition = function() {
		WinAPI.GetWindowRect(this.hwnd, this.currentOffset);
		return this.currentOffset;
	}
	
	// 종료 전 플레이어 원위치
	WebPlayerBridge.prototype.resetPosition = function() {
		if (this.initialOffset.top + 100 < this.initialOffset.bottom) {
			WinAPI.MoveWindow(this.hwnd, this.initialOffset.left, this.initialOffset.top, this.initialOffset.right - this.initialOffset.left, this.initialOffset.bottom - this.initialOffset.top), true;
		}
	}
	WebPlayerBridge.prototype.moveWindow = function(x=-11111, y=-111111) {
		if (x == -11111 || y == -11111) {
			// 프로그램 설정에 따른 위치로
			WinAPI.MoveWindow(this.hwnd
					, this.currentOffset.left
					, this.currentOffset.top
					, this.currentOffset.right - this.currentOffset.left
					, this.currentOffset.bottom - this.currentOffset.top
					);
		} else {
			this.currentOffset.left += x;
			this.currentOffset.top += y;
			this.currentOffset.right += x;
			this.currentOffset.bottom += y;
			this.moveWindow();
		}
	}
	
	WebPlayerBridge.prototype.doExit = function() {
		WinAPI.postMessage(this.hwnd, 0x0010, 0, 0);
	}
	
	WebPlayerBridge.prototype.findPlayer    = function() { }
	WebPlayerBridge.prototype.openFile  = function(path) { }
	WebPlayerBridge.prototype.getFps        = function() { }
	WebPlayerBridge.prototype.playOrPause   = function() { }
	WebPlayerBridge.prototype.pause         = function() { }
	WebPlayerBridge.prototype.play          = function() { }
	WebPlayerBridge.prototype.stop          = function() { }
	WebPlayerBridge.prototype.getTime       = function() { }
	WebPlayerBridge.prototype.moveTo    = function(time) { }
}
{	// override
	WebPlayerBridge.prototype.findPlayer = function() {
		if (!this.hwnd) {
			this.hwnd = {
				wndProc: function(m) {
					if (this.window) {
						if (this.window.wndProc) {
							return this.window.wndProc(m);
						}
						if (this.window.iframe && this.window.iframe.contentWindow && this.window.iframe.contentWindow.wndProc) {
							return this.window.iframe.contentWindow.wndProc(m);
						}
					}
					return null;
				}
			,	run: function() {
					if (this.window && this.window.name) {
						return;
					}
					this.window = window.open(location.href.substring(0, location.href.lastIndexOf("/")) + "/bridge/player.html", "player", "scrollbars=no,location=no");
					if (this.window) {
						if (this.window.document) {
							this.window.document.title = "플레이어";
						} else if (this.window.setTitle) {
							this.window.setTitle("플레이어");
						}
					}
				}
			}
		}
		return this.hwnd;
	}
	WebPlayerBridge.prototype.openFile = function(path) {
		/* native */
	}
	WebPlayerBridge.prototype.getFileName = function() {
		alert("이 플레이어에선 지원되지 않습니다.");
	}
	WebPlayerBridge.prototype.getFps      = function() { return this.sendMessage(POT_COMMAND, POT_GET_VIDEO_FPS   , 0); }
	WebPlayerBridge.prototype.playOrPause = function() { return this.sendMessage(POT_COMMAND, POT_SET_PLAY_STATUS , 0); }
	WebPlayerBridge.prototype.pause       = function() { return this.sendMessage(POT_COMMAND, POT_SET_PLAY_STATUS , 1); }
	WebPlayerBridge.prototype.play        = function() { return this.sendMessage(POT_COMMAND, POT_SET_PLAY_STATUS , 2); }
	WebPlayerBridge.prototype.stop        = function() { return this.sendMessage(POT_COMMAND, POT_SET_PLAY_CLOSE  , 0); }
	WebPlayerBridge.prototype.getTime     = function() { return this.sendMessage(POT_COMMAND, POT_GET_CURRENT_TIME, 1); }
	WebPlayerBridge.prototype.moveTo  = function(time) { return this.sendMessage(POT_COMMAND, POT_SET_CURRENT_TIME, time); }
}
