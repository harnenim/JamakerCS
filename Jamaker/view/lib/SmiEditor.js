// TODO: 자동으로 구해지도록?
var LH = 20; // LineHeight
var SB = 16; // ScrollBarWidth

var LINE = {
		TEXT: 0
	,	SYNC: 1
	,	TYPE: 2
};
var TYPE = {
		TEXT: null
	,	BASIC: 1
	,	FRAME: 2
	,	RANGE: 3
};
var TIDs = [null, "", " ", "	"];
function linesToText(lines) {
	var textLines = [];
	for (var i = 0; i < lines.length; i++) {
		textLines.push(lines[i][LINE.TEXT]);
	}
	return textLines.join("\n");
}

var SmiEditor = function(text) {
	var editor = this;

	this.initialize = false;
	this.area = $("<div class='hold'>");
	this.area.append(this.colSync = $("<div class='col-sync'>"));
	this.area.append($("<div class='col-sync' style='background: transparent;'>")); // 블록지정 방지 영역
//	this.area.append(this.input = $("<textarea class='input' spellcheck='false'>"));
	{	// 문법 하이라이트 기능 지원용
		this.hArea = $("<div class='input highlight-textarea hljs" + (SmiEditor.useHighlight ? "" : " nonactive") + "'>");
		this.hArea.append($("<div>").append(this.hview = $("<div>")));
		this.hArea.append(this.input = $("<textarea spellcheck='false'>"));
		this.area.append(this.hArea);
	}
	this.colSync.html('<span class="sync"><br /></span>');
	if (text) {
		text = text.split("\r\n").join("\n");
		
		// 싱크 라인 분리되도록 양식 변환
		var lines = text.split("\n");
		var newLines = [];
		var cnt = 0;
		for (var i = 0; i < lines.length; i++) {
			var line = lines[i];
			if (line.substring(0, 6).toUpperCase() == "<SYNC ") {
				var blocks = line.split(">");
				for (var j = 1; j < blocks.length; j++) {
					if (blocks[j].substring(0, 6).toUpperCase() == "<SYNC ") continue;
					if (blocks[j].substring(0, 3).toUpperCase() == "<P ") continue;
					
					var syncLine = blocks.splice(0, j).join(">") + ">";
					line = blocks.join(">");
					if (line.length) {
						newLines.push(syncLine);
						cnt++;
					} else {
						line = syncLine;
					}
					break;
				}
			}
			newLines.push(line);
		}
		if (cnt) {
			text = newLines.join("\n");
		}
		
		this.input.val(text);
		this.setCursor(0)
		this.saved = text;
	} else {
		this.saved = "";
	}
	
	this.text = "";
	this.lines = [["", 0, TYPE.TEXT]];
	this.highlightLines = [];
	
	this.syncUpdating = false;
	this.needToUpdateSync = false;
	
	this.bindEvent();
	
	this.history = new History(this.input, 32, function() {
		editor.scrollToCursor();
		editor.updateSync([0, editor.lines.length]); // 실행취소일 땐 전체 갱신하도록
	});
	setTimeout(function() {
		if (SmiEditor.autoComplete.length) {
			editor.act = new AutoCompleteTextarea(editor.input, SmiEditor.autoComplete, function() {
				editor.history.log();
				editor.updateSync(null, 1);
			});
		}
	}, 1);
};

SmiEditor.setSetting = function(setting) {
	if (setting.sync) {
		SmiEditor.sync = setting.sync;
	}
	SmiEditor.useHighlight = setting.highlight && setting.highlight.parser;
	SmiEditor.showEnter = setting.highlight.enter;
	
	{	// AutoComplete
		for (var key in SmiEditor.autoComplete) {
			delete SmiEditor.autoComplete[key];
		}
		if (setting.autoComplete) {
			for (var key in setting.autoComplete) {
				SmiEditor.autoComplete[key] = setting.autoComplete[key];
			}
		}
	}

	{	// 단축키
		var withs = ["withCtrls", "withAlts", "withCtrlAlts", "withCtrlShifts"];
		var keys = "pqrstuvwxyz{ABCDEFGHIJKLMKNOPQRSTUVWXYZ1234567890";
		SmiEditor.fn = setting.command ? setting.command.fn : {}; // F숫자 조합은 기본값 추가 없이 그대로 사용
		
		// 설정값 초기화
		for (var i = 0; i < withs.length; i++) {
			var command = SmiEditor[withs[i]] = { reserved: "" /* 설정에서 건드릴 수 없는 예약 단축키 */ };
			for (var j = 0; j < keys.length; j++) {
				command[keys[j]] = " ";
			}
		}
		
		// 기본 단축키
		SmiEditor.withCtrls["A"] = null;
		SmiEditor.withCtrls["C"] = null;
		SmiEditor.withCtrls["V"] = null;
		SmiEditor.withCtrls["X"] = null;
		SmiEditor.withCtrls.reserved += "ACVX";
		SmiEditor.withAlts["s"] = null; // Alt+F4
		SmiEditor.withAlts.reserved += "s";

		// 메뉴
		if (setting.menu) {
			for (var i = 0; i < setting.menu.length; i++) {
				var menu = setting.menu[i][0];
				var index = menu.indexOf("&") + 1;
				if (index > 0 && index < menu.length) {
					var key = menu[index];
					if ("A" <= key && key <= "Z") {
						SmiEditor.withAlts[key] = "/*메뉴 접근*/ binder.focusToMenu(" + key.charCodeAt() + ");";
						SmiEditor.withAlts.reserved += key;
					}
				}
			}
		}
		
		// 예약 단축키
		SmiEditor.withCtrls["F"] = "/* 찾기           */ SmiEditor.Finder.open();";
		SmiEditor.withCtrls["H"] = "/* 바꾸기         */ SmiEditor.Finder.openChange();";
		SmiEditor.withCtrls["Y"] = "/* 다시 실행      */ editor.history.forward();";
		SmiEditor.withCtrls["Z"] = "/* 실행 취소      */ editor.history.back();";
		SmiEditor.withCtrls.reserved += "FHYZ";
		
		// 설정값 반영
		if (setting.command) {
			for (var i = 0; i < withs.length; i++) {
				var withCmd = withs[i];
				var command = setting.command[withCmd];
				for (var key in command) {
					var func = command[key];
					if (func) {
						SmiEditor[withCmd][key] = func;
					}
				}
			}
		}
	}
}

SmiEditor.sync = {
	insert: 1 // 싱크 입력 시 커서 이동
,	update: 2 // 싱크 수정 시 커서 이동
,	weight: -450 // 가중치 설정
,	unit: 42 // 싱크 조절량 설정
,	move: 2000 // 앞으로/뒤로
,	lang: "KRCC" // 그냥 아래 preset 설정으로 퉁치는 게 나은가...?
,	preset: "<Sync Start={sync}><P Class={lang}{type}>" // TODO: 설정할 때 문법 경고?
,	frame: true
};
SmiEditor.autoComplete = [];
SmiEditor.PlayerAPI = {
		playOrPause: function(    ) { binder.playOrPause(); }
	,	play       : function(    ) { binder.play(); }
	,	stop       : function(    ) { binder.stop(); }
	,	moveTo     : function(time) { binder.moveTo(time); }
	,	move       : function(move) { binder.moveTo(time + move); }
};
SmiEditor.limitKeyFrame = 200;
SmiEditor.trustKeyFrame = false;
SmiEditor.followKeyFrame = false;
SmiEditor.video = {
		path: null
	,	FR: 23976 // 기본값 23.976fps
	,	FL: 1000000 / 23976
	,	fs: []
	,	kfs: []
}
SmiEditor.findSync = function(sync, fs=[], from=0, to=-1) {
	if (fs.length == 0) return null;
	if (to < 0) to = fs.length;
	if (from + 1 == to) {
		var dist0 = sync - fs[from];
		var dist1 = fs[to] - sync;
		if (dist0 <= dist1) {
			return fs[from];
		} else {
			return fs[to];
		}
	}
	var mid = from + Math.floor((to - from) / 2);
	if (fs[mid] < sync) {
		return SmiEditor.findSync(sync, fs, mid, to);
	} else {
		return SmiEditor.findSync(sync, fs, from, mid);
	}
}
SmiEditor.getSyncTime = function(sync, forKeyFrame=false, output={}) {
	if (!sync) sync = (time + SmiEditor.sync.weight);
	if (SmiEditor.sync.frame) { // 프레임 단위 싱크 보정
		var adjustSync = null;
		if (SmiEditor.trustKeyFrame // 키프레임 신뢰
		 && (forKeyFrame || SmiEditor.followKeyFrame) // 화면 싱크, 혹은 키프레임 따라가게 설정된 경우
		 && SmiEditor.video.kfs.length > 2
		) {
			adjustSync = SmiEditor.findSync(sync, SmiEditor.video.kfs);
			var dist = Math.abs(adjustSync - sync);
			if (dist > SmiEditor.limitKeyFrame) { // 기준치 넘어가면 키프레임에 맞춘 게 아니라고 간주
				adjustSync = null;
			} else {
				output.keyframe = true;
			}
		}
		if (adjustSync == null && SmiEditor.video.fs.length > 2) { // 프레임 싱크
			adjustSync = SmiEditor.findSync(sync, SmiEditor.video.fs);
			var dist = Math.abs(adjustSync - sync);
			if (dist > SmiEditor.limitKeyFrame) { // 기준치 넘어가면 프레임 정보가 잘못된 걸로 간주
				adjustSync = null;
			}
		}
		if (adjustSync) { // 보정 완료
			sync = adjustSync;
		} else { // FPS 기반 보정
			sync = Math.floor(Math.floor((sync / SmiEditor.video.FL) + 0.5) * SmiEditor.video.FL);
		}
		sync = Math.max(1, sync); // 0 이하는 허용하지 않음
	}
	return output.sync = sync;
}
SmiEditor.makeSyncLine = function(time, type) {
	return SmiEditor.sync.preset.split("{sync}").join(Math.floor(time)).split("{lang}").join(SmiEditor.sync.lang).split("{type}").join(TIDs[type ? type : 1]);
}

SmiEditor.prototype.isSaved = function() {
	return (this.saved == this.input.val());
};
SmiEditor.prototype.afterSave = function() {
	this.saved = this.input.val();
	this.afterChangeSaved(true);
};
SmiEditor.prototype.afterChangeSaved = function(saved) {
	if (this.onChangeSaved) {
		this.onChangeSaved(saved);
	}
}

SmiEditor.prototype.bindEvent = function() {
	var editor = this;
	
	// 내용에 따라 싱크 표시 동기화
	this.input.on("input propertychange", function () {
		editor.updateSync();
	});
	this.updateSync();
	
	// 싱크 스크롤 동기화
	this.input.on("scroll", function(e) {
		editor.colSync.scrollTop(editor.input.scrollTop());
		editor.hview.css({
			marginTop : -editor.input.scrollTop ()
		,	marginLeft: -editor.input.scrollLeft()
		});
	});
	
	// 개발용 임시
	this.input.on("keypress", function(e) {
		//console.log(e.keyCode);
	});
	
	this.input.on("mousedown", function(e) {
		editor.history.log();
	});
};

SmiEditor.selected = null;
SmiEditor.keyEventActivated = false;
SmiEditor.activateKeyEvent = function() {
	if (SmiEditor.keyEventActivated) return;
	SmiEditor.keyEventActivated = true;
	
	var lastKeyDown = 0;
	$(document).on("keydown", function(e) {
		lastKeyDown = e.keyCode;
		var editor = SmiEditor.selected;
		var hasFocus = editor && editor.input.is(":focus");
		
		if (!editor || !editor.act || editor.act.selected < 0) { // auto complete 작동 중엔 무시
			switch (e.keyCode) {
				case 33: { // PgUp
					if (hasFocus) {
						if (!e.shiftKey) {
							// 크로뮴에서 횡스크롤이 오른쪽으로 튀는 버그 존재
							editor.fixScrollAroundEvent();
						}
						editor.history.logIfCursorMoved();
					}
					break;
				}
				case 34: { // PgDn
					if (hasFocus) {
						if (!e.shiftKey) {
							// 크로뮴에서 횡스크롤이 오른쪽으로 튀는 버그 존재
							editor.fixScrollAroundEvent();
						}
						editor.history.logIfCursorMoved();
					}
					break;
				}
				case 35: { // End
					if (hasFocus) {
						if (!e.ctrlKey) {
							// 공백 줄일 경우 End키 이벤트 방지
							// ※ 크로뮴 textarea 공백줄에서 End키 누르면 커서가 다음 줄로 내려가는 버그
							//    어이 없는 게, IE에서 똑같이 하면 커서가 윗줄로 올라감(...)
							// 블록지정일 경우 selectionStart가 문제될 수도 있긴 한데... 그렇게 쓰는 경우는 거의 없을 듯
							var text = editor.input.val();
							var index = editor.input[0].selectionEnd;
							if (((index == 0) || (text[index-1] == '\n')) && (text[index] == '\n')) {
								e.preventDefault();
							}
						}
					}
					break;
				}
				case 38: { // ↑
					if (e.shiftKey) {
						if (e.ctrlKey) {
							if (e.altKey) {
								
							} else {
								// 싱크 이동
								if (editor) {
									e.preventDefault();
									editor.moveSync(true);
									return;
								}
							}
						}
					} else {
						if (e.ctrlKey) {
							if (e.altKey) {
								
							} else {
								// 스크롤 이동
								if (hasFocus) {
									e.preventDefault();
									editor.input.scrollTop(Math.max(0, editor.input.scrollTop() - LH));
									return;
								}
							}
						} else {
							if (e.altKey) {
								// 줄 이동
								if (hasFocus) {
									e.preventDefault();
									editor.moveLine(false);
									return;
								}
							} else {
								
							}
						}
					}
					if (hasFocus) {
						// 커서가 맨 윗줄일 경우 맨 앞으로 가는 이벤트 방지(크로뮴 버그? 기능?)
						// 블록지정일 경우 애매...
						if (editor.input.val().substring(0, editor.input[0].selectionEnd).indexOf("\n") < 0) {
							e.preventDefault();
						} else {
							editor.history.logIfCursorMoved();
						}
					}
					return;
				}
				case 40: { // ↓
					if (e.shiftKey) {
						if (e.ctrlKey) {
							if (e.altKey) {
								
							} else {
								// 싱크 이동
								if (editor) {
									e.preventDefault();
									editor.moveSync(false);
									return;
								}
							}
						}
					} else {
						if (e.ctrlKey) {
							if (e.altKey) {
								
							} else {
								// 스크롤 이동
								if (hasFocus) {
									e.preventDefault();
									editor.input.scrollTop(editor.input.scrollTop() + LH);
									return;
								}
							}
						} else {
							if (e.altKey) {
								// 줄 이동
								if (hasFocus) {
									e.preventDefault();
									editor.moveLine(true);
									return;
								}
							} else {
								
							}
						}
					}
					if (hasFocus) {
						// 커서가 맨 아랫줄일 경우 맨 뒤로 가는 이벤트 방지(크로뮴 버그? 기능?)
						// 블록지정일 경우 애매...
						if (editor.input.val().substring(editor.input[0].selectionStart).indexOf("\n") < 0) {
							e.preventDefault();
						} else {
							editor.history.logIfCursorMoved();
						}
					}
					return;
				}
				case 37: { // ←
					if (e.shiftKey) {
						if (e.ctrlKey) {
							if (e.altKey) {
								
							} else {
								// 왼쪽으로 이동
								if (hasFocus) {
									e.preventDefault();
									editor.moveToSide(-1);
								}
							}
						}
					} else {
						if (e.ctrlKey) {
							if (e.altKey) {
								
							} else {
							}
						} else {
							if (e.altKey) {
								// 뒤로
								e.preventDefault();
								SmiEditor.PlayerAPI.move(-SmiEditor.sync.move);
								SmiEditor.PlayerAPI.play();
								
							} else {
								
							}
						}
					}
					if (hasFocus) {
						editor.history.logIfCursorMoved();
					}
					return;
				}
				case 39: { // →
					if (e.shiftKey) {
						if (e.ctrlKey) {
							if (e.altKey) {
								
							} else {
								// 오른쪽으로 이동
								if (hasFocus) {
									e.preventDefault();
									editor.moveToSide(1);
								}
							}
						}
					} else {
						if (e.ctrlKey) {
							if (e.altKey) {
								
							} else {
							}
						} else {
							if (e.altKey) {
								// 앞으로
								e.preventDefault();
								SmiEditor.PlayerAPI.move(SmiEditor.sync.move);
								SmiEditor.PlayerAPI.play();
								
							} else {
								
							}
						}
					}
					if (hasFocus) {
						editor.history.logIfCursorMoved();
					}
					return;
				}
				case 9: { // Tab
					e.preventDefault();
					if (hasFocus) {
						editor.inputTextLikeNative("\t"); // TODO: 횡스크롤 이동 안 되고 있음...
					}
					break;
				}
				case 13: { // Enter
					if (hasFocus) {
						if (e.ctrlKey) { // Ctrl+Enter → <br>
							e.preventDefault();
							editor.insertBR();
						} else {
							// 크로뮴 textarea 줄바꿈 스크롤 버그...
							editor.fixScrollAroundEvent(0);
						}
					}
					break;
				}
				case 8: { // Backspace
					if (hasFocus) {
						if (e.ctrlKey) { // Ctrl+Backspace → 공백문자 그룹 삭제
							var text = editor.input.val();
							var cursor = editor.getCursor();
							if (cursor[0] == cursor[1]) {
								var delLen = 0;
								if (cursor[0] >= 12) {
									if (text.substring(cursor[0]-12, cursor[0]) == "<br><b>　</b>") {
										delLen = 12;
									}
								}
								if (!delLen && cursor[0] >= 8) {
									if (text.substring(cursor[0]- 8, cursor[0]) == "<b>　</b>") {
										delLen = 8;
									}
								}
								if (!delLen && cursor[0] >= 4) {
									if (text.substring(cursor[0]- 4, cursor[0]) == "<br>") {
										delLen = 4;
									}
								}
								if (!delLen && cursor[0] >= 3 && text[cursor[0]-1] == ">") {
									var prev = text.substring(0, cursor[0]);
									var index = prev.lastIndexOf("<");
									if (index >= 0) {
										delLen = cursor[0] - index;
									}
								}
								if (!delLen && cursor[0] >= 4 && text[cursor[0]-1] == ";") {
									var prev = text.substring(0, cursor[0]);
									var index = prev.lastIndexOf("&");
									if (index >= 0) {
										delLen = cursor[0] - index;
										if (delLen > 10) { // &~~; 형태가 열 글자를 넘진 않음
											delLen = 0;
										}
									}
								}
								if (delLen) {
									e.preventDefault();
									editor.input.val(text.substring(0, cursor[0] - delLen) + text.substring(cursor[0]));
									
									cursor = cursor[0]-delLen;
									editor.setCursor(cursor);
									editor.updateSync();
									editor.scrollToCursor();
								}
							}
						}
					}
					break;
				}
				case 46: { // Delete
					if (hasFocus) {
						if (e.ctrlKey) { // Ctrl+Delete → 공백문자 그룹 삭제
							var text = editor.input.val();
							var cursor = editor.getCursor();
							if (cursor[0] == cursor[1]) {
								var delLen = 0;
								if (cursor[0] + 12 <= text.length) {
									if (text.substring(cursor[0], cursor[0]+12) == "<br><b>　</b>") {
										delLen = 12;
									}
								}
								if (!delLen && cursor[0] + 8 <= text.length) {
									if (text.substring(cursor[0], cursor[0]+ 8) == "<b>　</b>") {
										delLen = 8;
									}
								}
								if (!delLen && cursor[0] + 4 <= text.length) {
									if (text.substring(cursor[0], cursor[0]+ 4) == "<br>") {
										delLen = 4;
									}
								}
								if (!delLen && text[cursor[0]] == "<") {
									var index = text.indexOf(">", cursor[0]);
									if (index > 0) {
										delLen = index - cursor[0] + 1;
									}
								}
								if (!delLen && text[cursor[0]] == "&") {
									var index = text.indexOf(";", cursor[0]);
									if (index > 0) {
										delLen = index - cursor[0] + 1;
										if (delLen > 10) { // &~~; 형태가 열 글자를 넘진 않음
											delLen = 0;
										}
									}
								}
								if (delLen) {
									e.preventDefault();
									editor.input.val(text.substring(0, cursor[0]) + text.substring(cursor[0] + delLen));
									
									editor.setCursor(cursor[0]);
									editor.updateSync();
									editor.scrollToCursor();
								}
							}
						}
					}
				}
			}
			
			{	// 단축키 설정
				var f = null;
				var key = (e.keyCode == 192) ? '`' : String.fromCharCode(e.keyCode);
				if (e.shiftKey) {
					if (e.ctrlKey) {
						if (e.altKey) {
							
						} else {
							f = SmiEditor.withCtrlShifts[key];
						}
					}
				} else {
					if (e.ctrlKey) {
						if (e.altKey) {
							f = SmiEditor.withCtrlAlts[key];
						} else {
							f = SmiEditor.withCtrls[key];
							if (f == null) {
								if (key == "X") {
									// 잘라내기 전 상태 기억
									editor.history.log();
									
								} else if (key == "V") {
									// 붙여넣기 전 상태 기억
									editor.history.log();
									// 붙여넣기도 스크롤 버그 있음
									editor.fixScrollAroundEvent(0);
								}
							}
						}
					} else {
						if (e.altKey) {
							f = SmiEditor.withAlts[key];
						} else {
							f = SmiEditor.fn[key];
						}
					}
				}
				
				if (f) {
					e.preventDefault();
					if (!hasFocus && editor) editor.input.focus();
					
					var type = typeof f;
					if (type == "function") {
						f();
					} else if (type == "string") {
						eval("(function(){ " + f + "// */\n})()"); // 내용물이 주석으로 끝날 수도 있음
					}
				}
			}
		}
	}).on("keyup", function(e) {
		switch (e.keyCode) {
			case 18: {
				if (lastKeyDown == 18) {
					// Alt키만 눌렀다 뗐을 경우 메뉴에 포커스 넘기기
					e.preventDefault();
					binder.focusToMenu(0);
				}
				lastKeyDown = null;
				break;
			}
		}
	});
};

SmiEditor.prototype.getCursor = function() {
	return [this.input[0].selectionStart, this.input[0].selectionEnd];
}
SmiEditor.prototype.setCursor = function(start, end) {
	this.input[0].setSelectionRange(start, end ? end : start);
}
SmiEditor.prototype.scrollToCursor = function(lineNo) {
	var left = 0;
	if (typeof lineNo == "undefined") {
		var cursor = this.input[0].selectionEnd;
		var linesBeforeCursor = this.input.val().substring(0, cursor).split("\n");
		lineNo = linesBeforeCursor.length - 1;
		
		// 좌우 스크롤 계산
		left = this.getWidth(linesBeforeCursor[lineNo]);
	}
	var top = lineNo * LH;
	var scrollTop = this.input.scrollTop();
	if (top < scrollTop) { // 커서가 보이는 영역보다 위
		this.input.scrollTop(top);
	} else {
		top += LH + SB - this.input.css("height").split("px")[0] + 2; // .height()는 padding을 빼고 반환함
		if (top > scrollTop) { // 커서가 보이는 영역보다 아래
			this.input.scrollTop(top);
		}
	}
	
	var scrollLeft = this.input.scrollLeft();
	if (left < scrollLeft) { // 커서가 보이는 영역보다 왼쪽
		this.input.scrollLeft(left);
	} else {
		left += SB - this.input.width() + 2;
		if (left > scrollLeft) { // 커서가 보이는 영역보다 오른쪽
			this.input.scrollLeft(left);
		}
	}
	
	// 간헐적 에디터 외부 스크롤 버그 교정
	this.area.scrollTop(0);
}
SmiEditor.prototype.getWidth = function(text) {
	var checker = SmiEditor.prototype.widthChecker;
	if (!checker) {
		$("body").append(checker = SmiEditor.prototype.widthChecker = $("<span>"));
		checker.css({ "white-space": "pre" });
	}
	checker.css({ font: this.input.css("font") }).text(text).show();
	var width = checker.width();
	checker.hide();
	return width;
}

SmiEditor.prototype.fixScrollAroundEvent = function(scrollLeft) {
	// 원래 스크롤 기억
	var scrollTop = this.input.scrollTop();
	if (scrollLeft == undefined) {
		scrollLeft = this.input.scrollLeft()
	}
	var editor = this;
	setTimeout(function() {
		// 이벤트 진행 후 원래 스크롤 복원
		editor.input.scrollTop (scrollTop );
		editor.input.scrollLeft(scrollLeft);
		// 스크롤 이동 필요하면 이동
		editor.scrollToCursor();
	}, 1);
}

//사용자 정의 명령 지원
SmiEditor.prototype.getText = function() {
	return {"text": this.input.val()
		,	"selection": this.getCursor()
	};
}
SmiEditor.prototype.setText = function(text, selection) {
	this.history.log();
	
	this.input.val(text);
	if (selection) {
		this.setCursor(selection[0], selection[1]);
		this.scrollToCursor();
	} else {
		var cursor = this.input[0].selectionStart;
		this.setCursor(cursor);
	}
	
	this.history.log();
	this.updateSync();
}
SmiEditor.prototype.getLine = function() {
	var cursor = this.getCursor();
	var lines = this.input.val().substring(0, cursor[1]).split("\n");
	var lineNo = lines.length - 1;
	var selection = [Math.max(0, lines[lineNo].length - cursor[1] + cursor[0]), lines[lineNo].length];
	return {"text": this.lines[lineNo][LINE.TEXT]
		,	"selection": selection
	};
}
SmiEditor.prototype.setLine = function(text, selection) {
	this.history.log();
	
	var cursor = this.input[0].selectionEnd;
	var value = this.input.val();
	var lines = value.substring(0, cursor).split("\n");
	var lineNo = lines.length - 1;
	var offset = cursor - lines[lineNo].length;
	lines = value.split("\n");
	lines[lineNo] = text;
	this.input.val(lines.join("\n"));
	if (selection) {
		this.setCursor(offset + selection[0], offset + selection[1]);
	} else {
		this.setCursor(cursor);
	}
	
	this.history.log();
	this.updateSync();
}
SmiEditor.inputText = function(text) {
	if (SmiEditor.selected) {
		SmiEditor.selected.inputText(text);
	}
}
SmiEditor.prototype.inputText = function(input, standCursor) {
	var text = this.input.val();
	var selection = this.getCursor();
	var cursor = selection[0] + (standCursor ? 0 : input.length);
	this.setText(text.substring(0, selection[0]) + input + text.substring(selection[1]), [cursor, cursor]);
	this.scrollToCursor();
}
SmiEditor.prototype.inputTextLikeNative = function(input) {
	// TODO: 횡스크롤을 안 잡고 있음...
	// 좌우 스크롤까지 하는 건 연산량 부담...
	// 애초에 예외적인 경우에 필요한 기능이긴 한데...
	var text = this.input.val();
	var selection = this.getCursor();
	var cursor = selection[0] + input.length;
	this.input.val(text.substring(0, selection[0]) + input + text.substring(selection[1]));
	this.setCursor(cursor);
	this.updateSync();
	this.scrollToCursor();
}

SmiEditor.prototype.reSyncPrompt = function() {
	var editor = this;
	prompt("싱크 시작 시간을 입력하세요.", function(value) {
		if (!value || !isFinite(value)) {
			alert("잘못된 값입니다.");
			return;
		}
		editor.reSync(Number(value), true);
	});
}
SmiEditor.prototype.reSync = function(sync, limitRange) {
	if (this.syncUpdating) {
		return;
	}
	this.history.log();
	
	// 커서가 위치한 줄
	var cursor = this.input[0].selectionStart;
	var lineNo = this.input.val().substring(0, cursor).split("\n").length - 1;

	if (!sync) {
		sync = SmiEditor.getSyncTime();
	}
	
	// 적용 시작할 싱크 찾기
	var i = lineNo;
	for (; i < this.lines.length; i++) {
		if (this.lines[i][LINE.SYNC]) {
			break;
		}
	}
	if (i == this.lines.length) {
		// 적용할 싱크 없음
		return;
	}
	var add = sync - this.lines[lineNo = i][LINE.SYNC];
	var lines = this.lines.slice(0, lineNo);
	
	var limitLine = this.lines.length;
	if (limitRange) {
		var endCursor = this.input[0].selectionEnd;
		if (endCursor > cursor) {
			limitLine = this.input.val().substring(0, endCursor).split("\n").length;
		}
	}
	for (; i < this.lines.length; i++) {
		var line = this.lines[i];
		if (i < limitLine && line[LINE.SYNC]) {
			var sync = line[LINE.SYNC];
			var newSync = sync + add;
			lines.push([line[LINE.TEXT].split(sync).join(newSync), newSync, line[LINE.TYPE]]);
		} else {
			lines.push(line);
		}
	}
	
	this.input.val(linesToText(lines));
	this.setCursor(cursor);
	this.history.log();
	this.updateSync([lineNo, this.lines.length]);
}
SmiEditor.prototype.insertSync = function(forFrame) {
	if (this.syncUpdating) {
		return;
	}
	this.history.log();
	
	// 커서가 위치한 줄
	var cursor = this.input[0].selectionEnd;
	var lineNo = this.input.val().substring(0, cursor).split("\n").length - 1;
	
	var sync = {};
	SmiEditor.getSyncTime(null, forFrame, sync);
	forFrame = forFrame || sync.keyframe;
	sync = sync.sync;
	
	var lineSync = this.lines[lineNo][LINE.SYNC];
	if (lineSync) {
		// 싱크 수정
		var lineText = this.lines[lineNo][LINE.TEXT].split(lineSync).join(sync);
		var type = this.lines[lineNo][LINE.TYPE];
		// 여기서 토글은 없는 게 나을 듯... TODO: 설정으로?
		var toggleWithUpdate = false;
		if (toggleWithUpdate) {
			if (type == TYPE.BASIC && forFrame) {
				var index = lineText.lastIndexOf(">");
				if (index > 0) {
					lineText = lineText.substring(0, index) + " " + lineText.substring(index);
				}
				type = TYPE.FRAME;
			} else if (type == TYPE.FRAME && !forFrame) {
				lineText = lineText.split(" >").join(">");
				type = TYPE.BASIC;
			}
		} 
		cursor = 0;
		for (var i = 0; i < lineNo + SmiEditor.sync.update; i++) { // 싱크 찍은 다음 줄로 커서 이동
			cursor += this.lines[i][LINE.TEXT].length + 1;
		}
		this.input.val(linesToText(this.lines.slice(0, lineNo).concat([[lineText, sync, type]], this.lines.slice(lineNo + 1))));
		this.scrollToCursor(lineNo + SmiEditor.sync.update);
		
	} else {
		// 싱크 입력
		var inputLines = [];
		var type = forFrame ? TYPE.FRAME : TYPE.BASIC;
		var lineText = SmiEditor.makeSyncLine(sync, type);
		cursor = 0;
		for (var i = 0; i <= lineNo; i++) {
			cursor += this.lines[i][LINE.TEXT].length + 1;
		}
		
		// 윗줄 내용이 없으면 공백 싱크 채워주기
		// TODO: 설정이 필요한가...?
		var autoNbsp = true;
		if (autoNbsp) {
			if (lineNo > 0) {
				var prevLine = this.lines[lineNo-1];
				if (prevLine[LINE.SYNC]) {
					inputLines.push(["&nbsp;", 0, TYPE.TEXT]);
					cursor += 7;
				} else if (prevLine[LINE.TEXT].trim() == "") {
					cursor += 7 - prevLine[LINE.TEXT].length;
					prevLine[LINE.TEXT] = "&nbsp;";
				}
			}
		}
		
		if (SmiEditor.sync.insert > 0) { // 싱크 찍은 다음 줄로 커서 이동
			cursor += lineText.length + 1;
			for (var i = lineNo + 1; i < lineNo + SmiEditor.sync.insert; i++) {
				cursor += this.lines[i][LINE.TEXT].length + 1;
			}
			// 아랫줄 내용이 없으면 공백 싱크 채워주기
			// TODO: 설정이 필요한가...?
			if (autoNbsp) {
				if (this.lines[lineNo][LINE.TEXT].length == 0) {
					var nextLine = this.lines[lineNo + SmiEditor.sync.insert];
					if (nextLine && nextLine[LINE.TEXT].length) {
						this.lines[lineNo][LINE.TEXT] = "&nbsp;";
						cursor += 6;
					}
				}
			}
		}
		inputLines.push([lineText, sync, type]);
		
		this.input.val(linesToText(this.lines.slice(0, lineNo).concat(inputLines, this.lines.slice(lineNo))));
		this.scrollToCursor(lineNo + SmiEditor.sync.insert + 1);
	}
	this.setCursor(cursor);
	
	this.history.log();
	this.updateSync();
}
SmiEditor.prototype.toggleSyncType = function() {
	if (this.syncUpdating) {
		return;
	}
	this.history.log();
	
	var text = this.input.val();
	var cursor = this.input[0].selectionEnd;
	var lineNo = text.substring(0, cursor).split("\n").length - 1;
	
	for (var i = lineNo; i >= 0; i--) {
		if (this.lines[i][LINE.SYNC]) {
			var line = this.lines[i];
			var newLine = {}; newLine[LINE.SYNC] = line[LINE.SYNC];
			if (line[LINE.TYPE] == TYPE.BASIC) { // 화면 싱크 할당
				var index = line[LINE.TEXT].lastIndexOf(">");
				newLine[LINE.TEXT] = line[LINE.TEXT].substring(0, index) + " " + line[LINE.TEXT].substring(index);
				newLine[LINE.TYPE] = TYPE.FRAME;
				if (i < lineNo) cursor++;
			} else if (line[LINE.TYPE] == TYPE.FRAME) { // 화면 싱크 해제
				var index = line[LINE.TEXT].lastIndexOf(" >");
				newLine[LINE.TEXT] = line[LINE.TEXT].substring(0, index) + line[LINE.TEXT].substring(index + 1);
				newLine[LINE.TYPE] = TYPE.BASIC;
				if (i < lineNo) cursor--;
			} else {
				return;
			}
			this.input.val(text = linesToText(this.lines.slice(0, i).concat(newLine, this.lines.slice(i + 1))));
			this.updateSync();
			this.setCursor(cursor);
			
			this.history.log();
			this.afterMoveSync([i, i+1]);
			return;
		}
	}
}
SmiEditor.prototype.removeSync = function() {
	if (this.syncUpdating) {
		return;
	}
	this.history.log();
	
	var text = this.input.val();
	var range = this.getCursor();
	var lineRange = [text.substring(0, range[0]).split("\n").length - 1, text.substring(0, range[1]).split("\n").length - 1];
	
	// 해당 줄 앞뒤 전체 선택되도록 조정
	range[0] = 0;
	for (var i = 0; i <= lineRange[1]; i++) {
		var lineLength = this.lines[i][LINE.TEXT].length;
		if (i < lineRange[0]) {
			range[0] += lineLength + 1;
		} else if (i == lineRange[0]) {
			range[1] = range[0] + lineLength;
		} else {
			range[1] += lineLength + 1;
		}
	}
	
	var lines = this.lines.slice(0, lineRange[0]);
	var cnt = 0;
	for (var i = lineRange[0]; i <= lineRange[1]; i++) {
		if (this.lines[i][LINE.SYNC]) {
			range[1] -= this.lines[i][LINE.TEXT].length + 1;
			cnt++;
		} else {
			lines.push(this.lines[i]);
		}
	}
	this.input.val(linesToText(lines.concat(this.lines.slice(lineRange[1]+1))));
	this.setCursor(range[0], range[1]);
	this.scrollToCursor(lineRange[1] - cnt);

	this.history.log();
	this.updateSync();
}
SmiEditor.prototype.insertBR = function() {
	this.history.log();
	
	var text = this.input.val();
	var range = this.getCursor();
	var lines = text.substring(0, range[0]).split("\n");
	this.input.val(text.substring(0, range[0]) + "<br>" + text.substring(range[1]));
	range[1] = range[0] + 4;
	this.setCursor(range[1], range[1]);
	this.history.log();
	this.updateSync();
}
SmiEditor.prototype.moveToSync = function(add) {
	var cursor = this.input[0].selectionEnd;
	var lineNo = this.input.val().substring(0, cursor).split("\n").length - 1;
	if (typeof add != "number") {
		add = 0;
	}
	
	var sync = 0;
	for (var i = lineNo; i >= 0; i--) {
		if (this.lines[i][LINE.SYNC]) {
			sync = this.lines[i][LINE.SYNC];
			break;
		}
	}
	
	SmiEditor.PlayerAPI.play();
	SmiEditor.PlayerAPI.moveTo(sync + add);
}
SmiEditor.prototype.findSync = function(target) {
	if (!target) {
		target = time;
	}
	var lineNo = 0;
	for (var i = 0; i < this.lines.length; i++) {
		if (this.lines[i][LINE.TYPE]) {
			if (this.lines[i][LINE.SYNC] < target) {
				lineNo = i;
			} else {
				if (!lineNo) {
					lineNo = i - 1;
				} else {
					lineNo++;
				}
				break;
			}
		}
	}
	var cursor = this.text.split("\n").slice(0, lineNo).join("\n").length + 1;
	this.setCursor(cursor);
	this.scrollToCursor(lineNo);
}
SmiEditor.prototype.deleteLine = function() {
	if (this.syncUpdating) {
		return;
	}
	this.history.log();
	
	var text = this.input.val();
	var range = this.getCursor();
	if ((range[0] < range[1]) && (text[range[1] - 1] == "\n")) {
		range[1]--;
	}
	var lineRange = [text.substring(0, range[0]).split("\n").length - 1, text.substring(0, range[1]).split("\n").length - 1];
	var tmp = text.substring(0, range[0]).split("\n");
	var cursor = range[0] - tmp[tmp.length - 1].length;
	
	this.input.val(linesToText(this.lines.slice(0, lineRange[0]).concat(this.lines.slice(lineRange[1]+1))));
	this.setCursor(cursor);
	this.history.log();
	this.updateSync();
}

SmiEditor.prototype.tagging = function(tag, fromCursor) {
	if (typeof tag == "undefined") return;
	if (tag[0] != "<") return;
	if (tag.indexOf(">") != tag.length - 1) return;

	this.history.log();

	var index = tag.indexOf(" ");
	if (index < 0) index = tag.indexOf(">");
	var closer = "</" + tag.substring(1, index) + ">";
	
	var line = this.getLine();
	if (line.selection[0] == line.selection[1]) {
		if (fromCursor) {
			// 현재 위치부터 끝까지
			this.setLine(line.text.substring(0, line.selection[0]) + tag + line.text.substring(line.selection[0]) + closer
				,	[line.selection[0], line.text.length + tag.length + closer.length]);
		} else {
			// 현재 줄 전체
			this.setLine(tag + line.text + closer
				,	[0, line.text.length + tag.length + closer.length]);
		}
		
	} else {
		// 선택 영역에 대해
		var selected = line.text.substring(line.selection[0], line.selection[1]);
		if (selected.substring(0, tag.length) == tag && selected.substring(selected.length - closer.length) == closer) {
			this.setLine(line.text.substring(0, line.selection[0])
				+	selected.substring(tag.length, selected.length - closer.length)
				+	line.text.substring(line.selection[1])
				,	[line.selection[0], line.selection[1] - (tag.length + closer.length)]);
		} else {
			this.setLine(line.text.substring(0, line.selection[0])
				+	tag + selected + closer
				+	line.text.substring(line.selection[1])
				,	[line.selection[0], line.selection[1] + (tag.length + closer.length)]);
		}
	}
	this.history.log();
}
SmiEditor.prototype.taggingRange = function(tag) {
	this.tagging(tag, true);
}

SmiEditor.prototype.updateSync = function (range=null) {
	this.updateHighlight();

	if (this.syncUpdating) {
		// 이미 렌더링 중이면 대기열 활성화
		this.needToUpdateSync = true;
		this.afterChangeSaved(this.isSaved());
		return;
	}
	this.needToUpdateSync = false;
	this.syncUpdating = true;
	
	var text = this.input.val();
	
	if (text == this.text) {
		this.syncUpdating = false;
		this.afterChangeSaved(this.isSaved());
		return;
	}
	
	// 프로세스 분리할 필요가 있나?
	var self = this;
	var thread = function() {
		var textLines = text.split("\n");
		var syncLines = [];
		
		// 줄 수 변동량
		var add = textLines.length - self.lines.length;

		// 커서가 위치한 줄
		var lineNo = text.substring(0, self.input[0].selectionEnd).split("\n").length - 1;

		if (range) {
			// 바뀌지 않은 범위 제외
			for (; range[0] < range[1]; range[0]++) {
				if (textLines[range[0]] != self.lines[range[0]][LINE.TEXT]) {
					break;
				}
			}
			for (; range[1] > range[0]; range[1]--) {
				if (textLines[range[1] - 1 + add] != self.lines[range[1] - 1][LINE.TEXT]) {
					break;
				}
			}
			
		} else {
			// 커서 전후로 수정된 범위를 찾을 범위 지정
			range = [Math.max(0, (add < 0 ? lineNo+add : lineNo-add) - 1), Math.min(self.lines.length, (add < 0 ? lineNo-add : lineNo+add) + 1)];
			
			// 수정된 범위 찾기
			for (range[0] = 0; range[0] < range[1]; range[0]++) {
				if (textLines[range[0]] != self.lines[range[0]][LINE.TEXT]) {
					break;
				}
			}
			if (range[0] == range[1] && add == 0) {
				// 변동 없음
				self.syncUpdating = false;
				setTimeout(function() {
					if (self.needToUpdateSync) {
						// 렌더링 대기열 있으면 재실행
						self.updateSync();
					}
				}, 100);
				return;
			}
			var min = add > 0 ? range[0] : range[0] - add;
			for (range[1]--; range[1] > min; range[1]--) {
				if (textLines[range[1] + add] != self.lines[range[1]][LINE.TEXT]) {
					break;
				}
			}
			range[1]++;
		}
		
		// 수정된 범위 직후의 싱크 찾기
		for (i = range[1] + 1; i < self.lines.length; i++) {
			if (self.lines[i][LINE.TYPE]) {
				range[1] = ++i;
				break;
			}
		}
		
		var newLines = range[0]>0 ? self.lines.slice(0, range[0]) : [];
		var beforeSync = 0;
		for (var i = range[0] - 1; i >= 0; i--) {
			if (self.lines[i][LINE.SYNC]) {
				beforeSync = self.lines[i][LINE.SYNC];
				break;
			}
		}
		var lastSync = range[0]>0 ? self.colSync.find("span.sync:eq(" + (range[0] - 1) + ")") : [];
		var nextSync = null;
		for (var i = range[1]; i < self.lines.length; i++) {
			if (self.lines[i][LINE.SYNC]) {
				nextSync = [self.lines[i][LINE.SYNC], self.colSync.find("span.sync:eq(" + i + ")")];
				break;
			}
		}
		
		// 수정된 부분 삭제
		self.colSync.find("span.sync").each(function(i) {
			if (i < range[0]) return;
			if (i >= range[1]) return;
			var span = $(this);
			span.remove();
		});
		
		var toUpdate = textLines.length - (self.lines.length - range[1]) - range[0];
		for (var i = 0; i < toUpdate; i++) {
			newLines.push(["", 0, null]);
		}
		newLines = newLines.concat(self.lines.slice(range[1]));
		
		// 새로 그릴 범위 파싱
		// 싱크값을 제외하면 별도의 값을 취하지 않는 간이 파싱
		// SMI는 태그 꺽쇠 내에서 줄바꿈을 하는 경우는 일반적으로 없다고 가정
		// 이 가정이 없을 경우, 항상 전체 범위에 대해 파싱해야 해서 성능 문제 발생
		for (var i = range[0]; i < range[1] + add; i++) {
			var line = newLines[i][LINE.TEXT] = textLines[i];
			var j = 0;
			var k = 0;
			var hasSync = false;
			var sync = 0;
			
			while ((k = line.indexOf("<", j)) >= 0) {
				// 태그 열기
				j = k + 1;

				// 태그 닫힌 곳까지 탐색
				var closeIndex = line.indexOf(">", j);
				if (j < closeIndex) {
					// 태그명 찾기
					for (k = j; k < closeIndex; k++) {
						var c = line[k];
						if (c == ' ' || c == '\t' || c == '"' || c == "'" || c == '\n') {
							break;
						}
					}
					var tagName = line.substring(j, k);
					j = k;
					
					hasSync = (tagName.toUpperCase() == "SYNC");

					if (hasSync) {
						while (j < closeIndex) {
							// 속성 찾기
							for (; j < closeIndex; j++) {
								var c = line[j];
								if (('0'<=c&&c<='9') || ('a'<=c&&c<='z') || ('A'<=c&&c<='Z')) {
									break;
								}
								//html += c;
							}
							for (k = j; k < closeIndex; k++) {
								var c = line[k];
								if ((c<'0'||'9'<c) && (c<'a'||'z'<c) && (c<'A'||'Z'<c)) {
									break;
								}
							}
							var attrName = textLines[i].substring(j, k);
							j = k;
							
							// 속성 값 찾기
							if (line[j] == "=") {
								j++;
								
								var q = line[j];
								if (q == "'" || q == '"') { // 따옴표로 묶인 경우
									k = textLines[i].indexOf(q, j + 1);
									k = (0 <= k && k < closeIndex) ? k : closeIndex;
								} else {
									q = "";
									k = textLines[i].indexOf(" ");
									k = (0 <= k && k < closeIndex) ? k : closeIndex;
									k = textLines[i].indexOf("\t");
									k = (0 <= k && k < closeIndex) ? k : closeIndex;
								}
								var value = line.substring(j + q.length, k);
								
								if (q.length && k < closeIndex) { // 닫는 따옴표가 있을 경우
									j += q.length + value.length + q.length;
								} else {
									j += q.length + value.length;
								}
								
								if (attrName.toUpperCase() == "START" && isFinite(value)) {
									sync = Number(value);
								}
							}
						}
					} else {
						// 싱크 태그 아니면 그냥 제낌
						j = closeIndex;
					}
					
					// 태그 닫기
					j++;
				}
			}
			
			if (newLines[i][LINE.SYNC] = sync) { // 어차피 0이면 플레이어에서도 씹힘
				// 화면 싱크 체크
				newLines[i][LINE.TYPE] = TYPE.BASIC;
				var typeCss = "";
				if (line.indexOf(" >") > 0) {
					newLines[i][LINE.TYPE] = TYPE.FRAME;
					typeCss = " frame";
				} else if (line.indexOf("\t>") > 0) {
					newLines[i][LINE.TYPE] = TYPE.RANGE;
					typeCss = " range";
				}
				var h = sync;
				var ms = h % 1000; h = (h - ms) / 1000;
				var s  = h %   60; h = (h -  s) /   60;
				var m  = h %   60; h = (h -  m) /   60;
				syncLines.push("<span class='sync" + (sync < beforeSync ? " error" : (sync == beforeSync ? " equal" : "")) + typeCss + "'>"
						+ h + ":" + (m>9?"":"0")+m + ":" + (s>9?"":"0")+s + ":" + (ms>99?"":"0")+(ms>9?"":"0")+ms
						+ "<br /></span>");
				beforeSync = sync;
			} else {
				newLines[i][LINE.TYPE] = TYPE.TEXT;
				syncLines.push("<span class='sync'><br /></span>");
			}
		}
		
		// 수정된 내용 삽입
		if (lastSync.length) {
			lastSync.after(syncLines.join(""));
		} else {
			self.colSync.prepend(syncLines.join(""));
		}
		if (nextSync && beforeSync) {
			if (nextSync[0] <= beforeSync) {
				nextSync[1].addClass(nextSync[0] == beforeSync ? "equal" : "error");
			} else {
				nextSync[1].removeClass("equal").removeClass("error");
			}
		}
		
		self.text = text;
		self.lines = newLines;
		if (SmiEditor.PlayerAPI && SmiEditor.PlayerAPI.setLines) {
			SmiEditor.PlayerAPI.setLines(newLines);
		}
		if (SmiEditor.Viewer.window) {
			SmiEditor.Viewer.refresh();
		}
		self.syncUpdating = false;
		if (self.input.scrollTop() != self.colSync.scrollTop()) {
			self.input.scroll();
		}
		
		self.afterChangeSaved(self.isSaved());
		
		setTimeout(function() {
			if (self.needToUpdateSync) {
				// 렌더링 대기열 있으면 재실행
				self.updateSync();
			}
		}, 100);
	};
	if (this.initialized) {
		setTimeout(thread, 1);
	} else {
		thread();
		this.initialized = true;
	}
}
SmiEditor.prototype.updateHighlight = function () {
	if (this.highlightUpdating) {
		// 이미 렌더링 중이면 대기열 활성화
		this.needToUpdateHighlight = true;
		return;
	}
	this.needToUpdateHighlight = false;
	this.highlightUpdating = true;

	var self = this;
	function thread() {
		if (SmiEditor.useHighlight) {
			self.hArea.removeClass("nonactive");
		} else {
			self.hArea.addClass("nonactive");
			self.highlightLines = [];
			self.hview.empty();
			self.highlightUpdating = false;
			return;
		}
		var lines = self.input.val().split("\n");

		var changeBegin = 0; changeEnd = Math.min(lines.length, self.highlightLines.length);
		if (self.highlightLines.length) {
			{	// 수정된 범위 찾기
				var i;
				for (i = 0; i < changeEnd; i++) {
					if (self.highlightLines[i] != lines[i]) {
						break;
					}
				}
				changeBegin = i;
				
				var add = lines.length - self.highlightLines.length;
				for (i = self.highlightLines.length - 1; i > (add > 0 ? changeBegin : changeBegin - add); i--) {
					if (self.highlightLines[i] != lines[i + add]) {
						break;
					}
				}
				changeEnd = i + 1;
				
			}
			
			{	// 기존 결과물 삭제
				var removeLines = self.hview.children().splice(changeBegin, changeEnd - changeBegin);
				for (var i = 0; i < removeLines.length; i++) {
					$(removeLines[i]).remove();
				}
			}
		} else {
			add = lines.length;
		}
		
		var newLines = [];
		var highlightLines = self.hview.children();
		var lastLine = (changeBegin > 0) ? $(highlightLines[changeBegin - 1]) : null;
		var state = lastLine ? lastLine.data("next") : null;
		var i = changeBegin;
		for (; i < changeEnd + add; i++) {
			var highlightLine = SmiEditor.highlightText(lines[i], state);
			if (SmiEditor.showEnter) {
				highlightLine.append($("<span class='hljs-comment enter'>").text("↵"));
			}
			highlightLine.append("<br />");
			newLines.push(highlightLine);
			if (lastLine) {
				lastLine.after(highlightLine);
			} else {
				self.hview.prepend(highlightLine);
			}
			state = (lastLine = highlightLine).data("next");
		}
		if (lastLine) {
			for (; i < highlightLines.length; i++) {
				var highlightLine = lastLine.next();
				if (highlightLine.length == 0 || highlightLine.data("state") == state) {
					break;
				}
				// 다음 줄 문법 하이라이트 재계산 필요
				highlightLine.remove();
				lastLine.after(highlightLine = SmiEditor.highlightText(lines[i], state).append("<br />"));
				state = (lastLine = highlightLine).data("next");
			}
		}
		
		self.highlightLines = lines;
		
		self.highlightUpdating = false;
		setTimeout(function () {
			if (self.needToUpdateHighlight) {
				// 렌더링 대기열 있으면 재실행
				self.updateSync();
			}
		}, 1);
	};
	setTimeout(thread, 1);
}
SmiEditor.highlightCss = ".hljs-sync: { color: #3F5FBF; }";
SmiEditor.highlightText = function(text, state=null) {
	var previewLine = $("<span>");
	if (text.toUpperCase().startsWith("<SYNC ")) {
		previewLine.addClass("hljs-sync");
	}
	return previewLine.text(text);
}
SmiEditor.refreshHighlight = function() {
	var style = $("#style_highlight");
	if (style.length == 0) {
		$("head").append(style = $("<style>").attr({ id: "style_highlight" }));
	}
	style.html(SmiEditor.highlightCss);
}
SmiEditor.prototype.moveLine = function(toNext) {
	if (this.syncUpdating) return;
	this.history.log();
	
	var text = this.input.val();
	var range = this.getCursor();
	var lineRange = [text.substring(0, range[0]).split("\n").length - 1, text.substring(0, range[1]).split("\n").length - 1];
	var lines = text.split("\n");
	var addLine = 0;
	
	if (toNext) {
		if (lineRange[1] == lines.length - 1) {
			return;
		}
		this.input.val(lines.slice(0, lineRange[0]).concat(lines[lineRange[1]+1], lines.slice(lineRange[0], lineRange[1]+1), lines.slice(lineRange[1]+2)).join("\n"));
		
		var targetTop = (lineRange[1]+2) * LH - this.input.css("height").split("px")[0] + SB;
		if (targetTop > this.input.scrollTop()) {
			this.input.scrollTop(targetTop);
		}
		addLine = lines[lineRange[1]+1].length + 1;
	} else {
		if (lineRange[0] == 0) {
			return;
		}
		this.input.val(lines.slice(0, lineRange[0]-1).concat(lines.slice(lineRange[0], lineRange[1]+1), lines[lineRange[0]-1], lines.slice(lineRange[1]+1)).join("\n"));
		
		var targetTop = (lineRange[1]-1) * LH;
		if (targetTop < this.input.scrollTop()) {
			this.input.scrollTop(targetTop);
		}
		addLine = -(lines[lineRange[0]-1].length + 1);
	}
	this.setCursor(range[0]+addLine, range[1]+addLine);
	this.history.log();
	this.updateSync([Math.max(0, lineRange[0]-1), Math.min(lineRange[1]+2, lines.length)]);
}
SmiEditor.prototype.moveSync = function(toForward) {
	this.history.log();
	
	var rate = SmiEditor.sync.unit;
	
	var text = this.input.val();
	var range = this.getCursor();
	var lineRange = [0, this.lines.length - 1];
	var cursor = null;
	if (range[0] < range[1]) { // 선택 영역이 있을 때
		lineRange = [text.substring(0, range[0]).split("\n").length - 1, text.substring(0, range[1]).split("\n").length - 1];
	} else { // 선택 영역이 없을 때
		// 커서가 해당 줄의 몇 번째 글자인지를 기억
		var lines = text.substring(0, range[0]).split("\n");
		cursor = [lines.length - 1, lines[lines.length - 1].length];
	}

	if (toForward) {
		for (var i = lineRange[0]; i <= lineRange[1]; i++) {
			if (this.lines[i][LINE.SYNC]) {
				var sync = this.lines[i][LINE.SYNC] + rate;
				if (sync >= 36000000) { // 잠정 오류 조치 싱크 보정
					sync -= 36000000;
				}
				this.lines[i][LINE.TEXT] = this.lines[i][LINE.TEXT].split(this.lines[i][LINE.SYNC]).join(sync); // 싱크 줄에 싱크 이외의 숫자가 없다고 가정
				this.lines[i][LINE.SYNC] = sync;
			}
		}
	} else {
		for (var i = lineRange[0]; i <= lineRange[1]; i++) {
			if (this.lines[i][LINE.SYNC]) {
				var sync = this.lines[i][LINE.SYNC] - rate;
				if (sync <= 0) { // 0 이하일 경우 10시간 옮겨서 경고
					sync += 36000000;
				}
				this.lines[i][LINE.TEXT] = this.lines[i][LINE.TEXT].split(this.lines[i][LINE.SYNC]).join(sync); // 싱크 줄에 싱크 이외의 숫자가 없다고 가정
				this.lines[i][LINE.SYNC] = sync;
			}
		}
	}
	this.input.val(this.text = linesToText(this.lines));
	var lines = this.text.split("\n");
	if (range[0] < range[1]) { // 선택 영역이 있을 때
		// 줄 전체 선택
		var i = 0;
		var index = 0;
		while (i < lineRange[0]) {
			index += lines[i++].length + 1;
		}
		range[0] = index;
		while (i <= lineRange[1]) {
			index += lines[i++].length + 1;
		}
		range[1] = --index;
		
	} else { // 선택 영역이 없을 때
		// 커서 위치 찾기
		var index = cursor[1];
		for (var i = 0; i < cursor[0]; i++) {
			index += lines[i].length + 1;
		}
		range = [index, index];
	}
	this.setCursor(range[0], range[1]);
	this.afterMoveSync([lineRange[0], lineRange[1]+1]);
	this.history.log();
}
SmiEditor.prototype.afterMoveSync = function(range) {
	this.updateHighlight();
	
	if (this.syncUpdating) {
		// 이미 렌더링 중이면 대기열 활성화
		this.needToUpdateSync = true;
		return;
	}
	this.needToUpdateSync = false;
	this.syncUpdating = true;
	
	var start = new Date().getTime();
	
	var text = this.input.val();
	
	// 프로세스 분리할 필요가 있나?
	var self = this;
	setTimeout(function() {
		var lines = text.split("\n");
		var syncLines = [];
		
		// 줄 수 변동량
		var add = 0;
		
		var beforeSync = 0;
		for (var i = range[0] - 1; i >= 0; i--) {
			if (self.lines[i][LINE.SYNC]) {
				beforeSync = self.lines[i][LINE.SYNC];
				break;
			}
		}
		var lastSync = range[0]>0 ? self.colSync.find("span.sync:eq(" + (range[0] - 1) + ")") : [];
		var nextSync = null;
		for (var i = range[1]; i < self.lines.length; i++) {
			if (self.lines[i][LINE.SYNC]) {
				nextSync = [self.lines[i][LINE.SYNC], self.colSync.find("span.sync:eq(" + i + ")")];
				break;
			}
		}
		
		// 수정된 부분 삭제
		self.colSync.find("span.sync").each(function(i) {
			if (i < range[0]) return;
			if (i >= range[1]) return;
			var span = $(this);
			span.remove();
		});
		
		// 새로 그리기
		for (var i = range[0]; i < range[1] + add; i++) {
			var sync = self.lines[i][LINE.SYNC];
			if (sync) { // 어차피 0이면 플레이어에서도 씹힘
				var typeCss = "";
				if (self.lines[i][LINE.TYPE] == TYPE.FRAME) {
					typeCss = " frame";
				} else if (self.lines[i][LINE.TYPE] == TYPE.RANGE) {
					typeCss = " range";
				}
				var h = sync;
				var ms = h % 1000; h = (h - ms) / 1000;
				var s  = h %   60; h = (h -  s) /   60;
				var m  = h %   60; h = (h -  m) /   60;
				syncLines.push("<span class='sync" + (sync < beforeSync ? " error" : (sync == beforeSync ? " equal" : "")) + typeCss + "'>"
						+ h + ":" + (m>9?"":"0")+m + ":" + (s>9?"":"0")+s + ":" + (ms>99?"":"0")+(ms>9?"":"0")+ms
						+ "<br /></span>");
				beforeSync = sync;
			} else {
				syncLines.push("<span class='sync'><br /></span>");
			}
		}
		
		// 수정된 내용 삽입
		if (lastSync.length) {
			lastSync.after(syncLines.join(""));
		} else {
			self.colSync.prepend(syncLines.join(""));
		}
		if (nextSync && beforeSync) {
			if (nextSync[0] <= beforeSync) {
				nextSync[1].addClass(nextSync[0] == beforeSync ? "equal" : "error");
			} else {
				nextSync[1].removeClass("equal").removeClass("error");
			}
		}

		if (SmiEditor.PlayerAPI && SmiEditor.PlayerAPI.setLines) {
			SmiEditor.PlayerAPI.setLines(newLines);
		}
		if (SmiEditor.Viewer.window) {
			SmiEditor.Viewer.refresh();
		}
		self.syncUpdating = false;
		self.afterChangeSaved(self.isSaved());
		
		setTimeout(function() {
			if (self.needToUpdateSync) {
				// 렌더링 대기열 있으면 재실행
				self.updateSync();
			}
		}, 100);
	}, 1);
}
SmiEditor.prototype.moveToSide = function(direction) {
	if (direction == 0) return;
	
	var rate = SmiEditor.sync.unit;
	
	var text = this.input.val();
	var range = this.getCursor();
	var cursorLine = text.substring(0, range[0]).split("\n").length - 1;
	
	// 커서 위치 바로 위의 싱크 라인 찾기
	var syncLine = cursorLine;
	for (; syncLine >= 0; syncLine--) {
		if (this.lines[syncLine][LINE.SYNC]) {
			break;
		}
		if (this.lines[syncLine][LINE.TEXT].toUpperCase().startsWith("</BODY>")) {
			break;
		}
	}
	// 싱크 라인 없으면 무시
	if (syncLine < 0) {
		return;
	}
	
	// 다음 싱크 라인 찾기
	var nextLine = cursorLine;
	for (; nextLine < this.lines.length; nextLine++) {
		if (this.lines[nextLine][LINE.SYNC]) {
			break;
		}
		if (this.lines[nextLine][LINE.TEXT].toUpperCase().startsWith("</BODY>")) {
			break;
		}
		// <br>로 끝나는 라인이 아닐 경우 아직 싱크 찍지 않은 부분으로 간주
		if (!this.lines[nextLine][LINE.TEXT].toUpperCase().endsWith("<BR>")) {
			nextLine++;
			break;
		}
	}
	
	var textLines = this.lines.slice(syncLine + 1, nextLine);
	for (var i = 0; i < textLines.length; i++) {
		textLines[i] = textLines[i][LINE.TEXT];
	}
	textLines = textLines.join("").split("​").join("").split(/<br>/gi);
	
	// 내용물 비었으면 무시
	if ($("<span>").html(textLines.join("").split("　").join(" ")).text().trim().length == 0) {
		return;
	}
	
	if (direction > 0) {
		// 오른쪽으로 이동
		var remained = true;
		var added = false;
		for (var i = 0; i < direction; i++) {
			// 모든 줄이 공백으로 끝나는지 확인
			if (remained) {
				for (var j = 0; j < textLines.length; j++) {
					if (!textLines[j].endsWith("　")) {
						remained = false;
						break;
					}
				}
			}
			if (remained) {
				// 오른쪽 공백 제거
				for (var j = 0; j < textLines.length; j++) {
					textLines[j] = textLines[j].substring(0, textLines[j].length - 1);
				}
			} else {
				// 왼쪽 공백 추가
				for (var j = 0; j < textLines.length; j++) {
					textLines[j] = "　" + textLines[j];
				}
				added = true;
			}
		}
		// 모든 줄이 공백으로 끝나는지 확인
		if (remained) {
			for (var j = 0; j < textLines.length; j++) {
				if (!textLines[j].endsWith("　")) {
					remained = false;
					break;
				}
			}
		}
		if (!remained) {
			// 오른쪽에 추가했던 공백을 다 없앴어도 원본에 공백 있을 수 있음
			for (var i = 0; i < textLines.length; i++) {
				var textLine = textLines[i];
				if (textLine.endsWith(" ") || textLine.endsWith("　")) {
					textLines[i] = textLine + "​";
				}
			}
		}
		var br = (remained ? "​" : "") + ("<br>" + ((remained || added) ? "\n" : "")) + (added ? "​" : "");
		textLines = ((added ? "​" : "") + textLines.join(br) + (remained ? "​" : "")).split("\n");
		
	} else {
		// 왼쪽으로 이동
		var remained = true;
		var added = false;
		for (var i = 0; i < -direction; i++) {
			// 모든 줄이 공백으로 시작하는지 확인
			if (remained) {
				for (var j = 0; j < textLines.length; j++) {
					if (!textLines[j].startsWith("　")) {
						remained = false;
						break;
					}
				}
			}
			if (remained) {
				// 왼쪽 공백 제거
				for (var j = 0; j < textLines.length; j++) {
					textLines[j] = textLines[j].substring(1);
				}
			} else {
				// 오른쪽 공백 추가
				for (var j = 0; j < textLines.length; j++) {
					textLines[j] = textLines[j] + "　";
				}
				added = true;
			}
		}
		// 모든 줄이 공백으로 시작하는지 확인
		if (remained) {
			for (var j = 0; j < textLines.length; j++) {
				if (!textLines[j].startsWith("　")) {
					remained = false;
					break;
				}
			}
		}
		if (!remained) {
			// 왼쪽에 추가했던 공백을 다 없앴어도 원본에 공백 있을 수 있음
			for (var i = 0; i < textLines.length; i++) {
				var textLine = textLines[i];
				if (textLine.startsWith(" ") || textLine.startsWith("　")) {
					textLines[i] = "​" + textLine;
				}
			}
		}
		var br = (added ? "​" : "") + ("<br>" + ((remained || added) ? "\n" : "")) + (remained ? "​" : "");
		textLines = ((remained ? "​" : "") + textLines.join(br) + (added ? "​" : "")).split("\n");
	}
	
	for (var i = 0; i < textLines.length; i++) {
		textLines[i] = [textLines[i], 0, TYPE.TEXT];
	}
	
	this.history.log();
	var prev = this.lines.slice(0, syncLine + 1);
	var cursor = 0;
	for (var i = 0; i < prev.length; i++) {
		cursor += prev[i][LINE.TEXT].length + 1;
	}
	var lines = prev.concat(textLines).concat(this.lines.slice(nextLine));
	this.input.val(linesToText(lines));
	this.setCursor(cursor);
	this.history.log();
	this.updateSync([syncLine, nextLine]);
}

SmiEditor.Finder = {
		last: { find: "", replace: "", withCase: false, reverse: false }
	,	open: function(isReplace) {
			var w = 440 * DPI;
			var h = 220 * DPI;
			var x = Math.ceil((setting.window.x + (setting.window.width  / 2)) - (w / 2));
			var y = Math.ceil((setting.window.y + (setting.window.height / 2)) - (h / 2));
		
			this.onload = (isReplace ? this.onloadReplace : this.onloadFind);
			
			this.window = window.open("finder.html", "finder", "scrollbars=no,location=no,width="+w+",height="+h);
			binder.moveWindow("finder", x, y, w, h, false);
			binder.focus("finder");
		}
	,	onloadFind: function(isReplace) {
			this.last.toFocus = "[name=find]";
			
			if (SmiEditor.selected) {
				var editor = SmiEditor.selected;
				var selection = editor.getCursor();
				var length = selection[1] - selection[0];
				if (length) {
					this.last.find = editor.text.substring(selection[0], selection[1]);
					this.last.toFocus = (isReplace ? "[name=replace]" : ".button-find");
				}
			}
			
			binder.onloadFinder(JSON.stringify(this.last));
		}
	,	openChange: function() {
			this.open(true);
		}
	,	onloadReplace: function() {
			this.onloadFind(true);
		}

	,	finding: {
			find: ""
		,	replace: ""
		,	withCase: false
		,	reverse: false
		}
	,	checkError: function(params) {
			if (!SmiEditor.selected) {
				return "열려있는 파일이 없습니다.";
			}
			this.finding = JSON.parse(params);
			this.finding.input = SmiEditor.selected.input[0];
			this.finding.text      = this.finding.input.value;
			this.finding.upperText = this.finding.text.toUpperCase();
			this.finding.upperFind = this.finding.find.toUpperCase();
		}
	,	afterFind: function() {
			var tab = SmiEditor.selected;
			tab.updateSync();
			tab.scrollToCursor();
			this.last.find    = this.finding.find;
			this.last.replace = this.finding.replace;
			this.last.withCase= this.finding.withCase;
			this.last.reverse = this.finding.reverse;
		}
	
	,	doFind: function(selection) {
			if (!selection) selection = [this.finding.input.selectionStart, this.finding.input.selectionEnd];
			var index = -1;
			var text = this.finding.text;
			var find = this.finding.find;
			if (!this.finding.withCase) {
				text = this.finding.upperText;
				find = this.finding.upperFind;
			}
			if (this.finding.reverse) {
				index = text.lastIndexOf(find, selection[0] - 1);
			} else {
				index = text.indexOf(find, selection[1]);
			}
			if (index < 0) return null;
			return [index, index + find.length];
		}
	,	doReplace: function(selection) {
			if (!selection) selection = [this.finding.input.selectionStart, this.finding.input.selectionEnd];
			var index = -1;
			var text = this.finding.text;
			var find = this.finding.find;
			if (!this.finding.withCase) {
				text = this.finding.upperText;
				find = this.finding.upperFind;
			}
			if (text.substring(selection[0], selection[1]) == find) {
				this.finding.text      = this.finding.text     .substring(0, selection[0]) + this.finding.replace + this.finding.text     .substring(selection[1]);
				this.finding.upperText = this.finding.upperText.substring(0, selection[0]) + this.finding.replace + this.finding.upperText.substring(selection[1]);
				selection[1] = selection[0] + this.finding.replace.length;
				return selection;
			}
			return null;
		}
		
	,	runFind: function(params) {
			var err = this.checkError(params);
			if (err) return this.sendMsgAfterRun(err);
	
			var selection = this.doFind();
			if (selection) {
				this.finding.input.setSelectionRange(selection[0], selection[1]);
				this.afterFind();
			} else {
				this.sendMsgAfterRun("찾을 수 없습니다.");
			}
		}
	,	runReplace: function(params) {
			var err = this.checkError(params);
			if (err) return this.sendMsgAfterRun(err);
			
			// 선택돼 있었으면 바꾸기
			var selection = this.doReplace();
			if (selection) {
				this.finding.input.value = this.finding.text;
				this.finding.input.setSelectionRange(selection[0], selection[1]);
				this.afterFind();
			}
			
			// 다음 거 찾기
			if (selection = this.doFind(selection)) {
				this.finding.input.setSelectionRange(selection[0], selection[1]);
				this.afterFind();
				
			} else {
				this.sendMsgAfterRun("찾을 수 없습니다.");
			}
		}
	,	runReplaceAll: function(params) {
			var err = this.checkError(params);
			if (err) return this.sendMsgAfterRun(err);
	
			var count = 0;
			var last = null;
			
			// 바꾸기
			var selection = this.doReplace();
			if (selection) count++;
			// 다음 찾기
			selection = this.doFind(selection);
			
			// 바꾸기-찾기 반복
			while (selection) {
				count++;
				last = selection;
				selection = this.doFind(this.doReplace(selection));
			}
			
			if (count) {
				this.finding.input.value = this.finding.text;
				this.finding.input.setSelectionRange(last[0], last[1]);
				this.afterFind();
				this.sendMsgAfterRun(count + "개 바꿈");
			} else {
				this.sendMsgAfterRun("찾을 수 없습니다.");
			}
		}
	,	sendMsgAfterRun: function(msg) {
			setTimeout(function() {
				binder.sendMsg("finder", msg);
			}, 1);
		}
};

SmiEditor.Viewer = {
		window: null
	,	open: function() {
			this.window = window.open("viewer.html", "viewer", "scrollbars=no,location=no,width=1,height=1");
			this.moveWindowToSetting();
			binder.focus("viewer");
			setTimeout(function() {
				binder.focus("editor");
			}, 100);
			return this.window;
		}
	,	moveWindowToSetting: function() {
			// CefSharp 쓴 경우 window.moveTo 같은 걸로 못 움직임. 네이티브로 해야 함
			binder.moveWindow("viewer"
					, setting.viewer.window.x
					, setting.viewer.window.y
					, setting.viewer.window.width
					, setting.viewer.window.height
					, true);
		}
	,	refresh: function() {
			setTimeout(function() {
				var lines = [[["", 0, TYPE.TEXT]]];
				if (SmiEditor.selected) {
					if (SmiEditor.selected.owner) {
						var holds = SmiEditor.selected.owner.holds.slice(0);
						holds.sort(function(a, b) {
							var aPos = a.pos;
							var bPos = b.pos;
							if (aPos < bPos) return 1;
							if (aPos > bPos) return -1;
							return 0;
						});
						lines = [];
						for (var i = 0; i < holds.length; i++) {
							lines.push(holds[i].lines);
						}
					} else {
						lines[0] = SmiEditor.selected.lines;
					}
				}
				binder.updateViewerLines(JSON.stringify(lines));
			}, 1);
		}
};

SmiEditor.Addon = {
		windows: {}
	,	open: function(name, target="addon") {
			var url = (name.substring(0, 4) == "http") ? name : "addon/" + name.split("..").join("").split(":").join("") + ".html";
			this.windows[target] = window.open(url, target, "scrollbars=no,location=no,width=1,height=1");
			setTimeout(function() { // 웹버전에서 딜레이 안 주면 위치를 못 잡는 경우가 있음
				SmiEditor.Addon.moveWindowToSetting(target);
			}, 1);
			binder.focus(target);
		}
	,	openExtSubmit: function(method, url, values) {
			this.ext = {
					method: method
				,	url: url
				,	values: values
			}
			this.windows.addon = window.open("addon/ExtSubmit.html", "addon", "scrollbars=no,location=no,width=1,height=1");
			setTimeout(function() {
				SmiEditor.Addon.moveWindowToSetting("addon");
			}, 1);
			binder.focus("addon");
		}
	,	onloadExtSubmit: function() {
			var w = this.windows.addon;
			if (w.iframe) {
				w = w.iframe.contentWindow;
			}
			w.submit(this.ext.method, this.ext.url, this.ext.values);
		}
	,	moveWindowToSetting: function(target) {
			// 플레이어 창 위에
			var margin = 40 * DPI;
			var targets = [];
			if (target) {
				targets = [target];
			} else {
				for (var key in this.windows) {
					targets.push(key);
				}
			}
			for (var i = 0; i < targets.length; i++) {
				binder.moveWindow(targets[i]
						, setting.player.window.x + margin
						, setting.player.window.y + margin
						, setting.player.window.width  - (margin * 2)
						, setting.player.window.height - (margin * 2)
						, true);
			}
		}
};
function openAddon(name, target) { SmiEditor.Addon.open(name, target); }
function extSubmit(method, url, values, withoutTag=true) {
	if (typeof values == "string") {
		var name = values;
		var editor = SmiEditor.selected;
		if (editor) {
			var text = editor.getText();
			var value = "";
			if (text.selection[0] < text.selection[1]) {
				value = text.text.substring(text.selection[0], text.selection[1]);

			} else {
				// 선택된 게 없으면
				var lines = text.text.split("\n");
				var lineNo = text.text.substring(0, text.selection[0]).split("\n").length - 1;

				// 현재 싱크 맨 윗줄 찾기
				var syncLineNo = lineNo;
				while (syncLineNo >= 0) {
					if (lines[syncLineNo].substring(0, 6).toUpperCase() == "<SYNC ") {
						break;
					}
					syncLineNo--;
				}

				if (syncLineNo >= 0) {
					// 다음 싱크 라인 찾기
					var nextSyncLineNo = syncLineNo + 1;
					while (nextSyncLineNo < lines.length) {
						if (lines[nextSyncLineNo].substring(0, 6).toUpperCase() == "<SYNC ") {
							break;
						}
						nextSyncLineNo++;
					}

					if (nextSyncLineNo < lines.length) {
						// 현재 싱크 내용물 선택
						value = lines.slice(syncLineNo + 1, nextSyncLineNo).join("\n");

					} else {
						// 현재 줄 선택
						value = lines[lineNo];
					}
				}
			}

			// string일 경우 태그 탈출 처리
			if (withoutTag) {
				value = $("<p>").html(value.split(/<br>/gi).join(" ")).text();
			}

			var params = {};
			params[name] = value;
			SmiEditor.Addon.openExtSubmit(method, url, params);
		}
	} else {
		SmiEditor.Addon.openExtSubmit(method, url, params);
	}
}

// 선택영역 C# 특수 가공 처리
SmiEditor.transforming = {};
SmiEditor.prototype.getTransformText = function() {
	//초기 상태 기억
	var origin = SmiEditor.transforming;
	origin.tab = this;
	origin.text = this.text;
	
	var start = 0;
	var end = origin.tab.lines.length;

	// 선택 범위만 작업
	var range = origin.tab.getCursor();
	if (range[0] != range[1]) {
		start = origin.text.substring(0, range[0]).split("\n").length - 1;
		end   = origin.text.substring(0, range[1]).split("\n").length;
	}
	
	// 범위 시작을 싱크 라인으로 축소
	for (; start < end; start++) {
		if (this.lines[start][LINE.SYNC]) {
			// 싱크 라인 찾음
			break;
		}
	}
	if (start == end) {
		// 선택 범위 없음
		return null;
	}
	
	// </body> 닫히기 전까지만 선택
	for (var i = start; i < end; i++) {
		if (this.lines[i][LINE.TEXT].toUpperCase().indexOf("</BODY>") >= 0) {
			end = i - 1;
			break;
		}
	}
	
	origin.start = start;
	origin.end = end;
	
	return origin.text.split("\n").slice(start, end).join("\n");
};
SmiEditor.afterTransform = function(result) { // 주로 C#에서 호출
	// 해당 줄 앞뒤 전체 선택되도록 조정
	result = result.split("\r\n").join("\n");
	var origin = SmiEditor.transforming;
	var origLines = origin.text.split("\n");
	var front = origLines.slice(0, origin.start);
	var range = [(origin.start > 0) ? (front.join("\n").length + 1) : 0];
	range.push(range[0] + result.length);
	
	// 교체
	origin.tab.setText(front.concat(result).concat(origLines.slice(origin.end)).join("\n"), range);
};
SmiEditor.prototype.normalize = function() {
	var text = this.getTransformText();
	if (text) {
		/*
		binder.normalize(text);
		*/
		var smi = new Subtitle.SmiFile();
		var input = smi.fromTxt(text).body;
		Subtitle.Smi.normalize(input);
		smi.body = input;
		SmiEditor.afterTransform(smi.toTxt().trim());
	}
};
SmiEditor.prototype.fillSync = function() {
	var text = this.getTransformText();
	if (text) {
		SmiEditor.afterTransform(SmiEditor.fillSync(text));
	}
};
SmiEditor.fillSync = function (text) {
	// 기존 중간싱크 제거 후 진행
	var textLines = text.split("\n");
	text = [];
	for (var i = 0; i < textLines.length; i++) {
		var line = textLines[i];
		if (line.substring(0, 6).toUpperCase() == "<SYNC " && line.indexOf("\t>") > 0) {
			// 해당 줄 무시
		} else if (line == "<~>") {
			// 해당 줄 무시
		} else {
			text.push(line);
		}
	}
	text = text.join("\n");

	var smi = new Subtitle.SmiFile();
	var input = smi.fromTxt(text).body;
	Subtitle.Smi.fillEmptySync(input);
	smi.body = input;
	return smi.toTxt().trim();
};

$(function() {
	SmiEditor.refreshHighlight();
	
	// 찾기/바꾸기 창 항상 위에
	window.addEventListener("focus", function() {
		if (SmiEditor.Finder.window) {
			binder.focus("finder");
		}
	});
});