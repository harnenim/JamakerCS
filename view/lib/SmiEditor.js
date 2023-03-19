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

var SmiEditor = function(text, path) {
	var editor = this;
	
	this.area = $("<div class='tab'>");
	this.area.append(this.colSync = $("<div class='col-sync'>"));
	this.area.append(this.input   = $("<textarea class='input' spellcheck='false'>"));
	this.colSync.html('<span class="sync"><br /></span>');
	if (text) {
		text = text.split("\r\n").join("\n");
		this.input.val(text);
		this.saved = text;
	} else {
		this.saved = "";
	}
	if (path) {
		this.path = path;
	}
	
	this.text = "";
	this.lines = [["", 0, TYPE.TEXT]];

	this.syncUpdating = false;
	this.needToUpdateSync = false;
	this.leftOfPgUpDn = -1; // 마지막 커서 이동이 PageUp/Down일 경우 커서 left값 기록
	
	this.bindEvent();
	
	this.history = new History(this.input, 32, function() {
		editor.scrollToCursor();
		editor.updateSync([0, editor.lines.length]); // 커서 위치와 관계없이 갱신
	});
	setTimeout(function() {
		editor.act = new AutoCompleteTextarea(editor.input, SmiEditor.autoComplete, function() {
			editor.history.log();
			editor.updateSync();
		});
	}, 1);
};

SmiEditor.setSetting = function(setting) {
	SmiEditor.sync = setting.sync;
	
	{	// AutoComplete
		for (var key in SmiEditor.autoComplete) {
			delete SmiEditor.autoComplete[key];
		}
		for (var key in setting.autoComplete) {
			SmiEditor.autoComplete[key] = setting.autoComplete[key];
		}
	}

	{	// 단축키
		var withs = ["withCtrls", "withAlts", "withCtrlAlts", "withCtrlShifts"];
		var keys = "ABCDEFGHIJKLMKNOPQRSTUVWXYZ1234567890";
		
		// 설정값 초기화
		for (var i = 0; i < withs.length; i++) {
			var command = SmiEditor[withs[i]] = {};
			for (var j = 0; j < keys.length; j++) {
				command[keys[j]] = " ";
			}
		}
		
		// 기본 단축키
		SmiEditor.withCtrls["A"] = null;
		SmiEditor.withCtrls["C"] = null;
		SmiEditor.withCtrls["V"] = null;
		SmiEditor.withCtrls["X"] = null;

		// 메뉴
		SmiEditor.withAlts["F"] = "binder.focusToMenu(70);";
		SmiEditor.withAlts["S"] = "binder.focusToMenu(83);";
		SmiEditor.withAlts["W"] = "binder.focusToMenu(87);";
		SmiEditor.withAlts["H"] = "binder.focusToMenu(72);";
		
		// 예약 단축키
		SmiEditor.withCtrls["D"] = "editor.deleteLine();";
		SmiEditor.withCtrls["F"] = "SmiEditor.Finder.open();";
		SmiEditor.withCtrls["H"] = "SmiEditor.Finder.openChange();";
		SmiEditor.withCtrls["Q"] = "editor.moveToSync();";
		SmiEditor.withCtrls["Y"] = "editor.history.forward();";
		SmiEditor.withCtrls["Z"] = "editor.history.back();";
		SmiEditor.withAlts["Q"] = "editor.findSync();";
		
		// 설정값 반영
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

	{	// 스타일
		if (!SmiEditor.style) {
			$("head").append(SmiEditor.style = $("<style>"));
		}
		SmiEditor.style.html(setting.css);

		if (SmiEditor.Viewer.window) {
			SmiEditor.Viewer.window.location.reload();
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
};
SmiEditor.autoComplete = [];
SmiEditor.PlayerAPI = {
		playOrPause: function(    ) { binder.playOrPause(); }
	,	play       : function(    ) { binder.play(); }
	,	stop       : function(    ) { binder.stop(); }
	,	moveTo     : function(time) { binder.moveTo(time); }
	,	move       : function(move) { binder.moveTo(time + move); }
};
SmiEditor.getSyncTime = function(sync) {
	if (!sync) sync = (time + SmiEditor.sync.weight);
	return Math.max(1, Math.floor(Math.floor((sync / FL) + 0.5) * FL));
}
SmiEditor.makeSyncLine = function(time, type) {
	return SmiEditor.sync.preset.split("{sync}").join(Math.floor(time)).split("{lang}").join(SmiEditor.sync.lang).split("{type}").join(TIDs[type ? type : 1]);
}

SmiEditor.prototype.isSaved = function() {
	return (this.saved == this.input.val());
};
SmiEditor.prototype.afterSave = function(path) {
	if (path) {
		this.path = path;
	}
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
	this.input.on("input propertychange", function() {
		editor.updateSync();
	});
	this.updateSync();
	
	// 싱크 스크롤 동기화
	this.input.on("scroll", function(e) {
		editor.colSync.scrollTop(editor.input.scrollTop());
	});
	
	// 개발용 임시
	this.input.on("keypress", function(e) {
		console.log(e.keyCode);
	});
	
	this.input.on("mousedown", function(e) {
		// PageUp/Down 아닐 경우 커서 위치 초기화
		this.leftOfPgUpDn = -1;
		editor.history.log();
	});
};

SmiEditor.selected = null;
var lastKeyDown = 0;
$(document).on("keydown", function(e) {
	lastKeyDown = e.keyCode;
	var editor = SmiEditor.selected;
	var hasFocus = editor && editor.input.is(":focus");
	
	if (!editor || editor.act.selected < 0) { // auto complete 작동 중엔 무시
		if (e.keyCode < 33 || e.keyCode > 34) {
			// PageUp/Down 아닐 경우 커서 위치 초기화
			if (hasFocus) {
				editor.leftOfPgUpDn = -1;
			}
		}
		switch (e.keyCode) {
			case 33: { // PgUp
				if (hasFocus) {
					e.preventDefault();
					editor.movePage(false);
					editor.history.logIfCursorMoved();
				}
				break;
			}
			case 34: { // PgDn
				if (hasFocus) {
					e.preventDefault();
					editor.movePage(true);
					editor.history.logIfCursorMoved();
				}
				break;
			}
			case 38: { // ↑
				if (e.shiftKey) {
					if (e.ctrlKey) {
						if (e.altKey) {
							
						} else {
							// 싱크 이동 -> TODO: Ctrl+Shift vs Ctrl+Alt
							// 원래 쓰던 단축키가 웹브라우저에서 안 돼서 억지로 테스트해본 거였나?
							if (editor) {
								e.preventDefault();
								editor.moveSync(true);
							}
						}
					}
				} else {
					if (e.ctrlKey) {
						if (e.altKey) {
							// 싱크 이동
							if (editor) {
								e.preventDefault();
								editor.moveSync(true);
							}
						} else {
							// 스크롤 이동
							if (hasFocus) {
								e.preventDefault();
								editor.input.scrollTop(Math.max(0, editor.input.scrollTop() - LH));
							}
						}
					} else {
						if (e.altKey) {
							// 줄 이동
							if (hasFocus) {
								e.preventDefault();
								editor.moveLine(false);
							}
						} else {
							
						}
					}
				}
				if (editor) {
					editor.history.logIfCursorMoved();
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
							}
						}
					}
				} else {
					if (e.ctrlKey) {
						if (e.altKey) {
							// 싱크 이동
							if (editor) {
								e.preventDefault();
								editor.moveSync(false);
							}
						} else {
							// 스크롤 이동
							if (hasFocus) {
								e.preventDefault();
								editor.input.scrollTop(editor.input.scrollTop() + LH);
							}
						}
					} else {
						if (e.altKey) {
							// 줄 이동
							if (hasFocus) {
								e.preventDefault();
								editor.moveLine(true);
							}
						} else {
							
						}
					}
				}
				if (editor) {
					editor.history.logIfCursorMoved();
				}
				return;
			}
			case 37: { // ←
				if (e.shiftKey) {
					if (e.ctrlKey) {
						if (e.altKey) {
							
						} else {
							
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
				if (editor) {
					editor.history.logIfCursorMoved();
				}
				return;
			}
			case 39: { // →
				if (e.shiftKey) {
					if (e.ctrlKey) {
						if (e.altKey) {
							
						} else {
							
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
				if (editor) {
					editor.history.logIfCursorMoved();
				}
				return;
			}
			case 116: { // F5: 싱크
				if (editor) {
					e.preventDefault();
					if (!hasFocus) editor.input.focus();
					if (e.ctrlKey) {
						editor.reSync();
					} else {
						editor.insertSync();
					}
				}
				break;
			}
			case 117: { // F6: 화면 싱크
				if (editor) {
					e.preventDefault();
					if (!hasFocus) editor.input.focus();
					editor.insertSync(true);
				}
				break;
			}
			case 118: { // F7: 화면 싱크 토글
				if (editor) {
					e.preventDefault();
					if (!hasFocus) editor.input.focus();
					editor.toggleSyncType();
				}
				break;
			}
			case 119: { // F8: 싱크 삭제
				if (editor) {
					e.preventDefault();
					if (!hasFocus) editor.input.focus();
					editor.removeSync();
				}
				break;
			}
			case 120: { // F9: 재생/일시정지
				e.preventDefault();
				SmiEditor.PlayerAPI.playOrPause();
				break;
			}
			case 121: { // F10: 재생 (정지화면 있을 경우 재생 중인지 확신이 안 설 때가 있어서 토글이 아닌 재생이 있는 게 맞을 듯)
				e.preventDefault();
				SmiEditor.PlayerAPI.play();
				break;
			}
			case 122: { // F11: 정지
				e.preventDefault();
				SmiEditor.PlayerAPI.stop();
				break;
			}
			case 9: { // Tab
				e.preventDefault();
				if (hasFocus) {
					editor.inputTextLikeNative("\t");
				}
				break;
			}
			case 13: { // Enter
				if (hasFocus) { // 크로뮴 textarea 버그 있음...
					e.preventDefault();
					if (e.ctrlKey) { // Ctrl+Enter → <br>
						editor.insertBR();
					} else {
						editor.inputTextLikeNative("\n");
						editor.input.scrollLeft(0); // 엔터일 땐 스크롤 맨 왼쪽
					}
				}
				break;
			}
		}
		
		{	// 단축키 설정
			var f = null;
			var key = String.fromCharCode(e.keyCode);
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
								
								// 크로뮴 textarea 버그 있음...
								/* https에서만 동작함?? C# 네이티브 연구?
								e.preventDefault();
								navigator.clipboard.readText().then(function(paste) {
									editor.inputTextLikeNative(paste.split("\r\n").join("\n"));
								}).catch(function(err) {
									console.log(err);
									alert("붙여넣기 실패");
								});
								*/
							}
						}
					}
				} else {
					if (e.altKey) {
						// TODO: Alt 예약된 단축키 체크 필요
						f = SmiEditor.withAlts[key];
					} else {
						
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
					eval("(function(){" + f + "})()");
				}
			}
		}
	}
}).on("keyup", function(e) {
	if (lastKeyDown == e.keyCode) {
		lastKeyDown = null;
		switch (e.keyCode) {
			case 18: { // Alt키만 눌렀다 뗐을 경우
				// 메뉴에 포커스 넘기기
				e.preventDefault();
				binder.focusToMenu(0);
				break;
			}
		}
	}
});

SmiEditor.prototype.getCursor = function() {
	return [this.input[0].selectionStart, this.input[0].selectionEnd];
}
SmiEditor.prototype.setCursor = function(start, end) {
	this.input[0].setSelectionRange(start, end ? end : start);
}
SmiEditor.prototype.scrollToCursor = function(lineNo) {
	if (typeof lineNo == "undefined") {
		var cursor = this.input[0].selectionEnd;
		lineNo = this.input.val().substring(0, cursor).split("\n").length - 1;
	}
	var top = lineNo * LH;
	var scrollTop = this.input.scrollTop();
	if (top < scrollTop) {
		this.input.scrollTop(top);
	} else {
		top += LH + SB - this.input.height();
		if (top > scrollTop) {
			this.input.scrollTop(top);
		}
	}
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
	} else {
		var cursor = this.input[0].selectionStart;
		this.setCursor(cursor, cursor);
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
	var lines = this.input.val().substring(0, cursor).split("\n");
	var offset = cursor - lines[lines.length - 1].length;
	this.lines[lines.length - 1][LINE.TEXT] = text;
	this.input.val(linesToText(this.lines));
	if (selection) {
		this.setCursor(offset + selection[0], offset + selection[1]);
	} else {
		this.setCursor(cursor, cursor);
	}
	
	this.history.log();
	this.updateSync();
}
SmiEditor.prototype.inputText = function(input, standCursor) {
	var text = this.input.val();
	var selection = this.getCursor();
	var cursor = selection[0] + (standCursor ? 0 : input.length);
	this.setText(text.substring(0, selection[0]) + input + text.substring(selection[1]), [cursor, cursor]);
	this.scrollToCursor();
}
SmiEditor.prototype.inputTextLikeNative = function(input) {
	// 좌우 스크롤까지 하는 건 연산량 부담...
	// 애초에 예외적인 경우에 필요한 기능
	var text = this.input.val();
	var selection = this.getCursor();
	var cursor = selection[0] + input.length;
	this.input.val(text.substring(0, selection[0]) + input + text.substring(selection[1]));
	this.setCursor(cursor, cursor);
	this.updateSync();
	this.scrollToCursor();
}

SmiEditor.prototype.reSync = function() {
	if (this.syncUpdating) {
		return;
	}
	this.history.log();
	
	// 커서가 위치한 줄
	var cursor = this.input[0].selectionEnd;
	var lineNo = this.input.val().substring(0, cursor).split("\n").length - 1;

	var sync = SmiEditor.getSyncTime();
	
	// 적용 시작할 싱크 찾기
	var i = lineNo;
	for (; i < this.lines.length; i++) {
		if (this.lines[i][LINE.SYNC]) {
			break;
		}
	}
	var add = sync - this.lines[lineNo = i][1];
	var lines = this.lines.slice(0, lineNo);
	
	for (; i < this.lines.length; i++) {
		var line = this.lines[i];
		if (line[LINE.SYNC]) {
			var sync = line[LINE.SYNC];
			var newSync = sync + add;
			lines.push([line[LINE.TEXT].split(sync).join(newSync), newSync, line[LINE.TYPE]]);
		} else {
			lines.push(line);
		}
	}
	
	this.input.val(linesToText(lines));
	this.setCursor(cursor, cursor);
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

	var sync = SmiEditor.getSyncTime();
	
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
	this.setCursor(cursor, cursor);
	
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
			if (line[LINE.TYPE] == TYPE.BASIC) { // 화면 싱크 할당
				var index = line[LINE.TEXT].lastIndexOf(">");
				line[LINE.TEXT] = line[LINE.TEXT].substring(0, index) + " " + line[LINE.TEXT].substring(index);
				line[LINE.TYPE] = TYPE.FRAME;
				if (i < lineNo) cursor++;
			} else if (line[LINE.TYPE] == TYPE.FRAME) { // 화면 싱크 해제
				var index = line[LINE.TEXT].lastIndexOf(" >");
				line[LINE.TEXT] = line[LINE.TEXT].substring(0, index) + line[LINE.TEXT].substring(index + 1);
				line[LINE.TYPE] = TYPE.BASIC;
				if (i < lineNo) cursor--;
			} else {
				return;
			}
			this.input.val(text = linesToText(this.lines));
			this.setCursor(cursor, cursor);
			
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
SmiEditor.prototype.moveToSync = function() {
	var cursor = this.input[0].selectionEnd;
	var lineNo = this.input.val().substring(0, cursor).split("\n").length - 1;
	
	var sync = 0;
	for (var i = lineNo; i >= 0; i--) {
		if (this.lines[i][LINE.SYNC]) {
			sync = this.lines[i][LINE.SYNC];
			break;
		}
	}
	
	SmiEditor.PlayerAPI.play();
	SmiEditor.PlayerAPI.moveTo(sync);
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
	this.setCursor(cursor, cursor);
	this.scrollToCursor(lineNo);
}
SmiEditor.prototype.deleteLine = function() {
	if (this.syncUpdating) {
		return;
	}
	this.history.log();
	
	var text = this.input.val();
	var range = this.getCursor();
	var lineRange = [text.substring(0, range[0]).split("\n").length - 1, text.substring(0, range[1]).split("\n").length - 1];
	var tmp = text.substring(0, range[0]).split("\n");
	var cursor = range[0] - tmp[tmp.length - 1].length;
	
	this.input.val(linesToText(this.lines.slice(0, lineRange[0]).concat(this.lines.slice(lineRange[1]+1))));
	this.setCursor(cursor, cursor);
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
	console.log(line);
	if (line.selection[0] == line.selection[1]) {
		console.log("단일");
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
		console.log("블록");
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

SmiEditor.prototype.updateSync = function(range) {
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
	setTimeout(function() {
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
				range[1] = i;
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
		if (SmiEditor.Viewer) {
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
	}, 1);
}
SmiEditor.prototype.movePage = function(down) {
	var text = this.input.val();
	var lines = text.split("\n");
	var move = Math.floor((this.area.height() - SB) / LH) - 1;
	
	var cursor = this.getCursor();
	var lineRange = cursor[1] ? text.substring(0, cursor[1]).split("\n") : [""];
	lineRange = [lineRange.length - 1, lineRange[lineRange.length - 1].length];
	
	if (this.leftOfPgUpDn < 0) {
		var tmp = $("<span>").text(lines[lineRange[0]].substring(0, lineRange[1]));
		this.area.append(tmp);
		this.leftOfPgUpDn = tmp.width();
		tmp.remove();
	}

	var lineNo = 0;
	if (down) {
		lineRange[0] = Math.min(lineRange[0] + move, lines.length - 1);
	} else {
		lineRange[0] = Math.max(lineRange[0] - move, 0);
	}
	for (var i = 0; i < lineRange[0]; i++) {
		lineNo += lines[i].length + 1;
	}
	this.scrollToCursor(lineRange[0]);
	
	// 커서 left 위치 보정
	var tmp = $("<span>");
	this.area.append(tmp);
	
	var line = lines[lineRange[0]];
	var last = 0;
	var i = 0;
	for (; i < line.length; i++) {
		tmp.append(line[i]);
		var w = tmp.width();
		if (w >= this.leftOfPgUpDn) {
			if (this.leftOfPgUpDn - last < w - this.leftOfPgUpDn) {
				if (i > 0) {
					i--;
				}
			}
			break;
		}
		last = w;
	}
	tmp.remove();
	
	lineNo = Math.max(0, lineNo + i);
	this.setCursor(lineNo, lineNo);
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
		
		var targetTop = (lineRange[1]+2) * LH - this.input.height() + SB;
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

SmiEditor.Finder = {
		last: { find: "", replace: "", withCase: "", reverse: "" }
	,	open: function(onload) {
			var w = 440 * DPI;
			var h = 220 * DPI;
			var x = Math.ceil((setting.window.x + (setting.window.width  / 2)) - (w / 2));
			var y = Math.ceil((setting.window.y + (setting.window.height / 2)) - (h / 2));
		
			this.onload = (onload ? onload : this.onloadFind);
			
			this.window = window.open("finder.html", "finder", "scrollbars=no,location=no,width="+w+",height="+h);
			binder.moveWindow("finder", x, y, w, h, false);
			binder.focus("finder");
		}
	,	onloadFind: function() {
			var popup = this.popup = $(this.window.document.body);
			if (this.last){
				popup.find("[name=find]"   ).val(this.last.find   )[0].setSelectionRange(0, this.last.find   .length);
				popup.find("[name=replace]").val(this.last.replace)[0].setSelectionRange(0, this.last.replace.length);
				popup.find("[name=case]").prop("checked", this.last.withCase);
				popup.find("[name=direction][value=" + (this.last.reverse ? "-" : "") + "1]").click();
			}
			popup.find("[name=find]").focus();
			
			if (SmiEditor.selected) {
				var editor = SmiEditor.selected;
				var selection = editor.getCursor();
				var length = selection[1] - selection[0];
				if (length) {
					this.last.find = editor.text.substring(selection[0], selection[1]);
					popup.find("[name=find]").val(this.last.find)[0].setSelectionRange(0, length);
					popup.find(".button-find").focus();
					return true;
				}
			}
		}
	,	openChange: function() {
			this.open(this.onloadChange);
		}
	,	onloadChange: function() {
			if (this.onloadFind()) {
				this.popup.find("[name=replace]").focus();
			}
		}
};

SmiEditor.Viewer = {
		window: null
	,	open: function() {
			this.window = window.open("viewer.html", "viewer", "scrollbars=no,location=no,width=0,height=0");
			this.moveWindowToSetting();
			binder.focus("editor");
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
	,	onload: function() {
			this.window.setSetting(setting.viewer);
		}
	,	refresh: function() {
			if (this.window && this.window.refresh) {
				this.window.refresh();
			}
		}
};

SmiEditor.Addon = {
		window: null
	,	open: function(name) {
			var url = (name.substring(0, 4) == "http") ? name : "addon/" + name.split("..").join("").split(":").join("") + ".html";
			this.window = window.open(url, "addon", "scrollbars=no,location=no,width=0,height=0");
			this.moveWindowToSetting();
			binder.focus("addon");
		}
	,	openExtSubmit: function(method, url, values) {
			// TODO: 현재 submit 하면 addon 이름이 지워져버림... iframe 만들까?
			this.window = window.open("", "addon", "scrollbars=no,location=no,width=0,height=0");
			this.moveWindowToSetting();
			binder.focus("addon");
			
			var html = $("<html>").append("<head>");
			var body = $("<body>");
			var form = $("<form>").attr({"action": url, "method": (method ? method : "get")});
			for (var key in values) {
				form.append($("<input>").attr({"type": "hidden", "name": key, "value": values[key]}));
			}
			body.append(form);
			html.append(body);
			this.window.document.write("<!doctype html><html>" + html.html() + "</html>");
			this.window.document.getElementsByTagName('form')[0].submit();
		}
	,	moveWindowToSetting: function() {
			// 플레이어 창 위에
			var margin = 40 * DPI;
			binder.moveWindow("addon"
					, setting.player.window.x + margin
					, setting.player.window.y + margin
					, setting.player.window.width  - (margin * 2)
					, setting.player.window.height - (margin * 2)
					, true);
		}
};
function openAddon(name) { SmiEditor.Addon.open(name); }
function extSubmit(method, url, values) { SmiEditor.Addon.openExtSubmit(method, url, values); }

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
		binder.normalize(text);
	}
};
SmiEditor.prototype.fillSync = function() {
	var text = this.getTransformText();
	if (text) {
		// 기존 중간싱크 제거 후 진행
		var lines = text.split("\n");
		text = [];
		for (var i = 0; i < lines.length; i++) {
			var line = lines[i];
			if (line.substring(0, 6).toUpperCase() == "<SYNC " && line.indexOf("\t>") > 0) {
				// 해당 줄 무시
			} else {
				text.push(line);
			}
		}
		
		// TODO: js로 다시 구현할까...?
		// 전에 C#으로 만들어본 거 재활용함
		binder.fillSync(text.join("\n"));
	}
};
SmiEditor.prototype.shake = function() {
	var start = 0;
	var end = this.lines.length;
	
	var range = this.getCursor();
	if (range[0] != range[1]) {
		start = this.text.substring(0, range[0]).split("\n").length - 1;
		end   = this.text.substring(0, range[1]).split("\n").length;
	}
	
	var lastSync = null;
	for (var i = start; i < end; i++) {
		var line = this.lines[i];
		if (line[LINE.TYPE]) {
			if (lastSync) {
				var text = [];
				for (var j = lastSync[0] + 1; j < i; j++) {
					text.push(this.lines[j][LINE.TEXT]);
				}
				text = text.join("\n").split(/<br>/gi);
				// TODO: 다시 만들어야 되는데.........
			}
			lastSync = [i, line];
		}
	}
	
};
