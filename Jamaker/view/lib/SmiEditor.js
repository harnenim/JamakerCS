let LH = 20; // LineHeight
let SB = 16; // ScrollBarWidth ... TODO: 자동으로 구해지도록?

// 배열로 개발했던 것들 레거시 지원
const LINE = {
		TEXT: "TEXT"
	,	SYNC: "SYNC"
	,	TYPE: "TYPE"
	,	LEFT: "LEFT"
	,	VIEW: "VIEW"
};
const TYPE = {
		TEXT: null
	,	BASIC: 1
	,	FRAME: 2
	,	RANGE: 3
};
const TIDs = [null, "", " ", "	"];
function linesToText(lines) {
	const textLines = [];
	for (let i = 0; i < lines.length; i++) {
		textLines.push(lines[i].TEXT);
	}
	return textLines.join("\n");
}

window.Line = function(text="", sync=0, type=TYPE.TEXT) {
	this.TEXT = text;
	this.SYNC = sync;
	this.TYPE = type;
	
	if (sync == 0 && type == null) {
		let j = 0;
		let k = 0;
		
		while ((k = text.indexOf("<", j)) >= 0) {
			// 태그 열기
			j = k + 1;

			// 태그 닫힌 곳까지 탐색
			const closeIndex = text.indexOf(">", j);
			if (j < closeIndex) {
				// 태그명 찾기
				for (k = j; k < closeIndex; k++) {
					const c = text[k];
					if (c == ' ' || c == '\t' || c == '"' || c == "'" || c == '\n') {
						break;
					}
				}
				const tagName = text.substring(j, k);
				j = k;

				if (tagName.toUpperCase() == "SYNC") {
					while (j < closeIndex) {
						// 속성 찾기
						for (; j < closeIndex; j++) {
							const c = text[j];
							if (('0'<=c&&c<='9') || ('a'<=c&&c<='z') || ('A'<=c&&c<='Z')) {
								break;
							}
						}
						for (k = j; k < closeIndex; k++) {
							const c = text[k];
							if ((c<'0'||'9'<c) && (c<'a'||'z'<c) && (c<'A'||'Z'<c)) {
								break;
							}
						}
						const attrName = text.substring(j, k);
						j = k;
						
						// 속성 값 찾기
						if (text[j] == "=") {
							j++;
							
							let q = text[j];
							if (q == "'" || q == '"') { // 따옴표로 묶인 경우
								k = text.indexOf(q, j + 1);
								k = (0 <= k && k < closeIndex) ? k : closeIndex;
							} else {
								q = "";
								k = text.indexOf(" ");
								k = (0 <= k && k < closeIndex) ? k : closeIndex;
								k = text.indexOf("\t");
								k = (0 <= k && k < closeIndex) ? k : closeIndex;
							}
							const value = text.substring(j + q.length, k);
							
							if (q.length && k < closeIndex) { // 닫는 따옴표가 있을 경우
								j += q.length + value.length + q.length;
							} else {
								j += q.length + value.length;
							}
							
							if (attrName.toUpperCase() == "START" && isFinite(value)) {
								this.SYNC = Number(value);
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
	}
	if (this.SYNC && type == null) {
		this.TYPE = TYPE.BASIC;
		if (text.indexOf("\t>") > 0) {
			this.TYPE = TYPE.RANGE;
		} else if (text.indexOf(" >") > 0) {
			this.TYPE = TYPE.FRAME;
		}
	}
}
Line.prototype.render = function(index, last={ sync: 0, state: null }) {
	if (this.SYNC) { // 어차피 0이면 플레이어에서도 씹힘
		const sync = this.SYNC;
		
		// 화면 싱크 체크
		let typeCss = "";
		if (this.TYPE == TYPE.RANGE) {
			typeCss = " range";
		} else {
			if (this.TYPE == TYPE.FRAME) {
				typeCss = " frame";
			} else {
				typeCss = " normal";
			}
			if (SmiEditor.findSync(sync, SmiEditor.video.kfs, false)) {
				typeCss += " keyframe";
			}
		}
		let h = sync;
		const ms = h % 1000; h = (h - ms) / 1000;
		const s  = h %   60; h = (h -  s) /   60;
		const m  = h %   60; h = (h -  m) /   60;
		const syncText = (h + ":" + (m>9?"":"0")+m + ":" + (s>9?"":"0")+s + ":" + (ms>99?"":"0")+(ms>9?"":"0")+ms);
		
		if (this.LEFT == null) {
			(this.LEFT = $("<div>")).append($("<span>"));
		}
		const $div = this.LEFT;
		$div.attr({
				"class": "sync" + (sync < last.sync ? " error" : (sync == last.sync ? " equal" : "")) + typeCss
			,	"data-index": index // data로 넣어주면 지우고 다시 그릴 때 사라짐
		});
		$div.find("span").text(syncText);
		
		last.sync = sync;
		
	} else {
		this.TYPE = TYPE.TEXT;
		if (this.LEFT != null) {
			this.LEFT.remove();
			this.LEFT = null;
		}
	}
	this.renderHighlight(last);
	return this;
};
Line.prototype.renderHighlight = function(last, forced=false) {
	if (SmiEditor.useHighlight) {
		if (!forced && this.VIEW && this.VIEW.data("state") == last.state) {
			// 상태가 바뀌지 않음
			return false;
		}
		const $view = this.VIEW = SmiEditor.highlightText(this.TEXT, last.state);
		$view.attr({ "data-state": last.state, "data-next": (last.state = $view.data("next")) });
		
		// 색상 미리보기
		if (SmiEditor.showColor) {
			$view.find(".hljs-attr").each((_, el) => {
				const $attr = $(el);
				const attrName = $attr.text().trim().toLowerCase();
				if (attrName == "color" || attrName == "fade") {
					const $value = $attr.next();
					if ($value.hasClass("hljs-value")) {
						let color = $value.text();
						if (color.startsWith('"') || color.startsWith("'")) {
							color = color.substring(1, color.length - 1);
						}
						color = color.trim();
						if (!(color.length == 7 && color.startsWith("#"))) {
							let hex = sToAttrColor(color);
							if (hex == color) {
								return;
							}
							color = "#" + hex;
						}
						$value.addClass("hljs-color").css({ borderColor: color });
					}
				}
			});
		}
		
		// 줄바꿈 표시
		if (SmiEditor.showEnter) {
			$view.append($("<span class='hljs-comment enter'>").text("↵"));
		}
		
		return true;
	}
	return false;
}

window.SmiEditor = function(text) {
	const editor = this;
	
	this.initialize = false;
	this.area = $("<div class='hold'>");
	this.area.append(this.colSync = $("<div class='col-sync'>"));
	this.area.append(this.colSyncCover = $("<div class='col-sync-cover'>")); // 블록지정 방지 영역
	{	// 문법 하이라이트 기능 지원용
		this.hArea = $("<div class='input highlight-textarea hljs" + (SmiEditor.useHighlight ? "" : " nonactive") + "'>");
		this.hArea.append($("<div>").append(this.hview = $("<div>")));
		this.hArea.append(this.input = $("<textarea spellcheck='false'>"));
//		this.hArea.append(this.input = $("<textarea spellcheck='false' class='scrollTop scrollLeft'>"));
		this.area.append(this.hArea);
	}
	this.colSync.append(this.colSyncSizer = $('<div class="sync">&nbsp;</div>'));
	if (text) {
		text = text.split("\r\n").join("\n");
		
		// 싱크 라인 분리되도록 양식 변환
		const lines = text.split("\n");
		const newLines = [];
		let cnt = 0;
		for (let i = 0; i < lines.length; i++) {
			let line = lines[i];
			if (line.substring(0, 6).toUpperCase() == "<SYNC ") {
				const blocks = line.split(">");
				for (let j = 1; j < blocks.length; j++) {
					if (blocks[j].substring(0, 6).toUpperCase() == "<SYNC ") continue;
					if (blocks[j].substring(0, 3).toUpperCase() == "<P ") continue;
					
					const syncLine = blocks.splice(0, j).join(">") + ">";
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
	this.lines = [new Line()];
	
	this.isRendering = false;
	this.needToRender = false;
	
	this.bindEvent();
	
	this.history = new History(this.input, 32, () => {
		editor.scrollToCursor();
		editor.render([0, editor.lines.length]); // 실행취소일 땐 전체 갱신하도록
	});
	setTimeout(() => {
		if (SmiEditor.autoComplete.length) {
			editor.act = new AutoCompleteTextarea(editor.input, SmiEditor.autoComplete, () => {
				editor.history.log();
				editor.render();
			});
		}
	}, 1);
};

SmiEditor.setSetting = (setting) => {
	if (setting.sync) {
		SmiEditor.sync = setting.sync;
	}
	SmiEditor.useHighlight = setting.highlight && setting.highlight.parser;
	if (setting.highlight) {
		SmiEditor.showColor = setting.highlight.color;
		SmiEditor.showEnter = setting.highlight.enter;
	}
	
	{	// AutoComplete
		for (let key in SmiEditor.autoComplete) {
			delete SmiEditor.autoComplete[key];
		}
		if (setting.autoComplete) {
			for (let key in setting.autoComplete) {
				SmiEditor.autoComplete[key] = setting.autoComplete[key];
			}
		}
	}
	
	{	// 단축키
		const withs = ["withCtrls", "withAlts", "withCtrlAlts", "withCtrlShifts"];
		const keys = "pqrstuvwxyz{ABCDEFGHIJKLMKNOPQRSTUVWXYZ1234567890";
		SmiEditor.fn = setting.command ? setting.command.fn : {}; // F숫자 조합은 기본값 추가 없이 그대로 사용
		
		// 설정값 초기화
		for (let i = 0; i < withs.length; i++) {
			const command = SmiEditor[withs[i]] = { reserved: "" /* 설정에서 건드릴 수 없는 예약 단축키 */ };
			for (let j = 0; j < keys.length; j++) {
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
			for (let i = 0; i < setting.menu.length; i++) {
				const menu = setting.menu[i][0];
				const index = menu.indexOf("&") + 1;
				if (index > 0 && index < menu.length) {
					const key = menu[index];
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
			for (let i = 0; i < withs.length; i++) {
				const withCmd = withs[i];
				const command = setting.command[withCmd];
				for (let key in command) {
					const func = command[key];
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
		playOrPause: (    ) => { binder.playOrPause(); }
	,	play       : (    ) => { binder.play(); }
	,	stop       : (    ) => { binder.stop(); }
	,	moveTo     : (time) => { binder.moveTo(time); }
	,	move       : (move) => { binder.moveTo(time + move); }
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
SmiEditor.findSync = (sync, fs=[], findNear=true, from=0, to=-1) => {
	if (fs.length == 0) return null;
	if (to < 0) to = fs.length;
	if (from + 1 == to) {
		const dist0 = sync - fs[from];
		const dist1 = fs[to] - sync;
		if (dist0 <= dist1) {
			return (findNear || (dist0 == 0)) ? fs[from] : null;
		} else {
			return (findNear || (dist1 == 0)) ? fs[to] : null;
		}
	}
	const mid = from + Math.floor((to - from) / 2);
	if (fs[mid] < sync) {
		return SmiEditor.findSync(sync, fs, findNear, mid, to);
	} else {
		return SmiEditor.findSync(sync, fs, findNear, from, mid);
	}
}
SmiEditor.getSyncTime = (sync, forKeyFrame=false, output={}) => { /* output: 리턴값은 숫자여야 하는데, 키프레임 상태값 반환이 필요해져서 C# out처럼 만듦 */
	if (!sync) sync = (time + SmiEditor.sync.weight);
	if (SmiEditor.sync.frame) { // 프레임 단위 싱크 보정
		let adjustSync = null;
		if (SmiEditor.trustKeyFrame // 키프레임 신뢰
		 && (forKeyFrame || SmiEditor.followKeyFrame) // 화면 싱크, 혹은 키프레임 따라가게 설정된 경우
		 && SmiEditor.video.kfs.length > 2
		) {
			adjustSync = SmiEditor.findSync(sync, SmiEditor.video.kfs);
			const dist = Math.abs(adjustSync - sync);
			if (dist > SmiEditor.limitKeyFrame) { // 기준치 넘어가면 키프레임에 맞춘 게 아니라고 간주
				adjustSync = null;
			} else {
				output.keyframe = true;
			}
		}
		if (adjustSync == null && SmiEditor.video.fs.length > 2) { // 프레임 싱크
			adjustSync = SmiEditor.findSync(sync, SmiEditor.video.fs);
			const dist = Math.abs(adjustSync - sync);
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
SmiEditor.makeSyncLine = (time, type) => {
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
	const editor = this;
	
	// 내용에 따라 싱크 표시 동기화
	this.input.on("input propertychange", function() {
		editor.render();
	});
	this.render();
	
	this.input.on("scroll", function(e) {
		const scrollTop  = editor.input.scrollTop ();
		const scrollLeft = editor.input.scrollLeft();
		
		// 싱크 스크롤 동기화
		editor.colSync.scrollTop(scrollTop);
		
		if (SmiEditor.useHighlight) {
			// 문법 하이라이트 스크롤 동기화
			editor.hview.css({
					marginTop : -scrollTop 
				,	marginLeft: -scrollLeft
			});
			
			// 문법 하이라이트 보이는 범위 찾기
			const showFrom = Math.floor(scrollTop / LH);
			const showEnd  = Math.ceil((scrollTop + editor.input.outerHeight()) / LH);
			
			const toAppendLefts = [];
			const toRemoveLefts = [];
			editor.colSync.children().each(function() {
				toRemoveLefts.push(this);
			});
			const toAppendViews = [];
			const toRemoveViews = [];
			editor.hview.children().each(function() {
				toRemoveViews.push(this);
			});
			
			const a = Math.max(0, showFrom);
			const b = Math.min(showEnd, editor.lines.length);
			for (let i = a; i < b; i++) {
				const css = { top: (i * LH) + "px" };
				const $left = editor.lines[i].LEFT;
				const $view = editor.lines[i].VIEW;
				if ($left != null) {
					const rIndex = toRemoveLefts.indexOf($left[0]);
					if (rIndex >= 0) {
						// 기존에 있었는데 범위에 남아있음
						toRemoveLefts.splice(rIndex, 1);
					} else {
						// 기존에 없었는데 범위에 들어옴
						toAppendLefts.push($left);
					}
					// 위치 계산은 새로 해줌
					$left.css(css);
				}
				if ($view != null) {
					const rIndex = toRemoveViews.indexOf($view[0]);
					if (rIndex >= 0) {
						// 기존에 있었는데 범위에 남아있음
						toRemoveViews.splice(rIndex, 1);
					} else {
						// 기존에 없었는데 범위에 들어옴
						toAppendViews.push($view);
					}
					// 위치 계산은 새로 해줌
					$view.css(css);
				}
			}
			// 0번은 colSyncSizer
			for (let i = 1; i < toRemoveLefts.length; i++) {
				$(toRemoveLefts[i]).remove();
			}
			for (let i = 0; i < toAppendLefts.length; i++) {
				editor.colSync.append(toAppendLefts[i]);
			}
			for (let i = 0; i < toRemoveViews.length; i++) {
				$(toRemoveViews[i]).remove();
			}
			for (let i = 0; i < toAppendViews.length; i++) {
				editor.hview.append(toAppendViews[i]);
			}
		}
	});
	
	// 개발용 임시
	this.input.on("keypress", function(e) {
		//console.log(e.keyCode);
	});
	
	this.input.on("mousedown", function(e) {
		editor.history.log();
		editor.colSyncCover.show();
	}).on("keyup", function(e) {
		// 찾기/바꾸기 창이 있었을 경우 재활성화
		SmiEditor.Finder.focus();
	});
	this.area.on("mouseup", function(e) {
		editor.colSyncCover.hide();
	});
	// 창 벗어난 상태에서 mouseup 해서 레이어가 안 사라진 경우, 클릭하면 제거
	this.colSyncCover.on("click", function(e) {
		editor.colSyncCover.hide();
	});
	
	{
		// 싱크 영역에서 휠 돌리는 경우
		let targetScrollTop = 0;
		let lastScrollStart = -1;
		this.colSync.on("scroll", function(e) {
			if (e.ctrlKey || e.shiftKey || e.altKey) {
				return;
			}
			editor.input.scrollTop(editor.colSync.scrollTop());
			
		}).on("wheel", ".sync", function(e) {
			if (!e.ctrlKey) {
				return;
			}
			// Ctrl+휠이면 싱크 조절 동작
			const $sync = $(this);
			if ($sync.hasClass("range")) {
				return;
			}
			editor.moveSyncLine($sync.data("index"), (e.originalEvent.deltaY < 0));
			
		}).attr({ title: "Ctrl+휠로 개별 싱크를 조절할 수 있습니다." });

		// 싱크 조절 버튼 기능
		this.colSync.on("click", ".sync:not(.range)", function(e) {
			if ((e.clientX / editor.colSync.width()) >= 0.84) {
				const $sync = $(this);
				editor.moveSyncLine($sync.data("index"), (((e.clientY - $sync.offset().top) / $sync.height() * 2) < 1));
			}
		});
	}
};

SmiEditor.selected = null;
SmiEditor.keyEventActivated = false;
SmiEditor.activateKeyEvent = function() {
	if (SmiEditor.keyEventActivated) return;
	SmiEditor.keyEventActivated = true;
	
	let lastKeyDown = 0;
	$(document).on("keydown", function(e) {
		lastKeyDown = e.keyCode;
		const editor = SmiEditor.selected;
		const hasFocus = editor && editor.input.is(":focus");
		
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
							const text = editor.input.val();
							const index = editor.input[0].selectionEnd;
							if (((index == 0) || (text[index-1] == '\n')) && (text[index] == '\n')) {
								e.preventDefault();
							}
						}
					}
					break;
				}
				case 36: { // Home
					if (hasFocus) {
						// 커서가 원래부터 맨 앞에 있는 경우엔 커서 이동이 없어서, 알아서 스크롤이 안 됨
						editor.input.scrollLeft(0);
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
								// Ctrl+방향키 이동 시 태그 건너뛰기
								const cursor = editor.getCursor();
								if (cursor[0] > 0 && cursor[0] == cursor[1]) {
									const text = editor.input.val();
									if (text[cursor[0] - 1] == '>') {
										const prev = text.substring(0, cursor[0]);
										const index = prev.lastIndexOf('<');
										if (index >= 0) {
											const tag = prev.substring(index, prev.length - 1);
											if ((tag.indexOf('\n') < 0) && (tag.indexOf('>') < 0)) {
												editor.setCursor(index);
												editor.scrollToCursor();
												e.preventDefault();
											}
										}
									} else if (text[cursor[0] - 1] == ';') {
										const prev = text.substring(0, cursor[0]);
										const index = prev.lastIndexOf('&');
										if (index >= 0) {
											const tag = prev.substring(index, prev.length - 1);
											if ((tag.indexOf('\n') < 0) && (tag.indexOf(';') < 0)) {
												editor.setCursor(index);
												editor.scrollToCursor();
												e.preventDefault();
											}
										}
									}
								}
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
								// Ctrl+방향키 이동 시 태그 건너뛰기
								const cursor = editor.getCursor();
								if (cursor[0] == cursor[1]) {
									const text = editor.input.val();
									if (text.length > cursor[0]) {
										if (text[cursor[0]] == '<') {
											const next = text.substring(cursor[0]);
											const index = next.indexOf('>') + 1;
											if (index > 0) {
												const tag = next.substring(1, index);
												if ((tag.indexOf('\n') < 0)) {
													editor.setCursor(cursor[0] + index);
													editor.scrollToCursor();
													e.preventDefault();
												}
											}
										} else if (text[cursor[0]] == '&') {
											const next = text.substring(cursor[0]);
											const index = next.indexOf(';') + 1;
											if (index > 0) {
												const tag = next.substring(1, index);
												if ((tag.indexOf('\n') < 0) && (tag.indexOf('&') < 0)) {
													editor.setCursor(cursor[0] + index);
													editor.scrollToCursor();
													e.preventDefault();
												}
											}
										}
									}
								}
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
							const cursor = editor.getCursor();
							if (cursor[0] == cursor[1]) {
								const text = editor.input.val();
								let delLen = 0;
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
									const index = text.substring(0, cursor[0]).lastIndexOf("<");
									if (index >= 0) {
										delLen = cursor[0] - index;
									}
								}
								if (!delLen && cursor[0] >= 4 && text[cursor[0]-1] == ";") {
									const index = text.substring(0, cursor[0]).lastIndexOf("&");
									if (index >= 0) {
										delLen = cursor[0] - index;
										if (delLen > 10) { // &~~; 형태가 열 글자를 넘진 않음
											delLen = 0;
										}
									}
								}
								if (delLen) {
									e.preventDefault();
									const pos = cursor[0] - delLen;
									editor.input.val(text.substring(0, pos) + text.substring(cursor[0]));
									editor.setCursor(pos);
									editor.render();
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
							const cursor = editor.getCursor();
							if (cursor[0] == cursor[1]) {
								const text = editor.input.val();
								let delLen = 0;
								if (cursor[0] + 12 <= text.length) {
									if (text.substring(cursor[0], cursor[0]+12) == "<b>　</b><br>") {
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
									const index = text.indexOf(">", cursor[0]);
									if (index > 0) {
										delLen = index - cursor[0] + 1;
									}
								}
								if (!delLen && text[cursor[0]] == "&") {
									const index = text.indexOf(";", cursor[0]);
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
									editor.render();
									editor.scrollToCursor();
								}
							}
						}
					}
				}
			}
			
			{	// 단축키 설정
				let f = null;
				const key = (e.keyCode == 192) ? '`' : String.fromCharCode(e.keyCode);
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
					
					const type = typeof f;
					if (type == "function") {
						f();
					} else if (type == "string") {
						eval("(() => { " + f + "// */\n})()"); // 내용물이 주석으로 끝날 수도 있음
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
	let left = 0;
	if (typeof lineNo == "undefined") {
		const linesBeforeCursor = this.input.val().substring(0, this.input[0].selectionEnd).split("\n");
		// 좌우 스크롤 계산
		left = this.getWidth(linesBeforeCursor[lineNo = (linesBeforeCursor.length - 1)]);
	}
	let top = lineNo * LH;
	
	{	const scrollTop = this.input.scrollTop();
		if (top < scrollTop) { // 커서가 보이는 영역보다 위
			this.input.scrollTop(top);
		} else {
			top += LH + SB - this.input.css("height").split("px")[0] + 2; // .height()는 padding을 빼고 반환함
			if (top > scrollTop) { // 커서가 보이는 영역보다 아래
				this.input.scrollTop(top);
			}
		}
	}
	{	const scrollLeft = this.input.scrollLeft();
		if (left < scrollLeft) { // 커서가 보이는 영역보다 왼쪽
			this.input.scrollLeft(left);
		} else {
			left += SB - this.input.width() + 2;
			if (left > scrollLeft) { // 커서가 보이는 영역보다 오른쪽
				this.input.scrollLeft(left);
			}
		}
	}
	// 간헐적 에디터 외부 스크롤 버그 교정
	this.area.scrollTop(0);
}
SmiEditor.prototype.getWidth = function(text) {
	let checker = SmiEditor.prototype.widthChecker;
	if (!checker) {
		$("body").append(checker = SmiEditor.prototype.widthChecker = $("<span>"));
		checker.css({ "white-space": "pre" });
	}
	checker.css({ font: this.input.css("font") }).text(text).show();
	const width = checker.width();
	checker.hide();
	return width;
}

SmiEditor.prototype.fixScrollAroundEvent = function(scrollLeft) {
	// 원래 스크롤 기억
	const scrollTop = this.input.scrollTop();
	if (scrollLeft == undefined) {
		scrollLeft = this.input.scrollLeft()
	}
	const editor = this;
	setTimeout(() => {
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
		this.setCursor(this.input[0].selectionStart);
	}
	
	this.history.log();
	this.render();
}
SmiEditor.prototype.getLine = function() {
	const cursor = this.getCursor();
	const lines = this.input.val().substring(0, cursor[1]).split("\n");
	const lineNo = lines.length - 1;
	const selection = [Math.max(0, lines[lineNo].length - cursor[1] + cursor[0]), lines[lineNo].length];
	return {"text": this.lines[lineNo].TEXT
		,	"selection": selection
	};
}
SmiEditor.prototype.setLine = function(text, selection) {
	this.history.log();
	
	const cursor = this.input[0].selectionEnd;
	const value = this.input.val();
	let lines = value.substring(0, cursor).split("\n");
	const lineNo = lines.length - 1;
	const offset = cursor - lines[lineNo].length;
	lines = value.split("\n");
	lines[lineNo] = text;
	this.input.val(lines.join("\n"));
	if (selection) {
		this.setCursor(offset + selection[0], offset + selection[1]);
	} else {
		this.setCursor(cursor);
	}
	
	this.history.log();
	this.render();
}
SmiEditor.inputText = (text) => {
	if (SmiEditor.selected) {
		SmiEditor.selected.inputText(text);
	}
}
SmiEditor.prototype.inputText = function(input, standCursor) {
	const text = this.input.val();
	const selection = this.getCursor();
	const cursor = selection[0] + (standCursor ? 0 : input.length);
	this.setText(text.substring(0, selection[0]) + input + text.substring(selection[1]), [cursor, cursor]);
	this.scrollToCursor();
}
SmiEditor.prototype.inputTextLikeNative = function(input) {
	// TODO: 횡스크롤을 안 잡고 있음...
	// 좌우 스크롤까지 하는 건 연산량 부담...
	// 애초에 예외적인 경우에 필요한 기능이긴 한데...
	const text = this.input.val();
	const selection = this.getCursor();
	const cursor = selection[0] + input.length;
	this.input.val(text.substring(0, selection[0]) + input + text.substring(selection[1]));
	this.setCursor(cursor);
	this.render();
	this.scrollToCursor();
}

SmiEditor.prototype.reSyncPrompt = function() {
	const editor = this;
	prompt("싱크 시작 시간을 입력하세요.", (value) => {
		if (!value || !isFinite(value)) {
			alert("잘못된 값입니다.");
			return;
		}
		editor.reSync(Number(value), true);
	});
}
SmiEditor.prototype.reSync = function(sync, limitRange) {
	if (this.isRendering) {
		return;
	}
	this.history.log();
	
	// 커서가 위치한 줄
	const cursor = this.input[0].selectionStart;
	let lineNo = this.input.val().substring(0, cursor).split("\n").length - 1;

	if (!sync) {
		sync = SmiEditor.getSyncTime();
	}
	
	// 적용 시작할 싱크 찾기
	let i = lineNo;
	for (; i < this.lines.length; i++) {
		if (this.lines[i].SYNC) {
			break;
		}
	}
	if (i == this.lines.length) {
		// 적용할 싱크 없음
		return;
	}
	const add = sync - this.lines[lineNo = i].SYNC;
	const lines = this.lines.slice(0, lineNo);
	
	let limitLine = this.lines.length;
	if (limitRange) {
		const endCursor = this.input[0].selectionEnd;
		if (endCursor > cursor) {
			limitLine = this.input.val().substring(0, endCursor).split("\n").length;
		}
	}
	for (; i < this.lines.length; i++) {
		const line = this.lines[i];
		if (i < limitLine && line.SYNC) {
			const sync = line.SYNC;
			const newSync = sync + add;
			// 싱크 줄에는 다른 숫자가 없다고 가정
			lines.push(new Line(line.TEXT.split(sync).join(newSync), newSync, line.TYPE));
		} else {
			lines.push(line);
		}
	}
	
	this.input.val(linesToText(lines));
	this.setCursor(cursor);
	this.history.log();
	this.render([lineNo, this.lines.length]);
}
SmiEditor.prototype.insertSync = function(forFrame) {
	if (this.isRendering) {
		return;
	}
	this.history.log();
	
	// 현재 커서가 위치한 줄
	const lineNo = this.input.val().substring(0, this.input[0].selectionEnd).split("\n").length - 1;
	
	let tmp = {};
	const sync = SmiEditor.getSyncTime(null, forFrame, tmp);
	forFrame = forFrame || tmp.keyframe;
	
	let cursor = 0;
	const lineSync = this.lines[lineNo].SYNC;
	if (lineSync) {
		// 싱크 줄에서 싱크 삽입할 경우엔 싱크 수정
		// 싱크 줄에는 다른 숫자가 없다고 가정
		let lineText = this.lines[lineNo].TEXT.split(lineSync).join(sync);
		let type = this.lines[lineNo].TYPE;
		// 여기서 토글은 없는 게 나을 듯... TODO: 설정으로?
		let toggleWithUpdate = false;
		if (toggleWithUpdate) {
			if (type == TYPE.BASIC && forFrame) {
				const index = lineText.lastIndexOf(">");
				if (index > 0) {
					lineText = lineText.substring(0, index) + " " + lineText.substring(index);
				}
				type = TYPE.FRAME;
			} else if (type == TYPE.FRAME && !forFrame) {
				lineText = lineText.split(" >").join(">");
				type = TYPE.BASIC;
			}
		}
		// 에디터 맨 아래에 싱크줄이 있는 예외가 있음
		const limit = Math.min(this.lines.length, lineNo + SmiEditor.sync.update);
		for (let i = 0; i < limit; i++) { // 싱크 찍은 다음 줄로 커서 이동
			cursor += this.lines[i].TEXT.length + 1;
		}
		this.input.val(linesToText(this.lines.slice(0, lineNo).concat([new Line(lineText, sync, type)], this.lines.slice(lineNo + 1))));
		this.scrollToCursor(lineNo + SmiEditor.sync.update);
		
	} else {
		// 싱크 입력
		const inputLines = [];
		const type = forFrame ? TYPE.FRAME : TYPE.BASIC;
		const lineText = SmiEditor.makeSyncLine(sync, type);
		for (let i = 0; i <= lineNo; i++) {
			cursor += this.lines[i].TEXT.length + 1;
		}
		
		// 윗줄 내용이 없으면 공백 싱크 채워주기
		// TODO: 설정이 필요한가...?
		if (lineNo > 0) {
			const prevLine = this.lines[lineNo-1];
			if (prevLine.SYNC) {
				inputLines.push(new Line("&nbsp;"));
				cursor += 7;
			} else if (prevLine.TEXT.trim() == "") {
				cursor += 7 - prevLine.TEXT.length;
				prevLine.TEXT = "&nbsp;";
				prevLine.VIEW = null;
				prevLine.render();
			}
		}
		
		if (SmiEditor.sync.insert > 0) { // 싱크 찍은 다음 줄로 커서 이동
			cursor += lineText.length + 1;
			for (let i = lineNo + 1; i < lineNo + SmiEditor.sync.insert; i++) {
				cursor += this.lines[i].TEXT.length + 1;
			}
			// 아랫줄 내용이 없으면 공백 싱크 채워주기
			if (this.lines[lineNo].TEXT.length == 0) {
				const nextLine = this.lines[lineNo + SmiEditor.sync.insert];
				if (nextLine && nextLine.TEXT.length) {
					this.lines[lineNo].TEXT = "&nbsp;";
					cursor += 6;
				}
			}
		}
		inputLines.push(new Line(lineText, sync, type));
		
		this.input.val(linesToText(this.lines.slice(0, lineNo).concat(inputLines, this.lines.slice(lineNo))));
		this.scrollToCursor(lineNo + SmiEditor.sync.insert + 1);
	}
	this.setCursor(cursor);
	
	this.history.log();
	this.render();
}
SmiEditor.prototype.toggleSyncType = function() {
	if (this.isRendering) {
		return;
	}
	this.history.log();
	
	const text = this.input.val();
	let cursor = this.input[0].selectionEnd;
	const lineNo = text.substring(0, cursor).split("\n").length - 1;
	
	for (let i = lineNo; i >= 0; i--) {
		if (this.lines[i].SYNC) {
			let line = this.lines[i];
			let newLine = {}; newLine.SYNC = line.SYNC;
			if (line.TYPE == TYPE.BASIC) { // 화면 싱크 할당
				newLine.TYPE = TYPE.FRAME;
				if (SmiEditor.trustKeyFrame) { // 키프레임 신뢰할 경우 자동으로 키프레임에 맞추기
					newLine.SYNC = SmiEditor.getSyncTime(line.SYNC, true);
				}
			} else if (line.TYPE == TYPE.FRAME) { // 화면 싱크 해제
				newLine.TYPE = TYPE.BASIC;
			} else {
				return;
			}
			newLine.TEXT = SmiEditor.makeSyncLine(newLine.SYNC, newLine.TYPE);
			cursor += (newLine.TEXT.length - line.TEXT.length);
			this.input.val(linesToText(this.lines.slice(0, i).concat(newLine, this.lines.slice(i + 1))));
			this.render();
			this.setCursor(cursor);
			
			this.history.log();
			this.renderByResync([i, i+1]);
			return;
		}
	}
}
SmiEditor.prototype.removeSync = function() {
	if (this.isRendering) {
		return;
	}
	this.history.log();
	
	const text = this.input.val();
	const range = this.getCursor();
	const lineRange = [text.substring(0, range[0]).split("\n").length - 1, text.substring(0, range[1]).split("\n").length - 1];
	
	// 해당 줄 앞뒤 전체 선택되도록 조정
	range[0] = 0;
	for (let i = 0; i <= lineRange[1]; i++) {
		let lineLength = this.lines[i].TEXT.length;
		if (i < lineRange[0]) {
			range[0] += lineLength + 1;
		} else if (i == lineRange[0]) {
			range[1] = range[0] + lineLength;
		} else {
			range[1] += lineLength + 1;
		}
	}
	
	let lines = this.lines.slice(0, lineRange[0]);
	let cnt = 0;
	for (let i = lineRange[0]; i <= lineRange[1]; i++) {
		if (this.lines[i].SYNC) {
			range[1] -= this.lines[i].TEXT.length + 1;
			cnt++;
		} else {
			lines.push(this.lines[i]);
		}
	}
	this.input.val(linesToText(lines.concat(this.lines.slice(lineRange[1]+1))));
	this.setCursor(range[0], range[1]);
	this.scrollToCursor(lineRange[1] - cnt);

	this.history.log();
	this.render();
}
SmiEditor.prototype.insertBR = function() {
	this.history.log();
	
	const text = this.input.val();
	const range = this.getCursor();
	this.input.val(text.substring(0, range[0]) + "<br>" + text.substring(range[1]));
	range[1] = range[0] + 4;
	this.setCursor(range[1], range[1]);
	this.history.log();
	this.render();
}
SmiEditor.prototype.moveToSync = function(add) {
	if (typeof add != "number") {
		add = 0;
	}
	
	const lineNo = this.input.val().substring(0, this.input[0].selectionEnd).split("\n").length - 1;
	let sync = 0;
	for (let i = lineNo; i >= 0; i--) {
		if (this.lines[i].SYNC) {
			sync = this.lines[i].SYNC;
			break;
		}
	}
	sync += add;
	if (sync < 0) {
		sync = 0;
	}
	
	SmiEditor.PlayerAPI.play();
	SmiEditor.PlayerAPI.moveTo(sync);
}
SmiEditor.prototype.findSync = function(target) {
	if (!target) {
		target = time;
	}
	let lineNo = 0;
	let hasSync = false;
	for (let i = 0; i < this.lines.length; i++) {
		if (this.lines[i].TYPE) {
			hasSync = true;
			if (this.lines[i].SYNC < target) {
				lineNo = i + 1;
			} else {
				if (!lineNo) {
					lineNo = (i > 0) ? (i - 1) : 0;
				}
				break;
			}
		}
	}
	if (!hasSync) {
		return;
	}
	const cursor = (lineNo ? this.text.split("\n").slice(0, lineNo).join("\n").length + 1 : 0);
	this.setCursor(cursor);
	this.scrollToCursor(lineNo);
}
SmiEditor.prototype.deleteLine = function() {
	if (this.isRendering) {
		return;
	}
	this.history.log();
	
	const text = this.input.val();
	const range = this.getCursor();
	if ((range[0] < range[1]) && (text[range[1] - 1] == "\n")) {
		range[1]--;
	}
	const lineRange = [text.substring(0, range[0]).split("\n").length - 1, text.substring(0, range[1]).split("\n").length - 1];
	let tmp = text.substring(0, range[0]).split("\n");
	const cursor = range[0] - tmp[tmp.length - 1].length;
	
	this.input.val(linesToText(this.lines.slice(0, lineRange[0]).concat(this.lines.slice(lineRange[1]+1))));
	this.setCursor(cursor);
	this.history.log();
	this.render();
}

SmiEditor.prototype.tagging = function(tag, fromCursor) {
	if (typeof tag == "undefined") return;
	if (tag[0] != "<") return;
	if (tag.indexOf(">") != tag.length - 1) return;

	this.history.log();

	let index = tag.indexOf(" ");
	if (index < 0) index = tag.indexOf(">");
	const closer = "</" + tag.substring(1, index) + ">";
	
	const line = this.getLine();
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
		const selected = line.text.substring(line.selection[0], line.selection[1]);
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

SmiEditor.prototype.updateTimeRange = function() {
	let start = 999999998;
	let end = 0;
	for (let i = 0; i < this.lines.length; i++) {
		const line = this.lines[i];
		if (line.TYPE) {
			start = Math.min(start, line.SYNC);
			end   = Math.max(end  , line.SYNC);
		}
	}
	this.start = start;
	if (end) {
		this.end   = (start == end) ? 999999999 : end;
	} else {
		this.end = 999999999;
	}
}

SmiEditor.prototype.render = function(range=null) {
	if (this.isRendering) {
		// 이미 렌더링 중이면 대기열 활성화
		this.needToRender = true;
		return;
	}
	this.needToRender = false;
	this.isRendering = true;

	const self = this;
	function thread() {
		const lines = self.lines;
		const newText = self.input.val();
		const newTextLines = newText.split("\n");
		
		// 텍스트 바뀐 범위 찾기
		let remainedHead = 0;
		let remainedFoot = 0;
		if (range) {
			remainedHead = range[0];
			remainedFoot = lines.length - range[1];
		}
		{	const limit = Math.min(lines.length, newTextLines.length);
			for (; remainedHead < limit; remainedHead++) {
				if (lines[remainedHead].TEXT != newTextLines[remainedHead]) {
					break;
				}
			}
			for (; remainedFoot < limit - remainedHead - 1; remainedFoot++) {
				if (lines[lines.length - 1 - remainedFoot].TEXT != newTextLines[newTextLines.length - 1 - remainedFoot]) {
					break;
				}
			}
		}
		
		// 텍스트 바뀐 범위보다 앞쪽
		const newLines = self.lines.slice(0, remainedHead);
		const last = { sync: 0, state: null };
		for (let i = remainedHead - 1; i >= 0; i--) {
			if (self.lines[i].SYNC) {
				last.sync = self.lines[i].SYNC;
				break;
			}
		}
		if (SmiEditor.useHighlight && remainedHead > 0) {
			last.state = self.lines[remainedHead - 1].VIEW ? self.lines[remainedHead - 1].VIEW.data("next") : null;
		}
		
		{	// 텍스트 바뀐 범위
			for (let i = remainedHead; i < newTextLines.length - remainedFoot; i++) {
				newLines.push(new Line(newTextLines[i]).render(i, last));
			}
		}
		{	// 텍스트 바뀐 범위보다 뒤쪽
			newLines.push(...lines.slice(lines.length - remainedFoot));
			
			if (last.sync) {
				for (let i = newLines.length - remainedFoot; i < newLines.length; i++) {
					if (newLines[i].SYNC) {
						const line = newLines[i];
						if (line.SYNC <= last.sync) {
							line.LEFT.addClass((line.SYNC == last.sync) ? "equal" : "error");
						} else {
							line.LEFT.removeClass("equal").removeClass("error");
						}
						break;
					}
				}
			}
			for (let i = newLines.length - remainedFoot; i < newLines.length; i++) {
				if (!newLines[i].renderHighlight(last)) {
					break;
				}
			}
		}

		self.text = newText;
		self.lines = newLines;
		self.colSyncSizer.css({ top: newLines.length * LH + "px" });
		
		if (SmiEditor.PlayerAPI && SmiEditor.PlayerAPI.setLines) {
			SmiEditor.PlayerAPI.setLines(newLines);
		}
		if (SmiEditor.Viewer.window) {
			SmiEditor.Viewer.refresh();
		}
		self.isRendering = false;
		
		self.afterChangeSaved(self.isSaved());
		
		setTimeout(() => {
			if (self.needToRender) {
				// 렌더링 대기열 있으면 재실행
				self.render();
			} else {
				// 렌더링 끝났으면 출력 새로고침
				self.input.scroll();
			}
		}, 100);
	};
	setTimeout(thread, 1);
}
// highlightCss, highlightText는 설정 가져와서 override
SmiEditor.highlightCss = ".hljs-sync: { color: #3F5FBF; }";
SmiEditor.highlightText = (text, state=null) => {
	const previewLine = $("<span>");
	if (text.toUpperCase().startsWith("<SYNC ")) {
		previewLine.addClass("hljs-sync");
	}
	return previewLine.text(text);
}
SmiEditor.refreshHighlight = () => {
	let $style = $("#styleHighlight");
	if (!$style.length) {
		$("head").append($style = $("<style id='styleHighlight'>"));
	}
	$style.html(SmiEditor.highlightCss);
}
SmiEditor.prototype.refreshHighlight = function() {
	if (SmiEditor.useHighlight) {
		this.hArea.removeClass("nonactive");
		const last = { state: null };
		for (let i = 0; i < this.lines.length; i++) {
			this.lines[i].renderHighlight(last, true);
		}
		this.input.scroll();
	} else {
		this.hArea.addClass("nonactive");
	}
}

SmiEditor.prototype.moveLine = function(toNext) {
	if (this.isRendering) return;
	this.history.log();
	
	const text = this.input.val();
	const range = this.getCursor();
	const lineRange = [text.substring(0, range[0]).split("\n").length - 1, text.substring(0, range[1]).split("\n").length - 1];
	const lines = text.split("\n");
	let addLine = 0;
	
	if (toNext) {
		if (lineRange[1] == lines.length - 1) {
			return;
		}
		this.input.val(lines.slice(0, lineRange[0]).concat(lines[lineRange[1]+1], lines.slice(lineRange[0], lineRange[1]+1), lines.slice(lineRange[1]+2)).join("\n"));
		
		const targetTop = (lineRange[1]+2) * LH - this.input.css("height").split("px")[0] + SB;
		if (targetTop > this.input.scrollTop()) {
			this.input.scrollTop(targetTop);
		}
		addLine = lines[lineRange[1]+1].length + 1;
	} else {
		if (lineRange[0] == 0) {
			return;
		}
		this.input.val(lines.slice(0, lineRange[0]-1).concat(lines.slice(lineRange[0], lineRange[1]+1), lines[lineRange[0]-1], lines.slice(lineRange[1]+1)).join("\n"));
		
		const targetTop = (lineRange[1]-1) * LH;
		if (targetTop < this.input.scrollTop()) {
			this.input.scrollTop(targetTop);
		}
		addLine = -(lines[lineRange[0]-1].length + 1);
	}
	this.setCursor(range[0]+addLine, range[1]+addLine);
	this.history.log();
	this.render([Math.max(0, lineRange[0]-1), Math.min(lineRange[1]+2, lines.length)]);
}
SmiEditor.prototype.moveSync = function(toForward) {
	this.history.log();
	
	const text = this.input.val();
	const range = this.getCursor();
	let lineRange = [0, this.lines.length - 1];
	let cursor = null;
	if (range[0] < range[1]) { // 선택 영역이 있을 때
		lineRange = [text.substring(0, range[0]).split("\n").length - 1, text.substring(0, range[1]).split("\n").length - 1];
	} else { // 선택 영역이 없을 때
		// 커서가 해당 줄의 몇 번째 글자인지를 기억
		const lines = text.substring(0, range[0]).split("\n");
		cursor = [lines.length - 1, lines[lines.length - 1].length];
	}

	if (toForward) {
		for (let i = lineRange[0]; i <= lineRange[1]; i++) {
			if (this.lines[i].SYNC) {
				let sync = this.lines[i].SYNC + SmiEditor.sync.unit;
				if (sync >= 36000000) { // 잠정 오류 조치 싱크 보정
					sync -= 36000000;
				}
				this.lines[i].TEXT = this.lines[i].TEXT.split(this.lines[i].SYNC).join(sync); // 싱크 줄에 싱크 이외의 숫자가 없다고 가정
				this.lines[i].SYNC = sync;
			}
		}
	} else {
		for (let i = lineRange[0]; i <= lineRange[1]; i++) {
			if (this.lines[i].SYNC) {
				let sync = this.lines[i].SYNC - SmiEditor.sync.unit;
				if (sync <= 0) { // 0 이하일 경우 10시간 옮겨서 경고
					sync += 36000000;
				}
				this.lines[i].TEXT = this.lines[i].TEXT.split(this.lines[i].SYNC).join(sync); // 싱크 줄에 싱크 이외의 숫자가 없다고 가정
				this.lines[i].SYNC = sync;
			}
		}
	}
	this.input.val(this.text = linesToText(this.lines));
	const lines = this.text.split("\n");
	if (range[0] < range[1]) { // 선택 영역이 있을 때
		// 줄 전체 선택
		let i = 0;
		let index = 0;
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
		let index = cursor[1];
		for (let i = 0; i < cursor[0]; i++) {
			index += lines[i].length + 1;
		}
		range[0] = range[1] = index;
	}
	this.setCursor(range[0], range[1]);
	this.renderByResync([lineRange[0], lineRange[1]+1]);
	this.history.log();
}
// 위에서 this.lines를 직접 건드려서 render로 갱신이 안 되는데... 이대로 가는 게 맞나? 일원화?
SmiEditor.prototype.renderByResync = function(range) {
	if (this.isRendering) {
		// 이미 렌더링 중이면 대기열 활성화
		this.needToRender = true;
		return;
	}
	this.needToRender = false;
	this.isRendering = true;
	
	// 프로세스 분리할 필요가 있나?
	const self = this;
	setTimeout(() => {
		const syncLines = [];
		
		// 줄 수 변동량
		let add = 0;
		
		const last = { sync: 0 };
		for (let i = range[0] - 1; i >= 0; i--) {
			if (self.lines[i].SYNC) {
				last.sync = self.lines[i].SYNC;
				break;
			}
		}
		const lastSyncView = range[0]>0 ? self.lines[range[0] - 1].LEFT : [];
		let nextSyncLine = null;
		for (let i = range[1]; i < self.lines.length; i++) {
			if (self.lines[i].SYNC) {
				nextSyncLine = self.lines[i];
				break;
			}
		}
		
		// 새로 그리기
		for (let i = range[0]; i < range[1] + add; i++) {
			const line = self.lines[i];
			if (line.TYPE) { // 싱크 줄만 갱신
				line.VIEW = null;
				line.render(i, last);
			}
		}
		
		if (nextSyncLine && last.sync) {
			if (nextSyncLine.SYNC <= last.sync) {
				nextSyncLine.LEFT.addClass(nextSyncLine.SYNC == last.sync ? "equal" : "error");
			} else {
				nextSyncLine.LEFT.removeClass("equal").removeClass("error");
			}
		}

		if (SmiEditor.PlayerAPI && SmiEditor.PlayerAPI.setLines) {
			SmiEditor.PlayerAPI.setLines(newLines);
		}
		if (SmiEditor.Viewer.window) {
			SmiEditor.Viewer.refresh();
		}
		self.isRendering = false;
		self.afterChangeSaved(self.isSaved());
		
		setTimeout(() => {
			if (self.needToRender) {
				// 렌더링 대기열 있으면 재실행
				self.render();
			} else {
				// 렌더링 끝났으면 출력 새로고침
				self.input.scroll();
			}
		}, 100);
	}, 1);
}
SmiEditor.prototype.moveSyncLine = function(lineIndex, toForward) {
	this.history.log();
	
	const line = this.lines[lineIndex];
	const lines = this.text.split("\n");
	const sync = line.SYNC + ((toForward ? 1 : -1) * SmiEditor.sync.unit);
	lines[lineIndex] = SmiEditor.makeSyncLine(sync, line.TYPE);
	
	this.input.val(lines.join("\n"));
	this.setCursor(lines.slice(0, lineIndex).join("\n").length + 1);
	this.render();
	this.scrollToCursor();
	this.input.focus();

	this.history.log();
}
/**
 * frameSyncOnly: 화면 싱크만 맞춰주기
 * add: 과거 반프레임 보정치 안 넣었던 것들을 위해 추가
 */
SmiEditor.prototype.fitSyncsToFrame = function(frameSyncOnly=false, add=0) {
	if (!SmiEditor.video.fs.length) {
		return;
	}
	const lines = JSON.parse(JSON.stringify(this.lines.slice(0)));
	const cursor = this.getCursor();
	const range = [0, lines.length];
	const cursorLine = this.text.substring(0, cursor[0]).split("\n").length - 1;
	if (cursor[0] < cursor[1]) {
		range[0] = cursorLine;
		range[1] = this.text.substring(0, cursor[1]).split("\n").length;
	}

	// TODO: 렌더링 뜯어고쳤더니... 괜히 기교 안 부리고 그냥 전체 업데이트 돌아가는 게 맞을 것 같기도...?
	for (let i = range[0]; i < range[1]; i++) {
		const line = lines[i];
		if ((line.TYPE == TYPE.FRAME) || (!frameSyncOnly && (line.TYPE == TYPE.BASIC))) {
			const sync = SmiEditor.findSync(line.SYNC + add, SmiEditor.video.fs);
			if (sync != null) {
				line.TEXT = SmiEditor.makeSyncLine((line.SYNC = sync), line.TYPE);

				//const colSync = $(colSyncs[i]);
				const colSync = this.lines[i].LEFT;
				let h = sync;
				let ms = h % 1000; h = (h - ms) / 1000;
				let s  = h %   60; h = (h -  s) /   60;
				let m  = h %   60; h = (h -  m) /   60;
				colSync.find("span").html(h + ":" + (m>9?"":"0")+m + ":" + (s>9?"":"0")+s + ":" + (ms>99?"":"0")+(ms>9?"":"0")+ms + "<br />");
				
				// 키프레임 됐을 때 업데이트
				const kSync = SmiEditor.findSync(line.SYNC, SmiEditor.video.kfs);
				if (kSync == sync) {
					colSync.addClass("keyframe");
				}
			}
		}
	}
	{	// 중간 싱크 재계산
		let lastIndex = -1;
		let startIndex = -1;
		let count = 0;
		for (let i = 0; i < lines.length; i++) {
			if (lines[i].TYPE) { // 텍스트 건너뛰고 싱크 라인만 따짐
				if (lines[i].TYPE == TYPE.RANGE) {
					if (startIndex < 0) {
						startIndex = lastIndex;
						count = 2;
					} else {
						count++;
					}
				} else {
					if (startIndex >= 0) {
						const endIndex = i;
						const startSync = lines[startIndex].SYNC;
						const endSync   = lines[endIndex  ].SYNC;
						
						let ratio = 0;
						for (let j = startIndex + 1; j < endIndex; j++) {
							if (lines[j].TYPE == TYPE.RANGE) {
								ratio++;
								const line = lines[j];
								const sync = Math.round(((count - ratio) * startSync + ratio * endSync) / count);
								line.TEXT = SmiEditor.makeSyncLine((line.SYNC = sync), TYPE.RANGE);
							}
						}
						startIndex = -1;
					}
					lastIndex = i;
				}
			}
		}
	}
	const text = linesToText(lines);
	this.input.val(text);
	this.setCursor(cursorLine == 0 ? 0 : (text.split("\n").slice(0, cursorLine).join("\n").length + 1));
	this.render(range);
}
SmiEditor.prototype.refreshKeyframe = function() {
	for (let i = 0; i < this.lines.length; i++) {
		const line = this.lines[i];
		if (line.TYPE == TYPE.BASIC || line.TYPE == TYPE.FRAME) {
			if (SmiEditor.findSync(line.SYNC, SmiEditor.video.kfs, false)) {
				line.LEFT.addClass("keyframe");
			} else {
				line.LEFT.removeClass("keyframe");
			}
		}
	}
}
SmiEditor.prototype.moveToSide = function(direction) {
	if (direction == 0) return;
	
	const text = this.input.val();
	const cursorLine = text.substring(0, this.getCursor()[0]).split("\n").length - 1;
	
	// 커서 위치 바로 위의 싱크 라인 찾기
	let syncLine = cursorLine;
	for (; syncLine >= 0; syncLine--) {
		if (this.lines[syncLine].SYNC) {
			break;
		}
		if (this.lines[syncLine].TEXT.toUpperCase().startsWith("</BODY>")) {
			break;
		}
	}
	// 싱크 라인 없으면 무시
	if (syncLine < 0) {
		return;
	}
	
	// 다음 싱크 라인 찾기
	let nextLine = cursorLine;
	for (; nextLine < this.lines.length; nextLine++) {
		if (this.lines[nextLine].SYNC) {
			break;
		}
		if (this.lines[nextLine].TEXT.toUpperCase().startsWith("</BODY>")) {
			break;
		}
		// <br>로 끝나는 라인이 아닐 경우 아직 싱크 찍지 않은 부분으로 간주
		if (!this.lines[nextLine].TEXT.toUpperCase().endsWith("<BR>")) {
			nextLine++;
			break;
		}
	}
	
	let textLines = this.lines.slice(syncLine + 1, nextLine);
	for (let i = 0; i < textLines.length; i++) {
		textLines[i] = textLines[i].TEXT;
	}
	textLines = textLines.join("").split("​").join("").split(/<br>/gi);
	
	// 내용물 비었으면 무시
	if ($("<span>").html(textLines.join("").split("　").join(" ")).text().trim().length == 0) {
		return;
	}
	
	if (direction > 0) {
		// 오른쪽으로 이동
		let remained = true;
		let added = false;
		for (let i = 0; i < direction; i++) {
			// 모든 줄이 공백으로 끝나는지 확인
			if (remained) {
				for (let j = 0; j < textLines.length; j++) {
					if (!textLines[j].endsWith("　")) {
						remained = false;
						break;
					}
				}
			}
			if (remained) {
				// 오른쪽 공백 제거
				for (let j = 0; j < textLines.length; j++) {
					textLines[j] = textLines[j].substring(0, textLines[j].length - 1);
				}
			} else {
				// 왼쪽 공백 추가
				for (let j = 0; j < textLines.length; j++) {
					textLines[j] = "　" + textLines[j];
				}
				added = true;
			}
		}
		// 모든 줄이 공백으로 끝나는지 확인
		if (remained) {
			for (let j = 0; j < textLines.length; j++) {
				if (!textLines[j].endsWith("　")) {
					remained = false;
					break;
				}
			}
		}
		if (!remained) {
			// 오른쪽에 추가했던 공백을 다 없앴어도 원본에 공백 있을 수 있음
			for (let i = 0; i < textLines.length; i++) {
				let textLine = textLines[i];
				if (textLine.endsWith(" ") || textLine.endsWith("　")) {
					textLines[i] = textLine + "​";
				}
			}
		}
		const br = (remained ? "​" : "") + ("<br>" + ((remained || added) ? "\n" : "")) + (added ? "​" : "");
		textLines = ((added ? "​" : "") + textLines.join(br) + (remained ? "​" : "")).split("\n");
		
	} else {
		// 왼쪽으로 이동
		let remained = true;
		let added = false;
		for (let i = 0; i < -direction; i++) {
			// 모든 줄이 공백으로 시작하는지 확인
			if (remained) {
				for (let j = 0; j < textLines.length; j++) {
					if (!textLines[j].startsWith("　")) {
						remained = false;
						break;
					}
				}
			}
			if (remained) {
				// 왼쪽 공백 제거
				for (let j = 0; j < textLines.length; j++) {
					textLines[j] = textLines[j].substring(1);
				}
			} else {
				// 오른쪽 공백 추가
				for (let j = 0; j < textLines.length; j++) {
					textLines[j] = textLines[j] + "　";
				}
				added = true;
			}
		}
		// 모든 줄이 공백으로 시작하는지 확인
		if (remained) {
			for (let j = 0; j < textLines.length; j++) {
				if (!textLines[j].startsWith("　")) {
					remained = false;
					break;
				}
			}
		}
		if (!remained) {
			// 왼쪽에 추가했던 공백을 다 없앴어도 원본에 공백 있을 수 있음
			for (let i = 0; i < textLines.length; i++) {
				let textLine = textLines[i];
				if (textLine.startsWith(" ") || textLine.startsWith("　")) {
					textLines[i] = "​" + textLine;
				}
			}
		}
		const br = (added ? "​" : "") + ("<br>" + ((remained || added) ? "\n" : "")) + (remained ? "​" : "");
		textLines = ((remained ? "​" : "") + textLines.join(br) + (added ? "​" : "")).split("\n");
	}
	
	for (let i = 0; i < textLines.length; i++) {
		textLines[i] = new Line(textLines[i]);
	}
	
	this.history.log();
	const prev = this.lines.slice(0, syncLine + 1);
	let cursor = 0;
	for (let i = 0; i < prev.length; i++) {
		cursor += prev[i].TEXT.length + 1;
	}
	const lines = prev.concat(textLines).concat(this.lines.slice(nextLine));
	this.input.val(linesToText(lines));
	this.setCursor(cursor);
	this.history.log();
	this.render([syncLine, nextLine]);
}

SmiEditor.Finder = {
		last: { find: "", replace: "", withCase: false, reverse: false }
	,	open: function(isReplace) {
			const w = 440 * DPI;
			const h = 220 * DPI;
			const x = Math.ceil((setting.window.x + (setting.window.width  / 2)) - (w / 2));
			const y = Math.ceil((setting.window.y + (setting.window.height / 2)) - (h / 2));
		
			this.onload = (isReplace ? this.onloadReplace : this.onloadFind);
			
			this.window = window.open("finder.html", "finder", "scrollbars=no,location=no,width="+w+",height="+h);
			binder.moveWindow("finder", x, y, w, h, false);
			binder.focus("finder");
		}
	,	onloadFind: function(isReplace) {
			this.last.toFocus = "[name=find]";
			
			if (SmiEditor.selected) {
				const editor = SmiEditor.selected;
				const selection = editor.getCursor();
				const length = selection[1] - selection[0];
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
			SmiEditor.selected.scrollToCursor();
			this.last.find    = this.finding.find;
			this.last.replace = this.finding.replace;
			this.last.withCase= this.finding.withCase;
			this.last.reverse = this.finding.reverse;
		}
	
	,	doFind: function(selection) {
			if (!selection) selection = [this.finding.input.selectionStart, this.finding.input.selectionEnd];
			let index = -1;
			let text = this.finding.text;
			let find = this.finding.find;
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
			let text = this.finding.text;
			let find = this.finding.find;
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
			const err = this.checkError(params);
			if (err) return this.sendMsgAfterRun(err);
	
			let selection = null;
			if (selection = this.doFind()) {
				this.finding.input.setSelectionRange(selection[0], selection[1]);
				this.afterFind();
			} else {
				this.sendMsgAfterRun("찾을 수 없습니다.");
			}
		}
	,	runReplace: function(params) {
			const err = this.checkError(params);
			if (err) return this.sendMsgAfterRun(err);
			let selection = null;
			
			// 찾은 상태로 선택돼 있었으면 바꾸기
			if (selection = this.doReplace()) {
				SmiEditor.selected.history.log();
				this.finding.input.value = this.finding.text;
				this.finding.input.setSelectionRange(selection[0], selection[1]);
				this.afterFind();
				SmiEditor.selected.render();
				SmiEditor.selected.history.log();
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
			const err = this.checkError(params);
			if (err) return this.sendMsgAfterRun(err);
	
			let count = 0;
			let last = null;
			let selection = null;
			
			// 바꾸기
			if (selection = this.doReplace()) count++;
			
			// 다음 찾기
			selection = this.doFind(selection);
			
			// 바꾸기-찾기 반복
			while (selection) {
				count++;
				last = selection;
				selection = this.doFind(this.doReplace(selection));
			}
			
			if (count) {
				SmiEditor.selected.history.log();
				this.finding.input.value = this.finding.text;
				this.finding.input.setSelectionRange(last[0], last[1]);
				this.afterFind();
				SmiEditor.selected.render();
				SmiEditor.selected.history.log();
				this.sendMsgAfterRun(count + "개 바꿈");
			} else {
				this.sendMsgAfterRun("찾을 수 없습니다.");
			}
		}
	,	sendMsgAfterRun: function(msg) {
			// 딜레이 안 주면 화면 갱신 안 된 상태로 뜰 수 있음
			setTimeout(() => {
				binder.sendMsg("finder", msg);
			}, 1);
		}

		// 찾기/바꾸기 창 항상 위에
	,	lastFocus: 0
	,	focus: function(delay=1000) {
			if (!this.window) return;
			
			const now = this.lastFocus = new Date().getTime();
			setTimeout(() => {
				// 다른 입력이 있었으면 넘김
				if (now != this.lastFocus) return;
				
				binder.focus("finder"); // C#
				SmiEditor.Finder.window.focus(); // 웹버전
				SmiEditor.Finder.lastFocus = 0;
			}, delay);
		}
};

SmiEditor.Viewer = {
		window: null
	,	open: function() {
			this.window = window.open("viewer.html", "viewer", "scrollbars=no,location=no,width=1,height=1");
			this.moveWindowToSetting();
			binder.focus("viewer");
			setTimeout(() => {
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
			setTimeout(() => {
				const lines = [];
				if (SmiEditor.selected) { // 홀드
					if (SmiEditor.selected.owner) { // 탭
						// 탭의 모든 홀드 가져오기
						let holds = SmiEditor.selected.owner.holds.slice(0);
						holds.sort((a, b) => {
							let aPos = a.pos;
							let bPos = b.pos;
							if (aPos < bPos) return 1;
							if (aPos > bPos) return -1;
							return 0;
						});
						for (let i = 0; i < holds.length; i++) {
							lines.push(holds[i].lines);
						}
					} else {
						// 홀드 기능 개발 전 코드 일단은 유지
						lines.push(SmiEditor.selected.lines);
					}
				} else {
					// 열린 게 없어도 오류 나지 않도록
					lines.push([new Line()]);
				}
				binder.updateViewerLines(JSON.stringify(lines));
			}, 1);
		}
};

SmiEditor.Addon = {
		windows: {}
	,	open: function(name, target="addon") {
			const url = (name.substring(0, 4) == "http") ? name : "addon/" + name.split("..").join("").split(":").join("") + ".html";
			this.windows[target] = window.open(url, target, "scrollbars=no,location=no,width=1,height=1");
			setTimeout(() => { // 웹버전에서 딜레이 안 주면 위치를 못 잡는 경우가 있음
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
			setTimeout(() => {
				SmiEditor.Addon.moveWindowToSetting("addon");
			}, 1);
			binder.focus("addon");
		}
	,	onloadExtSubmit: function() {
			let w = this.windows.addon;
			if (w.iframe) {
				w = w.iframe.contentWindow;
			}
			w.submit(this.ext.method, this.ext.url, this.ext.values);
		}
	,	moveWindowToSetting: function(target) {
			// 플레이어 창 위에
			const margin = 40 * DPI;
			const targets = [];
			if (target) {
				targets.push(target);
			} else {
				for (let key in this.windows) {
					targets.push(key);
				}
			}
			for (let i = 0; i < targets.length; i++) {
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
		let name = values;
		let editor = SmiEditor.selected;
		if (editor) {
			const text = editor.getText();
			let value = "";
			if (text.selection[0] < text.selection[1]) {
				// 선택된 내용물 가져오기
				value = text.text.substring(text.selection[0], text.selection[1]);

			} else {
				// 선택된 게 없으면
				const lines = text.text.split("\n");
				const lineNo = text.text.substring(0, text.selection[0]).split("\n").length - 1;

				// 현재 문단 or 싱크 맨 윗줄 찾기
				let syncLineNo = lineNo;
				while (syncLineNo >= 0) {
					const line = lines[syncLineNo];
					if (!line || line.substring(0, 6).toUpperCase() == "<SYNC ") {
						break;
					}
					syncLineNo--;
				}

				if (syncLineNo >= 0) {
					// 다음 문단 or 싱크 라인 찾기
					let nextSyncLineNo = syncLineNo + 1;
					while (nextSyncLineNo < lines.length) {
						const line = lines[nextSyncLineNo];
						if (!line || line.substring(0, 6).toUpperCase() == "<SYNC ") {
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
			
			// 맞춤법 검사기 같은 데에 보내기 전에 태그 탈출 처리
			if (withoutTag) {
				value = $("<p>").html(value.split(/<br>/gi).join(" ")).text();
			}

			const params = {};
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
	const origin = SmiEditor.transforming;
	origin.tab = this;
	origin.text = this.text;
	
	let start = 0;
	let end = origin.tab.lines.length;

	// 선택 범위만 작업
	const range = origin.tab.getCursor();
	if (range[0] != range[1]) {
		start = origin.text.substring(0, range[0]).split("\n").length - 1;
		end   = origin.text.substring(0, range[1]).split("\n").length;
	}
	
	// 범위 시작을 싱크 라인으로 축소
	for (; start < end; start++) {
		if (this.lines[start].SYNC) {
			// 싱크 라인 찾음
			break;
		}
	}
	if (start == end) {
		// 선택 범위 없음
		return null;
	}
	
	// </body> 닫히기 전까지만 선택
	for (let i = start; i < end; i++) {
		if (this.lines[i].TEXT.toUpperCase().indexOf("</BODY>") >= 0) {
			end = i - 1;
			break;
		}
	}
	
	origin.start = start;
	origin.end = end;
	
	return origin.text.split("\n").slice(start, end).join("\n");
};
SmiEditor.afterTransform = (result) => { // 주로 C#에서 호출
	// 해당 줄 앞뒤 전체 선택되도록 조정
	result = result.split("\r\n").join("\n");
	const origin = SmiEditor.transforming;
	const origLines = origin.text.split("\n");
	const front = origLines.slice(0, origin.start);
	const range = [(origin.start > 0) ? (front.join("\n").length + 1) : 0];
	range.push(range[0] + result.length);
	
	// 교체
	origin.tab.setText(front.concat(result).concat(origLines.slice(origin.end)).join("\n"), range);
};
SmiEditor.prototype.normalize = function() {
	const text = this.getTransformText();
	if (text) {
		const smi = new Subtitle.SmiFile();
		const input = smi.fromTxt(text).body;
		Subtitle.Smi.normalize(input, false, SmiEditor.video.FR / 1000);
		smi.body = input;
		SmiEditor.afterTransform(smi.toTxt().trim());
	}
};
SmiEditor.prototype.fillSync = function() {
	const text = this.getTransformText();
	if (text) {
		SmiEditor.afterTransform(SmiEditor.fillSync(text));
	}
};
SmiEditor.fillSync = (text) => {
	// 기존 중간싱크 제거 후 진행
	const textLines = text.split("\n");
	const lines = [];
	for (let i = 0; i < textLines.length; i++) {
		const line = textLines[i];
		if (line.substring(0, 6).toUpperCase() == "<SYNC " && line.indexOf("\t>") > 0) {
			// 해당 줄 무시
		} else if (line == "<~>") {
			// 해당 줄 무시
		} else {
			lines.push(line);
		}
	}

	const smi = new Subtitle.SmiFile();
	const input = smi.fromTxt(lines.join("\n")).body;
	Subtitle.Smi.fillEmptySync(input);
	smi.body = input;
	return smi.toTxt().trim();
};

$(() => {
	SmiEditor.refreshHighlight();
	
	$(document).on("mouseup", function(e) {
		// 찾기/바꾸기 창이 있었을 경우 재활성화
		SmiEditor.Finder.focus();
	});
});