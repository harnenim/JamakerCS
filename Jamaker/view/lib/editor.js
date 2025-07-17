window.time = 0;

window.tabs = [];
window.tab = 0;
window.closingTab = null;
window.tabToCloseAfterRun = null;

window.autoSaveTemp = null;

window.autoFindSync = false;

// C# 쪽에서 호출
function refreshTime(now) {
	if (time != now) {
		time = now;
		if (autoFindSync && tabs.length && tabs[tab]) {
			if (tabs[tab].hold < 0) {
				tabs[tab].assHold.findSync();
			} else {
				tabs[tab].holds[tabs[tab].hold].findSync();
			}
		}
	}
}
window.showFps = null;

window.Tab = function(text, path) {
	this.area = SmiEditor.tabPreset.clone();
	this.holdSelector = this.area.find(".hold-selector");
	this.holdArea = this.area.find(".holds");
	this.holds = [];
	this.hold = 0;
	this.lastHold = 1;
	this.path = path;
	
	const tab = this;
	
	{	const holds = SmiFile.textToHolds(text);
		{
			const hold = holds[0];
			if (hold.ass) {
				this.assFile = new AssFile(hold.ass);
			}
			hold.ass = [];
		}
		for (let i = 1; i < holds.length; i++) {
			holds[i].ass = [];
		}
		const assHold = tab.assHold = new SmiEditor();
		{
			assHold.isAssHold = true;
			
			this.holdSelector.append(assHold.selector = $("<div class='selector ass-only'>").data({ hold: assHold }));
			assHold.selector.append($("<div class='hold-name'>").append($("<span>").text("ASS 추가 스크립트")));
			assHold.selector.attr({ title: "ASS 추가 스크립트" });
			assHold.owner = this;
			
			assHold.area.empty().addClass("ass-hold");
			
			let form = $("<form>").addClass("tab-ass-area");
			assHold.area.append(form);
			
			let div = $("<div>").addClass("tab-ass-styles");
			div.append($("<span>").text("[V4+ Styles]"));
			div.append($("<textarea spellcheck='false' tabindex='-1'>"));
			form.append(div);
			
			div = $("<div>").addClass("tab-ass-script");
			div.append($("<span>").text("[Events] ").append($("<button type='button'>").text("＋")));
			const assEditorArea = $("<div>");
			div.append(assEditorArea);
			form.append(div);
			
			this.holdArea.append(assHold.area);
			
			assHold.assEditor = new AssEditor(assEditorArea);
			assHold.assEditor.onUpdate = function() {
				if (this.isSaved) {
					assHold.selector.removeClass("not-saved");
				} else {
					assHold.selector.addClass("not-saved");
				}
				tab.onChangeSaved();
			};
			tab.area.find("div.tab-ass-script button").on("click", function() {
				const sync = SmiEditor.getSyncTime("!"); // 가중치 없는 현재 싱크로 넣음
				assHold.assEditor.addEvents([ new AssEvent(sync, sync, name, "") ]);
			});
		}
		
		let frameSyncs = [];
		if (this.assFile) {
			const events = this.assFile.getEvents();
			/* 홀드별 ASS 에디터 구분은 혼란만 가중시키는 듯함
			const list = events.body;
			const appends = [];
			for (let i = 0; i < list.length; i++) {
				const item = list[i];
				if (item.Style == "Default") {
					holds[0].ass.push(item);
				} else {
					let found = false;
					for (let h = 1; h < holds.length; h++) {
						if (item.Style == holds[h].name) {
							holds[h].ass.push(item);
							found = true;
							break;
						}
					}
					if (!found) {
						appends.push(item);
					}
				}
			}
			events.body = appends;
			*/
			
			this.area.find(".tab-ass-styles textarea").val(this.assFile.getStyles().toText(false));
			
			const info = this.assFile.getInfo();
			if (info) {
				let strFrameSyncs = info.get("FrameSyncs");
				if (strFrameSyncs) {
					frameSyncs = strFrameSyncs.split(",");
					if (isFinite(frameSyncs[0])) {
						for (let i = 0; i < frameSyncs.length; i++) {
							frameSyncs[i] = Number(frameSyncs[i]);
						}
					}
				}
			}
			assHold.assEditor.setEvents(events.body, frameSyncs, true);
			assHold.assEditor.update();
		}
		
		holds[0].frameSyncs = frameSyncs;
		this.addHold(holds[0], true, true);
		for (let i = 1; i < holds.length; i++) {
			holds[i].frameSyncs = frameSyncs;
			this.addHold(holds[i], false, false);
		}
	}
	this.savedHolds = this.holds.slice(0);
	
	this.holdSelector.on("click", ".selector", function() {
		tab.selectHold($(this).data("hold"));
		
	}).on("dblclick", ".hold-name", function(e) {
		e.stopPropagation();
		$(this).parents(".selector").data("hold").rename();
		
	}).on("click", ".btn-hold-remove", function(e) {
		e.stopPropagation();
		const hold = $(this).parents(".selector").data("hold");
		confirm("삭제하시겠습니까?", () => {
			const index = tab.holds.indexOf(hold);
			
			if (tab.hold == index) {
				// 선택된 걸 삭제하는 경우 메인 홀드로 먼저 이동
				//tab.holds[0].selector.click();
				tab.selectHold(tab.holds[0]);
			} else if (tab.hold > index) {
				// 선택된 게 삭제 대상보다 뒤에 있을 경우 번호 당김
				tab.hold--;
			}
			
			tab.holds.splice(index, 1);
			hold.selector.remove();
			hold.area.remove();
			delete hold;
			
			tab.holdEdited = true;
			tab.updateHoldSelector();
			tab.onChangeSaved();
			SmiEditor.Viewer.refresh();
		});
		
	}).on("click", ".btn-hold-upper", function(e) {
		e.stopPropagation();
		const hold = $(this).parents(".selector").data("hold");
		if (hold.pos == -1) {
			hold.pos = 1;
		} else {
			hold.pos++;
		}
		tab.updateHoldSelector();
		hold.afterChangeSaved(hold.isSaved());
		SmiEditor.Viewer.refresh();
		
	}).on("click", ".btn-hold-lower", function(e) {
		e.stopPropagation();
		const hold = $(this).parents(".selector").data("hold");
		if (hold.pos == 1) {
			hold.pos = -1;
		} else {
			hold.pos--;
		}
		tab.updateHoldSelector();
		hold.afterChangeSaved(hold.isSaved());
		SmiEditor.Viewer.refresh();
	});
	
	this.area.on("click", ".btn-hold-style", function(e) {
		const hold = $(this).data("hold");
		hold.area.addClass("style");
	}).on("click", ".btn-hold-ass", function(e) {
		const hold = $(this).data("hold");
		hold.area.addClass("ass");
	});
};
window.getCurrentTab = function() {
	return tabs.length ? tabs[tab] : null;
}
Tab.prototype.addHold = function(info, isMain=false, asActive=true) {
	if (!info) {
		info = {
				name: "새 홀드"
			,	text: ""
			,	pos: 1
		}
	}
	const hold = new SmiEditor(info.text);
	this.holds.push(hold);
	this.holdSelector.append(hold.selector = $("<div class='selector'>").data({ hold: hold }));
	hold.selector.append($("<div class='hold-name'>").append($("<span>").text(hold.name = hold.savedName = info.name)));
	hold.selector.attr({ title: hold.name });
	hold.owner = this;
	hold.pos   = hold.savedPos   = info.pos;
	
	const style = hold.style = (info.style ? info.style : JSON.parse(JSON.stringify(DefaultStyle)));
	hold.savedStyle = SmiFile.toSaveStyle(style);
	hold.savedAss = hold.ass = info.ass;
	hold.tempSavedText = info.text;
	hold.updateTimeRange();
	
	if (isMain) {
		hold.area.addClass("main");
		hold.selector.addClass("main selected");
		const tab = this;
		hold.afterRender = function() {
			const match = /<sami( [^>]*)*>/gi.exec(this.text);
			if (match && match[1]) {
				const attrs = match[1].toUpperCase().split(" ");
				for (let i = 0; i < attrs.length; i++) {
					if (attrs[i] == "ASS") {
						if (!tab.withAss) {
							tab.withAss = true;
							tab.area.addClass("ass");
							tab.updateHoldSelector();
						}
						return;
					}
				}
			}
			tab.withAss = false;
			tab.area.removeClass("ass");
			tab.updateHoldSelector();
		}
		
	} else {
		const btnArea = $("<div class='area-btn-hold'>");
		hold.selector.append(btnArea);
		btnArea.append($("<button type='button' class='btn-hold-remove' title='삭제'>"));
		btnArea.append($("<button type='button' class='btn-hold-upper'  title='위로(Ctrl+Alt+↑)'>"));
		btnArea.append($("<button type='button' class='btn-hold-lower'  title='아래로(Ctrl+Alt+↓)'>"));
		// 홀드 생성 직후에 숨기면 스크롤바 렌더링이 문제 생김
		// 최초 로딩 시 메인 홀드만 보이는 상태에서 사용상 문제는 없음
		//hold.area.hide();
	}
	{
		hold.area.append($("<button type='button' class='btn-hold-style' title='홀드 공통 스타일 설정'>").text("스타일").data({ hold: hold }));
		hold.area.append($("<button type='button' class='btn-hold-ass' title='ASS 저장에만 쓰이는 추가 스크립트'>").text("ASS용").data({ hold: hold }));
		
		hold.area.append(hold.styleArea = $("<div class='hold-style-area'>"));
		{
			const area = SmiEditor.stylePreset.clone();
			hold.styleArea.append(area);
			
			const $preview = hold.$preview = area.find(".hold-style-preview");
			
			area.on("input propertychange", "input[type=text], input[type=color]", function () {
				let $input = $(this);
				if ($input.hasClass("hold-style-preview-color")) {
					$preview.css({ background: $input.val() });
					return;
				}
				if ($input.hasClass("color")) {
					const color = $input.val();
					if (color.startsWith("#") && color.length == 7) {
						if (isFinite("0x" + color.substring(1))) {
							$input = $input.prev().val(color);
						} else {
							return;
						}
					} else {
						return;
					}
				}
				let value = $input.val();
				if ($input.attr("type") == "color") {
					$input.next().val(value = value.toUpperCase());
				}
				const name = $input.attr("name");
				hold.style[name] = value;
				hold.refreshStyle();
				
			}).on("input propertychange", "input[type=number], input[type=range]", function () {
				const $input = $(this);
				const name = $input.attr("name");
				hold.style[name] = Number($input.val());
				hold.refreshStyle();
				
				
			}).on("change", "input[type=checkbox]", function () {
				const $input = $(this);
				const name = $input.attr("name");
				hold.style[name] = $input.prop("checked");
				hold.refreshStyle();
				
			}).on("change", "input[type=radio]", function () {
				const $input = $(this);
				hold.style[$input.attr("name")] = $input.val();
				hold.refreshStyle();
				
			}).on("keyup", function() {
				const $main = $preview.find(".hold-style-preview-main");
				const text = $main.text();
				$preview.find(".hold-style-preview-outline, .hold-style-preview-shadow").text(text);
				if ($main.children().length) $main.text(text);
			});
			$preview.find(".hold-style-preview-outline, .hold-style-preview-shadow").text($preview.find(".hold-style-preview-main").text());
			
			area.find(".btn-close-popup").on("click", function() {
				hold.area.removeClass("style");
				if (SmiEditor.Viewer.window) {
					SmiEditor.Viewer.refresh();
				}
			});
			
			hold.setStyle(style);
		}
	}
	
	this.holdArea.append(hold.area);
	this.updateHoldSelector();
	if (asActive) {
		this.selectHold(hold);
	}
	this.onChangeSaved();
}
SmiEditor.prototype.setStyle = function(style) {
	if (style.Fontname == "맑은 고딕") {
		style.Fontname = "";
	}
	this.style = style;
	const area = this.styleArea.find(".hold-style");
	
	area.find("input[name=PrimaryColour]").val(style.PrimaryColour).next().val(style.PrimaryColour);
	area.find("input[name=Italic]   ").prop("checked", style.Italic);
	area.find("input[name=Underline]").prop("checked", style.Underline);
	area.find("input[name=StrikeOut]").prop("checked", style.StrikeOut);

	area.find("input[name=Fontname]").val(style.Fontname);
	area.find("input[name=output][value=" + style.output + "]").click();
	area.find("input[name=Fontsize]").val(style.Fontsize);
	area.find("input[name=Bold]    ").prop("checked", style.Bold);
	area.find("input[name=SecondaryColour]").val(style.SecondaryColour).next().val(style.SecondaryColour);
	area.find("input[name=OutlineColour]  ").val(style.OutlineColour  ).next().val(style.OutlineColour  );
	area.find("input[name=BackColour]     ").val(style.BackColour     ).next().val(style.BackColour     );
	area.find("input[name=PrimaryOpacity]  ").val(style.PrimaryOpacity  );
	area.find("input[name=SecondaryOpacity]").val(style.SecondaryOpacity);
	area.find("input[name=OutlineOpacity]  ").val(style.OutlineOpacity  );
	area.find("input[name=BackOpacity]     ").val(style.BackOpacity     );
	area.find("input[name=ScaleX]     ").val(style.ScaleX     );
	area.find("input[name=ScaleY]     ").val(style.ScaleY     );
	area.find("input[name=Spacing]    ").val(style.Spacing    );
	area.find("input[name=Angle]      ").val(style.Angle      );
	area.find("input[name=BorderStyle]").prop("checked", style.BorderStyle);
	area.find("input[name=Outline]    ").val(style.Outline    );
	area.find("input[name=Shadow]     ").val(style.Shadow     );
	area.find("input[name=Alignment][value=" + style.Alignment + "]").click();
	area.find("input[name=MarginL]").val(style.MarginL);
	area.find("input[name=MarginR]").val(style.MarginR);
	area.find("input[name=MarginV]").val(style.MarginV);
	
	this.refreshStyle();
}
SmiEditor.prototype.refreshStyle = function() {
	const style = this.style;
	
	const css = {};
	css.fontFamily = style.Fontname ? (style.Fontname.startsWith("@") ? style.Fontname.substring(1) : style.Fontname) : "맑은 고딕";
	css.color = style.PrimaryColour + (256 + style.PrimaryOpacity).toString(16).substring(1);
	css.fontStyle = style.Italic ? "italic" : "";
	{	const deco = [];
		if (style.Underline) deco.push("underline");
		if (style.StrikeOut) deco.push("line-through");
		css.textDecoration = deco.join(" ");
	}
	css.fontSize = style.Fontsize + "px";
	css.fontWeight = style.Bold ? "bold" : "";
	
	css.transform = "scale(" + (style.ScaleX / 200) + "," + (style.ScaleY / 200) + ")";
	css.letterSpacing = (style.Fontsize * style.Spacing / 100) + "px";
	css.rotate = -style.Angle + "deg";
	
	this.$preview.find(".hold-style-preview-main").css(css);
	
	css["-webkit-text-stroke"] = (style.Outline * 3) + "px " + style.OutlineColour + (256 + style.OutlineOpacity).toString(16).substring(1);
	this.$preview.find(".hold-style-preview-outline").css(css);

	css.color = style.BackColour + (256 + style.BackOpacity).toString(16).substring(1);
	css["-webkit-text-stroke"] = (style.Outline * 3) + "px " + style.BackColour + (256 + style.BackOpacity).toString(16).substring(1);
	css.top = css.left = "calc(50% + " + style.Shadow + "px)";
	this.$preview.find(".hold-style-preview-shadow").css(css);
	
	this.afterChangeSaved(this.isSaved());
}

// TODO: 비홀드 ASS 에디터는 어떻게 동작하지...?

SmiEditor.prototype._historyForward = SmiEditor.prototype.historyForward;
SmiEditor.prototype.historyForward = function(e) {
	if (this.area.hasClass("style")
	 || this.area.hasClass("ass")) {
		// 스타일/ASS 편집기에선 기본 동작
		return;
	}
	this.history.forward();
}
SmiEditor.prototype._historyBack = SmiEditor.prototype.historyBack;
SmiEditor.prototype.historyBack = function(e) {
	if (this.area.hasClass("style")
	 || this.area.hasClass("ass")) {
		// 스타일/ASS 편집기에선 기본 동작
		return;
	}
	this.history.back();
}

SmiEditor.prototype._insertSync = SmiEditor.prototype.insertSync;
SmiEditor.prototype.insertSync = function(mode=0) {
	// 스타일 편집일 때 무시
	if (this.area.hasClass("style")) return;
	
	// ASS 편집일 때 동작
	if (this.isAssHold || this.area.hasClass("ass")) {
		// 선택된 객체 찾기
		const $item = $(document.activeElement).parents(".item");
		if (!$item.length) return;
		const item = $item.data("obj");
		if (!item) return;
		
		// 가중치 없는 싱크
		const sync = SmiEditor.getSyncTime("!", true);
		
		if (mode == 0) {
			item.inputStart.val(sync);
		} else {
			item.inputEnd.val(sync);
		}
		item.update();
		
		return;
	}
	
	// 일반 SMI 동작
	this._insertSync(mode);
}
SmiEditor.prototype._reSync = SmiEditor.prototype.reSync;
SmiEditor.prototype.reSync = function(sync, limitRange=false) {
	// 스타일 편집일 때 무시
	if (this.area.hasClass("style")) return;
	
	// ASS 편집일 때 동작
	if (this.isAssHold || this.area.hasClass("ass")) {
		console.log("ASS 편집일 때 동작");
		// TODO: ASS 에디터에 대해서만 동작?
		// 이거 자체를 쓸 일이 있나?
		alert("ASS 에디터에선 사용하실 수 없습니다.");
		return;
	}
	
	// 일반 SMI 동작
	if (!sync) {
		sync = SmiEditor.getSyncTime();
	}
	const originSync = this._reSync(sync, limitRange);
	if (!originSync) return;
	
	// ASS 에디터도 싱크 이동
	if (this.assEditor) {
		for (let i = 0; i < this.assEditor.syncs.length; i++) {
			const item = this.assEditor.syncs[i];
			const start = Number(item.inputStart.val());
			const end   = Number(item.inputEnd  .val());
			if (end >= originSync) {
				const add = sync - originSync
				item.inputEnd.val(end + add);
				if (start >= originSync) {
					item.inputStart.val(start + add);
				}
				item.update();
			}
		}
	}
}
SmiEditor.prototype._toggleSyncType = SmiEditor.prototype.toggleSyncType;
SmiEditor.prototype.toggleSyncType = function() {
	// 스타일 편집일 때 무시
	if (this.area.hasClass("style")) return;
	/*
	// ASS 편집일 때 무시
	if (this.area.hasClass("ass")) return;
	*/
	// SMI 에디터 동작
	this._toggleSyncType();
}
SmiEditor.prototype._moveToSync = SmiEditor.prototype.moveToSync;
SmiEditor.prototype.moveToSync = function(add=0) {
	// 스타일 편집일 때 무시
	if (this.area.hasClass("style")) return;
	
	// ASS 편집일 때 동작
	if (this.isAssHold) {
		// 선택된 객체 찾기
		const $item = $(document.activeElement).parents(".item");
		if (!$item.length) return;
		const item = $item.data("obj");
		if (!item) return;
		
		SmiEditor.PlayerAPI.play();
		SmiEditor.PlayerAPI.moveTo(Number(item.inputStart.val()) + add);
		
		return;
	}
	
	// SMI 에디터 동작
	this._moveToSync(add);
}
SmiEditor.prototype._getText = SmiEditor.prototype.getText;
SmiEditor.prototype.getText = function(forced) {
	if (!forced) {
		if (this.area.hasClass("style")
		 || this.area.hasClass("ass")) {
			alert("SMI 에디터 모드가 아닙니다.");
			throw new Error("SMI 에디터 모드 아님");
			return;
		}
	}
	return this._getText();
}
SmiEditor.prototype._setText = SmiEditor.prototype.setText;
SmiEditor.prototype.setText = function(text, selection) {
	if (this.area.hasClass("style")
	 || this.area.hasClass("ass")) {
		alert("SMI 에디터 모드가 아닙니다.");
		return;
	}
	this._setText(text, selection);
}
SmiEditor.prototype._getLine = SmiEditor.prototype.getLine;
SmiEditor.prototype.getLine = function() {
	if (this.area.hasClass("style")
	 || this.area.hasClass("ass")) {
		alert("SMI 에디터 모드가 아닙니다.");
		throw new Error("SMI 에디터 모드 아님");
		return;
	}
	return this._getLine();
}
SmiEditor.prototype._setLine = SmiEditor.prototype.setLine;
SmiEditor.prototype.setLine = function(text, selection) {
	if (this.area.hasClass("style")
	 || this.area.hasClass("ass")) {
		alert("SMI 에디터 모드가 아닙니다.");
		return;
	}
	this._setLine(text, selection);
}
SmiEditor.prototype._inputText = SmiEditor.prototype.inputText;
SmiEditor.prototype.inputText = function(text) {
	if (this.area.hasClass("style")
	 || this.area.hasClass("ass")) {
		alert("SMI 에디터 모드가 아닙니다.");
		return;
	}
	this._inputText(text);
}
SmiEditor.prototype._tagging = SmiEditor.prototype.tagging;
SmiEditor.prototype.tagging = function(input, standCursor) {
	if (this.area.hasClass("style")
	 || this.area.hasClass("ass")) {
		alert("SMI 에디터 모드가 아닙니다.");
		return;
	}
	this._tagging(input, standCursor);
}

Tab.prototype.updateHoldSelector = function() {
	if (!this.withAss && this.holds.length <= 1) {
		this.area.removeClass("with-hold");
		refreshPaddingBottom();
		return;
	}
	this.area.addClass("with-hold");
	refreshPaddingBottom();
	
	let BEGIN = 1;
	let END = -1;
	
	const timers = []; // 각 홀드의 시작/종료 시간을 정렬한 객체
	for (let i = 0; i < this.holds.length; i++) {
		const hold = this.holds[i];
		if (i > 0) {
			hold.selector.find(".hold-name span").text(i + "." + hold.name);
		}
		timers.push({ time: hold.start, holds: [{ index: i, type: BEGIN }] });
		timers.push({ time: hold.end  , holds: [{ index: i, type: END   }] });
	}
	timers[0].time = timers[0].rate = 0; // 메인 홀드는 시작 시간 0으로 출력
	timers.sort((a, b) => {
		if (a.time < b.time)
			return -1;
		if (a.time > b.time)
			return 1;
		return 0;
	});
	
	for (let i = 0; i < timers.length - 1; i++) {
		if (timers[i].time == timers[i+1].time) {
			timers[i].holds.push(timers[i+1].holds[0]);
			timers.splice(i + 1, 1);
			i--;
		}
	}
	
	let add = 0; // 홀드 시작/종료 위치 개수에 대한 추가 보정값
	{	const begins = []; // 각 홀드의 시작 위치를 기록한 객체
		for (let i= 0; i < timers.length; i++) {
			const timer = timers[i];
			
			for (let j = 0; j < timer.holds.length; j++) {
				if (timer.holds[j].type == END) {
					// 홀드 종료 위치가 시작 위치와 4칸 이상 떨어져야 함
					const min = begins[timer.holds[j].index] + 4;
					if (i + add < min) {
						// 4칸 안 될 경우 보정값에 추가
						add = min - i;
					}
				}
			}
			timer.rate = i + add;
			
			for (let j = 0; j < timer.holds.length; j++) {
				if (timer.holds[j].type == BEGIN) {
					// 현재 위치에서 시작하는 홀드 위치 기억
					begins[timer.holds[j].index] = timer.rate;
				}
			}
		}
	}
	
	const posStatus = {};
	for (let i = 0; i < timers.length; i++) {
		const timer = timers[i];
		const rate = (timer.rate / (timers.length + add - 1) * 100);
		for (let j = 0; j < timer.holds.length; j++) {
			const selector = timer.holds[j];
			const hold = this.holds[selector.index];
			if (selector.type == BEGIN) {
				// 홀드 시작
				hold.selector.css({ left: rate + "%" });
				
				// 홀드끼리 영역 겹칠 경우 보완 필요
				let pos = hold.pos;
				if (pos > 0) {
					while (posStatus[pos] && posStatus[pos].length) {
						posStatus[pos++].push(hold);
					}
				} else {
					while (posStatus[pos] && posStatus[pos].length) {
						posStatus[pos--].push(hold);
					}
				}
				posStatus[pos] = [hold];
				hold.viewPos = pos;
				
				let top = 30;
				if (pos > 0) {
					for (let k = 0; k < pos; k++) {
						top /= 2;
					}
				} else if (hold.pos < 0) {
					for (let k = 0; k < -pos; k++) {
						top /= 2;
					}
					top = 60 - top;
				}
				hold.selector.css({ top: top + "%" });
				
			} else {
				// 홀드 끝
				hold.selector.css({ right: (100 - rate) + "%" });
				
				// 홀드 위치 사용 중 해제
				for (let pos in posStatus) {
					const posHolds = posStatus[pos];
					const index = posHolds.indexOf(hold);
					if (index >= 0) {
						posHolds.splice(index, 1);
					}
				}
			}
		}
	}
}
Tab.prototype.selectHold = function(hold) {
	let index = hold;
	if (isFinite(hold)) {
		if (this.withAss && hold < 0) {
			hold = this.assHold;
		} else if (!(hold = this.holds[hold])) {
			return;
		}
	} else {
		index = this.holds.indexOf(hold);
	}
	SmiEditor.selected = hold;

	this.holdSelector.find(".selector").removeClass("selected");
	this.holdArea.find(".hold").hide();
	hold.selector.addClass("selected");
	hold.area.show();
	hold.input.focus().scroll();
	if ((this.hold = index) != 0) {
		this.lastHold = this.hold;
	}
	SmiEditor.Viewer.refresh();
}
Tab.prototype.selectLastHold = function() {
	if (this.holds.length == 0) {
		return;
	}
	if (this.hold != 0) {
		this.selectHold(0);
		return;
	}
	if (this.lastHold < 0) {
		this.selectHold(-1);
		return;
	}
	if (this.lastHold && this.holds[this.lastHold]) {
		this.selectHold(this.lastHold);
	} else {
		this.selectHold(1);
	}
}
Tab.prototype.replaceBeforeSave = function() {
	for (let i = 0; i < this.holds.length; i++) {
		let text = this.holds[i].input.val(); // .text 동기화 실패 가능성 고려, 현재 값 다시 불러옴
		let changed = false;
		
		// 커서 기준 3개로 나눠서 치환
		let cursor = this.holds[i].getCursor();
		text = [text.substring(0, cursor[0]), text.substring(cursor[0], cursor[1]), text.substring(cursor[1])];
		for (let j = 0; j < setting.replace.length; j++) {
			const item = setting.replace[j];
			if (item.use) {
				if (text[0].indexOf(item.from) >= 0) { text[0] = text[0].split(item.from).join(item.to); changed = true; }
				if (text[1].indexOf(item.from) >= 0) { text[1] = text[1].split(item.from).join(item.to); changed = true; }
				if (text[2].indexOf(item.from) >= 0) { text[2] = text[2].split(item.from).join(item.to); changed = true; }
			}
		}
		cursor = [text[0].length, text[0].length + text[1].length];
		
		if (text[0].length > 0 && text[1].length > 0) {
			// 시작 커서 전후 치환
			text = [text[0] + text[1], text[2]];
			for (let j = 0; j < setting.replace.length; j++) {
				const item = setting.replace[j];
				if (item.use) {
					const index = text[0].indexOf(item.from);
					if (index >= 0) {
						text[0] = text[0].split(item.from).join(item.to);
						cursor[0] = index + item.to.length;
						cursor[1] += item.to.length - item.from.length;
						changed = true;
					}
				}
			}
		} else {
			text = [text[0] + text[1], text[2]];
		}
		
		// 종료 커서 전후 치환
		if (text[1].length > 0) {
			text = text[0] + text[1];
			for (let j = 0; j < setting.replace.length; j++) {
				const item = setting.replace[j];
				if (item.use) {
					const index = text.indexOf(item.from);
					if (index >= 0) {
						text = text.split(item.from).join(item.to);
						cursor[1] = index;
						changed = true;
					}
				}
			}
		} else {
			text = text[0];
		}
		
		// 바뀐 게 있으면 적용
		if (changed) {
			this.holds[i].setText(text, cursor);
		}
	}
}
Tab.prototype.getAdditioinalToAss = function(forSmi=false) {
	const assFile = this.assFile ? this.assFile : new AssFile();
	
	let frameSyncs = [];
	{
		let syncs = this.assHold.assEditor.getFrameSyncs();
		/*
		for (let h = 0; h < this.holds.length; h++) {
			const hold = this.holds[h];
			syncs.push(...hold.assEditor.getFrameSyncs());
		}
		*/
		// 정렬
		syncs.sort((a, b) =>  {
			if (a < b) {
				return -1;
			} else if (a > b) {
				return 1;
			}
			return 0;
		});

		// 중복 제외 후 출력
		let last = null;
		for (let i = 0; i < syncs.length; i++) {
			const sync = syncs[i];
			if (last == sync) {
				continue;
			}
			frameSyncs.push(last = sync);
		}
	}
	let videoPath = Subtitle.video.path;
	if (videoPath && this.path) {
		// 상대경로로 바꿔줌
		videoPath = videoPath.split("/").join("\\").split("\\");
		let smiPath = this.path.split("/").join("\\").split("\\");
		let i = 0;
		for (; i < videoPath.length && smiPath.length; i++) {
			if (videoPath[i] != smiPath[i]) {
				break;
			}
		}
		videoPath = videoPath.slice(i).join("\\");
		for (; i < smiPath.length - 1; i++) {
			videoPath = "..\\" + videoPath;
		}
	}
	const info = assFile.getInfo();
	info.set("VideoInfo", videoPath);
	info.set("FrameSyncs", frameSyncs.join(","));
	
	let styles = this.area.find(".tab-ass-styles textarea").val();
	if (styles.trim().length) {
		styles = styles.split("\n");
		const part = assFile.getStyles();
		part.body.length = 0;
		for (let i = 0; i < styles.length; i++) {
			let style = styles[i].split(":");
			if (style.length > 1) {
				const cols = style[1].trim().split(",");
				if (cols.length >= AssPart.StylesFormat.length) {
					style = { key: "Style", Encoding: 1 };
					for (let j = 0; j < AssPart.StylesFormat.length; j++) {
						style[AssPart.StylesFormat[j]] = cols[j];
					}
					part.body.push(style);
				}
			}
		}
	} else {
		assFile.getStyles().length = 0;
	}
	
	let events = this.assHold.assEditor.toEvents();
	assFile.getEvents().body = events;
	
	if (forSmi) {
		if (this.assFile || styles.length || events.length) {
			return "\n<!-- ASS\n" + assFile.toText() + "\n-->";
		} else {
			return "";
		}
		
	} else {
		return assFile;
	}
}
Tab.prototype.getSaveText = function(withCombine=true, withComment=true) {
	return SmiFile.holdsToText(this.holds, setting.saveWithNormalize, withCombine, withComment, Subtitle.video.FR / 1000)
		+ this.getAdditioinalToAss(true); // ASS 추가 내용 footer에 넣어주기
}
Tab.prototype.onChangeSaved = function(hold) {
	if (this.isSaved()) {
		this.area.removeClass("tmp-saved").removeClass("not-saved");
		for (let i = 0; i < this.holds.length; i++) {
			this.holds[i].selector.removeClass("not-saved");
		}
		this.assHold.selector.removeClass("not-saved");
	} else {
		this.area.removeClass("tmp-saved").addClass("not-saved");
	}
	
	if (hold) {
		// 홀드 수정에 따른 갱신
		hold.updateTimeRange();
		this.updateHoldSelector();
	}
}
Tab.prototype.isSaved = function() {
	if (this.savedHolds && (this.savedHolds.length != this.holds.length)) {
		return false;
	}
	
	for (let i = 0; i < this.holds.length; i++) {
		if (!this.holds[i].isSaved()) {
			return false;
		}
	}
	return this.assHold.assEditor.isSaved;
}

Tab.prototype.toAss = function(orderByEndSync=false) {
	const assFile = new AssFile(null, Subtitle.video.width, Subtitle.video.height);
	const assStyles = assFile.getStyles();
	const assEvents = assFile.getEvents();
	
	// 스타일/이벤트는 뺐다가 뒤쪽에 다시 추가
	assFile.parts.length = 1;
	const append = this.getAdditioinalToAss();
	for (let i = 0; i < append.parts.length; i++) {
		switch (append.parts[i].name) {
			case "Script Info":
			case "V4+ Styles":
			case "Events":
				break;
			default: {
				assFile.parts.push(append.parts[i]);
			}
		}
	}
	assFile.parts.push(assStyles);
	assFile.parts.push(assEvents);
	
	// ASS에서 추가한 내용 먼저 추가
	const appendedLength = append.getEvents().body.length;
	assEvents.body.push(...append.getEvents().body);
	
	const holds = this.holds;
	const syncs = [];
	const styles = {};
	for (let h = 0; h < holds.length; h++) {
		const hold = holds[h];
		const name = (h == 0) ? "Default" : hold.name;
		const style = hold.style ? hold.style : DefaultStyle;
		
		if ((style.output & 0b10) == 0) {
			// ASS 변환 대상 제외
			syncs.push([]);
			hold.smiFile = null;
			continue;
		}

		if (styles[name]) {
			// 이미 추가함
		} else {
			assFile.addStyle(name, style, hold);
			styles[name] = style;
		}
		
		hold.smiFile = new SmiFile(hold.text);
		const smis = hold.smiFile.body;
		
		const assComments = []; // ASS 주석에서 복원한 목록
		const toAssEnds = {};
		for (let i = 0; i < smis.length; i++) {
			const smi = smis[i];
			{	// 앞에서 나온 ASS 형태에 종료싱크 채워주기
				const toAssEnd = toAssEnds[i];
				if (toAssEnd) {
					for (let j = 0; j < toAssEnd.length; j++) {
						toAssEnd[j][2] += smi.start;
					}
				}
			}
			
			let assTexts = [];
			if (smi.text.startsWith("<!-- ASS X -->")) {
				// ASS 변환 대상 제외
				smi.text = smi.text.substring(14).trim();
				smi.skip = true;
				
			} else if (smi.text.startsWith("<!-- ASS\n")) {
				// 원래 ASS 변환용 주석이 있었을 경우 삭제
				const commentEnd = smi.text.indexOf("\n-->"); // "\n-->\n"으로 할 경우, SMI 내용물이 아예 없는 경우 못 잡아냄
				if (commentEnd > 0) {
					assTexts = smi.text.substring(9, commentEnd).split("\n");
					smi.text = smi.text.substring(commentEnd + 4).trim();
					if (assTexts[assTexts.length - 1] == "END") {
						// ASS 변환 대상 제외
						assTexts.length = assTexts.length - 1;
						smi.skip = true;
					}
				}
			}
			
			// ASS 주석에 [SMI] 있을 경우 넣을 내용물
			const smiText = Subtitle.$tmp.html(smi.text).text().split("\n").join("\\N");
			
			// ASS 주석에서 복원
			for (let j = 0; j < assTexts.length; j++) {
				let ass = assTexts[j].split("[SMI]").join(smiText).split(",");
				
				if (isFinite(ass[0])) {
					let type = null;
					if (ass.length >= 5) {
						if (ass[1] == "") { // span 형식
							type = "span";
							const span = (ass[2] != "" && isFinite(ass[2])) ? Number(ass[2]) : 1;
							ass = [0, smi.start, 0, (ass[3] ? ass[3] : name), ass.slice(4).join(","), smi];
							let toAssEnd = toAssEnds[i + span];
							if (toAssEnd == null) {
								toAssEnd = toAssEnds[i + span] = [];
							}
							toAssEnd.push(ass);
							assComments.push(ass);
							
						} else if (isFinite(ass[1])) { // add 형식
							type = "add";
							const addStart = Number(ass[1]);
							const addEnd = isFinite(ass[2]) ? Number(ass[2]) : addStart;
							ass = [0, smi.start + addStart, addEnd, (ass[3] ? ass[3] : name), ass.slice(4).join(","), smi];
							let toAssEnd = toAssEnds[i + 1];
							if (toAssEnd == null) {
								toAssEnd = toAssEnds[i + 1] = [];
							}
							toAssEnd.push(ass);
							assComments.push(ass);
						}
					}
					if (!type) {
						// 싱크 변형 없이 스타일이 나오는 형식
						ass = [0, smi.start, 0, ass[1], ass.slice(2).join(","), smi];
						let toAssEnd = toAssEnds[i + 1];
						if (toAssEnd == null) {
							toAssEnd = toAssEnds[i + 1] = [];
						}
						toAssEnd.push(ass);
						assComments.push(ass);
					}
				} else {
					// 텍스트만 입력
					ass = [0, smi.start, 0, name, ass.join(","), smi];
					let toAssEnd = toAssEnds[i + 1];
					if (toAssEnd == null) {
						toAssEnd = toAssEnds[i + 1] = [];
					}
					toAssEnd.push(ass);
					assComments.push(ass);
				}
			}
		}
		
		for (let i = 0; i < assComments.length; i++) {
			const item = assComments[i];
			const event = new AssEvent(item[1], item[2], item[3], item[4], item[0]);
			event.owner = item[5];
			assEvents.body.push(event);
		}
		
		syncs.push(hold.syncs = hold.smiFile.toSyncs());
	}
	{	// 홀드 결합 pos 자동 조정 재개발
		
		// 정렬 위치가 중앙 하단인 것들만 모음
		const an2Holds = [];
		for (let h = 0; h < holds.length; h++) {
			const hold = holds[h];
			if (hold.style && hold.style.Alignment != 2) continue;
			an2Holds.push(hold);
		}
		// 아래인 것부터 정렬
		an2Holds.sort((a, b) => {
			return a.pos - b.pos;
		});
		
		if (an2Holds.length > 1) {
			const usedLines = []; // 각 싱크에 사용된 줄 수
			for (let h = 0; h < an2Holds.length; h++) {
				const hold = an2Holds[h];
				for (let i = 0; i < hold.syncs.length; i++) {
					const sync = hold.syncs[i];
					const usedLine = { start: sync.start, used: 0 };
					const newItems = [usedLine];
					
					// 이미 확인된 줄과 비교
					let j = 0
					for (; j < usedLines.length; j++) {
						if (sync.start == usedLines[j].start) {
							usedLine.used = usedLines[j].used;
							break;
						} else if (sync.start < usedLines[j].start) {
							usedLine.used = (j > 0) ? usedLines[j - 1].used : 0;
							break;
						}
					}
					let k = j;
					if (k < usedLines.length) {
						for (; k < usedLines.length; k++) {
							if (sync.end == usedLines[k].start) {
								break;
							} else if (sync.end < usedLines[k].start) {
								newItems.push({
										start: sync.end
									,	used: (k > 0) ? usedLines[k - 1].used : 0
								});
								break;
							}
							usedLine.used = Math.max(usedLine.used, usedLines[k].used);
						}
					} else {
						newItems.push({ start: sync.end, used: 0 });
					}
					
					sync.bottom = usedLine.used;
					usedLine.used += sync.getTextOnly().split("\n").length;
					
					newItems.push(...usedLines.slice(k));
					usedLines.length = j;
					usedLines.push(...newItems);
				}
			}
		}
	}
	for (let h = 1; h < holds.length; h++) {
		assFile.addFromSyncs(syncs[h], holds[h].name);
	}
	// 메인 홀드를 마지막에 추가
	assFile.addFromSync(syncs[0], "Default");
	
	// 홀드에 없는 스타일 추가
	assStyles.body.push(...append.getStyles().body);
	
	const eventsBody = assFile.getEvents().body;
	{	// ASS 자막은 SMI와 싱크 타이밍이 미묘하게 달라서 보정 필요
		if (SmiEditor.sync && SmiEditor.sync.frame) {
			if (Subtitle.video.fs.length) {
				for (let i = appendedLength; i < eventsBody.length; i++) {
					const item = eventsBody[i];
					item.Start = AssEvent.toAssTime((item.start = Subtitle.findSync(item.start)) - 15);
					item.End   = AssEvent.toAssTime((item.end   = Subtitle.findSync(item.end  )) - 15);
				}
			} else {
				const FL = Subtitle.video.FL;
				for (let i = appendedLength; i < eventsBody.length; i++) {
					const item = eventsBody[i];
					item.Start = Math.max(1, ((Math.round(item.start / FL) - 0.5) * FL) - 15);
					item.End   = Math.max(1, ((Math.round(item.end   / FL) - 0.5) * FL) - 15);
				}
			}
		}
		
		for (let i = 0; i < eventsBody.length; i++) {
			eventsBody[i].clearEnds();
		}
	}

	// 원래의 스크립트 순서를 기준으로, 시간이 겹치는 걸 기준으로 레이어 재부여
	let forLayers = [];
	for (let i = 0; i < eventsBody.length; i++) {
		let item = eventsBody[i];
		let forLayer = forLayers[item.Layer];
		if (!forLayer) {
			forLayers[item.Layer] = forLayer = [];
		}
		forLayer.push(item);
	}
	let checkeds = [];
	for (let l = 0; l < forLayers.length; l++) {
		let forLayer = forLayers[l];
		if (!forLayer) continue;
		for (let i = 0; i < forLayer.length; i++) {
			const item = forLayer[i];
			let maxLayer = -1;
			for (let j = 0; j < checkeds.length; j++) {
				const checked = checkeds[j];
				if (item.start < checked.end && checked.start < item.end) {
					maxLayer = Math.max(maxLayer, checked.Layer);
				}
			}
			item.Layer = maxLayer + 1;
			checkeds.push(item);
		}
	}
	
	// TODO: ASS 에디터에 레이어 재계산치 반영 가능한가...?
	
	if (orderByEndSync) {
		// 레이어 보장된 상태에서 종료싱크까지 정렬
		eventsBody.sort((a, b) => {
			let cmp = a.start - b.start;
			if (cmp == 0) {
				cmp = a.end - b.end;
			}
			return cmp;
		});
	} else {
		// 저장 시엔 레이어 순으로 정렬
		eventsBody.sort((a, b) => {
			let cmp = a.start - b.start;
			if (cmp == 0) {
				cmp = a.Layer - b.Layer;
			}
			return cmp;
		});
	}
	return assFile;
}

SmiEditor.prototype.isSaved = function() {
	if (this.isAssHold) {
		return this.assEditor.isSaved;
	} else {
		return (this.savedName  == this.name )
			&& (this.savedPos   == this.pos  )
			&& (this.savedStyle == SmiFile.toSaveStyle(this.style))
			&& (this.saved == this.input.val()
		);
	}
};
SmiEditor.prototype.onChangeSaved = function(saved) {
	// 홀드 저장 여부 표시
	if (this.selector) {
		if (saved) {
			this.selector.removeClass("not-saved");
		} else {
			this.selector.addClass("not-saved");
		}
	}
	
	// 수정될 수 있는 건 열려있는 탭이므로
	if (!tabs.length) return;
	const currentTab = tabs[tab];
	if (!currentTab) return;
	currentTab.onChangeSaved(this);
};
SmiEditor.prototype.rename = function() {
	if (this == this.owner.holds[0]) {
		// 메인 홀드는 이름 변경 X
		return;
	}
	const hold = this;
	prompt("홀드 이름 변경", (input) => {
		if (!input) {
			alert("잘못된 입력입니다.");
			return;
		}
		if (input.indexOf("|") >= 0 || input.indexOf(",") >= 0) {
			alert("구분자는 입력할 수 없습니다.");
			return;
		}
		if (isFinite(input)) {
			alert("숫자만 입력할 순 없습니다.");
			return;
		}
		if (input == "메인"
		 || input == "Default"
		) {
			alert("예약어입니다.");
			return;
		}
		hold.selector.find(".hold-name > span").text(hold.owner.holds.indexOf(hold) + "." + (hold.name = input));
		hold.selector.attr({ title: hold.name });
		hold.afterChangeSaved(hold.isSaved());
	}, hold.name);
}
SmiEditor.selectTab = function(index=-1) {
	const tabSelector = $("#tabSelector");
	if (index < 0) {
		const selectedTab = tabSelector.find(".selected").data("tab");
		if (selectedTab) {
			// 다음 탭 선택
			index = (tabs.indexOf(selectedTab) + 1) % tabs.length;
		} else {
			index = 0;
		}
	}
	
	const currentTab = tabs[tab = index];
	tabSelector.find(".selected").removeClass("selected");
	$(currentTab.th).addClass("selected").data("tab");
	
	$("#editor > .tab").hide();
	currentTab.area.show();
	if (_for_video_) { // 동영상 파일명으로 자막 파일을 연 경우 동영상 열기 불필요
		_for_video_ = false;
	} else if (currentTab.path && currentTab.path.length > 4 && binder) {
		binder.checkLoadVideoFile(currentTab.path);
	}
	SmiEditor.selected = currentTab.holds[currentTab.hold];
	SmiEditor.Viewer.refresh();
	SmiEditor.selected.input.focus();
	
	// 탭에 따라 홀드 여부 다를 수 있음
	refreshPaddingBottom();
}

function deepCopyObj(obj) {
	if (obj && typeof obj == "object") {
		if (Array.isArray(obj)) {
			return JSON.parse(JSON.stringify(obj));
		}
		
		const out = {};
		for (let key in obj) {
			out[key] = deepCopyObj(obj[key]);
		}
		return out;
		
	} else {
		return obj;
	}
}
function setDefault(target, dflt) {
	let count = 0; // 변동 개수... 쓸 일이 있으려나?
	for (let key in dflt) {
		if (typeof dflt[key] == "object") {
			if (Array.isArray(dflt[key])) {
				// 기본값이 배열
				if (Array.isArray(target[key])) {
					// 배열끼리는 덮어쓰지 않고 유지
				} else {
					// 기존에 배열이 아니었으면 오류로 간주
					target[key] = JSON.parse(JSON.stringify(dflt[key]));
					count++;
				}
			} else {
				// 기본값이 객체
				if (target[key] && (typeof target[key] == "object") && !Array.isArray(target[key])) {
					// 객체에서 객체로 기본값 복사
					count += setDefault(target[key], dflt[key]);
				} else {
					// 기존에 객체가 아니었으면 오류로 간주
					target[key] = deepCopyObj(dflt[key]);
					count++;
				}
			}
		} else {
			// 기본값이 기본형
			if (target[key] != null) {
				// 기존에 값 있으면 유지
			} else {
				// 기본값 복사
				target[key] = dflt[key];
				count++;
			}
		}
	}
	return count;
}

// C# 쪽에서 호출
function init(jsonSetting, isBackup=true) {
	{
		const tabPreset = $("#tabPreset");
		SmiEditor.tabPreset = tabPreset.clone();
		SmiEditor.tabPreset.attr({ id: null });
		tabPreset.remove();
		
		const holdStylePreset = $("#holdStylePreset");
		SmiEditor.stylePreset = holdStylePreset.clone();
		SmiEditor.stylePreset.attr({ id: null });
		holdStylePreset.remove();
		
		const holdAssPreset = $("#holdAssPreset");
		SmiEditor.assPreset = holdAssPreset.clone();
		SmiEditor.assPreset.attr({ id: null });
		holdAssPreset.remove();
	}
	
	try {
		setting = JSON.parse(jsonSetting);
		if (typeof setting != "object") {
			if (!isBackup) {
				binder.repairSetting();
				return;
			}
		}
		
		const notified = checkVersion(setting.version);
		
		if (notified.style) {
			// 스타일 기본값이 바뀌었을 경우
			const css = setting.viewer.css.split("/*");
			
			// 주석 분리
			css[0] = [null, css[0]];
			for (let i = 1; i < css.length; i++) {
				const aCss = css[i].split("*/");
				css[i] = [aCss[0], aCss.slice(1).join("*/")];
			}
			
			// 내용 중 font-size 있으면 주석 처리
			for (let i = 0; i < css.length; i++) {
				const aCss =  css[i][1];
				const begin = aCss.indexOf("font-size");
				if (begin >= 0) {
					let end = aCss.indexOf(";", begin);
					if (end < 0) {
						end = aCss.length;
					} else {
						end++;
					}
					
					css[i][1] = aCss.substring(0, begin) + "/* " + aCss.substring(begin, end) + " font-size 비활성화 */" + aCss.substring(end);
				}
				css[i] = (css[i][0] ? ("/* " + css[i][0] + " */") : "") + css[i][1];
			}
			
			setting.viewer.css = css.join("");
		}
		
		// C#에서 보내준 세팅값 오류로 빠진 게 있으면 채워주기
		if (!Array.isArray(setting)) {
			let count = setDefault(setting, DEFAULT_SETTING);
			if (setting.version != DEFAULT_SETTING.version) {
				setting.version = DEFAULT_SETTING.version;
				count++;
				
				if (notified.menu) {
					// 메뉴 기본값이 바뀌었을 경우
					
					for (let di = 0; di < DEFAULT_SETTING.menu.length; di++) {
						let exist0 = false;
						
						const dMenu = DEFAULT_SETTING.menu[di];
						const dMenu0 = dMenu[0];
						const dMenu0name = dMenu0.split("(&")[0];
						
						for (let si = 0; si < setting.menu.length; si++) {
							const sMenu = setting.menu[si];
							const sMenu0 = sMenu[0];
							const sMenu0name = sMenu0.split("(&")[0];
							
							if (sMenu0name == dMenu0name) {
								// 이름이 같은 메뉴를 찾았을 경우
								exist0 = true;
								
								if (sMenu0.indexOf("(&") < 0 && dMenu0.indexOf("(&") > 0) {
									// 단축키가 추가된 경우
									sMenu[0] = dMenu0;
									count++;
								}
								
								for (let dj = 1; dj < dMenu.length; dj++) {
									let exist1 = false;
									
									const dMenu1 = dMenu[dj];
									const dMenu1name = dMenu1.split("|")[0].split("(&")[0];
									
									for (let sj = 1; sj < sMenu.length; sj++) {
										const sMenu1 = sMenu[sj];
										const sMenu1name = sMenu1.split("|")[0].split("(&")[0];
										
										if (sMenu1name == dMenu1name) {
											// 이름이 같은 메뉴를 찾았을 경우
											exist1 = true;
											let updated = false;
											
											const sLen = sMenu1.indexOf("|");
											const dLen = dMenu1.indexOf("|");
											let sMenuName = sMenu1.substring(0, sLen);
											let dMenuName = dMenu1.substring(0, dLen);
											if (sMenuName.indexOf("(&") < 0 && dMenuName.indexOf("(&") > 0) {
												// 단축키가 추가된 경우
												sMenuName = dMenuName;
												updated = true;
											}
											
											let sMenuFunc = sMenu1.substring(sLen + 1);
											let dMenuFunc = dMenu1.substring(dLen + 1);
											if (sMenuFunc != dMenuFunc) {
												// 기능이 바뀐 경우
												sMenuFunc = dMenuFunc + " /* " + DEFAULT_SETTING.version + " 이전: " + sMenuFunc.split("*/").join("*​/") + " */";
												updated = true;
											}
											if (updated) {
												sMenu[sj] = sMenuName + "|" + sMenuFunc;
												count++;
											}
											
											break;
										}
									}
									if (!exist1) {
										// 이름이 같은 메뉴를 못 찾았을 경우 - 메뉴 추가
										sMenu.push(dMenu1);
										count++;
									}
								}
								
								break;
							}
						}
						if (!exist0) {
							// 이름이 같은 메뉴를 못 찾았을 경우 - 메뉴 추가
							setting.menu.push(dMenu);
							count++;
						}
					}
				}
			}
			if (count) {
				saveSetting();
			}
		} else {
			setting = deepCopyObj(DEFAULT_SETTING);
			saveSetting();
		}
		
	} catch (e) {
		console.log(e);
		
		if (!isBackup) {
			binder.repairSetting();
			return;
		}
		
		setting = deepCopyObj(DEFAULT_SETTING);
		saveSetting();
	}
	
	const btnAddHold = $("#btnAddHold").on("click", function() {
		if (tabs.length == 0) return;
		tabs[tab].addHold();
	});
	const inputWeight = $("#inputWeight").on("input propertychange", function() {
		const weight = inputWeight.val();
		if (isFinite(weight)) {
			SmiEditor.sync.weight = setting.sync.weight = Number(weight);
		} else {
			alert("숫자를 입력하세요.");
			const cursor = inputWeight[0].selectionEnd - 1;
			inputWeight.val(SmiEditor.sync.weight);
			inputWeight[0].setSelectionRange(cursor, cursor);
		}
	});
	const inputUnit = $("#inputUnit").on("input propertychange", function() {
		const unit = inputUnit.val();
		if (isFinite(unit)) {
			SmiEditor.sync.unit = setting.sync.unit = Number(unit);
		} else {
			alert("숫자를 입력하세요.");
			const cursor = inputUnit[0].selectionEnd - 1;
			inputUnit.val(SmiEditor.sync.unit);
			inputUnit[0].setSelectionRange(cursor, cursor);
		}
	});
	const btnMoveToBack = $("#btnMoveToBack").on("click", function() {
		if (tabs.length == 0) return;
		tabs[tab].holds[tabs[tab].hold].moveSync(false);
		tabs[tab].holds[tabs[tab].hold].input.focus();
	});
	const btnMoveToForward = $("#btnMoveToForward").on("click", function() {
		if (tabs.length == 0) return;
		tabs[tab].holds[tabs[tab].hold].moveSync(true);
		tabs[tab].holds[tabs[tab].hold].input.focus();
	});
	
	const checkAutoFindSync = $("#checkAutoFindSync").on("click", function() {
		autoFindSync = $(this).prop("checked");
		if (tabs.length == 0) return;
		tabs[tab].holds[tabs[tab].hold].input.focus();
	});
	const checkTrustKeyframe = $("#checkTrustKeyframe").on("click", function() {
		if (SmiEditor.trustKeyFrame = $(this).prop("checked")) {
			$("#editor").addClass("trust-keyframe");
		} else {
			$("#editor").removeClass("trust-keyframe");
		}
		if (tabs.length == 0) return;
	});
	
	const btnNewTab = $("#btnNewTab").on("click", function() {
		openNewTab();
	});
	
	const tabSelector = $("#tabSelector").on("click", ".th:not(#btnNewTab)", function() {
		const th = $(this);
		if (th[0] == closingTab) {
			return;
		}
		
		const currentTab = th.data("tab");
		if (currentTab) {
			SmiEditor.selectTab(tabs.indexOf(currentTab));
		}
		
	}).on("click", ".btn-close-tab", function(e) {
		e.preventDefault();
		
		const th = $(this).parent();
		closingTab = th[0]; // 탭 선택 이벤트 방지... e.preventDefault()로 안 되네...
		
		let saved = true;
		{	const currentTab = th.data("tab");
			for (let i = 0; i < currentTab.holds.length; i++) {
				if (currentTab.holds[i].input.val() != currentTab.holds[i].saved) {
					saved = false;
					break;
				}
			}
		}
		confirm((!saved ? "저장되지 않았습니다.\n" : "") + "탭을 닫으시겠습니까?", () => {
			const index = closeTab(th);

			setTimeout(() => {
				if (tabs.length) {
					if ($("#tabSelector .th.selected").length == 0) {
						// 선택돼있던 탭을 닫았을 경우 다른 탭 선택
						tab = Math.min(index, tabs.length - 1);
					} else {
						// 비활성 탭을 닫았을 경우
						if (index < tab) {
							// 닫힌 탭보다 뒤면 1씩 당겨서 재선택
							tab--;
						}
					}
					$("#tabSelector .th:eq(" + tab + ")").click();
				}
				closingTab = null;
			}, 1);
			
		}, () => {
			setTimeout(() => {
				closingTab = null;
			}, 1);
		});
	});

	$("#editor").on("click", "button.tab-ass-btn", function() {
		const $btn = $(this);
		const $tab = $btn.parents(".tab");
		const currentTab = tabs[tab];
		if ($tab.hasClass("edit-ass")) {
			$tab.removeClass("edit-ass");
			SmiEditor.selected = currentTab.holds[currentTab.hold];
		} else {
			$tab.addClass("edit-ass");
			(SmiEditor.selected = currentTab.assHold).input.focus();
		}
	});
	
	// ::-webkit-scrollbar에 대해 CefSharp에서 커서 모양이 안 바뀜
	// ... 라이브러리 버그? 업데이트하면 달라지나?
	$("body").on("mousemove", "textarea", function(e) {
		$(this).css({ cursor: ((this.clientWidth <= e.offsetX) || (this.clientHeight <= e.offsetY) ? "default" : "text") });
	});
	
	SmiEditor.activateKeyEvent();

	// Win+방향키 이벤트 직후 창 위치 초기화
	const winKeyStatus = [false, false];
	$(window).on("keydown", function (e) {
		if (e.keyCode == 91 || e.keyCode == 92) {
			// WinKey 최우선 처리
			winKeyStatus[e.keyCode - 91] = true;
			return;
		}
		if (e.keyCode == 27) { // ESC
			if (SmiEditor.selected) {
				const hold = SmiEditor.selected;
				if (hold.styleArea) {
					// 일반 SMI 홀드
					if (hold.area.hasClass("style")) {
						hold.area.removeClass("style");
						if (SmiEditor.Viewer.window) {
							SmiEditor.Viewer.refresh();
						}
					} else if (hold.area.hasClass("ass")) {
						hold.area.removeClass("ass");
					}
				} else {
					// ASS 추가 편집 전용 홀드
					tabs[tab].area.find("button.tab-ass-btn").click();
				}
			}
		}
	}).on("keyup", function (e) {
		if (winKeyStatus[0] || winKeyStatus[1]) {
			switch (e.keyCode) {
				case 37: // ←
				case 38: // ↑
				case 39: // →
				{
					setTimeout(() => {
						moveWindowsToSetting();
					}, 1);
					break;
				}
				case 91: {
					winKeyStatus[0] = false;
					break;
				}
				case 92: {
					winKeyStatus[1] = false;
					break;
				}
			}
		}
	});
	
	setSetting(setting, true);
	SmiEditor.Viewer.open(); // 스타일 세팅 설정 완료 후에 실행
	moveWindowsToSetting();

	autoSaveTemp = setInterval(() => {
		saveTemp();
	}, setting.tempSave * 1000);
}

function setSetting(setting, initial=false) {
	const oldSetting = window.setting;
	
	// 탭 on/off 먼저 해야 height값 계산 가능
	if (setting.useTab) {
		$("body").addClass("use-tab");
	} else {
		$("body").removeClass("use-tab");
	}
	
	SmiEditor.setSetting(setting);
	if (initial || (oldSetting.size != setting.size) || (JSON.stringify(oldSetting.color) != JSON.stringify(setting.color))) {
		// 스타일 바뀌었을 때만 재생성
		if (setting.css) {
			delete(setting.css);
		}
		
		// 스크롤바 버튼 새로 그려야 함
		let button = "";
		let disabled = "";
		{
			let canvas = SmiEditor.canvas;
			if (!canvas) canvas = SmiEditor.canvas = document.createElement("canvas");
			canvas.width = canvas.height = ((SB = (16 * setting.size)) + 1) * 2;

			const v1 = SB / 2;
			const v2 = SB + 1 + (SB / 2);
			const v15 = setting.size * 1.5;
			const v20 = setting.size * 2.0;
			const v35 = setting.size * 3.5;
			const c = canvas.getContext("2d");
			let x;
			let y;
			x = v1; y = v1; c.moveTo(x, y-v15); c.lineTo(x+v35, y+v20), c.lineTo(x-v35, y+v20); c.closePath();
			x = v1; y = v2; c.moveTo(x, y+v15); c.lineTo(x+v35, y-v20), c.lineTo(x-v35, y-v20); c.closePath();
			x = v2; y = v1; c.moveTo(x-v15, y); c.lineTo(x+v20, y-v35), c.lineTo(x+v20, y+v35); c.closePath();
			x = v2; y = v2; c.moveTo(x+v15, y); c.lineTo(x-v20, y+v35), c.lineTo(x-v20, y-v35); c.closePath();
			
			const r = Math.floor((Number("0x" + setting.color.border.substring(1,3)) + Number("0x" + setting.color.text.substring(1,3))) / 2);
			const g = Math.floor((Number("0x" + setting.color.border.substring(3,5)) + Number("0x" + setting.color.text.substring(3,5))) / 2);
			const b = Math.floor((Number("0x" + setting.color.border.substring(5,7)) + Number("0x" + setting.color.text.substring(5,7))) / 2);
			c.fillStyle = "#" + ((((r << 8) | g) << 8) + b).toString(16);
			c.fill();
			button = SmiEditor.canvas.toDataURL();
			
			c.fillStyle = setting.color.border;
			c.fill();
			disabled = SmiEditor.canvas.toDataURL();
		}
		$.ajax({url: "lib/SmiEditor.color.css"
			,	dataType: "text"
			,	success: (preset) => {
					for (let name in setting.color) {
						preset = preset.split("[" + name + "]").join(setting.color[name]);
					}
					if (button) {
						preset = preset.split("[button]").join(button).split("[buttonDisabled]").join(disabled);
						$("body").addClass("custom-scrollbar");
					} else {
						$("body").removeClass("custom-scrollbar");
					}
					
					let $style = $("#styleColor");
					if (!$style.length) {
						$("head").append($style = $("<style id='styleColor'>"));
					}
					$style.html(preset);
				}
		});
		
		// 찾기/바꾸기 내재화했을 경우
		if (SmiEditor.Finder
		 && SmiEditor.Finder.window
		 && SmiEditor.Finder.window.iframe
		 && SmiEditor.Finder.window.iframe.contentWindow
		 && SmiEditor.Finder.window.iframe.contentWindow.setColor) {
			SmiEditor.Finder.window.iframe.contentWindow.setColor(setting.color);
		}
	}
	if (initial || (oldSetting.size != setting.size)) {
		$.ajax({url: "lib/SmiEditor.size.css"
			,	dataType: "text"
				,	success: (preset) => {
					preset = preset.split("20px").join((LH = (20 * setting.size)) + "px");
					
					let $style = $("#styleSize");
					if (!$style.length) {
						$("head").append($style = $("<style id='styleSize'>"));
					}
					$style.html(preset);
					
					for (let i = 0; i < tabs.length; i++) {
						const holds = tabs[i].holds;
						for (let j = 0; j < holds.length; j++) {
							holds[j].input.scroll();
							if (holds[j].act) {
								holds[j].act.resize();
							}
						}
					}
				}
		});
		
		// 찾기/바꾸기 내재화했을 경우
		if (SmiEditor.Finder
		 && SmiEditor.Finder.window
		 && SmiEditor.Finder.window.iframe
		 && SmiEditor.Finder.window.iframe.contentWindow
		 && SmiEditor.Finder.window.iframe.contentWindow.setSize) {
			SmiEditor.Finder.window.iframe.contentWindow.setSize(setting.size);
			const w = 440 * setting.size;
			const h = 220 * setting.size;
			SmiEditor.Finder.window.frame.css({
					top: (window.innerHeight - h) / 2
				,	left: (window.innerWidth - w) / 2
				,	width: w
				,	height: h
			});
		}
	}
	if (initial || (JSON.stringify(oldSetting.highlight) != JSON.stringify(setting.highlight))) {
		// 문법 하이라이트 양식 바뀌었을 때만 재생성
		if (setting.useHighlight == false) {
			setting.highlight = { parser: "", style: "eclipse" };
			delete(setting.useHighlight);
		} else if (setting.useHighlight) {
			delete(setting.useHighlight);
		}
		// 문법 하이라이트 세팅 중에 내용이 바뀔 수 있어서
		// 에디터 목록을 만들어서 넘기지 않고, 함수 형태로 넘김
		SmiEditor.setHighlight(setting.highlight, () => {
			const editors = [];
			for (let i = 0; i < tabs.length; i++) {
				for (let j = 0; j < tabs[i].holds.length; j++) {
					editors.push(tabs[i].holds[j]);
				}
			}
			return editors;
		});
	}
	{
		if (setting.sync.kLimit == undefined) {
			setting.sync.kLimit = 200;
		}
		SmiEditor.followKeyFrame = setting.sync.kframe;
		SmiEditor.limitKeyFrame  = setting.sync.kLimit;
	}
	
	// 기본 단축키
	SmiEditor.withCtrls["N"] = newFile;
	SmiEditor.withCtrls["O"] = openFile;
	SmiEditor.withCtrls["S"] = saveFile;
	SmiEditor.withCtrls["s"] = closeCurrentTab; // Ctrl+F4
	SmiEditor.withCtrls.reserved += "NOSs";
	
	// 가중치 등
	$("#inputWeight").val(setting.sync.weight);
	$("#inputUnit"  ).val(setting.sync.unit  );
	if (setting.sync.frame) {
		$(".for-frame-sync").show();
	} else {
		$(".for-frame-sync").hide();
	}
	
	SmiEditor.scrollMargin = setting.scrollMargin;
	AssEvent.useAlignDialogue = setting.viewer.useAlign;
	
	{
		const dll = setting.player.control.dll;
		if (dll) {
			const playerSetting = setting.player.control[dll];
			if (playerSetting) {
				binder.setPlayer(dll, playerSetting.path, playerSetting.withRun);
			}
		}
	}
	
	Combine.css = setting.viewer.css;
	DefaultStyle.Fontsize = Number(setting.viewer.size) / 18 * 80;
	
	binder.setMenus(setting.menu);
	
	window.setting = JSON.parse(JSON.stringify(setting));
	
	// 새 파일 양식은 세팅 로딩이 완료된 후에 갖춰짐
	if (!setting.useTab && !tabs.length) {
		// 탭 기능 껐을 땐 에디터 하나 열린 상태
		newFile();
	}
}
function moveWindowsToSetting() {
	binder.moveWindow("editor"
			, setting.window.x
			, setting.window.y
			, setting.window.width
			, setting.window.height
			, true);
	SmiEditor.Viewer.moveWindowToSetting();
	SmiEditor.Addon .moveWindowToSetting();
	if (setting.player.window.use) {
		binder.moveWindow("player"
				, setting.player.window.x
				, setting.player.window.y
				, setting.player.window.width
				, setting.player.window.height
				, true);
		// TODO: false->true일 때 플레이어 위치 다시 구하기?
	}
	binder.setFollowWindow(setting.window.follow);

	// 창 위치 초기화 후 호출
	setTimeout(() => {
		refreshPaddingBottom();
	}, 1);
}

// C# 쪽에서 호출
function setDpiBy(width) {
	// C#에서 보내준 창 크기와 js에서 구한 브라우저 크기의 불일치를 이용해 DPI 배율을 구함
	setTimeout(() => {
		DPI = (width + 8) / (window.outerWidth + 10);
	}, 1000); // 로딩 덜 됐을 수가 있어서 딜레이 줌
}

window.playerDlls = [];
window.highlights = [];
// C# 쪽에서 호출
function setPlayerDlls(dlls) {
	playerDlls = dlls.split("\n");
}
function setHighlights(list) {
	highlights = list.split("\n");
}

function openSetting() {
	SmiEditor.settingWindow = window.open("setting.html", "setting", "scrollbars=no,location=no,resizable=no,width=1,height=1");
	binder.moveWindow("setting"
			, (setting.window.x < setting.player.window.x)
			  ? (setting.window.x + (40 * DPI))
			  : (setting.window.x + setting.window.width - (840 * DPI))
			, setting.window.y + (40 * DPI)
			, 800 * DPI
			, (600+30) * DPI
			, false);
	binder.focus("setting");
	return SmiEditor.settingWindow;
}
function saveSetting() {
	if (window.binder) {
		binder.saveSetting(stringify(setting));
	}
}
function refreshPaddingBottom() {
	// 에디터 하단 여백 재조정
	const holdTop = tabs.length ? Number(tabs[tab].area.find(".holds").css("top").split("px")[0]) : 0;
	const padding = $("#editor").height() - holdTop - LH;
	const append = "\n#editor .input textarea { padding-bottom: " + (padding - 2 - SB) + "px; }"
	             + "\n.hold > .col-sync > div:first-child { height: " + (padding - 1) + "px; }";
	let $style = $("#stylePaddingBottom");
	if (!$style.length) {
		$("head").append($style = $("<style id='stylePaddingBottom'>"));
	}
	$style.html(append);
	if (SmiEditor.selected) {
		SmiEditor.selected.input.scroll();
	}
}

function openHelp(name) {
	const url = (name.substring(0, 4) == "http") ? name : "help/" + name.split("..").join("").split(":").join("") + ".html";
	SmiEditor.helpWindow = window.open(url, "help", "scrollbars=no,location=no,resizable=no,width=1,height=1");
	binder.moveWindow("help"
			, setting.window.x + (40 * DPI)
			, setting.window.y + (40 * DPI)
			, 800 * DPI
			, (600+30) * DPI
			, false);
	binder.focus("help");
}

function runIfCanOpenNewTab(func) {
	tabToCloseAfterRun = null;
	if (!setting.useTab) {
		// 탭 미사용 -> 현재 파일 닫기
		if (tabs.length) {
			const currentTab = tabs[0];
			for (let i = 0; i < currentTab.holds.length; i++) {
				if (!currentTab.isSaved()) {
					confirm("현재 파일을 닫을까요?", () => {
						tabToCloseAfterRun = $("#tabSelector > .th:not(#btnNewTab)");
						func();
					});
					return;
				}
			}
			tabToCloseAfterRun = $("#tabSelector > .th:not(#btnNewTab)");
		}
	}
	if (func) func();
}
function closeTab(th) {
	const targetTab = th.data("tab");
	const index = tabs.indexOf(targetTab);
	tabs.splice(index, 1);
	targetTab.area.remove();
	th.remove();
	delete targetTab;
	
	SmiEditor.selected = null;
	SmiEditor.Viewer.refresh();
	return index;
}
function closeCurrentTab() {
	if (setting.useTab && tabs.length && tabs[tab]) {
		$("#tabSelector .th:eq(" + tab + ") .btn-close-tab").click();
	}
}

function newFile() {
	runIfCanOpenNewTab(openNewTab);
}

function openFile(path, text, forVideo) {
	if (path && path.toLowerCase().endsWith(".ass")) {
		// 연동 ASS 파일 열기
		loadAssFile(path, text);
		
	} else {
		// C#에서 파일 열 동안 canOpenNewTab 결과가 달라질 리는 없겠지만, 일단은 바깥에서 감싸주기
		runIfCanOpenNewTab(() => {
			if (text) {
				// 새 탭 열기
				openNewTab(text, path, forVideo);
			} else {
				// C#에서 파일 열기 대화상자 실행
				binder.openFile();
			}
		});
	}
}
function openFileForVideo(path, text) {
	runIfCanOpenNewTab(() => {
		// C#에서 동영상의 자막 파일 탐색
		binder.openFileForVideo();
	});
}

let exporting = false;
function saveFile(asNew, isExport) {
	const currentTab = tabs[tab];
	let syncError = null;
	
	for (let i = 0; i < currentTab.holds.length; i++) {
		const hold = currentTab.holds[i];
		hold.history.log();
		
		if (!syncError) {
			for (let j = 0; j < hold.lines.length; j++) {
				const line = hold.lines[j];
				if (line.LEFT && (line.LEFT.hasClass("error") || line.LEFT.hasClass("equal"))) {
					syncError = [i, j];
					break;
				}
			}
		}
	}

	let path = currentTab.path;
	if (!path) {
		// 파일 경로가 없으면 다른 이름으로 저장 대화상자 필요
		asNew = true;
	}
	
	// 저장 전 일괄치환
	if (setting.replace.length > 0) {
		currentTab.replaceBeforeSave();
	}
	
	if (asNew) {
		path = "";
	} else if (isExport) {
		// 내보내기용 파일명 생성
		if (binder && !binder._) {
			const index = path.lastIndexOf("/");
			const prefix = "_"; // 설정 만들기?
			path = path.substring(0, index + 1) + prefix + path.substring(index + 1);
		} else {
			path = "";
			alert("웹버전에서는 파일명 지정이 필수입니다.");
		}
	}
	
	let withAss = currentTab.withAss;
	/*
	if (!isExport) { // SMI 내보내기 시엔 ASS 저장할 필요 없음
		const match = /<sami( [^>]*)*>/gi.exec(currentTab.holds[0].text);
		if (match && match[1]) {
			const attrs = match[1].toUpperCase().split(" ");
			for (let i = 0; i < attrs.length; i++) {
				if (attrs[i] == "ASS") {
					withAss = true;
					break;
				}
			}
		}
	}
	*/
	if (withAss) {
		const styles = { "Default": SmiFile.toSaveStyle(currentTab.holds[0].style) };
		for (let i = 1; i < currentTab.holds.length; i++) {
			const hold = currentTab.holds[i];
			const saveStyle = SmiFile.toSaveStyle(hold.style);
			if (typeof styles[hold.name] == "string") {
				if (styles[hold.name] != saveStyle) {
					const from = hold.name;
					let to = null;
					for (let j = 1; ; j++) {
						to = hold.name + j;
						if (typeof styles[to] == "undefined") {
							break;
						}
					}
					alert("같은 이름의 홀드끼리 스타일이 일치하지 않습니다.\n임의로 이름을 변경합니다.\n" + from + " -> " + to);
					hold.name = to;
					hold.selector.find(".hold-name > span").text(hold.owner.holds.indexOf(hold) + "." + hold.name);
					hold.selector.attr({ title: hold.name });
					hold.afterChangeSaved(hold.isSaved());
					styles[hold.name] = saveStyle;
				}
			} else {
				styles[hold.name] = saveStyle;
			}
		}
	}
	
	let assPath = "";
	if (withAss) {
		//*
		if (path) {
			if (path.indexOf("\\") > 0 || path.indexOf("/") >= 0) {
				// 웹샘플 파일명이면 여기로 못 들어옴
				if (path.toLowerCase().endsWith(".smi")) {
					assPath = path.substring(0, path.length - 3) + "ass";
				} else {
					assPath = path + ".ass";
				}
			} else if (currentTab.assPath) {
				// 웹샘플에서 이미 저장한 적 있을 경우
				assPath = currentTab.assPath;
			}
		} else {
			alert("최초 SMI 파일 생성 시엔 ASS 파일이 생성되지 않습니다.");
			withAss = false;
		}
		/*/
		// SMI 파일이 아닌 영상 파일 경로 기반으로
		if (Subtitle.video.path) {
			const index = Subtitle.video.path.lastIndexOf(".");
			if (index > 0) {
				assPath = Subtitle.video.path.substring(0, index) + ".ass";
			} else {
				assPath = Subtitle.video.path + ".ass";
			}
		} else if (currentTab.assPath) {
			// 웹샘플에서 이미 저장한 적 있을 경우
			assPath = currentTab.assPath;
		}
		*/
	}
	if (syncError) {
		confirm("싱크 오류가 있습니다.\n저장하시겠습니까?", function() {
			binder.save(currentTab.getSaveText(true, !(exporting = isExport)), path, true);
			if (withAss) {
				binder.save(currentTab.toAss().toText(), assPath, false);
			}
			
		}, function() {
			const hold = currentTab.holds[syncError[0]];
			currentTab.selectHold(hold);
			
			const lineNo = syncError[1];
			const cursor = (lineNo ? hold.text.split("\n").slice(0, lineNo).join("\n").length + 1 : 0);
			hold.setCursor(cursor);
			hold.scrollToCursor(lineNo);
		});
	} else {
		binder.save(currentTab.getSaveText(true, !(exporting = isExport)), path, true);
		if (withAss) {
			binder.save(currentTab.toAss().toText(), assPath, false);
		}
	}
}

// 저장 후 C# 쪽에서 호출
function afterSaveFile(path) {
	const currentTab = tabs[tab];
	if (exporting) {
		// 내보내기 동작일 땐 상태 바꾸지 않음
		exporting = false;
		return;
	}
	for (let i = 0; i < currentTab.holds.length; i++) {
		// 최종 저장 여부는 탭 단위로 다뤄져야 해서 군더더기 작업이 됨
		// afterSave 재정의도 삭제
		// currentTab.holds[i].afterSave();
		const hold = currentTab.holds[i];
		hold.saved = hold.input.val();
		hold.savedPos = hold.pos;
		hold.savedName = hold.name;
		hold.savedStyle = SmiFile.toSaveStyle(hold.style);
		if (hold.assEditor) {
			hold.assEditor.setSaved();
		}
	}
	currentTab.assHold.assEditor.setSaved();
	currentTab.path = path;
	const title = path ? ((path.length > 14) ? ("..." + path.substring(path.length - 14, path.length - 4)) : path.substring(0, path.length - 4)) : "새 문서";
	$("#tabSelector .th:eq(" + tab + ") span").text(title).attr({ title: path });
	currentTab.holdEdited = false;
	currentTab.savedHolds = currentTab.holds.slice(0);
	
	// savedHolds가 교체된 후에 저장 여부 체크
	currentTab.onChangeSaved();
}
// 웹버전에서만 활용
function afterSaveAssFile(path) {
	tabs[tab].assPath = path;
}

function saveTemp() {
	const currentTab = tabs[tab];
	if (!currentTab) {
		return;
	}

	// 마지막 임시 저장 이후 변경 사항 없으면 무시
	const texts = [];
	let isChanged = false;
	for (let i = 0; i < currentTab.holds.length; i++) {
		const text = texts[i] = currentTab.holds[i].input.val();
		if (text == currentTab.holds[i].tempSavedText) {
			continue;
		}
		isChanged = true;
	}
	
	if (isChanged) {
		const path = currentTab.path ? currentTab.path : "\\new.smi";
		binder.saveTemp(currentTab.getSaveText(false), path);
		for (let i = 0; i < currentTab.holds.length; i++) {
			currentTab.holds[i].tempSavedText = texts[i];
		}
		currentTab.area.addClass("tmp-saved");
	}
}

let _for_video_ = false;
function openNewTab(text, path, forVideo) {
	if (tabToCloseAfterRun) {
		closeTab(tabToCloseAfterRun);
		tabToCloseAfterRun = null;
	}
	if (tabs.length >= 4) {
		alert("탭은 4개까지 열 수 있습니다.");
		return;
	}
	
	const texts = [];
	if (path) {
		if (path.substring(path.length - 4).toUpperCase() == ".SRT") {
			// SRT 파일 불러왔을 경우 SMI로 변환
			path = path.substring(0, path.length - 4) + ".smi";
			texts.push(text = srt2smi(text));
		}
	}

	const title = path ? ((path.length > 14) ? ("..." + path.substring(path.length - 14, path.length - 4)) : path.substring(0, path.length - 4)) : "새 문서";
	
	const tab = new Tab(text ? text : setting.newFile, path);
	tabs.push(tab);
	$("#editor").append(tab.area);

	const th = $("<div class='th'>").append($("<span>").text(title)).attr({ title: path });
	th.append($("<button type='button' class='btn-close-tab'>").text("×"));
	$("#btnNewTab").before(th);
	
	_for_video_ = forVideo;
	(tab.th = th).data("tab", tab).click();
	
	if (path && path.indexOf(":")) { // 웹버전에선 온전한 파일 경로를 얻지 못해 콜론 없음
		let withAss = false;
		{
			const match = /<sami( [^>]*)*>/gi.exec(text);
			if (match && match[1]) {
				const attrs = match[1].toUpperCase().split(" ");
				for (let i = 0; i < attrs.length; i++) {
					if (attrs[i] == "ASS") {
						withAss = true;
						break;
					}
				}
			}
		}
	}
	
	return tab;
}
// C# 쪽에서 호출
function confirmLoadVideo(path) {
	setTimeout(() => {
		confirm("동영상 파일을 같이 열까요?\n" + path, function() {
			binder.loadVideoFile(path);
		});	
	}, 1);
}

// C# 쪽에서 호출
function setVideo(path) {
	if (Subtitle.video.path == path) return;
	
	Subtitle.video.path = path;
	Subtitle.video.fs = [];
	Subtitle.video.kfs = [];
	Subtitle.video.aegisubSyncs = null;
	$("#forFrameSync").addClass("disabled");
	$("#checkTrustKeyframe").attr({ disabled: true });

	// 동영상 파일이 열려있을 때만 프레임 분석 진행
	const ext = path.toLowerCase();
	if (ext.endsWith(".avi")
	 || ext.endsWith(".mp4")
	 || ext.endsWith(".mkv")
	 || ext.endsWith(".wmv")
	 || ext.endsWith(".ts")
	 || ext.endsWith(".m2ts")
	) {
		Subtitle.video.isAudio = false;
		binder.requestFrames(path);
		
	} else {
		// 오디오 파일을 불러온 경우 ms 단위 싱크로 동작
		Subtitle.video.isAudio = true;
		Subtitle.video.FR = 1000000;
		Subtitle.video.FL = 1;
	}
}
// C# 쪽에서 호출 - requestFrames
function setVideoInfo(w=1920, h=1080, fr=23976) {
	Subtitle.video.width = w;
	Subtitle.video.height = h;
	
	// TODO: fps 관련은 이제 날리는 게 맞나...?
	if (fr == 23975) {
		fr = 23975.7; // 일부 영상 버그
	}
	Subtitle.video.FL = 1000000 / (Subtitle.video.FR = fr);
	if (showFps == null) {
		showFps = $("#showFps");
	}
	showFps.text((Math.round(fr*10)/10000) + " fps");
}
// C# 쪽에서 호출 - requestFrames
function loadFkf(fkfName) {
	// C# 파일 객체를 js 쪽에 전달할 수 없으므로, 정해진 경로의 파일을 ajax 형태로 가져옴
	const req = new XMLHttpRequest();
	req.open("GET", "../temp/" + fkfName);
	req.responseType = "arraybuffer";
	req.onload = (e) => {
		afterLoadFkfFile(req.response);
	}
	req.onerror = (e) => {
		// 실패했어도 프로그레스바는 없애줌
		Progress.set("#forFrameSync", 0);
	}
	req.send();
}
// 웹버전 샘플에서 fkf 파일 드래그로 열었을 경우
function loadFkfFile(file) {
	const fr = new FileReader();
	fr.onload = function(e) {
		afterLoadFkfFile(e.target.result);
	}
	fr.readAsArrayBuffer(file);
}
function afterLoadFkfFile(buffer) {
	const fkf = new Int32Array(buffer);
	const vfsLength = fkf[0];
	const kfsLength = fkf[1];
	
	const vfs = [];
	const kfs = [];
	
	let offset = 8;
	{	const view = new DataView(buffer.slice(offset, offset + (vfsLength * 4)));
		for (let i = 0; i < vfsLength; i++) {
			vfs.push(view.getInt32(i * 4, true));
		}
	}
	offset = offset + (vfsLength * 4);
	{	const view = new DataView(buffer.slice(offset, offset + (kfsLength * 4)));
		for (let i = 0; i < kfsLength; i++) {
			kfs.push(view.getInt32(i * 4, true));
		}
	}
	Subtitle.video.fs  = vfs;
	Subtitle.video.kfs = kfs;
	afterSetFkf();
}
// 웹샘플에서 필요해서 분리
function afterSetFkf() {
	Subtitle.video.aegisubSyncs = null
	
	// 키프레임 신뢰 기능 활성화
	$("#forFrameSync").removeClass("disabled");
	$("#checkTrustKeyframe").attr({ disabled: false });
	Progress.set("#forFrameSync", 0);
	
	for (let i = 0; i < tabs.length; i++) {
		const holds = tabs[i].holds;
		for (let j = 0; j < holds.length; j++) {
			holds[j].refreshKeyframe();
		}
	}
}

// C# 쪽에서 호출
function loadAssFile(path, text, target=-1) {
	if (target < 0) {
		// 탭이 지정 안 된 경우..는 없어야 맞음
		target = tab;
	}
	const currentTab = tabs[target];
	if (!currentTab || !currentTab.withAss) {
		alert("연동용 자막 파일이 열려있어야 ASS 파일을 읽을 수 있습니다.");
		return;
	}
	
	// SMI -> ASS 변환 결과
	const originFile = currentTab.toAss(true);
	
	// 따로 불러온 ASS 파일
	const targetFile = new AssFile(text);
	
	{	// 비교 결과랑 별개로, Aegisub Project Garbage 등을 반영
		if (!currentTab.assFile) {
			currentTab.assFile = new AssFile();
		}
		
		// 스타일/이벤트는 뺐다가 뒤쪽에 다시 추가
		const assStyles = currentTab.assFile.getStyles();
		const assEvents = currentTab.assFile.getEvents();
		currentTab.assFile.parts.length = 1;
		
		for (let i = 0; i < targetFile.parts.length; i++) {
			const part = targetFile.parts[i];
			switch (part.name) {
				case "Script Info":
				case "V4+ Styles":
				case "Events":
					break;
				default: {
					const origPart = currentTab.assFile.getPart(part.name);
					if (origPart) {
						origPart.format = part.format;
						origPart.body   = part.body;
					} else {
						currentTab.assFile.parts.push(part);
					}
				}
			}
		}
		currentTab.assFile.parts.push(assStyles);
		currentTab.assFile.parts.push(assEvents);
	}
	{
		const targetEvents = targetFile.getEvents().body;
		for (let i = 0; i < targetEvents.length; i++) {
			targetEvents[i].clearEnds();
		}
		
		// 싱크 프레임 단위 정규화 먼저 진행
		for (let i = 0; i < targetEvents.length; i++) {
			const t = targetEvents[i];
			t.oStart = t.Start;
			t.oEnd   = t.End;
			t.optimizeSync();
		}
		
		// 원래의 스크립트 순서를 기준으로, 시간이 겹치는 걸 기준으로 레이어 재부여
		{
			let forLayers = [];
			for (let i = 0; i < targetEvents.length; i++) {
				let item = targetEvents[i];
				let forLayer = forLayers[item.Layer];
				if (!forLayer) {
					forLayers[item.Layer] = forLayer = [];
				}
				forLayer.push(item);
			}
			let checkeds = [];
			for (let l = 0; l < forLayers.length; l++) {
				let forLayer = forLayers[l];
				if (!forLayer) continue;
				for (let i = 0; i < forLayer.length; i++) {
					const item = forLayer[i];
					let maxLayer = -1;
					for (let j = 0; j < checkeds.length; j++) {
						const checked = checkeds[j];
						if (item.start < checked.end && checked.start < item.end) {
							maxLayer = Math.max(maxLayer, checked.Layer);
						}
					}
					item.Layer = maxLayer + 1;
					checkeds.push(item);
				}
			}
		}
		
		// 시간 순 정렬 돌리고 시작
		targetEvents.sort((a, b) => {
			let cmp = a.start - b.start;
			if (cmp == 0) {
				cmp = a.end - b.end;
			}
			return cmp;
		});
	}
	
	console.log(originFile);
	console.log(targetFile);
	
	// TODO:
	// 불일치 부분 확인 및 보정
	const appendFile = new AssFile();

	// 홀드 스타일과 ASS 스타일 비교
	let styleTexts = currentTab.area.find(".tab-ass-styles textarea").val();
	styleTexts = styleTexts ? [styleTexts] : [];
	const styles = {}; // 아래에서도 필요해짐
	const changedStyles = [];
	let styleCount = 0;
	{
		// SMI 홀드 기반으로 생성한 스타일
		let part = originFile.getStyles();
		for (let i = 0; i < part.body.length; i++) {
			const style = part.body[i];
			styles[style.Name] = style;
		}
		
		// ASS 파일에서 가져온 스타일
		part = targetFile.getStyles();
		
		for (let i = 0; i < part.body.length; i++) {
			const style = part.body[i];
			const genStyle = styles[style.Name];
			if (genStyle) {
				console.log("SMI에서 해당하는 홀드가 있음");
				let styleChanged = false;
				for (let j = 0; j < part.format.length; j++) {
					const f = part.format[j];
					if (style[f] != genStyle[f]) {
						console.log("홀드 스타일 변경 됨", f, genStyle, style);
						changedStyles.push(style);
						styleChanged = true;
						break;
					}
				}
			} else {
				console.log("SMI에서 해당하는 홀드가 없음");
				changedStyles.push(style);
			}
		}
	}
	
	{	// 홀드 스크립트와 ASS 스크립트 비교
		
		// 1:1 - 결과물이 다른 경우
		//       <font ass="~~"> 태그 추가해서 구현 시도 - 어느 정도 한계 존재 
		//       내용 불일치 시 SMI용 내용 전체 무시하고 <!-- ASS 주석으로 대체 - 이렇게만 하는 게 구현은 쉬움
		
		// 1:0 - SMI엔 있는데 ASS엔 없는 경우
		//       변환 시 내용물 무시하는 명령어 자동 반영
		
		// 1:N - SMI와 동일한 싱크에 ASS 자막 여러 개 있는 경우
		//       해당 대사에 <!-- ASS 주석으로 추가
		//       마지막 줄에 대해서만 1:1 변환 적용 가능한지 확인
		
		// 0:N - SMI에 아예 없고, ASS에서 추가한 부분일 경우
		//       에디터와 별도의 UI에 표현
		//       문서 끝에 <!-- ASS 주석으로 추가
		//       해당 부분에 대해서도 화면 싱크 매니저 지원 필요
		//       currentTab.assFile = new Subtitle.AssFile2(); <- 나중에 정리되면 2 떼는 쪽으로
		
		// ASS에만 있는 부분은 기본적으로 화면 싱크로 간주?
		// 같은 홀드로 뺀 음성 대사라면 시간이 겹칠 리 없으니 SMI에서 문제되진 않을 것
		
		const originEvents = originFile.getEvents().body;
		const targetEvents = targetFile.getEvents().body;
		const appendEvents = appendFile.getEvents().body;
		
		for (let i = 0; i < targetEvents.length; i++) {
			let assText = targetEvents[i].Text.split("}{").join("");

			// 뒤쪽에 붙은 군더더기 종료태그 삭제
			while (assText.endsWith("}")) {
				if (assText.endsWith("{}")) {
					// 의도적으로 넣은 것
					break;
				}
				let end = assText.lastIndexOf("{");
				if (end > 0) {
					const tags = assText.substring(end + 1, assText.length - 1).split("\\");
					assText = assText.substring(0, end);
					
					// 끝에 붙은 공통 태그는 앞으로 가져옴
					let frontTag = "";
					for (let j = 0; j < tags.length; j++) {
						const tag = tags[j];
						if (tag.startsWith("fad")
						 || tag.startsWith("pos")
						 || tag.startsWith("mov")
						 || tag.startsWith("clip")
						) {
							frontTag += "\\" + tag;
							tags.splice(j, 1);
							j--;
						}
					}
					
					if (frontTag) {
						// 앞으로 가져온 태그가 있을 경우
						if (assText.startsWith("{\\")) {
							assText = "{" + frontTag + assText.substring(1);
						} else {
							assText = "{" + frontTag + "}" + assText;
						}
						// 끄트머리가 공백문자면 태그 없어도 중괄호 필요함
						if (assText.endsWith("　")
						 || assText.endsWith(" ")
						) {
							assText += "{}";
						}
					}
				} else {
					break;
				}
			}
			targetEvents[i].Text = assText;
		}
		
		let oi = 0; let ti = 0;
		let count = 0;
		while (ti < targetEvents.length) {
			const tEvent = targetEvents[ti];
			while ((oi < originEvents.length) && (originEvents[oi].Start < tEvent.Start)) {
				// ASS 출력 제외 대상
				const origin = originEvents[oi].origin;
				oi++;
			}
			// 싱크가 일치하는 것들 찾기
			const origins = [];
			const targets = [];
			for (let i = oi; i < originEvents.length; i++) {
				const event = originEvents[i];
				if (event.start != tEvent.start) break;
				if (event.end   != tEvent.end  ) break;
				origins.push(event);
			}
			for (let i = ti; i < targetEvents.length; i++) {
				const event = targetEvents[i];
				if (event.start != tEvent.start) break;
				if (event.end   != tEvent.end  ) break;
				targets.push(event);
			}
			
			// 기존 생성물과 일치하는지 확인
			for (let oj = 0; oj < origins.length; oj++) {
				const o = origins[oj];
				if (o.origin) {
					// SMI 기반 생성물
					for (let tj = 0; tj < targets.length; tj++) {
						const t = targets[tj];
						if (o.Style == t.Style && o.Text == t.Text) {
							t.origin = o.origin;
							t.found = o.found = true;
							break;
						}
					}
					if (!o.found) {
						// SMI 기반 생성물에 태그를 추가해 구현 가능한지 확인
						let t = null;
						for (let tj = targets.length - 1; tj >= 0; tj--) {
							if (targets[tj].Style == o.Style) {
								// 스타일이 같은 것 중 마지막 것을 가져옴
								t = targets[tj];
								break;
							}
						}
						if (t && (t.Text.length > o.Text.length)) {
							let targetTags = [];
							let targetText = t.Text;
							
							if (targetText.startsWith("{")) {
								const end = targetText.indexOf("}");
								if (end > 0) {
									targetTags = targetText.substring(1, end).split("\\").slice(1);
									targetText = targetText.substring(end + 1);
								}
							}
							
							let originTags = [];
							let originText = o.Text;
							
							if (originText.startsWith("{")) {
								const end = originText.indexOf("}");
								if (end > 0) {
									originTags = originText.substring(1, end).split("\\").slice(1);
									originText = originText.substring(end + 1);
								}
							}
							
							// SMI 기반 생성물 앞뒤에 내용물을 추가해서 구현 가능한지 확인
							// TODO: 중간 내용물 추가도 필요한가...?
							const index = targetText.indexOf(originText);
							if (index >= 0) {
								let convertable = true;
								for (let ok = 0; ok < originTags.length; ok++) {
									const oTag = originTags[ok];
									let targetHasTag = false;
									for (let tk = 0; tk < targetTags.length; tk++) {
										if (oTag == targetTags[tk]) {
											targetHasTag = true;
											break;
										}
									}
									if (!targetHasTag) {
										// SMI 기반 생성물엔 있는데 결과물엔 없는 태그가 있으면 불가능
										convertable = false;
										break;
									}
								}
								
								if (convertable) {
									// 추가돼야 하는 태그 확인
									const appendTags = [];
									for (let tk = 0; tk < targetTags.length; tk++) {
										const tTag = targetTags[tk];
										let originHasTag = false;
										for (let ok = 0; ok < originTags.length; ok++) {
											if (tTag == originTags[ok]) {
												originHasTag = true;
												break;
											}
										}
										if (!originHasTag) {
											appendTags.push(tTag);
										}
									}
									let prev = "";
									if (appendTags.length) {
										prev = '<FONT ass="{\\' + appendTags.join("\\") + '}' + targetText.substring(0, index) + '"></FONT>\n';
									} else if (index) {
										prev = '<FONT ass="' + targetText.substring(0, index) + '"></FONT>\n';
									}
									let next = "";
									if (targetText.length > (index + originText.length)) {
										next = '\n<FONT ass="' + targetText.substring(index + originText.length) + '"></FONT>';
									}
									
									o.origin.origin.text = prev + o.origin.origin.text + next;
									t.found = true;
									t.origin = o.origin;
									count++;
								}
							}
						}
					}
					
				} else {
					// ASS 전용 스크립트
					for (let tj = 0; tj < targets.length; tj++) {
						const t = targets[tj];
						if (o.Style == t.Style && o.Text == t.Text) {
							t.owner = o.owner;
							t.found = o.found = true;
							break;
						}
					}
				}
				if (!o.found) {
					// SMI->ASS 변환 제외 필요
					o.origin.origin.skip = true;
					count++;
				}
			}
			for (let tj = 0; tj < targets.length; tj++) {
				const t = targets[tj];
				if (!t.found) {
					// 기존에 없던 ASS 스크립트 카운트
					count++;
				}
				if (!t.origin) {
					// SMI 기반 생성물이 아닐 경우
					appendEvents.push(t);
				}
			}
			
			oi += origins.length;
			ti += targets.length;
		}
		while (oi < originEvents.length) {
			// ASS 출력 제외 대상
			originEvents[oi].skip = true;
			console.log("count++ ASS 출력 제외 대상", originEvents[oi]);
			count++;
			oi++;
		}
		
		if (changedStyles.length > 0 || count > 0) {
			let msg = "ASS 자막 수정 내역이 있습니다. 적용하시겠습니까?\n\n자막에 맞는 동영상 파일이 열려있어야 정상적인 결과를 얻을 수 있습니다.";
			if (count == 0) {
				msg = "ASS 자막 스타일 수정 내역이 있습니다. 적용하시겠습니까?";
			}
			confirm(msg, () => {
				if (changedStyles.length) {
					const addPart = appendFile.getStyles();
					
					for (let i = 0; i < changedStyles.length; i++) {
						const style = changedStyles[i];
						const genStyle = styles[style.Name];
						if (genStyle) {
							// 기존 스타일 가져오기
							const styleName = (style.Name == "Default") ? "메인" : style.Name;
							let holdStyle = null;
							for (let h = 0; h < currentTab.holds.length; h++) {
								const hold = currentTab.holds[h];
								if (hold.name == styleName) {
									holdStyle = JSON.parse(JSON.stringify(hold.style));
									break;
								}
							}
							console.log("기존 스타일 가져오기", holdStyle);
							// 여기서 없을 수는 없음
							if (holdStyle) {
								// output은 유지
								holdStyle.Fontname    = style.Fontname   ;
								holdStyle.Fontsize    = style.Fontsize   ;
								holdStyle.Bold        = style.Bold      != 0;
								holdStyle.Italic      = style.Italic    != 0;
								holdStyle.Underline   = style.Underline != 0;
								holdStyle.StrikeOut   = style.StrikeOut != 0;
								holdStyle.ScaleX      = style.ScaleX     ;
								holdStyle.ScaleY      = style.ScaleY     ;
								holdStyle.Spacing     = style.Spacing    ;
								holdStyle.Angle       = style.Angle      ;
								holdStyle.BorderStyle = (style.BorderStyle & 2) != 0;
								holdStyle.Outline     = style.Outline    ;
								holdStyle.Shadow      = style.Shadow     ;
								holdStyle.Alignment   = style.Alignment  ;
								holdStyle.MarginL     = style.MarginL    ;
								holdStyle.MarginR     = style.MarginR    ;
								holdStyle.MarginV     = style.MarginV    ;
								{ let fc = style.PrimaryColour  ; holdStyle.PrimaryColour   = '#'+fc[8]+fc[9]+fc[6]+fc[7]+fc[4]+fc[5]; holdStyle.PrimaryOpacity   = 255 - Number('0x'+fc[2]+fc[3]); }
								{ let fc = style.SecondaryColour; holdStyle.SecondaryColour = '#'+fc[8]+fc[9]+fc[6]+fc[7]+fc[4]+fc[5]; holdStyle.SecondaryOpacity = 255 - Number('0x'+fc[2]+fc[3]); }
								{ let fc = style.OutlineColour  ; holdStyle.OutlineColour   = '#'+fc[8]+fc[9]+fc[6]+fc[7]+fc[4]+fc[5]; holdStyle.OutlineOpacity   = 255 - Number('0x'+fc[2]+fc[3]); }
								{ let fc = style.BackColour     ; holdStyle.BackColour      = '#'+fc[8]+fc[9]+fc[6]+fc[7]+fc[4]+fc[5]; holdStyle.BackOpacity      = 255 - Number('0x'+fc[2]+fc[3]); }
								
								// 해당 홀드 스타일 적용
								// 같은 이름의 홀드가 여러 개일 수 있음
								for (let h = 0; h < currentTab.holds.length; h++) {
									const hold = currentTab.holds[h];
									if (hold.name == styleName) {
										hold.setStyle(holdStyle);
									}
								}
							}
						} else {
							console.log("SMI에서 해당하는 홀드가 없음");
							addPart.body.push(style);
						}
					}
					if (addPart.body.length) {
						// 추가 스타일
						styleTexts.push(addPart.toText(false));
						currentTab.area.find(".tab-ass-styles textarea").val(styleTexts.join("\n"));
					}
				}
				if (count) {
					// 스크립트는 홀드별로 분할해서 넣어야 함
					const holds = currentTab.holds;
					for (let h = 0; h < holds.length; h++) {
						holds[h].ass = [];
					}
					
					const appendEvents = appendFile.getEvents();
					const list = appendEvents.body;
					const appends = [];
					
					// 기존 SMI 홀드에 span 형태로 끼워넣을 수 있는지 확인

					ti = 0;
					while (ti < list.length) {
						let targets = [];
						const styles = [];
						
						// target 싱크 그룹화
						const tEvent = list[ti];
						for (let i = ti; i < list.length; i++) {
							// 싱크 일치하는 것 확인
							const event = list[i];
							if (event.start != tEvent.start) break;
							if (event.end   != tEvent.end  ) break;
							targets.push(event);
							
							const style = event.Style;
							if (styles.indexOf(style) < 0) {
								styles.push(style);
							}
						}
						
						const start = tEvent.start;
						const end = tEvent.end;
						let importSet = null;
						
						for (let s = 0; s < styles.length; s++) {
							const style = (styles[s] == "Default") ? "메인" : styles[s];
							
							// style 기준으로 홀드 찾기
							for (let h = 0; h < currentTab.holds.length; h++) {
								const hold = currentTab.holds[h];
								
								let canImport = hold.smiFile; // ASS 출력 제외 홀드에는 넣을 수 없음
								if (!canImport) continue;

								const body = hold.smiFile.body;
								let replaceFrom = -1;
								let replaceTo = -1;
								let fromEmpty = true;
								let toEmpty = true;

								{
									let i = 0;
									for (; i < body.length; i++) {
										let sync = Subtitle.findSync(body[i].start);
										if (sync < start) {
											continue;
										}
										
										if (start < sync) {
											// 중간 싱크를 생성해야 함
											if (i == 0 || body[i-1].isEmpty()) {
												// 공백에서 시작
												replaceFrom = i;
												fromEmpty = true;
												
											} else {
												// 공백 아니면 겹칠 수 없음
												canImport = false;
												break;
											}
											
										} else {
											// 시작 싱크가 SMI 싱크와 일치
											replaceFrom = i;
											fromEmpty = false;
										}
	
										for (; i < body.length; i++) {
											sync = Subtitle.findSync(body[i].start);
											if (sync < end) {
												continue;
											}
											
											if (end < sync) {
												// 중간 싱크를 생성해야 함
												if (i == 0 || body[i-1].isEmpty()) {
													// 공백에서 종료
													replaceTo = i;
													toEmpty = true;
													
												} else {
													// 공백 아니면 겹칠 수 없음
													canImport = false;
												}
											} else {
												// 종료 싱크가 SMI 싱크와 일치
												replaceTo = i;
												toEmpty = false;
											}
											break;
										}
										break;
									}
								}
								if (!canImport || replaceFrom < 0 || replaceTo < 0) {
									continue;
								}

								// 공백이 아닌 것도 분할해서 추가할 순 있겠지만, 연관된 것들 span 조정해야 함
								// 여기까지 가면 ASS 에디터의 의미도 더 퇴색됨

								// 우선순위 판단
								let point = 0;
								if (!fromEmpty) point += 3; // SMI 싱크 그대로 사용
								if (!toEmpty  ) point += 3; // SMI 싱크 그대로 사용
								if (hold.name == style) {
									point += 2; // 이름 동일
								} else if (style.startsWith(hold.name)) {
									point += 1; // 이름 포함
								}

								if (importSet && importSet.point > point) {
									// 기존에 찾은 게 더 점수가 높음
									continue;
								}

								importSet = {
										hold: hold
									,	replaceFrom: replaceFrom
									,	replaceTo: replaceTo
									,	fromEmpty: fromEmpty
									,	toEmpty: toEmpty
									,	point: point
								};
							}
						}

						if (importSet) {
							const body = importSet.hold.smiFile.body;
							const replaceFrom = importSet.replaceFrom;
							const replaceTo   = importSet.replaceTo;
							const fromEmpty   = importSet.fromEmpty;
							const toEmpty     = importSet.toEmpty;

							let smi = body[replaceFrom];
							if (!smi.assComments) {
								smi.assComments = [];
							}

							for (let i = 0; i < targets.length; i++) {
								// 싱크 겹치도록 넣어줌
								const item = targets[i];
								let span = replaceTo - replaceFrom;
								if (fromEmpty) span++;
								smi.assComments.push([item.Layer, "", (span == 1 ? "" : span), item.Style, item.Text].join(","));
							}

							if (fromEmpty) {
								// 공백 싱크 추가
								const bodyEnd = body.slice(replaceFrom);
								body.length = replaceFrom;
								body.push(smi = new Smi(start, SyncType.frame, ""));
								body.push(...bodyEnd);
							}

							if (toEmpty) {
								// 종료 싱크 추가 필요
								const bodyEnd = body.slice(replaceTo);
								body.length = replaceTo;
								body.push(new Smi(start, SyncType.frame, "&nbsp;"));
								body.push(...bodyEnd);
							}

						} else {
							// SMI 홀드에 넣을 수 없는, ASS 전용 스크립트
							appends.push(...targets);
						}
						
						ti += targets.length;
					}
					
					// 홀드 SMI 재구성
					for (let i = 0; i < currentTab.holds.length; i++) {
						const hold = currentTab.holds[i];
						if (!hold.smiFile) continue;
						
						for (let j = 0; j < hold.smiFile.body.length; j++) {
							const smi = hold.smiFile.body[j];
							if (smi.assComments) {
								smi.assComments.sort((a, b) => {
									return Number(a.split(",")[0]) - Number(b.split(",")[0]);
								});
								let comment = "<!-- ASS\n" + smi.assComments.join("\n");
								if (smi.skip) {
									comment += "\nEND"
								}
								comment += "\n-->";
								if (smi.text) {
									smi.text = comment + "\n" + smi.text;
								} else {
									smi.text = comment;
								}
								
							} else if (smi.skip) {
								smi.text = "<!-- ASS X -->\n" + smi.text;
							}
						}
						
						const smiText = hold.smiFile.toText();
						hold.input.val(smiText);
						hold.setCursor(0);
						hold.scrollToCursor();
						hold.render();
					}
					
					// SMI 에디터에 넣지 못한 내용물
					appendEvents.body = appends;
					
					// ASS 전용 스크립트의 기본값은 화면 싱크
					
					// 일반 싱크인 것들 예외 처리
					const normalSyncs = [];
					for (let h = 0; h < currentTab.holds.length; h++) {
						const lines = currentTab.holds[h].lines;
						for (let i = 0; i < lines.length; i++) {
							const line = lines[i];
							if (line.TYPE == TYPE.BASIC) {
								normalSyncs.push(line.SYNC);
							}
						}
					}
					normalSyncs.sort((a, b) => {
						return a - b;
					});
					
					// 기존 ASS 에디터의 화면 싱크
					const frameSyncs = currentTab.assHold.assEditor.getFrameSyncs();
					
					// ASS 전용 스크립트에서 일반 싱크 제외하고 화면 싱크로 할당
					for (let i = 0; i < appendEvents.body.length; i++) {
						const event = appendEvents.body[i];
						if (Subtitle.findSync(event.start, normalSyncs, false) == null) frameSyncs.push(event.start);
						if (Subtitle.findSync(event.end  , normalSyncs, false) == null) frameSyncs.push(event.end  );
					}
					frameSyncs.sort((a, b) => {
						return a - b;
					});
					
					currentTab.assHold.assEditor.setEvents(appendEvents.body, frameSyncs);
				}
			});
		} else {
			if (styleCount) {
				alert("자막 스타일 변경사항이 있습니다.");
			} else {
				alert("ASS 자막에 특별한 수정사항이 없습니다.");
			}
		}
	}
}

// 종료 전 C# 쪽에서 호출
function beforeExit() {
	let saved = true;
	for (let i = 0; i < tabs.length; i++) {
		for (let j = 0; j < tabs[i].holds.length; j++) {
			if (tabs[i].holds[j].saved != tabs[i].holds[j].input.val()) {
				saved = false;
				break;
			}
		}
	}
	if (saved) {
		doExit(); // 그냥 꺼지는 게 맞는 것 같음
	} else {
		confirm("저장되지 않은 파일이 있습니다.\n종료하시겠습니까?", doExit);
	}
}
function doExit() {
	saveSetting(); // 창 위치 최신값으로 저장
	binder.doExit(setting.player.window.use
		, setting.player.control[setting.player.control.dll].withExit);
}

function srt2smi(text) {
	return new SmiFile().fromSync(new SrtFile(text).toSyncs()).toText();
}

/**
 * frameSyncOnly: 화면 싱크만 맞춰주기
 * add: 과거 반프레임 보정치 안 넣었던 것들을 위해 추가
 */
function fitSyncsToFrame(frameSyncOnly=false, add=0) {
	if (!Subtitle.video.fs.length) {
		/*
		return;
		/*/
		// 테스트용 코드
		for (let s = 0; s < 2000000; s += 50) {
			Subtitle.video.fs.push(s);
			if (s % 1000 == 0) {
				Subtitle.video.kfs.push(s);
			}
		}
		
		// 키프레임 신뢰 기능 활성화
		$("#forFrameSync").removeClass("disabled");
		$("#checkTrustKeyframe").attr({ disabled: false });
		Progress.set("#forFrameSync", 0);
		
		for (let i = 0; i < tabs.length; i++) {
			const holds = tabs[i].holds;
			for (let j = 0; j < holds.length; j++) {
				holds[j].refreshKeyframe();
			}
		}
		//*/
	}

	if (!tabs.length) return;
	const holds = tabs[tab].holds;
	
	for (let i = 0; i < holds.length; i++) {
		holds[i].fitSyncsToFrame(frameSyncOnly, add);
	}
}