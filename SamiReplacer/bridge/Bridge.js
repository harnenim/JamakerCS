// 팟플레이어 SDK 값 가져옴
var WM_USER = 0x0400;
var POT_COMMAND = WM_USER;

var POT_GET_CURRENT_TIME = 0x5004;
var POT_SET_CURRENT_TIME = 0x5005;
var POT_SET_PLAY_STATUS  = 0x5007;
var POT_SET_PLAY_CLOSE   = 0x5009;

var POT_GET_VIDEO_FPS    = 0x6032;

var POT_GET_PLAYFILE_NAME= 0x6020;
var POT_SET_PLAYFILE     =   1000;

function WebPlayerBridge() {
	this.hwnd = this.findPotPlayer();
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
	WebPlayerBridge.prototype.moveWindow = function(x, y) {
		if (x == null || y == null) {
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
	
	WebPlayerBridge.prototype.findPotPlayer = function() { }
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
	WebPlayerBridge.prototype.findPotPlayer = function() {
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

/*
var player = {}; // 가상 플레이어
{
	player.wndProc = function(m) {
		switch (m.wParam) {
			case POT_SET_PLAY_STATUS : {
				return this.setStatus(m.lParam);
			}
			case POT_SET_PLAY_CLOSE : {
				return this.stop();
			}
			case POT_SET_PLAY_ORDER  : {
				return this.move(m.lParam);
			}
			case POT_GET_CURRENT_TIME: {
				return this.getTime();
			}
			case POT_SET_CURRENT_TIME: {
				return this.moveTo(m.lParam);
			}
			case POT_GET_VIDEO_FPS   : {
				return this.getFps();
			}
			case 0x0010: {
				this.window.close();
				break;
			}
		}
	};
	
	//base: 재생 시간 계산 기준점
	//paused: 일시정지된 위치
	player.base = new Date().getTime();
	player.paused = player.base;
	player.setStatus = function(stat) {
		switch (stat) {
		case 0: return this.playOrPause();
		case 1: return this.pause();
		case 2: return this.play();
		}
	}
	player.getStatus = function() {
		if (this.paused == 0) {
			return 2; // 재생
		}
		if (this.paused <= this.base) {
			return 0; // 정지
		}
		return 1; // 일시정지
	}
	player.playOrPause = function() {
		// toggle은 있더라도 쓰면 안 됨
		if (this.paused) {
			this.play();
		} else {
			this.pause();
		}
	}
	player.play = function() {
		if (this.paused == 0) return; // 재생 중
		
		if (this.paused <= this.base) {
			// 정지 상태
			this.base = new Date().getTime();
		} else {
			// 일시정지 상태
			this.base += new Date().getTime() - this.paused;
		}
		this.paused = 0;
	}
	player.pause = function() {
		if (this.paused) return;
		this.paused = new Date().getTime();
	}
	player.stop = function() {
		this.base = this.paused = new Date().getTime();
	}
	player.getTime = function() {
		return (this.paused ? this.paused : new Date().getTime()) - this.base;
	}
	player.moveTo = function(time) {
		var time = Math.max(0, time);
		var now = new Date().getTime();
		this.base = now - time;
		if (this.paused) {
			this.paused = now;
		}
	}
	player.getFps = function() {
		return 23976;
	}
	player.run = function() {
		this.window = window.open("about:blank", "player", "scrollbars=no,location=no");
		if (this.window) {
			this.window.document.title = "플레이어";
			setInterval(function() {
				player.refresh();
			}, 10);
		}
	}
	player.refresh = function() {
		var h = this.getTime();
		if (h == this.time) return;
		this.time = h;
		
		var ms = h % 1000; h = (h - ms) / 1000;
		var s  = h %   60; h = (h -  s) /   60;
		var m  = h %   60; h = (h -  m) /   60;
		this.window.document.body.innerHTML = ("player: " + h + ":" + (m>9?"":"0")+m + ":" + (s>9?"":"0")+s + "." + Math.floor(ms / 100));
	};
}
{
	player.wndProc = function(m) {
		return (this.window && this.window.wndProc) ? this.window.wndProc(m) : null;
	};
	player.run = function() {
		if (this.window && this.window.name) {
			return;
		}
		this.window = window.open(location.href.split("index.html")[0] + "view/player.html", "player", "scrollbars=no,location=no");
		if (this.window) {
			this.window.document.title = "플레이어";
		}
	}
}
*/