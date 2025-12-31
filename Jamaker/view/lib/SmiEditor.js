import "./History.js";
import "./SubtitleObject.js";

{
	let link = document.createElement("link");
	link.rel = "stylesheet";
	link.href = new URL("./SmiEditor.css", import.meta.url).href;
	document.head.append(link);
}

window.LOG = true; // 배포 시 false

window.LH = 20; // LineHeight
window.SB = 16; // ScrollBarWidth ... TODO: 자동으로 구해지도록?

// 배열로 개발했던 것들 레거시 지원
window.LINE = {
		TEXT: "TEXT"
	,	SYNC: "SYNC"
	,	TYPE: "TYPE"
	,	LEFT: "LEFT"
	,	VIEW: "VIEW"
};
window.TYPE = {
		TEXT: null
	,	BASIC: 1
	,	FRAME: 2
	,	RANGE: 3
};
window.TIDs = [null, "", " ", "	"];
window.linesToText = function(lines) {
	const textLines = [];
	for (let i = 0; i < lines.length; i++) {
		textLines.push(lines[i].TEXT);
	}
	return textLines.join("\n");
}

window.Line = function(text="", sync=0, type=TYPE.TEXT) {
	// TODO: 처음에 객체 변수명이 아니라, 배열 번호 상수로 만들어서 대문자로 해놔서
	// 고칠 때도 대문자를 따라가 버렸는데, 변수명은 소문자로 바꾸는 게 맞나...
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
		
		let h = sync;
		const ms = h % 1000; h = (h - ms) / 1000;
		const s  = h %   60; h = (h -  s) /   60;
		const m  = h %   60; h = (h -  m) /   60;
		const syncText = `${h}:${intPadding(m)}:${intPadding(s)}:${intPadding(ms, 3)}`;
		
		if (this.LEFT == null) {
			(this.LEFT = document.createElement("div")).append(document.createElement("span"));
		}
		// 싱크 역전 체크
		this.LEFT.classList.add("sync");
		if (sync < last.sync) {
			this.LEFT.classList.add("error");
		} else if (sync == last.sync) {
			this.LEFT.classList.add("equal");
		} else {
			this.LEFT.classList.remove("error");
			this.LEFT.classList.remove("equal");
		}
		// 화면 싱크 체크
		if (this.TYPE == TYPE.RANGE) {
			this.LEFT.classList.add("range");
		} else {
			if (this.TYPE == TYPE.FRAME) {
				this.LEFT.classList.add("frame");
			} else {
				this.LEFT.classList.add("normal");
			}
			if (Subtitle.findSync(sync, Subtitle.video.kfs, false)) {
				this.LEFT.classList.add("keyframe");
			}
		}
		this.LEFT.setAttribute("data-index", index);
		this.LEFT.children[0].innerText = syncText;
		
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
		if (!forced && this.VIEW && eData(this.VIEW).state == last.state) {
			// 상태가 바뀌지 않음
			return false;
		}
		const view = this.VIEW = SmiEditor.highlightText(this.TEXT, last.state);
		eData(view, { "data-state": last.state, "data-next": (last.state = eData(view).next) });
		
		// 색상 미리보기
		if (SmiEditor.showColor) {
			[...view.querySelectorAll(".hljs-attr")].forEach((attr) => {
				const attrName = attr.innerText.trim().toLowerCase();
				if (attrName == "color" || attrName == "fade") {
					const value = attr.nextElementSibling;
					if (value && value.classList.contains("hljs-value")) {
						let color = value.innerText;
						if (color.startsWith('"') || color.startsWith("'")) {
							color = color.substring(1, color.length - 1);
						}
						color = color.trim();
						
						if (color.length == 15 && color[0] == '#' && color[7] == '~' && color[8] == '#') {
							// 그라데이션 색상
							value.classList.add("hljs-color");
							value.style.borderColor = "transparent";
							value.style.borderImage = `linear-gradient(to right, ${ color.substring(0,7) } 0%, ${ color.substring(8,15) } 100%)`;
							value.style.borderImageSlice = "1";
							
						} else {
							if (!(color.length == 7 && color.startsWith("#"))) {
								let hex = sToAttrColor(color);
								if (hex == color) {
									return;
								}
								color = "#" + hex;
							}
							
							value.classList.add("hljs-color");
							value.style.borderColor = color;
						}
					}
				}
			});
		}
		
		// 공백 싱크인 경우 싱크 투명도 따라감
		{	const html = view.innerHTML;
			if (html.replaceAll("&amp;nbsp;", "").trim().length == 0) {
				view.innerHTML = `<span class='hljs-sync'>${html}</span>`;
			}
		}
		
		// 줄바꿈 표시
		if (SmiEditor.showEnter) {
			view.append(showEnter.cloneNode(true));
		}
		
		return true;
	}
	return false;
}
const showEnter = document.createElement("span");
{
	showEnter.classList.add("hljs-comment", "enter");
	showEnter.innerText = "↵";
}

window.SmiEditor = function(text) {
	const editor = this;
	
	this.initialize = false;
	let el;
	this.area = document.createElement("div");
	this.area.classList.add("hold");
	{	this.area.append(this.colSync = document.createElement("div"));
		this.colSync.classList.add("col-sync");
		{	this.colSync.append(this.colSyncSizer = document.createElement("div"));
			this.colSyncSizer.classList.add("sync");
			this.colSyncSizer.innerHTML = "&nbsp";
		}
	}
	{	this.area.append(el = document.createElement("div"));
		el.classList.add("col-sync-gradient");
	}
	{	this.area.append(this.colSyncCover = document.createElement("div"));
		this.colSyncCover.classList.add("col-sync-cover");
	}
	{	this.area.append(this.hArea = document.createElement("div"));
		this.hArea.classList.add("input", "highlight-textarea", "hljs");
		if (!SmiEditor.useHighlight) {
			this.hArea.classList.add("nonactive");
		}
		{	this.hArea.append(el = document.createElement("div"));
			el.append(this.hview = document.createElement("div"));
			el.append(this.block = document.createElement("div"));
			this.block.classList.add("block-area");
		}
		this.hArea.append(this.input = document.createElement("textarea"));
		this.input.spellcheck = false;
	}
	
	if (text) {
		text = text.replaceAll("\r\n", "\n");
		
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
		
		this.input.value = text;
//		this.setCursor(0) // history 선언되기 전
		this.input.setSelectionRange(0, 0);
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
	}, false);
	setTimeout(() => {
		if (SmiEditor.autoComplete && window.AutoCompleteTextarea) {
			editor.ac = new AutoCompleteTextarea(editor.input, SmiEditor.autoComplete, () => {
				editor.remember();
				editor.render();
			});
		}
	}, 1);
};

SmiEditor.log = window.log = (msg, since=0) => {
	if (typeof binder === "undefined" || !LOG) {
		SmiEditor.log = window.log = () => {};
	} else {
		(SmiEditor.log = window.log = (msg, since=0) => {
			const time = new Date().getTime();
			binder.log(time + "\t" + msg + (since ? (": " + (time - since)) : ""));
			return time;
		})(msg, since);
	}
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
	SmiEditor.scrollShow = setting.scrollShow;
	
	if (window.AutoCompleteTextarea) { // AutoComplete 라이브러리 가져왔을 때만 생성
		for (let key in SmiEditor.autoComplete) {
			delete SmiEditor.autoComplete[key];
		}
		if (setting.autoComplete) {
			for (let key in setting.autoComplete) {
				const value = setting.autoComplete[key];
				switch (key) { // keyCode 기반에서 key 기반으로 변경했지만, 설정은 특수문자 때문에 바꾸기 힘듦
					case   "0": key = "-"; break;
					case  "50": key = "@"; break;
					case  "51": key = "#"; break;
					case  "52": key = "$"; break;
					case  "53": key = "%"; break;
					case  "54": key = "^"; break;
					case  "55": key = "&"; break;
					case  "57": key = "("; break;
					case  "48": key = ")"; break;
					case "188": key = "<"; break;
					case "190": key = ">"; break;
				}
				SmiEditor.autoComplete[key] = value;
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
						SmiEditor.withAlts[key] = "/*메뉴 접근*/";
						SmiEditor.withAlts.reserved += key;
					}
				}
			}
		}
		
		// 예약 단축키
		SmiEditor.withCtrls["F"] = "/* 찾기           */ SmiEditor.Finder.open();";
		SmiEditor.withCtrls["H"] = "/* 바꾸기         */ SmiEditor.Finder.openChange();";
		SmiEditor.withCtrls["Y"] = "/* 다시 실행      */ editor.historyForward();";
		SmiEditor.withCtrls["Z"] = "/* 실행 취소      */ editor.historyBack();";
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
	
	if (window.ContextMenu) { // ContextMenu 라이브러리 가져왔을 때만 생성
		if (SmiEditor.contextmenu) {
			SmiEditor.contextmenu.remove();
		}
		if (setting.contextmenu) {
			if (setting.contextmenu.length) {
				SmiEditor.contextmenu = new ContextMenu(setting.contextmenu);
			} else {
				SmiEditor.contextmenu = null;
			}
		} else {
			// 설정 기능 자체가 없을 때 동작
			// TODO: 설정 만들려면 <input>이 아니라 <textarea> 써야 하나?
			SmiEditor.contextmenu = new ContextMenu([
				{ name: "실행 취소(&Z)"
				, func: "SmiEditor.selected.history.back();"
				, perm: "SmiEditor.selected.history.cnt > SmiEditor.selected.history.range[0]"
				}
			,	{ name: "다시 실행(&Y)"
				, func: "SmiEditor.selected.history.forward();"
				, perm: "SmiEditor.selected.history.cnt < SmiEditor.selected.history.range[1]"
				}
			,	{ name: "" }
			,	{ name: "잘라내기(&X)"
				, func: "let cursor = SmiEditor.selected.getCursor();"
					+	"if (cursor[0] == cursor[1]) return;"
					+	"let text = SmiEditor.selected.input.value;"
					+	"navigator.clipboard.writeText(text.substring(cursor[0], cursor[1]));"
					+	"text = text.substring(0, cursor[0]) + text.substring(cursor[1]);"
					+	"SmiEditor.selected.setText(text, [cursor[0], cursor[0]]);"
				, perm: "(() => { let cursor = SmiEditor.selected.getCursor(); return cursor[0] < cursor[1]; })();"
				}
			,	{ name: "복사(&C)"
				, func: "let cursor = SmiEditor.selected.getCursor();"
					+	"if (cursor[0] == cursor[1]) return;"
					+	"let text = SmiEditor.selected.input.value;"
					+	"navigator.clipboard.writeText(text.substring(cursor[0], cursor[1]));"
				, perm: "(() => { let cursor = SmiEditor.selected.getCursor(); return cursor[0] < cursor[1]; })();"
				}
			,	{ name: "붙여넣기(&P)"
				, func: "let cursor = SmiEditor.selected.getCursor();"
					+	"let text = SmiEditor.selected.input.value;"
					+	"navigator.clipboard.readText().then((paste) => {"
					+	"	paste = paste.replaceAll('\\r\\n', '\\n');"
					+	"	text = text.substring(0, cursor[0]) + paste + text.substring(cursor[1]);"
					+	"	cursor = cursor[0] + paste.length;"
					+	"	SmiEditor.selected.setText(text, [cursor, cursor]);"
					+	"});"
				, perm: "(async () => {"
					+	"	try {"
					+	"		const clipboardText = await navigator.clipboard.readText();"
					+	"		if (clipboardText && clipboardText.trim().length) return true;"
					+	"	} catch (e) { }"
					+	"	return false;"
					+	"})();"
				}
			,	{ name: "삭제(&D)"
				, func: "let cursor = SmiEditor.selected.getCursor();"
					+	"if (cursor[0] == cursor[1]) return;"
					+	"let text = SmiEditor.selected.input.value;"
					+	"text = text.substring(0, cursor[0]) + text.substring(cursor[1]);"
					+	"SmiEditor.selected.setText(text, [cursor[0], cursor[0]]);"
				, perm: "(() => { let cursor = SmiEditor.selected.getCursor(); return cursor[0] < cursor[1]; })();"
				}
			,	{ name: "" }
			,	{ name: "찾기/바꾸기(&F)"
				, func: "SmiEditor.Finder.open();"
				, perm: true
				}
			]);
		}
	}
}
SmiEditor.scrollShow = 1;

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
SmiEditor.contextmenu = null;
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

SmiEditor.getSyncTime = (sync, forKeyFrame=false, output={}) => { /* output: 리턴값은 숫자여야 하는데, 키프레임 상태값 반환이 필요해져서 C# out처럼 만듦 */
	if (!sync) {
		sync = (time + SmiEditor.sync.weight);
	} else if (!isFinite(sync)) {
		// 가중치 없이 구하기
		sync = time;
	}
	if (SmiEditor.sync.frame) { // 프레임 단위 싱크 보정
		let adjustSync = null;
		if (SmiEditor.trustKeyFrame // 키프레임 신뢰
		 && (forKeyFrame || SmiEditor.followKeyFrame) // 화면 싱크, 혹은 키프레임 따라가게 설정된 경우
		 && Subtitle.video.kfs.length > 2
		) {
			adjustSync = Subtitle.findSync(sync, Subtitle.video.kfs);
			const dist = Math.abs(adjustSync - sync);
			if (dist > SmiEditor.limitKeyFrame) { // 기준치 넘어가면 키프레임에 맞춘 게 아니라고 간주
				adjustSync = null;
			} else {
				output.keyframe = true;
			}
		}
		if (adjustSync == null && Subtitle.video.fs.length > 2) { // 프레임 싱크
			adjustSync = Subtitle.findSync(sync, Subtitle.video.fs);
			const dist = Math.abs(adjustSync - sync);
			if (dist > SmiEditor.limitKeyFrame) { // 기준치 넘어가면 프레임 정보가 잘못된 걸로 간주
				adjustSync = null;
			}
		}
		if (adjustSync) { // 보정 완료
			sync = adjustSync;
		} else { // FPS 기반 보정
			sync = Math.floor(Math.floor((sync / Subtitle.video.FL) + 0.5) * Subtitle.video.FL);
		}
		sync = Math.max(1, sync); // 0 이하는 허용하지 않음
	}
	return output.sync = sync;
}
SmiEditor.makeSyncLine = (time, type) => {
	return SmiEditor.sync.preset.replaceAll("{sync}", Math.floor(time)).replaceAll("{lang}", SmiEditor.sync.lang).replaceAll("{type}", TIDs[type ? type : 1]);
}

SmiEditor.prototype.focus = function() {
	(SmiEditor.selected = this).input.focus();
}
SmiEditor.prototype.refresh = function() {
	this.focus();
	this.input.dispatchEvent(new Event("scroll", { bubbles: true }));
}

SmiEditor.prototype.isSaved = function() {
	return (this.saved == this.input.value);
};
SmiEditor.prototype.afterSave = function() {
	const funcSince = log("afterSave start");
	this.saved = this.input.value;
	this.afterChangeSaved(true);
	log("afterSave end", funcSince);
};
SmiEditor.prototype.afterChangeSaved = function(saved) {
	if (this.onChangeSaved) {
		this.onChangeSaved(saved);
	}
}

SmiEditor.prototype.bindEvent = function() {
	const editor = this;
	
	// 내용에 따라 싱크 표시 동기화
	this.input.addEventListener("input", () => {
		editor.render();
	});
	this.render();
	
	this.input.addEventListener("scroll", (e) => {
		if (editor.input.scrollTop == 1) {
			// 커서 위치를 맨 위로 올려도 화면 싱크 표시 영역 1px은 바로 스크롤되지 않음
			editor.input.scrollTop = 0;
		}
		const scrollTop  = editor.input.scrollTop ;
		const scrollLeft = editor.input.scrollLeft;
		
		{
			const ta = editor.input;
			if (ta.scrollTop) {
				editor.input.classList.remove("scrollTop");
			} else {
				editor.input.classList.add("scrollTop");
			}
			if (ta.clientHeight + ta.scrollTop < ta.scrollHeight) {
				editor.input.classList.remove("scrollBottom");
			} else {
				editor.input.classList.add("scrollBottom");
			}
			if (ta.scrollLeft) {
				editor.input.classList.remove("scrollLeft");
			} else {
				editor.input.classList.add("scrollLeft");
			}
			if (ta.clientWidth + ta.scrollLeft < ta.scrollWidth) {
				editor.input.classList.remove("scrollRight");
			} else {
				editor.input.classList.add("scrollRight");
			}
		}
		
		// 싱크 스크롤 동기화
		editor.colSync.scrollTop = scrollTop;
		
		// 문법 하이라이트 스크롤 동기화
		if (SmiEditor.useHighlight) {
			editor.hview.style.marginTop  = editor.block.style.marginTop  = `${-scrollTop }px`;
			editor.hview.style.marginLeft = editor.block.style.marginLeft = `${-scrollLeft}px`;
		}
		
		// 현재 스크롤에서 보이는 범위 찾기
		const showFrom = Math.floor(scrollTop / LH);
		const showEnd  = Math.ceil((scrollTop + parseFloat(getComputedStyle(editor.input).height)) / LH);
		
		const toAppendLefts = [];
		const toRemoveLefts = [];
		const toAppendViews = [];
		const toRemoveViews = [];
		[...editor.colSync.children].forEach((el) => {
			toRemoveLefts.push(el);
		});
		if (SmiEditor.useHighlight) {
			[...editor.hview.children].forEach((el) => {
				toRemoveViews.push(el);
			});
		}
		
		const a = Math.max(0, showFrom);
		const b = Math.min(showEnd, editor.lines.length);
		for (let i = a; i < b; i++) {
			const top = `${i * LH}px`;
			const left = editor.lines[i].LEFT;
			if (left != null) {
				const rIndex = toRemoveLefts.indexOf(left);
				if (rIndex >= 0) {
					// 기존에 있었는데 범위에 남아있음
					toRemoveLefts.splice(rIndex, 1);
				} else {
					// 기존에 없었는데 범위에 들어옴
					toAppendLefts.push(left);
				}
				// 위치 계산은 새로 해줌
				left.style.top = top;
			}
			if (SmiEditor.useHighlight) {
				const view = editor.lines[i].VIEW;
				if (view) {
					const rIndex = toRemoveViews.indexOf(view);
					if (rIndex >= 0) {
						// 기존에 있었는데 범위에 남아있음
						toRemoveViews.splice(rIndex, 1);
					} else {
						// 기존에 없었는데 범위에 들어옴
						toAppendViews.push(view);
					}
					// 위치 계산은 새로 해줌
					view.style.top = top;
				}
			}
		}
		// 0번은 colSyncSizer
		for (let i = 1; i < toRemoveLefts.length; i++) {
			toRemoveLefts[i].remove();
		}
		for (let i = 0; i < toAppendLefts.length; i++) {
			editor.colSync.append(toAppendLefts[i]);
		}
		if (SmiEditor.useHighlight) {
			for (let i = 0; i < toRemoveViews.length; i++) {
				toRemoveViews[i].remove();
			}
			for (let i = 0; i < toAppendViews.length; i++) {
				editor.hview.append(toAppendViews[i]);
			}
		}
		
		{	// 스크롤바 일정 시간 표시
			if (!editor.lastScroll) {
				editor.input.classList.add("scrolling");
			}
			const now = editor.lastScroll = new Date().getTime();
			setTimeout(function() {
				if (editor.lastScroll != now) return;
				editor.input.classList.remove("scrolling");
				editor.lastScroll = null;
			}, SmiEditor.scrollShow * 1000);
		}
	});
	
	this.input.addEventListener("blur", () => {
		editor.showBlockArea();
	});
	this.input.addEventListener("focus", () => {
		const block = editor.block;
		block.style.display = "none";
		block.innerHTML = "";
		const cursor = eData(block).cursor;
		if (cursor) {
			// 포커스 되찾을 때 블록지정 영역 유지
			// 이때 history는 건드릴 필요 없음
			editor.input.setSelectionRange(cursor[0], cursor[1]);
		}
		
	});
	window.addEventListener("blur", () => {
		// <textarea>의 포커스는 유지한 채 윈도우 창이 비활성화되는 경우
		if (SmiEditor.selected && (SmiEditor.selected.input == document.activeElement)) {
			// 블록지정 중복으로 보일 필요 없음
			const block = SmiEditor.selected.block;
			block.style.display = "none";
			block.innerHTML = "";
			eData(block, { cursor: null });
		}
	});
	
	// 개발용 임시
	this.input.addEventListener("keydown", (e) => {
		//console.log(e.key, new Date().getTime());
	});
	
	this.input.addEventListener("keyup", (e) => {
		// 찾기/바꾸기 창이 있었을 경우 재활성화
		SmiEditor.Finder.focus();
	});
	this.input.addEventListener("contextmenu", (e) => {
		if (SmiEditor.contextmenu) {
			SmiEditor.contextmenu.open(e, SmiEditor.selected.input);
		}
	});
	this.input.addEventListener("mousedown", (e) => {
		// 블록지정 중에 싱크 영역에 마우스가 올라갈 경우
		// 문서 맨 앞까지 블록지정 되지 않도록 레이어를 띄움
		editor.remember();
		editor.colSyncCover.style.display = "block";
	});
	
	this.area.addEventListener("mouseup", (e) => {
		editor.colSyncCover.style.display = "none";
	});
	// 창 벗어난 상태에서 mouseup 해서 레이어가 안 사라진 경우, 클릭하면 제거
	this.colSyncCover.addEventListener("click", (e) => {
		editor.colSyncCover.style.display = "none";
	});
	
	{
		// 싱크 영역에서 휠 돌리는 경우
		this.colSync.addEventListener("scroll", (e) => {
			if (e.ctrlKey || e.shiftKey || e.altKey) {
				return;
			}
			editor.input.scrollTop = editor.colSync.scrollTop;
		});
		this.colSync.addEventListener("wheel", (e) => {
			// Ctrl+휠 싱크 조절 동작
			if (!e.ctrlKey) {
				return;
			}
			const sync = e.target.closest(".sync");
			if (!sync || sync.classList.contains("range")) {
				return;
			}
			editor.moveSyncLine(sync.getAttribute("data-index"), (e.deltaY < 0));
		}, { passive: true });
		
		this.colSync.title = "Ctrl+휠로 개별 싱크를 조절할 수 있습니다.";
		
		// 싱크 조절 버튼 기능
		this.colSync.addEventListener("click", (e) => {
			const sync = e.target.closest(".sync:not(.range)");
			if (!sync) return;
			if ((e.clientX / editor.colSync.clientWidth) >= 0.84) {
				editor.moveSyncLine(sync.getAttribute("data-index"), (((e.clientY - sync.getBoundingClientRect().top) / sync.offsetHeight * 2) < 1));
			}
		});
	}
};
SmiEditor.prototype.showBlockArea = function() {
	const text = this.input.value;
	const cursor = this.getCursor();
	const prevLines  = text.substring(0, cursor[0]).split("\n");
	const blockLines = text.substring(cursor[0], cursor[1]).split("\n");
	
	const lineHeight = parseFloat(getComputedStyle(this.input).lineHeight);
	this.block.style.top = ((prevLines.length - 1) * lineHeight) + "px";
	
	const prev  = document.createElement("div");
	prev.innerText = prevLines[prevLines.length - 1];
	prev.classList.add("block-prev");
	
	let block = document.createElement("div");
	block.innerText = blockLines[0] + " ";
	block.classList.add("block-line");
	this.block.append(prev, block);
	
	for (let i = 1; i < blockLines.length; i++) {
		block = document.createElement("div");
		block.innerText = blockLines[i] + (i == blockLines.length - 1 ? "" : " ");
		block.classList.add("block-line");
		this.block.append(block);
	}
	
	eData(this.block, { cursor: cursor });
	this.block.style.display = "block";
}

SmiEditor.selected = null;
SmiEditor.keyEventActivated = false;
SmiEditor.activateKeyEvent = function() {
	if (SmiEditor.keyEventActivated) return;
	SmiEditor.keyEventActivated = true;
	const funcSince = log("activateKeyEvent start");

	document.addEventListener("keydown", (e) => {
		const editor = SmiEditor.selected;
		const hasFocus = editor && (editor.input == document.activeElement);

		// TODO: 새삼스럽지만, 단축키 기능 말고 방향키 같은 부분은 activateKeyEvent와 별도로 있었어야 했나...
		if (!editor || !editor.ac || editor.ac.selected < 0) { // auto complete 작동 중엔 무시
			switch (e.key) {
				case "PageUp": {
					if (hasFocus) {
						if (!e.shiftKey) {
							// 크로뮴에서 횡스크롤이 오른쪽으로 튀는 버그 존재
							editor.fixScrollAroundEvent();
						}
						editor.history.logIfCursorMoved();
					}
					break;
				}
				case "PageDown": {
					if (hasFocus) {
						if (!e.shiftKey) {
							// 크로뮴에서 횡스크롤이 오른쪽으로 튀는 버그 존재
							editor.fixScrollAroundEvent();
						}
						editor.history.logIfCursorMoved();
					}
					break;
				}
				case "End": {
					if (hasFocus) {
						if (!e.ctrlKey) {
							// 공백 줄일 경우 End키 이벤트 방지
							// ※ 크로뮴 textarea 공백줄에서 End키 누르면 커서가 다음 줄로 내려가는 버그
							//    어이 없는 게, IE에서 똑같이 하면 커서가 윗줄로 올라감(...)
							// 블록지정일 경우 selectionStart가 문제될 수도 있긴 한데... 그렇게 쓰는 경우는 거의 없을 듯
							const text = editor.input.value;
							const index = editor.input.selectionEnd;
							if (((index == 0) || (text[index-1] == '\n')) && (text[index] == '\n')) {
								e.preventDefault();
							}
						}
						editor.history.logIfCursorMoved();
					}
					break;
				}
				case "Home": {
					if (hasFocus) {
						// 커서가 원래부터 맨 앞에 있는 경우엔 커서 이동이 없어서, 알아서 스크롤이 안 됨
						editor.input.scrollLeft = 0;
						editor.history.logIfCursorMoved();
					}
					break;
				}
				case "ArrowUp": { // ↑
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
								// 홀드 위로 올리기
								if (editor.selector) {
									editor.selector.querySelector(".btn-hold-upper").click();
								}
								
							} else {
								// 스크롤 이동
								if (hasFocus) {
									e.preventDefault();
									editor.input.scrollTop = (Math.max(0, editor.input.scrollTop - LH));
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
						if (editor.input.value.substring(0, editor.input.selectionEnd).indexOf("\n") < 0) {
							e.preventDefault();
						} else {
							editor.history.logIfCursorMoved();
						}
					}
					return;
				}
				case "ArrowDown": { // ↓
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
								// 홀드 아래로 내리기
								if (editor.selector) {
									editor.selector.querySelector(".btn-hold-lower").click();
								}
								
							} else {
								// 스크롤 이동
								if (hasFocus) {
									e.preventDefault();
									editor.input.scrollTop = (editor.input.scrollTop + LH);
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
						if (editor.input.value.substring(editor.input.selectionStart).indexOf("\n") < 0) {
							e.preventDefault();
						} else {
							editor.history.logIfCursorMoved();
						}
					}
					return;
				}
				case "ArrowLeft": { // ←
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
									const text = editor.input.value;
									const c = text[cursor[0] - 1];
									switch (c) {
										case '>': {
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
											break;
										}
										case ';': {
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
											break;
										}
										case '\n': {
											editor.setCursor(cursor[0] - 1);
											editor.scrollToCursor();
											e.preventDefault();
											break;
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
				case "ArrowRight": { // →
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
									const text = editor.input.value;
									if (text.length > cursor[0]) {
										const c = text[cursor[0]];
										switch (c) {
											case '<': {
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
												break;
											}
											case '&': {
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
												break;
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
				case "Tab": {
					if (e.ctrlKey) { // Ctrl+Tab → 탭 전환
						// 순정 SmiEditor엔 탭이 없음
						// editor.js 등에서 추가 선언 필요함
						if (SmiEditor.selectTab) {
							SmiEditor.selectTab();
						}
						
					} else {
						if (hasFocus) {
							e.preventDefault();
							// 탭을 에디터에 입력하는 경우는 없다고 가정, 자동완성 기능으로 활용
							// 탭문자는 중간 싱크에만 활용 - 중간 싱크는 자동 생성으로만 존재
							if (editor.ac) editor.ac.onCheckWord();
						}
					}
					break;
				}
				case "Enter": {
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
				case "Backspace": {
					if (hasFocus) {
						if (e.ctrlKey) { // Ctrl+Backspace → 공백문자 그룹 삭제
							const cursor = editor.getCursor();
							if (cursor[0] == cursor[1]) {
								const text = editor.input.value;
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
									editor.input.value = (text.substring(0, pos) + text.substring(cursor[0]));
									editor.setCursor(pos);
									editor.render();
									editor.scrollToCursor();
								}
							}
						}
					}
					break;
				}
				case "Delete": {
					if (hasFocus) {
						if (e.ctrlKey) { // Ctrl+Delete → 공백문자 그룹 삭제
							const cursor = editor.getCursor();
							if (cursor[0] == cursor[1]) {
								const text = editor.input.value;
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
									editor.input.value = (text.substring(0, cursor[0]) + text.substring(cursor[0] + delLen));
									editor.setCursor(cursor[0]);
									editor.render();
									editor.scrollToCursor();
								}
							}
						}
					}
				}
				case "F5": {
					if (e.shiftKey && !e.ctrlKey && !e.altKey) {
						// Shift+F5: 가중치 없이 싱크 찍기
						editor.insertSync(2);
						return;
					}
					break;
				}
			}
			
			{	// 단축키 설정
				let f = null;
				let key = e.key.toUpperCase();
				if ((key[0] == "F") && (key.length > 1)) { // Fn -> pqrstuvwxyz{ 할당
					key = String.fromCharCode(Number(key.substring(1)) + 111);
				}
				
				if (e.shiftKey) {
					if (e.ctrlKey) {
						if (e.altKey) {
							
						} else {
							switch (key) {
								case '~': key = '`'; break;
								case '!': key = '1'; break;
								case '@': key = '2'; break;
								case '#': key = '3'; break;
								case '$': key = '4'; break;
								case '%': key = '5'; break;
								case '^': key = '6'; break;
								case '&': key = '7'; break;
								case '*': key = '8'; break;
								case '(': key = '9'; break;
								case ')': key = '0'; break;
								case '_': key = '-'; break;
								case '+': key = '='; break;
							}
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
									editor.remember();
									
								} else if (key == "V") {
									// 붙여넣기 전 상태 기억
									editor.remember();
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
					
					// 에디터로 포커스 이동
					if (SmiEditor.focusRequired()) {
						editor.input.focus();
					}
					
					const funcSince = log("단축키 실행 start");
					const type = typeof f;
					if (type == "function") {
						log(`${key} / func: ${f.name}`);
						f();
					} else if (type == "string" && f.trim().length) {
						log(`${key} / func: ${f.split("\n")[0]}`);
						eval(`(() => { ${ f }// */\n})()`); // 내용물이 주석으로 끝날 수도 있음
					}
					log("단축키 실행 end", funcSince);
				}
			}
		}
	});
	log("activateKeyEvent end", funcSince);
};
SmiEditor.focusRequired = function() {
	const editor = SmiEditor.selected;
	const hasFocus = editor && (editor.input == document.activeElement);
	return (!hasFocus && editor);
}

SmiEditor.prototype.historyForward = function() {
	this.history.forward();
}
SmiEditor.prototype.historyBack = function () {
	this.history.back();
}

SmiEditor.prototype.getCursor = function() {
	return [this.input.selectionStart, this.input.selectionEnd];
}
SmiEditor.prototype.setCursor = function(start=0, end=null) {
	this.input.setSelectionRange(start, end ? end : start);
	this.history.log(null, true);
}
SmiEditor.scrollMargin = 3.5;
SmiEditor.prototype.scrollToCursor = function(lineNo) {
	let left = 0;
	if (typeof lineNo == "undefined") {
		const linesBeforeCursor = this.input.value.substring(0, this.input.selectionEnd).split("\n");
		// 좌우 스크롤 계산
		left = this.getWidth(linesBeforeCursor[lineNo = (linesBeforeCursor.length - 1)]);
	}
	let top = lineNo * LH;
	const scrollMargin = SmiEditor.scrollMargin * LH;
	
	{	const scrollTop = this.input.scrollTop;
		if (top < scrollTop + scrollMargin) { // 커서가 보이는 영역보다 위
			this.input.scrollTop = (top - scrollMargin);
		} else {
			top += LH + SB - this.input.offsetHeight + 2; // .height()는 padding을 빼고 반환함
			if (top > scrollTop - scrollMargin) { // 커서가 보이는 영역보다 아래
				this.input.scrollTop = (top + scrollMargin);
			}
		}
	}
	{	const scrollLeft = this.input.scrollLeft;
		if (left < scrollLeft) { // 커서가 보이는 영역보다 왼쪽
			this.input.scrollLeft = left;
		} else {
			left += SB - this.input.offsetWidth + 2;
			if (left > scrollLeft) { // 커서가 보이는 영역보다 오른쪽
				this.input.scrollLeft = left;
			}
		}
	}
	// 간헐적 에디터 외부 스크롤 버그 교정
	this.area.scrollTop = 0;
}
SmiEditor.prototype.getWidth = function(text) {
	let checker = SmiEditor.prototype.widthChecker;
	if (!checker) {
		document.body.append(checker = SmiEditor.prototype.widthChecker = document.createElement("span"));
		checker.style.whiteSpce = "pre";
	}
	checker.style.font = getComputedStyle(this.input).font;
	checker.innerText = text;
	checker.style.display = "inline";
	const width = checker.clientWidth;
	checker.style.display = "none";
	return width;
}

SmiEditor.prototype.fixScrollAroundEvent = function(scrollLeft) {
	// 원래 스크롤 기억
	const scrollTop = this.input.scrollTop;
	if (scrollLeft == undefined) {
		scrollLeft = this.input.scrollLeft;
	}
	const editor = this;
	setTimeout(() => {
		// 이벤트 진행 후 원래 스크롤 복원
		editor.input.scrollTop  = scrollTop ;
		editor.input.scrollLeft = scrollLeft;
		// 스크롤 이동 필요하면 이동
		editor.scrollToCursor();
	}, 1);
}

SmiEditor.prototype.remember = function () {
	this.history.log();
}

SmiEditor.prototype.getValue = function() {
	return this.input.value;
}
SmiEditor.prototype.setValue = function(value) {
	this.input.value = value;
}

//사용자 정의 명령 지원
SmiEditor.prototype.getText = function() {
	return {"text": this.input.value
		,	"selection": this.getCursor()
	};
}
SmiEditor.prototype.setText = function(text, selection) {
	this.remember();
	
	this.input.value = text;
	if (selection) {
		this.setCursor(selection[0], selection[1]);
		this.scrollToCursor();
	} else {
		this.setCursor(this.input.selectionStart);
	}
	if (this.block.style.display == "block") {
		this.showBlockArea();
	}
	
	this.remember();
	this.render();
}
SmiEditor.prototype.getLine = function() {
	const cursor = this.getCursor();
	const lines = this.input.value.substring(0, cursor[1]).split("\n");
	const lineNo = lines.length - 1;
	const selection = [Math.max(0, lines[lineNo].length - cursor[1] + cursor[0]), lines[lineNo].length];
	return {"text": this.lines[lineNo].TEXT
		,	"selection": selection
	};
}
SmiEditor.prototype.setLine = function(text, selection) {
	this.remember();
	
	const cursor = this.input.selectionEnd;
	const value = this.input.value;
	let lines = value.substring(0, cursor).split("\n");
	const lineNo = lines.length - 1;
	const offset = cursor - lines[lineNo].length;
	lines = value.split("\n");
	lines[lineNo] = text;
	this.input.value = lines.join("\n");
	if (selection) {
		this.setCursor(offset + selection[0], offset + selection[1]);
	} else {
		this.setCursor(cursor);
	}
	
	this.remember();
	this.render();
}
SmiEditor.inputText = (input) => {
	if (SmiEditor.selected) {
		SmiEditor.selected.inputText(input);
	}
}
SmiEditor.prototype.inputText = function(input, standCursor) {
	const selection = this.getCursor();
	const cursor = selection[0] + (standCursor ? 0 : input.length);
	const text = this.input.value;
	if (input.length == 7 && input[0] == "#"
		&& selection[0] > 0 && text[selection[0] - 1] == "&"
		&& selection[1] < text.length && text[selection[1]] == "&") {
		// ASS 색상코드 블록지정한 상태일 경우 ASS 색상코드 입력
		input = "H" + input.substring(5,7) + input.substring(3,5) + input.substring(1,3);
	}
	this.setText(text.substring(0, selection[0]) + input + text.substring(selection[1]), [cursor, cursor]);
	this.scrollToCursor();
}
// TODO: 지금 안 쓰이나...???
/*
SmiEditor.prototype.inputTextLikeNative = function(input) {
	// TODO: 횡스크롤을 안 잡고 있음...
	// 좌우 스크롤까지 하는 건 연산량 부담..이 별로 안 되나?
	// 애초에 예외적인 경우에 필요한 기능이긴 한데...
	const text = this.input.value;
	const selection = this.getCursor();
	const cursor = selection[0] + input.length;
	this.input.value = (text.substring(0, selection[0]) + input + text.substring(selection[1]));
	this.setCursor(cursor);
	this.render();
	this.scrollToCursor();
}
*/

SmiEditor.prototype.reSyncPrompt = function() {
	const editor = this;
	prompt("싱크 시작 시간을 입력하세요.", (value) => {
		if (!value) {
			alert("잘못된 값입니다.");
		} else {
			try {
				value = eval(value);
				if (isFinite(value)) {
					try {
						editor.reSync(Number(value), true);
					} catch (e) {
						console.log(e);
					}
				} else {
					alert("잘못된 값입니다.");
				}
			} catch (e) {
				alert("잘못된 값입니다.");
			}
		}
	});
}
SmiEditor.prototype.reSync = function(sync, limitRange=false) {
	if (this.isRendering) {
		return;
	}
	this.remember();
	
	if (!sync) {
		sync = SmiEditor.getSyncTime();
	}
	
	let withEveryHolds = SmiEditor.sync.holds;
	
	const cursor    = this.input.selectionStart;
	const endCursor = this.input.selectionEnd;
	let limitLine = this.lines.length;
	let lineNo = this.input.value.substring(0, cursor).split("\n").length - 1;
	
	if (limitRange && endCursor > cursor) {
		limitLine = this.input.value.substring(0, endCursor).split("\n").length;
		withEveryHolds = false;
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
	const originSync = this.lines[lineNo = i].SYNC;
	const add = sync - originSync;
	
	if (withEveryHolds && this.owner) {
		// 모든 홀드에 작업
		const holds = this.owner.holds;
		
		for (let h = 0; h < holds.length; h++) {
			const hold = holds[h];
			
			// 적용 시작할 싱크 찾기
			let i = 0;
			for (; i < hold.lines.length; i++) {
				if (hold.lines[i].SYNC >= originSync) {
					break;
				}
			}
			const beginLineNo = i;
			const lines = hold.lines.slice(0, beginLineNo);
			
			for (; i < hold.lines.length; i++) {
				const line = hold.lines[i];
				if (line.SYNC) {
					const sync = line.SYNC;
					const newSync = sync + add;
					// 싱크 줄에는 다른 숫자가 없다고 가정
					lines.push(new Line(line.TEXT.replaceAll(sync, newSync), newSync, line.TYPE));
				} else {
					lines.push(line);
				}
			}
			
			const value = linesToText(lines);
			hold.input.value = value;
			hold.setCursor(cursor);
			hold.remember();
			hold.render([beginLineNo, hold.lines.length]);
		}
		
	} else {
		// 현재 홀드만 작업
		const lines = this.lines.slice(0, lineNo);
		
		for (; i < this.lines.length; i++) {
			const line = this.lines[i];
			if (i < limitLine && line.SYNC) {
				const sync = line.SYNC;
				const newSync = sync + add;
				// 싱크 줄에는 다른 숫자가 없다고 가정
				lines.push(new Line(line.TEXT.replaceAll(sync, newSync), newSync, line.TYPE));
			} else {
				lines.push(line);
			}
		}
		
		const value = linesToText(lines);
		this.input.value = value;
		this.setCursor(cursor);
		this.remember();
		this.render([lineNo, this.lines.length]);
	}
	
	return originSync;
}
/*
mode:
	0: 기본 싱크
	1: 화면 싱크
	2: 가중치 없이 화면 싱크
	true -> 1로 동작 (레거시 지원)
*/
SmiEditor.prototype.insertSync = function(mode=0) {
	if (this.isRendering) {
		return;
	}
	this.remember();
	
	if (mode === true) {
		mode = 1;
	}
	
	// 현재 커서가 위치한 줄
	let lineNo = 0;
	lineNo = this.input.value.substring(0, this.input.selectionEnd).split("\n").length - 1;
	
	let tmp = {};
	const sync = SmiEditor.getSyncTime(((mode == 2) ? "!" : null), (mode == 1), tmp);
	const forFrame = (mode > 0) || tmp.keyframe;
	
	let cursor = 0;
	const lineSync = this.lines[lineNo].SYNC;
	if (lineSync) {
		// 싱크 줄에서 싱크 삽입할 경우엔 싱크 수정
		// 싱크 줄에는 다른 숫자가 없다고 가정
		let lineText = this.lines[lineNo].TEXT.replaceAll(lineSync, sync);
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
				lineText = lineText.replaceAll(" >", ">");
				type = TYPE.BASIC;
			}
		}
		// 에디터 맨 아래에 싱크줄이 있는 예외가 있음
		const limit = Math.min(this.lines.length, lineNo + SmiEditor.sync.update);
		for (let i = 0; i < limit; i++) { // 싱크 찍은 다음 줄로 커서 이동
			cursor += this.lines[i].TEXT.length + 1;
		}
		this.input.value = linesToText(this.lines.slice(0, lineNo).concat([new Line(lineText, sync, type)], this.lines.slice(lineNo + 1)));
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
		
		this.input.value = linesToText(this.lines.slice(0, lineNo).concat(inputLines, this.lines.slice(lineNo)));
		this.scrollToCursor(lineNo + SmiEditor.sync.insert + 1);
	}
	this.setCursor(cursor);
	
	this.remember();
	this.render();
}
SmiEditor.prototype.toggleSyncType = function() {
	if (this.isRendering) {
		return;
	}
	this.remember();
	
	const text = this.input.value;
	let cursor = 0;
	let lineNo = 0;
	cursor = this.input.selectionEnd;
	lineNo = text.substring(0, cursor).split("\n").length - 1;
	
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
			const value = linesToText(this.lines.slice(0, i).concat(newLine, this.lines.slice(i + 1)));
			this.input.value = value;
			this.render();
			this.setCursor(cursor);
			
			this.remember();
			this.renderByResync([i, i+1]);
			return;
		}
	}
}
SmiEditor.prototype.removeSync = function() {
	if (this.isRendering) {
		return;
	}
	this.remember();
	
	let lineRange = [];
	const text = this.input.value;
	const range = this.getCursor();
	lineRange = [text.substring(0, range[0]).split("\n").length - 1, text.substring(0, range[1]).split("\n").length - 1];
	
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
	const value = linesToText(lines.concat(this.lines.slice(lineRange[1]+1)));
	this.input.value = value;
	this.setCursor(range[0], range[1]);
	this.scrollToCursor(lineRange[1] - cnt);
	
	this.remember();
	this.render();
}
SmiEditor.prototype.insertBR = function() {
	this.remember();
	
	const text = this.input.value;
	const range = this.getCursor();
	const value = (text.substring(0, range[0]) + "<br>" + text.substring(range[1]));
	this.input.value = value;
	range[1] = range[0] + 4;
	this.setCursor(range[1], range[1]);
	this.remember();
	this.render();
}
SmiEditor.prototype.moveToSync = function(add=0) {
	if (typeof add != "number") {
		add = 0;
	}
	
	let lineNo = 0;
	lineNo = this.input.value.substring(0, this.input.selectionEnd).split("\n").length - 1;
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
	const cursor = (lineNo ? this.input.value.split("\n").slice(0, lineNo).join("\n").length + 1 : 0);
	this.setCursor(cursor);
	this.scrollToCursor(lineNo);
}
SmiEditor.prototype.deleteLine = function() {
	if (this.isRendering) {
		return;
	}
	this.remember();
	
	const text = this.input.value;
	const range = this.getCursor();
	if ((range[0] < range[1]) && (text[range[1] - 1] == "\n")) {
		range[1]--;
	}
	const lineRange = [text.substring(0, range[0]).split("\n").length - 1, text.substring(0, range[1]).split("\n").length - 1];
	let tmp = text.substring(0, range[0]).split("\n");
	const cursor = range[0] - tmp[tmp.length - 1].length;
	
	this.input.value = linesToText(this.lines.slice(0, lineRange[0]).concat(this.lines.slice(lineRange[1]+1)));
	this.setCursor(cursor);
	this.remember();
	this.render();
	this.scrollToCursor();
}

SmiEditor.prototype.tagging = function(tag=null, fromCursor=null) {
	if (typeof tag != "string") return;
	if (tag[0] != "<") return;
	if (tag.indexOf(">") != tag.length - 1) return;
	
	let index = tag.indexOf(" ");
	if (index < 0) index = tag.indexOf(">");
	const closer = `</${ tag.substring(1, index) }>`;
	
	this.remember();
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
	this.remember();
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
		const funcSince = log("render start");
		
		const lines = self.lines;
		const newText = self.input.value;
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
			last.state = self.lines[remainedHead - 1].VIEW ? eData(self.lines[remainedHead - 1].VIEW).next : null;
		}
		
		{	// 텍스트 바뀐 범위
			for (let i = remainedHead; i < newTextLines.length - remainedFoot; i++) {
				newLines.push(new Line(newTextLines[i]).render(i, last));
			}
		}
		{	// 텍스트 바뀐 범위보다 뒤쪽
			newLines.push(...lines.slice(lines.length - remainedFoot));
			
			// 수정한 범위 다음에 오는 싱크 오류 체크
			for (let i = newLines.length - remainedFoot; i < newLines.length; i++) {
				if (newLines[i].SYNC) {
					const line = newLines[i];
					if (line.SYNC < last.sync) {
						line.LEFT.classList.remove("equal"); line.LEFT.classList.add("error");
					} else if (line.SYNC == last.sync) {
						line.LEFT.classList.remove("error"); line.LEFT.classList.add("equal");
					} else {
						line.LEFT.classList.remove("equal"); line.LEFT.classList.remove("error");
					}
					break;
				}
			}
			for (let i = newLines.length - remainedFoot; i < newLines.length; i++) {
				if (!newLines[i].renderHighlight(last)) {
					break;
				}
			}
		}
		
		self.text = newText; // TODO: 에디터 값 직접 가져오도록 수정함. 빠트린 것 없는 지 확인 후 삭제
		self.lines = newLines;
		self.colSyncSizer.style.top = (newLines.length * LH) + "px";
		
		if (SmiEditor.PlayerAPI && SmiEditor.PlayerAPI.setLines) {
			SmiEditor.PlayerAPI.setLines(newLines);
		}
		if (SmiEditor.Viewer.window) {
			SmiEditor.Viewer.refresh();
		}
		self.isRendering = false;
		
		self.afterChangeSaved(self.isSaved());
		
		log("render end", funcSince);
		
		setTimeout(() => {
			{
					const ta = self.input;
				if (ta.scrollWidth > ta.clientWidth) {
					self.input.classList.remove("disable-scroll-x");
					if (ta.scrollLeft) {
						self.input.classList.remove("scrollLeft");
					} else {
						self.input.classList.add("scrollLeft");
					}
					if (ta.clientWidth + ta.scrollLeft < ta.scrollWidth) {
						self.input.classList.remove("scrollRight");
					} else {
						self.input.classList.add("scrollRight");
					}
				} else {
					self.input.classList.add("disable-scroll-x", "scrollLeft", "scrollRight");
				}
				if (self.afterRender) {
					self.afterRender();
				}
			}
			if (self.needToRender) {
				// 렌더링 대기열 있으면 재실행
				self.render();
			} else {
				// 렌더링 끝났으면 출력 새로고침
				self.input.dispatchEvent(new Event("scroll", { bubbles: true }));
			}
		}, 100);
	};
	setTimeout(thread, 1);
}
// highlightCss, highlightText는 설정 가져와서 override
// TODO: 여기도 에디터 바꾸면 안 쓰일 듯?
SmiEditor.highlightCss = ".hljs-sync: { color: #3F5FBF; }";
SmiEditor.highlightText = (text, state=null) => {
	const previewLine = document.createElement("span");
	if (text.toUpperCase().startsWith("<SYNC ")) {
		previewLine.classList.add("hljs-sync");
	}
	previewLine.innerText = text;
	return previewLine;
}
SmiEditor.ROOT = "";
SmiEditor.setHighlight = (SH, editors) => {
	SmiEditor.useHighlight = SH && SH.parser;
	SmiEditor.showColor = SH.color;
	SmiEditor.showEnter = SH.enter;
	if (SH.parser) {
		fetch(SmiEditor.ROOT + `lib/highlight/parser/${ SH.parser }.js`).then(async (response) => {
			let parser = await response.text();
			eval(parser);
			
			let name = SH.style;
			let isDark = false;
			if (name.endsWith("-dark") || (name.indexOf("-dark-") > 0)) {
				isDark = true;
			} else if (name.endsWith("?dark")) {
				isDark = true;
				name = name.split("?")[0];
			}
			
			fetch(SmiEditor.ROOT + `lib/highlight/styles/${ name }.css`).then(async (response) => {
				let style = await response.text();
				// 문법 하이라이트 테마에 따른 커서 색상 추가
				SmiEditor.highlightCss
					= ".hljs { color: unset; }\n"
					+ `.hold textarea { caret-color: ${ (isDark ? "#fff" : "#000") }; }\n`
					+ style
					+ `.hljs-zw { border-color: ${ (isDark ? "#fff" : "#000") }; }\n`
					+ `.hljs-sync { opacity: ${ SH.sync } }\n`;
				SmiEditor.refreshHighlight(editors);
			});
		});
	} else {
		SmiEditor.afterRefreshHighlight(editors);
	}
}
SmiEditor.refreshHighlight = (editors) => {
	let styleHighlight = document.getElementById("styleHighlight");
	if (!styleHighlight) {
		styleHighlight = document.createElement("style");
		styleHighlight.id = "styleHighlight";
		document.head.append(styleHighlight);
	}
	styleHighlight.innerHTML = SmiEditor.highlightCss;
	
	SmiEditor.afterRefreshHighlight(editors);
}
SmiEditor.afterRefreshHighlight = (editors) => {
	if (!editors) return;
	if (typeof editors == "function") {
		editors = editors();
	}
	for (let i = 0; i < editors.length; i++) {
		editors[i].refreshHighlight();
	}
}
SmiEditor.prototype.refreshHighlight = function () {
	if (SmiEditor.useHighlight) {
		this.hArea.classList.remove("nonactive");
		const last = { state: null };
		for (let i = 0; i < this.lines.length; i++) {
			this.lines[i].renderHighlight(last, true);
		}
		this.input.dispatchEvent(new Event("scroll", { bubbles: true }))
	} else {
		this.hArea.classList.add("nonactive");
	}
}

SmiEditor.prototype.moveLine = function(toNext) {
	if (this.isRendering) return;
	this.remember();
	
	let text = this.input.value;
	let range = this.getCursor();
	let lineRange = [text.substring(0, range[0]).split("\n").length - 1, text.substring(0, range[1]).split("\n").length - 1];
	const lines = text.split("\n");
	let addLine = 0;
	
	if (toNext) {
		if (lineRange[1] == lines.length - 1) {
			// 더 이상 내릴 수 없음
			return;
		}
		text =	lines.slice(0, lineRange[0]) // 그대로인 범위
		.concat(
				lines      [lineRange[1]+1] // 선택 범위 아랫줄을 위로 올림
			,	lines.slice(lineRange[0],
				            lineRange[1]+1) // 선택 범위를 아래로 내림
			,	lines.slice(lineRange[1]+2) // 그대로인 범위
		).join("\n");
		
		// 이동 후 커서 위치에 따른 스크롤
		const targetTop = (lineRange[1]+2) * LH - this.input.offsetHeight + SB;
		if (targetTop > this.input.scrollTop) {
			this.input.scrollTop = targetTop;
		}
		// 이동 후 커서 위치 = 위로 내린 줄 길이만큼 더하기
		addLine = lines[lineRange[1]+1].length + 1;
	} else {
		if (lineRange[0] == 0) {
			// 더 이상 올릴 수 없음
			return;
		}
		text =	lines.slice(0, lineRange[0]-1) // 그대로인 범위
		.concat(
				lines.slice(lineRange[0],
				            lineRange[1]+1) // 선택 범위를 위로 올림
			,	lines      [lineRange[0]-1] // 선택 범위 윗줄을 아래로 내림
			,	lines.slice(lineRange[1]+1) // 그대로인 범위
		).join("\n");
		
		// 이동 후 커서 위치에 따른 스크롤
		const targetTop = (lineRange[1]-1) * LH;
		if (targetTop < this.input.scrollTop) {
			this.input.scrollTop = targetTop;
		}
		// 이동 후 커서 위치 = 아래로 내린 줄 길이만큼 빼기
		addLine = -(lines[lineRange[0]-1].length + 1);
	}
	this.input.value = text;
	this.setCursor(range[0]+addLine, range[1]+addLine);
	this.remember();
	this.render([Math.max(0, lineRange[0]-1), Math.min(lineRange[1]+2, lines.length)]);
}
SmiEditor.prototype.moveSync = function(toForward) {
	this.remember();
	
	let text;
	let range;
	text = this.input.value;
	range = this.getCursor();
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
				this.lines[i].TEXT = this.lines[i].TEXT.replaceAll(this.lines[i].SYNC, sync); // 싱크 줄에 싱크 이외의 숫자가 없다고 가정
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
				this.lines[i].TEXT = this.lines[i].TEXT.replaceAll(this.lines[i].SYNC, sync); // 싱크 줄에 싱크 이외의 숫자가 없다고 가정
				this.lines[i].SYNC = sync;
			}
		}
	}
	const lines = (this.input.value = this.text = linesToText(this.lines)).split("\n");
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
	this.remember();
}
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
		const funcSince = log("renderByResync start");
		
		const last = { sync: 0 };
		for (let i = range[1] - 1; i >= range[0]; i--) {
			if (self.lines[i].SYNC) {
				last.sync = self.lines[i].SYNC;
				break;
			}
		}
		if (last.sync == 0) return; // 선택된 싱크 없음

		const prev = { sync: 0 };
		for (let i = range[0] - 1; i >= 0; i--) {
			if (self.lines[i].SYNC) {
				prev.sync = self.lines[i].SYNC;
				break;
			}
		}
		
		// 새로 그리기
		last.sync = prev.sync;
		for (let i = range[0]; i < range[1]; i++) {
			const line = self.lines[i];
			if (line.TYPE) { // 싱크 줄만 갱신
				line.VIEW = null;
				line.render(i, last);
			}
		}
		
		let firstSyncLine = null;
		for (let i = range[0]; i < range[1]; i++) {
			if (self.lines[i].SYNC) {
				firstSyncLine = self.lines[i];
				break;
			}
		}
		if (firstSyncLine && prev.sync) {
			if (firstSyncLine.SYNC <= prev.sync) {
				firstSyncLine.LEFT.classList.add(firstSyncLine.SYNC == prev.sync ? "equal" : "error");
			} else {
				firstSyncLine.LEFT.classList.remove("equal");
				firstSyncLine.LEFT.classList.remove("error");
			}
		}
		// 선택 범위 아래쪽 싱크 역전 체크
		let nextSyncLine = null;
		for (let i = range[1]; i < self.lines.length; i++) {
			if (self.lines[i].SYNC) {
				nextSyncLine = self.lines[i];
				break;
			}
		}
		if (nextSyncLine && last.sync) {
			if (nextSyncLine.SYNC <= last.sync) {
				nextSyncLine.LEFT.classList.add(nextSyncLine.SYNC == last.sync ? "equal" : "error");
			} else {
				nextSyncLine.LEFT.classList.remove("equal");
				nextSyncLine.LEFT.classList.remove("error");
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
		
		log("renderByResync end", funcSince);
		
		setTimeout(() => {
			if (self.needToRender) {
				// 렌더링 대기열 있으면 재실행
				self.render();
			} else {
				// 렌더링 끝났으면 출력 새로고침
				self.input.dispatchEvent(new Event("scroll", { bubbles: true }));
			}
		}, 100);
	}, 1);
}
SmiEditor.prototype.moveSyncLine = function(lineIndex, toForward) {
	this.remember();
	
	const line = this.lines[lineIndex];
	const lines = this.input.value.split("\n");
	const sync = line.SYNC + ((toForward ? 1 : -1) * SmiEditor.sync.unit);
	lines[lineIndex] = SmiEditor.makeSyncLine(Math.max(1, sync), line.TYPE);
	
	const value = lines.join("\n");
	this.input.value = value;
	this.setCursor(lines.slice(0, lineIndex).join("\n").length + 1);
	this.render();
	this.scrollToCursor();
	this.input.focus();
	
	this.remember();
}
/**
 * frameSyncOnly: 화면 싱크만 맞춰주기
 * add: 과거 반프레임 보정치 안 넣었던 것들을 위해 추가
 */
SmiEditor.prototype.fitSyncsToFrame = function(frameSyncOnly=false, add=0) {
	if (!Subtitle.video.fs.length) {
		return;
	}
	const lines = JSON.parse(JSON.stringify(this.lines.slice(0)));
	const cursor = this.getCursor();
	const range = [0, lines.length];
	const cursorLine = this.input.value.substring(0, cursor[0]).split("\n").length - 1;
	if (cursor[0] < cursor[1]) {
		range[0] = cursorLine;
		range[1] = this.input.value.substring(0, cursor[1]).split("\n").length;
	}
	
	for (let i = range[0]; i < range[1]; i++) {
		const line = lines[i];
		if ((line.TYPE == TYPE.FRAME) || (!frameSyncOnly && (line.TYPE == TYPE.BASIC))) {
			let sync = Subtitle.findSync(line.SYNC + add, Subtitle.video.fs);
			if (sync != null) {
				if (sync == 0) sync = 1;
				line.TEXT = SmiEditor.makeSyncLine((line.SYNC = sync), line.TYPE);
				
				const colSync = this.lines[i].LEFT;
				let h = sync;
				let ms = h % 1000; h = (h - ms) / 1000;
				let s  = h %   60; h = (h -  s) /   60;
				let m  = h %   60; h = (h -  m) /   60;
				colSync.children[0].innerHTML = `${h}:${intPadding(m)}:${intPadding(s)}:${intPadding(ms, 3)}<br />`;
				
				// 키프레임 됐을 때 업데이트
				const kSync = Subtitle.findSync(line.SYNC, Subtitle.video.kfs);
				if (kSync == sync) {
					colSync.classList.add("keyframe");
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
	this.input.value = text;
	this.setCursor(cursorLine == 0 ? 0 : (text.split("\n").slice(0, cursorLine).join("\n").length + 1));
	this.render(range);
}
SmiEditor.prototype.refreshKeyframe = function() {
	for (let i = 0; i < this.lines.length; i++) {
		const line = this.lines[i];
		if (line.TYPE == TYPE.BASIC || line.TYPE == TYPE.FRAME) {
			if (Subtitle.findSync(line.SYNC, Subtitle.video.kfs, false)) {
				line.LEFT.classList.add   ("keyframe");
			} else {
				line.LEFT.classList.remove("keyframe");
			}
		}
	}
}
SmiEditor.prototype.moveToSide = function(direction) {
	if (direction == 0) return;
	
	let text;
	let cursorLine;
	text = this.input.value;
	cursorLine = text.substring(0, this.getCursor()[0]).split("\n").length - 1;
	
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
		// 태그로 끝나는 라인이 아닐 경우 아직 싱크 찍지 않은 부분으로 간주
		if (!this.lines[nextLine].TEXT.toUpperCase().endsWith(">")) {
			nextLine++;
			break;
		}
	}
	
	let textLines = this.lines.slice(syncLine + 1, nextLine);
	for (let i = 0; i < textLines.length; i++) {
		textLines[i] = textLines[i].TEXT;
	}
	textLines = textLines.join("").replaceAll("\n", "").replaceAll("​", "").split(/<br>/gi);
	
	// 내용물 비었으면 무시
	if (htmlToText(textLines.join("").replaceAll("　", " ")).trim().length == 0) {
		return;
	}
	
	for (let i = 0; i < textLines.length; i++) {
		let lineText = textLines[i];
		let linePrev = "";
		let lineNext = "";
		
		while (lineText.startsWith("<")) {
			const tagEnd = lineText.indexOf(">") + 1;
			if (tagEnd < 1) break;
			
			const tag = lineText.substring(0, tagEnd);
			const tagL = tag.toLowerCase();
			if (tagL.startsWith("<s") || tagL.startsWith("<u")) break; // 공백문자에도 영향을 줌
			linePrev += tag;
			lineText = lineText.substring(tagEnd);
		}
		
		while (lineText.endsWith(">")) {
			const tagStart = lineText.lastIndexOf("<");
			if (tagStart < 1) break;
			
			const tag = lineText.substring(tagStart);
			const tagL = tag.toLowerCase();
			if (tagL.startsWith("</s") || tagL.startsWith("</u")) break; // 공백문자에도 영향을 줌
			lineNext += tag;
			lineText = lineText.substring(0, tagStart);
		}
		
		textLines[i] = {
				prev: linePrev
			,	text: lineText
			,	next: lineNext
			,	skip: (lineText.replaceAll("　", "").replaceAll("&nbsp;", " ").trim().length == 0)
		};
	}
	
	if (direction > 0) {
		// 오른쪽으로 이동
		let remained = true;
		let added = false;
		for (let i = 0; i < direction; i++) {
			// 모든 줄이 공백으로 끝나는지 확인
			if (remained) {
				for (let j = 0; j < textLines.length; j++) {
					if (textLines[j].skip) continue;
					if (!textLines[j].text.endsWith("　")) {
						remained = false;
						break;
					}
				}
			}
			if (remained) {
				// 오른쪽 공백 제거
				for (let j = 0; j < textLines.length; j++) {
					if (textLines[j].skip) continue;
					textLines[j].text = textLines[j].text.substring(0, textLines[j].text.length - 1);
				}
			} else {
				// 왼쪽 공백 추가
				for (let j = 0; j < textLines.length; j++) {
					if (textLines[j].skip) continue;
					textLines[j].text = "　" + textLines[j].text;
				}
				added = true;
			}
		}
		// 모든 줄이 공백으로 끝나는지 확인
		if (remained) {
			for (let j = 0; j < textLines.length; j++) {
				if (textLines[j].skip) continue;
				if (!textLines[j].text.endsWith("　")) {
					remained = false;
					break;
				}
			}
		}
		if (!remained) {
			// 오른쪽에 추가했던 공백을 다 없앴어도 원본에 공백 있을 수 있음
			for (let i = 0; i < textLines.length; i++) {
				if (textLines[i].skip) continue;
				let textLine = textLines[i].text;
				if (textLine.endsWith(" ") || textLine.endsWith("　")) {
					textLines[i].text = textLine + "​";
				}
			}
		}
		for (let i = 0; i < textLines.length; i++) {
			const line = textLines[i];
			if (!line.skip) {
				if ((i || line.prev) && (added || remained)) line.prev += "\n";
				if (added   ) line.prev = line.prev + "​";
				if (remained) line.next = "​" + line.next;
			}
			textLines[i] = line.prev + line.text + line.next;
		}
		textLines = textLines.join("<br>").split("\n");
		
	} else {
		// 왼쪽으로 이동
		let remained = true;
		let added = false;
		for (let i = 0; i < -direction; i++) {
			// 모든 줄이 공백으로 시작하는지 확인
			if (remained) {
				for (let j = 0; j < textLines.length; j++) {
					if (textLines[j].skip) continue;
					if (!textLines[j].text.startsWith("　")) {
						remained = false;
						break;
					}
				}
			}
			if (remained) {
				// 왼쪽 공백 제거
				for (let j = 0; j < textLines.length; j++) {
					if (textLines[j].skip) continue;
					textLines[j].text = textLines[j].text.substring(1);
				}
			} else {
				// 오른쪽 공백 추가
				for (let j = 0; j < textLines.length; j++) {
					if (textLines[j].skip) continue;
					textLines[j].text = textLines[j].text + "　";
				}
				added = true;
			}
		}
		// 모든 줄이 공백으로 시작하는지 확인
		if (remained) {
			for (let j = 0; j < textLines.length; j++) {
				if (textLines[j].skip) continue;
				if (!textLines[j].text.startsWith("　")) {
					remained = false;
					break;
				}
			}
		}
		if (!remained) {
			// 왼쪽에 추가했던 공백을 다 없앴어도 원본에 공백 있을 수 있음
			for (let i = 0; i < textLines.length; i++) {
				if (textLines[i].skip) continue;
				let textLine = textLines[i].text;
				if (textLine.startsWith(" ") || textLine.startsWith("　")) {
					textLines[i].text = "​" + textLine;
				}
			}
		}
		for (let i = 0; i < textLines.length; i++) {
			const line = textLines[i];
			if (!line.skip) {
				if ((i || line.prev) && (added || remained)) line.prev += "\n";
				if (remained) line.prev = line.prev + "​";
				if (added   ) line.next = "​" + line.next;
			}
			textLines[i] = line.prev + line.text + line.next;
		}
		textLines = textLines.join("<br>").split("\n");
	}
	
	for (let i = 0; i < textLines.length; i++) {
		textLines[i] = new Line(textLines[i]);
	}
	
	this.remember();
	const prev = this.lines.slice(0, syncLine + 1);
	let cursor = 0;
	for (let i = 0; i < prev.length; i++) {
		cursor += prev[i].TEXT.length + 1;
	}
	const lines = prev.concat(textLines).concat(this.lines.slice(nextLine));
	const value = linesToText(lines);
	this.input.value = value;
	this.setCursor(cursor);
	this.remember();
	this.render([syncLine, nextLine]);
}

// 별도 창 방식
SmiEditor.Finder1 = {
		last: { find: "", replace: "", withCase: false, reverse: false }
	,	open: function(isReplace) {
			this.onload = (isReplace ? this.onloadReplace : this.onloadFind);
			let newWindow = window.open("finder.html", "finder", "scrollbars=no,location=no,width=400,height=220");
			if (newWindow) this.window = newWindow; // WebView2에서 팝업 재활용할 경우 null이 될 수 있음
			binder.focus("finder");
		}
	,	onloadFind: function(isReplace=false) {
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
			if (this.finding.find.length == 0) {
				return "찾을 문자열이 없습니다.";
			}
			this.finding.input = SmiEditor.selected.input;
			this.finding.text  = this.finding.input.value;
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
			if (!selection) {
				selection = [this.finding.input.selectionStart, this.finding.input.selectionEnd];
			}
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
			if (!selection) {
				selection = [this.finding.input.selectionStart, this.finding.input.selectionEnd];
			}
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
				SmiEditor.selected.remember();
				this.finding.input.value = this.finding.text;
				this.finding.input.setSelectionRange(selection[0], selection[1]);
				this.afterFind();
				SmiEditor.selected.render();
				SmiEditor.selected.remember();
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
			if (last = selection = this.doReplace()) count++;
			
			// 다음 찾기
			selection = this.doFind(selection);
			
			// 바꾸기-찾기 반복
			while (selection) {
				count++;
				last = selection;
				selection = this.doFind(this.doReplace(selection));
			}
			
			if (count) {
				SmiEditor.selected.remember();
				this.finding.input.value = this.finding.text;
				this.finding.input.setSelectionRange(last[0], last[1]);
				this.afterFind();
				SmiEditor.selected.render();
				SmiEditor.selected.remember();
				this.sendMsgAfterRun(count + "개 바꿈");
			} else {
				this.sendMsgAfterRun("찾을 수 없습니다.");
			}
		}
	,	sendMsgAfterRun: function(msg) {
			// 딜레이 안 주면 화면 갱신 안 된 상태로 뜰 수 있음
			setTimeout(() => {
				binder.sendMsg("finder", msg);
			}, 100);
		}
		
		// 찾기/바꾸기 창 항상 위에 - 웹샘플에서만 작동
	,	useFocus: false
	,	lastFocus: 0
	,	focus: function(delay=1000) {
			if (!this.useFocus) return;
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
// iframe 방식
SmiEditor.Finder2 = {
		last: { find: "", replace: "", withCase: false, reverse: false }
	,	open: function(isReplace) {
			const w = 440;
			const h = 220;
			this.window.frame.css({
					top: (window.innerHeight - h) / 2
				,	left: (window.innerWidth - w) / 2
				,	width: w
				,	height: h
				,	zIndex: 99999
			}).show();
			
			this.window.iframe.focus();
			if (isReplace) {
				this.onloadReplace();
			} else {
				this.onloadFind();
			}
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
			
			this.window.iframe.contentWindow.init(JSON.stringify(this.last));
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
			if (this.finding.find.length == 0) {
				return "찾을 문자열이 없습니다.";
			}
			this.finding.input = SmiEditor.selected.input;
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
				SmiEditor.selected.showBlockArea();
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
				SmiEditor.selected.remember();
				this.finding.input.value = this.finding.text;
				this.finding.input.setSelectionRange(selection[0], selection[1]);
				this.afterFind();
				SmiEditor.selected.render();
				SmiEditor.selected.remember();
				SmiEditor.selected.showBlockArea();
			}
			
			// 다음 거 찾기
			if (selection = this.doFind(selection)) {
				this.finding.input.setSelectionRange(selection[0], selection[1]);
				this.afterFind();
				SmiEditor.selected.showBlockArea();
				
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
			const cursor = this.finding.input.selectionStart;
			
			// 바꾸기
			if (last = selection = this.doReplace()) count++;
			
			// 다음 찾기
			selection = this.doFind(selection);
			
			// 바꾸기-찾기 반복
			while (selection) {
				count++;
				last = selection;
				selection = this.doFind(this.doReplace(selection));
			}
			
			if (count) {
				SmiEditor.selected.remember();
				this.finding.input.value = this.finding.text;
//				this.finding.input.setSelectionRange(last[0], last[1]);
				this.finding.input.setSelectionRange(cursor, cursor); // 시작점으로 커서 이동
				this.afterFind();
				SmiEditor.selected.render();
				SmiEditor.selected.remember();
				SmiEditor.selected.showBlockArea();
				this.sendMsgAfterRun(count + "개 바꿈");
			} else {
				this.sendMsgAfterRun("찾을 수 없습니다.");
			}
		}
	,	sendMsgAfterRun: function(msg) {
			// 딜레이 안 주면 화면 갱신 안 된 상태로 뜰 수 있음
			setTimeout(() => {
				alert(msg);
			}, 100);
		}

		// 찾기/바꾸기 창 항상 위에 필요 없음
	,	focus: function() {}
};

SmiEditor.Viewer = {
		window: null
	,	open: function() {
			let newWindow = window.open("viewer.html", "viewer", "scrollbars=no,location=no,width=1,height=1");
			if (newWindow) this.window = newWindow; // WebView2에서 팝업 재활용할 경우 null이 될 수 있음
			binder.focus("viewer");
			setTimeout(() => {
				binder.focus("editor");
			}, 100);
			return this.window;
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
							if (holds[i].style) {
								// 홀드 스타일 있을 경우 반영
								// TODO: 성능 부하가 얼마나 되지? 미리보기 쪽에서 필요 시 렌더링?
								//       수정된 영역만 업데이트하는 게 제일 좋긴 한데...
								const tag = SmiFile.styleToSmi(holds[i].style);
								const holdLines = holds[i].lines;
								const newLines = []; // 싱크 내 줄바꿈 뭉쳐서 보냄
								let lineBegins = 0;
								let lineEnds = 0;
								for (let j = 0; j < holdLines.length; j++) {
									if (holdLines[j].TEXT.toUpperCase().indexOf("</BODY>") >= 0) {
										// 문서 끝
										lineEnds = j;
										break;
									}
									if (holdLines[j].TYPE) {
										// 이전에 쌓인 텍스트 처리
										if (lineBegins < j) {
											let texts = [];
											let pass = 0;
											for (let k = lineBegins; k < j; k++) {
												const hText = holdLines[k].TEXT;
												texts.push(hText);
												if (hText.toLowerCase().endsWith("<br>")) {
													pass++;
												}
											}
											// <br> 뒤의 줄바꿈은 일단 제거
											let text = texts.join("\n").replaceAll(/<br>\n/gi, "<br>");
											{	// 주석 제거한 후 줄바꿈 확인
												const commentStart = text.indexOf("<!--");
												if (commentStart >= 0) {
													const commentEnd = text.indexOf("-->", commentStart);
													if (commentEnd > 0) {
														const prev = text.substring(0, commentStart);
														const next = text.substring(commentEnd + 3);
														if (!prev && next.startsWith("\n")) {
															text = next.substring(1);
														} else {
															text = prev + next;
														}
													}
												}
											}
											texts = text.split("\n");
											
											// 3줄 넘어가면 줄바꿈 살림
											text = texts.join((texts.length - pass > 3) ? "<br>" : "");
											
											if (text.replaceAll("&nbsp;", "").trim()) { // 공백 싱크는 제외
												newLines.push({ SYNC: 0, TYPE: null, TEXT: Smi.fromAttrs(Smi.toAttrs(tag[0] + text + tag[1], false)).replaceAll("\n", "<br>") })
											}
										}
										// 싱크 줄은 그냥 그대로
										newLines.push(holdLines[j]);
										lineBegins = j + 1;
										continue;
									}
								}
								if (lineBegins < lineEnds) {
									const texts = [];
									let pass = 0;
									for (let k = lineBegins; k < lineEnds; k++) {
										const hText = holdLines[k].TEXT;
										texts.push(hText);
										if (hText.toLowerCase().endsWith("<br>")) {
											pass++;
										}
									}
									// 3줄 넘어가면 줄바꿈 살림
									const text = texts.join((texts.length - pass > 3) ? "<br>" : "");
									
									if (text.replaceAll("&nbsp;", "").trim()) { // 공백 싱크는 제외
										newLines.push({ SYNC: 0, TYPE: null, TEXT: Smi.fromAttrs(Smi.toAttrs(tag[0] + text + tag[1], false)).replaceAll("\n", "<br>") })
									}
								}
								lines.push(newLines);
							} else {
								lines.push(holds[i].lines);
							}
						}
					} else {
						// 홀드 기능 개발 전 코드 일단은 유지
						lines.push(SmiEditor.selected.lines);
					}
				} else {
					// 열린 게 없어도 오류 나지 않도록
					lines.push([new Line()]);
				}
				// C#을 거쳐서 미리보기 창과 통신한다는 가정하에 JSON을 거쳤었는데
				// 그냥 팝업으로 통신하는 걸로
//				binder.updateViewerLines(JSON.stringify(lines));
				if (SmiEditor.Viewer.window) {
					if (SmiEditor.Viewer.window.setLines) {
						SmiEditor.Viewer.window.setLines(lines);
					} else if (SmiEditor.Viewer.window.iframe
					        && SmiEditor.Viewer.window.iframe.contentWindow
					        && SmiEditor.Viewer.window.iframe.contentWindow.setLines) {
						SmiEditor.Viewer.window.iframe.contentWindow.setLines(lines);
					}
				}
			}, 1);
		}
};

// 선택영역 C# 특수 가공 처리
SmiEditor.transforming = {};
SmiEditor.prototype.getTransformText = function() {
	//초기 상태 기억
	const origin = SmiEditor.transforming;
	origin.editor = this;
	origin.text = this.input.value;
	
	let start = 0;
	let end = origin.editor.lines.length;
	
	// 선택 범위만 작업
	const range = origin.editor.getCursor();
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
	result = result.replaceAll("\r\n", "\n");
	const origin = SmiEditor.transforming;
	const origLines = origin.text.split("\n");
	const front = origLines.slice(0, origin.start);
	const range = [(origin.start > 0) ? (front.join("\n").length + 1) : 0];
	range.push(range[0] + result.length);
	
	// 교체
	origin.editor.setText(front.concat(result).concat(origLines.slice(origin.end)).join("\n"), range);
};
SmiEditor.prototype.normalize = function() {
	const text = this.getTransformText();
	if (text) {
		const smi = new SmiFile();
		const input = smi.fromText(text).body;
		Smi.normalize(input, false, Subtitle.video.FR / 1000);
		smi.body = input;
		SmiEditor.afterTransform(smi.toText().trim());
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
	
	const smi = new SmiFile();
	const input = smi.fromText(lines.join("\n")).body;
	Smi.fillEmptySync(input);
	smi.body = input;
	return smi.toText().trim();
};

// 자동완성에 닫는 태그 추가
if (window.AutoCompleteTextarea) {
	AutoCompleteTextarea.getList = function(text, pos, list) {
		if (text[pos] == '<') {
			// '<' 입력일 경우 닫는 태그 자동완성에 추가
			let lines = text.substring(0, pos).split("\n");
			let begin = lines.length - 1;
			for (; begin >= 0; begin--) {
				if (lines[begin].substring(0, 6).toUpperCase() == "<SYNC ") {
					begin++;
					break;
				}
			}
			if (begin > 0) {
				lines = lines.slice(begin);
			}
			let syncText = lines.join("");
			
			let state = null;
			let tag = null;
			let tags = [];
			
			function openTag() {
				if (tag.toUpperCase() != "BR") {
					tags.push(tag);
				}
				tag = null;
			}
			function closeTag(tagName) {
				tagName = tagName.toUpperCase();
				for (let i = tags.length - 1; i >= 0; i--) {
					if (tags[i].toUpperCase() == tagName) {
						tags.length = i;
						break;
					}
				}
			}
			
			for (let pos = 0; pos < syncText.length; pos++) {
				const c = syncText[pos];
				switch (state) {
					case '/': { // 태그?!
						state = '<';
						if (c == '/') { // 종료 태그 시작일 경우
							const end = syncText.indexOf('>', pos);
							if (end < 0) {
								// 태그 끝이 없음
								pos = syncText.length;
								break;
							}
							closeTag(syncText.substring(pos + 1, end));
							pos = end;
							state = null;
							break;
						}
						// 종료 태그 아닐 경우 아래로 이어서 진행
						tag = "";
					}
					case '<': { // 태그명
						switch (c) {
							case '>': { // 태그 종료
								openTag();
								state = null;
								break;
							}
							case ' ':
							case '\t': { // 태그명 끝
								state = '>';
								break;
							}
							default: {
								tag += c;
								break;
							}
						}
						break;
					}
					case '>': { // 태그 내
						switch (c) {
							case '>': { // 태그 종료
								openTag();
								state = null;
								break;
							}
							case ' ':
							case '\t':
							case '<':
							case '&': {
								break;
							}
							default: { // 속성명 시작
								state = 'a';
								break;
							}
						}
						break;
					}
					case 'a': { // 속성명
						switch (c) {
							case '>': { // 태그 종료
								openTag();
								state = null;
								break;
							}
							case '=': { // 속성값 시작
								state = '=';
								break;
							}
							case ' ':
							case '\t': { // 일단은 속성이 끝나지 않을 걸로 간주
								state = '`';
								break;
							}
						}
						break;
					}
					case '`': { // 속성명+공백문자
						switch (c) {
							case '>': { // 태그 종료
								openTag();
								state = null;
								break;
							}
							case '=': { // 속성값 시작
								state = '=';
								break;
							}
							case ' ':
							case '\t': { // 일단은 속성이 끝나지 않을 걸로 간주
								break;
							}
							default: { // 속성값 없는 속성으로 확정, 새 속성 시작
								state = 'a';
							}
						}
						break;
					}
					case '=': { // 속성값 시작 전
						switch (c) {
							case '>': { // 태그 종료
								openTag();
								state = null;
								break;
							}
							case '"': { // 속성값 따옴표 시작
								state = '"';
								break;
							}
							case "'": { // 속성값 따옴표 시작
								state = "'";
								break;
							}
							case ' ': { // 일단은 속성이 끝나지 않을 걸로 간주
								break;
							}
							case '\t': {
								break;
							}
							default: {
								state = '~';
							}
						}
						break;
					}
					case '~': { // 따옴표 없는 속성값
						switch (c) {
							case '>': { // 태그 종료
								openTag();
								state = null;
								break;
							}
							case ' ':
							case '\t': { // 속성 종료
								state = '>';
								break;
							}
						}
						break;
					}
					case '"': {
						switch (c) {
							case '"': { // 속성 종료
								state = '>';
								break;
							}
						}
						break;
					}
					case "'": {
						switch (c) {
							case "'": { // 속성 종료
								state = '>';
								break;
							}
						}
						break;
					}
					case '!': { // 주석
						if ((pos + 3 <= syncText.length) && (syncText.substring(pos, pos+3) == "-->")) {
							state = null;
							pos += 2;
						}
						break;
					}
					default: { // 텍스트
						switch (c) {
							case '<': { // 태그 시작
								if ((pos + 4 <= syncText.length) && (syncText.substring(pos, pos+4) == "<!--")) {
									state = '!';
									pos += 3;
								} else {
									state = '/';
								}
								break;
							}
							case '\n': { // 줄바꿈 무자 무시
								break;
							}
						}
					}
				}
			}
			const newList = [];
			for (let i = tags.length - 1; i >= 0; i--) {
				const item = `</${tags[i]}>`;
				if (newList.indexOf(item) < 0) { // 중복 제외
					newList.push(item);
				}
			}
			newList.push(...list);
			list = newList;
		}
		return list;
	}
}

ready(() => {
	SmiEditor.refreshHighlight();
	
	if (window.Frame) {
		SmiEditor.Finder = SmiEditor.Finder2;
		SmiEditor.Finder.window = new Frame("finder.html", "finder", "", () => {
			// 좌우 크기만 조절 가능
			[...SmiEditor.Finder.window.frame.querySelectorAll(".tl, .t, .tr, .bl, .b, .br")].forEach((el) => { el.remove(); });
			
			SmiEditor.Finder.window.close =
			SmiEditor.Finder.window.iframe.contentWindow.close = () => {
				// 닫기가 아닌 숨기기로 재정의
				SmiEditor.Finder.window.frame.hide();
				setTimeout(() => {
					// X 클릭했을 경우 버튼에 포커스 뺏기는데, 에디터에 돌려줌
					SmiEditor.selected.input.focus();
				}, 1);
			};
		});
		SmiEditor.Finder.window.frame.hide();
	} else {
		SmiEditor.Finder = SmiEditor.Finder1;
		document.addEventListener("mouseup", () => {
			// 찾기/바꾸기 창이 있었을 경우 재활성화
			SmiEditor.Finder.focus();
		});
	}
});