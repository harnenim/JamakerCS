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
			
			assHold.area.empty().addClass("ass-hold").append(SmiEditor.assHoldPreset.clone());
			this.holdArea.append(assHold.area);
			const assEditorArea = assHold.area.find(".ass-editor");
			
			assHold.assEditor = new AssEditor(assEditorArea);
			assHold.assEditor.onUpdate = function() {
				if (this.isSaved) {
					assHold.selector.removeClass("not-saved");
				} else {
					assHold.selector.addClass("not-saved");
				}
				tab.onChangeSaved();
			};
			tab.area.find("div.tab-ass-script button.btn-add-event").on("click", function() {
				const sync = SmiEditor.getSyncTime("!"); // 가중치 없는 현재 싱크로 넣음
				assHold.assEditor.addEvents([ new AssEvent(sync, sync, "Default", "") ]);
			});
			tab.area.find("div.tab-ass-script button.btn-split-hold").on("click", function() {
				const events = assHold.assEditor.toEvents();
				if (!events.length) {
					alert("스크립트가 없습니다.");
					return;
				}
				const styleList = [];
				const styleMap = {};
				for (let i = 0; i < events.length; i++) {
					const event = events[i];
					let style = styleMap[event.Style];
					if (!style) {
						styleList.push(style = styleMap[event.Style] = { name: event.Style, events: [] });
					}
					style.events.push(event);
				}
				styleList.sort((a, b) => {
					return a.events.length - b.events.length;
				});
				
				const $popup = $("#assSplitHoldSelectorPopup").empty();
				for (let i = 0; i < styleList.length; i++) {
					const style = styleList[i];
					$popup.append($("<button>").text(style.name + " (" + style.events.length + "개)").data({ tab: tab, style: style.name }));
				}
				$popup.append($("<button>").text("취소"));
				
				$("#assSplitHoldSelector").show();
			});
		}
		
		let frameSyncs = [];
		if (this.assFile) {
			const events = this.assFile.getEvents();
			
			const editAssFile = new AssFile(" "); // 공백이라도 안 넣으면 [Script Info] 자동 생성됨
			for (let i = 0; i < this.assFile.parts.length; i++) {
				const part = this.assFile.parts[i];
				if (part.name == "Script Info") continue;
				if (part.name == "Events") continue;
				editAssFile.parts.push(part);
			}
			this.area.find(".tab-ass-appends textarea").val(editAssFile.toText());
			
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
			
			{	// 홀드명 겹치는 게 남는지 확인
				let exist = false;
				for (let i = 0; i < tab.holds.length; i++) {
					if (tab.holds[i] == hold) continue;
					if (tab.holds[i].name == hold.name) {
						exist = true;
						break;
					}
				}
				if (!exist) {
					// 없으면 ASS 추가 스크립트에 홀드 스타일 넣기
					const style = SmiFile.toAssStyle(hold.style);
					style.Name = hold.name;
					
					const appendFile = new AssFile(tab.area.find(".tab-ass-appends textarea").val());
					appendFile.getStyles().body.push(style);
					tab.area.find(".tab-ass-appends textarea").val(appendFile.toText());
				}
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
	
	const style = hold.style = (info.style ? info.style : JSON.parse(JSON.stringify(Subtitle.DefaultStyle)));
	if (style.Fontname == Subtitle.DefaultStyle.Fontname) {
		style.Fontname = "";
	}
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
			
			let withSmi = false;
			let withSrt = false;
			let withAss = false;
			
			if (match && match[1]) {
				const attrs = match[1].toUpperCase().split(" ");
				for (let i = 0; i < attrs.length; i++) {
					if (attrs[i] == "SMI") {
						withSmi = true;
					} else if (attrs[i] == "SRT") {
						withSrt = true;
					} else if (attrs[i] == "ASS") {
						withAss = true;
					}
				}
			}
			tab.withSmi = withSmi;
			tab.withSrt = withSrt;
			if (tab.withAss != withAss) {
				if (withAss) {
					tab.withAss = true;
					tab.area.addClass("ass");
					tab.updateHoldSelector();
				} else {
					tab.withAss = false;
					tab.area.removeClass("ass");
					tab.updateHoldSelector();
				}
			}
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
				let value = $input.val();
				if (isFinite(value)) {
					value = Number(value);
				} else {
					value = 0;
				}
				hold.style[name] = value;
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
				
			}).on("click", "button.hold-style-preview-toggle", function() {
				$preview.toggleClass("script");
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
	
	return hold;
}
SmiEditor.prototype.setStyle = function(style) {
	if (style.Fontname == Subtitle.DefaultStyle.Fontname) {
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
	if (style.Fontname == Subtitle.DefaultStyle.Fontname) {
		style.Fontname = "";
	}
	
	const css = {};
	css.fontFamily = style.Fontname ? (style.Fontname.startsWith("@") ? style.Fontname.substring(1) : style.Fontname) : Subtitle.DefaultStyle.Fontname;
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
	
	{	// ASS 스크립트 미리보기
		if (!this.assStyle) {
			this.assStyle = new AssPart("V4+ Styles", AssPart.StylesFormat);
			this.assStyle.body.push({});
		}
		const style = SmiFile.toAssStyle(this.style);
		style.Name = this.name;
		this.assStyle.body[0] = style;
		this.$preview.find("textarea[name=script]").val(this.assStyle.toText() + "\n"); // 블록지정 편의성을 위해 줄바꿈 추가
	}
	
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
	if (this.area.hasClass("ass")) {
		alert("SMI 에디터 모드가 아닙니다.");
		return;
	}
	if (this.area.hasClass("style")) {
		if (text.length == 7 && text.startsWith("#")) {
			this.style.PrimaryColour = text;
			this.area.find("input[name=PrimaryColour]").val(text).next().val(text);
			this.refreshStyle();
		} else {
			alert("SMI 에디터 모드가 아닙니다.");
			return;
		}
	} else {
		this._inputText(text);
	}
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
		
		// 종료된 홀드를 먼저 빼주지 않으면 과잉 보정 발생
		timer.holds.sort((a, b) => {
			if (a.type < b.type)
				return -1;
			if (a.type > b.type)
				return 1;
			return 0;
		});
		
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
	const funcSince = log("replaceBeforeSave start");
	
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
	
	log("replaceBeforeSave end", funcSince);
}
Tab.prototype.getAdditionalToAss = function(forSmi=false) {
	const funcSince = log("getAdditionalToAss start");
	
	const assFile = new AssFile(" "); // 기본 part 없이 생성
	
	let frameSyncs = [];
	{
		let syncs = this.assHold.assEditor.getFrameSyncs();
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
	const info = assFile.getInfo(true);
	info.set("VideoInfo", videoPath);
	info.set("FrameSyncs", frameSyncs.join(","));
	
	let appends = this.area.find(".tab-ass-appends textarea").val();
	if (appends.trim().length) {
		const appendFile = new AssFile(appends);
		for (let i = 0; i < appendFile.parts.length; i++) {
			const appendPart = appendFile.parts[i];
			if (appendPart.name == "Script Info") continue;
			if (appendPart.name == "Events") continue;
			if (appendPart.name == "V4+ Styles") {
				const part = assFile.getStyles();
				for (let j = 0; j < appendPart.body.length; j++) {
					const appendStyle = appendPart.body[j];
					let style = null;
					for (let k = 0; k < part.body.length; k++) {
						if (part.body[k].Name == appendStyle.Name) {
							style = part.body[k];
							break;
						}
					}
					if (style) {
						// TODO: 이미 있어도 덮어쓰는 게 맞을까...?
					} else {
						part.body.push(appendStyle);
					}
				}
			} else {
				const part = assFile.getPart(appendPart.name);
				if (part) {
					part.body.push(...appendPart.body);
				} else {
					assFile.parts.push(appendPart);
				}
			}
		}
	}
	
	let events = this.assHold.assEditor.toEvents();
	assFile.getEvents().body = events;
	
	log("getAdditionalToAss end", funcSince);
	
	if (forSmi) {
		assFile.getEvents().format = AssEditor.FormatToSave;
		const assText = assFile.toText();
		if (assText) {
			return "\n<!-- ASS\n" + assText + "\n-->";
		} else {
			return "";
		}
		
	} else {
		return assFile;
	}
}
Tab.prototype.getSaveText = function(withNormalize=true, withCombine=true, withComment=1) {
	const funcSince = log("getSaveText start");
	const result = SmiFile.holdsToText(this.holds, withNormalize, withCombine, withComment, Subtitle.video.FR / 1000)
		+ (((withComment > 0) && this.withAss) ? this.getAdditionalToAss(true) : ""); // ASS 추가 내용 footer에 넣어주기
	log("getSaveText end", funcSince);
	return result;
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
	const funcSince = log("toAss start");
	
	const assFile = new AssFile(null, Subtitle.video.width, Subtitle.video.height);
	const assStyles = assFile.getStyles();
	const assEvents = assFile.getEvents();
	
	// 스타일/이벤트는 뺐다가 뒤쪽에 다시 추가
	assFile.parts.length = 1;
	const append = this.getAdditionalToAss();
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
		const style = hold.style ? hold.style : Subtitle.DefaultStyle;
		
		if ((style.output & 0b10) == 0) {
			// ASS 변환 대상 제외
			syncs.push(hold.syncs = []);
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
		if (h == 0) {
			// 메인 홀드에서 <title> 확인
			const h0 = hold.smiFile.header.search(/<title>/gi);
			if (h0 > 0) {
				const h1 = hold.smiFile.header.search(/<\/title>/gi);
				if (h1 > 0) {
					const title = hold.smiFile.header.substring(h0 + 7, h1);
					assFile.getInfo().body.push({ key: "Title", value: title });
				}
			}
		}
		
		const smis = hold.smiFile.body;
		
		const assComments = []; // ASS 주석에서 복원한 목록
		const toAssEnds = {};
		for (let i = 0; i < smis.length; i++) {
			const smi = smis[i];
			{	// 앞에서 나온 ASS 형태에 종료싱크 채워주기
				const toAssEnd = toAssEnds[i];
				if (toAssEnd) {
					for (let j = 0; j < toAssEnd.length; j++) {
						if (!toAssEnd[j][7]) {
							toAssEnd[j][2] += smi.start;
						}
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
			
			// ASS 주석에 [TEXT] 있을 경우 넣을 내용물 ([SMI]는 후처리 필요해서 빼둠)
			let smiText = Subtitle.$tmp.html(smi.text.split(/<br>/gi).join("\\N")).text();
			while (smiText.indexOf("\\N　\\N") >= 0) { smiText = smiText.split("\\N　\\N").join("\\N"); }
			while (smiText.indexOf("\\N\\N"  ) >= 0) { smiText = smiText.split("\\N\\N"  ).join("\\N"); }
			
			// ASS 주석에서 복원
			for (let j = 0; j < assTexts.length; j++) {
				const assText = assTexts[j];
				let ass = assText.split("[TEXT]").join(smiText)
				                 .split("\n").join("") // 비태그 줄바꿈은 무시해야 함
				                 .split(",");
				
				let layer = 0;
				let span = 1;
				let addStart = 0;
				let addEnd = 0;
				let style = name;
				let text = "";
				let addEndFromStart = false;
				
				if (isFinite(ass[0])) {
					layer = ass[0];
					let type = null;
					
					if (ass.length >= 5) {
						if (ass[1] == "") { // span 형식
							type = "span";
							if (ass[2] == "") {
								// [Layer, -, -, Style, Text]
								if (ass[3]) style = ass[3];
								text = ass.slice(4).join(",");
								
							} else if (isFinite(ass[2])) {
								// [Layer, -, span, Style, Text]
								span = Number(ass[2]);
								if (ass[3]) style = ass[3];
								text = ass.slice(4).join(",");
								
							} else if (ass[3].endsWith(")")) {
								let ass2 = ass[2].split("(");
								let ass3 = ass[3].split(")");
								if (ass2.length == 2
								 && isFinite(ass2[0])
								 && isFinite(ass2[1])
								 && isFinite(ass3[0])
								) {
									// [Layer, -, span(add, add), Style, Text]
									span = Number(ass2[0]);
									addStart = Number(ass2[1]);
									addEnd   = Number(ass3[0]);
									if (ass[4]) style = ass[4];
									text = ass.slice(5).join(",");
								}
							}
						} else if (isFinite(ass[1])) { // add 형식
							type = "add";
							addStart = Number(ass[1]);
							if (isFinite(ass[2])) {
								addEnd = Number(ass[2]);
								if (ass[2].startsWith("+")) { // +로 시작할 경우 시작 싱크를 기준으로
									addEnd += smi.start;
									addEndFromStart = true;
								}
							} else {
								addEnd = addStart;
							}
							if (ass[3]) style = ass[3];
							text = ass.slice(4).join(",");
						}
					}
					if (!type) {
						// 싱크 변형 없이 스타일이 나오는 형식
						// [Layer, Style, Text]
						style = ass[1];
						text = ass.slice(2).join(",");
					}
				} else {
					// 텍스트만 입력
					text = ass.join(",");
				}
				
				ass = [layer, smi.start + addStart, addEnd, style, text, smi, assText, addEndFromStart];
				let toAssEnd = toAssEnds[i + span];
				if (toAssEnd == null) {
					toAssEnd = toAssEnds[i + span] = [];
				}
				toAssEnd.push(ass);
				assComments.push(ass);
			}
		}
		if (assComments.length && assComments[assComments.length - 1][2] == 0) {
			// 마지막에 종료싱크 없을 때
			assComments[assComments.length - 1][2] = 999999999;
		}
		
		// 주석 기반 스크립트
		for (let i = 0; i < assComments.length; i++) {
			const item = assComments[i];
			const event = new AssEvent(item[1], item[2], item[3], item[4], item[0]);
			event.owner = item[5];
			event.comment = item[6];
			assEvents.body.push(event);
			
			// [SMI]는 후처리 결과를 반영해야 함
			if (event.comment.indexOf("[SMI]") >= 0) {
				if (!event.owner.preAss) {
					event.owner.preAss = [];
				}
				event.owner.preAss.push(event);
			}
		}
		
		// SMI 기반 스크립트
		syncs.push(hold.syncs = hold.smiFile.toSyncs());
	}
	{	// 홀드 결합 pos 자동 조정
		const an2Holds = [];
		for (let h = 0; h < holds.length; h++) {
			const hold = holds[h];
			if (hold.style
			 && !(   hold.style.Alignment == 2
			      || hold.style.Alignment == 5
			     )
			) continue; // ASS에서 정중앙 혹은 중앙 하단이 아니면 제외
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
					
					let useBottom = true; // a2Holds에 애초에 걸러진 것만 있음
					for (let j = 0; j < sync.text.length; j++) {
						const ass = sync.text[j].ass;
						if (ass && (ass.indexOf("\\an") > 0)) {
							const an = ass[ass.indexOf("\\an") + 3];
							if (an % 3 != 2) {
								// 개별적으로 좌우 구석에 밀었을 경우 제외
								useBottom = false;
								break;
							}
						}
					}
					if (!useBottom) {
						// \pos를 지정했으면 좌우 구석이 아니므로 중앙 높이를 차지할 수 있음
						for (let j = 0; j < sync.text.length; j++) {
							const ass = sync.text[j].ass;
							if (ass && (ass.indexOf("\\pos") > 0)) {
								useBottom = true;
								break;
							}
						}
					}
					if (!useBottom) {
						continue;
					}
					
					let used = 0;
					
					// 이미 확인된 줄과 비교
					let j = 0
					for (; j < usedLines.length; j++) {
						if (sync.start == usedLines[j].start) {
							used = usedLines[j].used;
							break;
						} else if (sync.start < usedLines[j].start) {
							used = (j > 0) ? usedLines[j - 1].used : 0;
							break;
						}
					}
					
					const nextLines = [];
					let k = j;
					for (; k < usedLines.length; k++) {
						if (sync.end == usedLines[k].start) {
							break;
						} else if (sync.end < usedLines[k].start) {
							nextLines.push({ start: sync.end, used: ((k > 0) ? usedLines[k - 1].used : 0) });
							break;
						}
						used = Math.max(used, usedLines[k].used);
					}
					if (k == usedLines.length) {
						// 뒤쪽이 없었으면 끝내기 잡아줌
						nextLines.push({ start: sync.end, used: 0 });
					}
					
					sync.bottom = used;
					used += sync.getTextOnly().split("\n").length;
					
					nextLines.push(...usedLines.slice(k));
					usedLines.length = j;
					if (j > 0 && usedLines[j - 1].used == used) {
						// 앞쪽이랑 같으면 건너뜀
					} else {
						usedLines.push({ start: sync.start, used: used });
					}
					usedLines.push(...nextLines);
				}
			}
		}
	}
	for (let h = 1; h < holds.length; h++) {
		// TODO: 이게 맞나? 샘플 테스트 필요
		// SMI에서 용도가 다른 <b> 태그 속성 없애고 진행
		for (let i = 0; i < syncs[h].length; i++) {
			const attrs = syncs[h][i].text;
			for (let j = 0; j < attrs.length; j++) {
				if (attrs[j].b) {
					attrs[j].b = false;
				}
			}
		}
		// 홀드 내용물 추가
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
					if (item.start == 0) item.start = 1;
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
	// 애초에 여긴 SMI 저장 이후에 돌아가는 부분인데?
	
	log("toAss end", funcSince);
	
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
		if (this.style.Fontname == Subtitle.DefaultStyle.Fontname) {
			this.style.Fontname = "";
		}
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
	const funcSince = log("init start");
	
	if (!SmiEditor.tabPreset) {
		const tabPreset = $("#tabPreset");
		SmiEditor.tabPreset = tabPreset.clone();
		SmiEditor.tabPreset.attr({ id: null });
		tabPreset.remove();
	}
	if (!SmiEditor.assHoldPreset) {
		const assHoldPreset = $("#assHoldPreset");
		SmiEditor.assHoldPreset = assHoldPreset.clone();
		SmiEditor.assHoldPreset.attr({ id: null });
		assHoldPreset.remove();
	}
	if (!SmiEditor.stylePreset) {
		const holdStylePreset = $("#holdStylePreset");
		SmiEditor.stylePreset = holdStylePreset.clone();
		SmiEditor.stylePreset.attr({ id: null });
		holdStylePreset.remove();
	}
	
	try {
		setting = JSON.parse(jsonSetting);
		if (typeof setting != "object") {
			if (!isBackup) {
				log("repairSetting");
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
			if (!setting.defStyle) {
				setting.defStyle = JSON.parse(JSON.stringify(DefaultStyle));
				setting.defStyle.Fontname = "맑은 고딕";
				count++;
			}
			Subtitle.DefaultStyle = setting.defStyle;
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
			log("repairSetting");
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
	
	$("#assSplitHoldSelectorPopup").on("click", "button", function() {
		const data = $(this).data();
		if (data.tab && data.style) {
			splitHold(data.tab, data.style);
		}
		$("#assSplitHoldSelector").hide();
	});
	
	// ::-webkit-scrollbar에 대해 CefSharp에서 커서 모양이 안 바뀜
	// ... 라이브러리 버그? 업데이트하면 달라지나?
	$("body").on("mousemove", "textarea", function(e) {
		$(this).css({ cursor: ((this.clientWidth <= e.offsetX) || (this.clientHeight <= e.offsetY) ? "default" : "text") });
	});
	
	SmiEditor.activateKeyEvent();
	
	// Win+방향키 이벤트 직후 창 위치 초기화
	const winKeyStatus = [0, 0];
	$(window).on("keydown", function (e) {
		if (e.keyCode == 27) { // ESC
			if (SmiEditor.selected) {
				const hold = SmiEditor.selected;
				if (hold.styleArea) {
					// SMI 홀드 스타일 창 닫기
					if (hold.area.hasClass("style")) {
						hold.area.removeClass("style");
						if (SmiEditor.Viewer.window) {
							SmiEditor.Viewer.refresh();
						}
					}
				}
			}
		}
	}).on("keyup", function (e) {
		if (e.metaKey) {
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
			}
		}
	});
	
	setSetting(setting, true);
	SmiEditor.Viewer.open(); // 스타일 세팅 설정 완료 후에 실행
	moveWindowsToSetting();
	
	autoSaveTemp = setInterval(() => {
		saveTemp();
	}, setting.tempSave * 1000);
	
	log("init end", funcSince);
	
	binder.afterInit(setting.useTab ? 4 : 1);
}

function setSetting(setting, initial=false) {
	const funcSince = log("setSetting start");
	
	const oldSetting = window.setting;
	
	// 탭 on/off 먼저 해야 height값 계산 가능
	if (setting.useTab) {
		$("body").addClass("use-tab");
	} else {
		$("body").removeClass("use-tab");
	}
	
	SmiEditor.setSetting(setting);
	if (initial && oldSetting.scrollShow == undefined) {
		setting.scrollShow = 0; // 기존 사용자는 0초로 초기화
	}
	if (initial
	 || (               oldSetting.size       !=                setting.size      )
	 || (               oldSetting.scrollShow !=                setting.scrollShow)
	 || (JSON.stringify(oldSetting.color)     != JSON.stringify(setting.color)    )
	) {
		// 스타일 바뀌었을 때만 재생성
		if (setting.css) {
			delete(setting.css);
		}
		
		// 스크롤바 버튼 새로 그려야 함
		let button = "";
		let disabled = "";
		if (setting.scrollShow == 0) {
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
					if (button.length) {
						preset = preset.split("[button]").join(button).split("[buttonDisabled]").join(disabled);
						$("body").addClass("classic-scrollbar");
					} else {
						$("body").removeClass("classic-scrollbar");
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
		
		binder.setThumbnailSize(setting.sync.width, setting.sync.height);
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
				binder.setPlayer(dll, playerSetting.path, playerSetting.withRun, setting.player.window.use);
			}
		}
	}
	
	Combine.css = setting.viewer.css;
	//	DefaultStyle.Fontsize = Number(setting.viewer.size) / 18 * 80;
	if (!setting.defStyle) {
		setting.defStyle = {
				"Fontname": "맑은 고딕"
			,	"Fontsize": 80
			,	"PrimaryColour"  : "#FFFFFF"
			,	"SecondaryColour": "#FF0000"
			,	"OutlineColour"  : "#000000"
			,	"BackColour"     : "#000000"
			,	"PrimaryOpacity"  : 255
			,	"SecondaryOpacity": 255
			,	"OutlineOpacity"  : 255
			,	"BackOpacity"     : 255
			,	"Bold"     : true
			,	"Italic"   : false
			,	"Underline": false
			,	"StrikeOut": false
			,	"ScaleX": 100
			,	"ScaleY": 100
			,	"Spacing": 0
			,	"Angle": 0
			,	"BorderStyle": false
			,	"Outline": 4
			,	"Shadow": 0
			,	"Alignment": 2
			,	"MarginL": 64
			,	"MarginR": 64
			,	"MarginV": 40
			,	"output": 3
		}
	}
	Subtitle.DefaultStyle = setting.defStyle;
	
	$("input[name=Fontname]").attr({ placeholder: Subtitle.DefaultStyle.Fontname });
	SmiEditor.stylePreset.find("input[name=Fontname]").attr({ placeholder: Subtitle.DefaultStyle.Fontname });
	
	binder.setMenus(setting.menu);
	
	window.setting = JSON.parse(JSON.stringify(setting));
	
	// 새 파일 양식은 세팅 로딩이 완료된 후에 갖춰짐
	if (!setting.useTab && !tabs.length) {
		// 탭 기능 껐을 땐 에디터 하나 열린 상태
		newFile();
	}
	
	log("setSetting end", funcSince);
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
	setTimeout(() => { refreshPaddingBottom(); }, 1);
	setTimeout(() => { refreshPaddingBottom(); }, 100); // 딜레이 버그 보완책으로 한 번 더 돌림
	
	// 설정에 따른 이동이었으면 웹샘플에서 설정창 맨 위로
	binder.focus("setting");
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
			, (setting.window.x < setting.player.window.x && setting.window.width < 880)
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
			, (setting.window.x < setting.player.window.x && setting.window.width < 880)
			  ? (setting.window.x + (40 * DPI))
			  : (setting.window.x + setting.window.width - (840 * DPI))
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
	$("#assSplitHoldSelector").hide();
	runIfCanOpenNewTab(openNewTab);
}

function openFile(path, text, forVideo) {
	const funcSince = log("openFile start");
	
	$("#assSplitHoldSelector").hide();
	
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
function openFileForVideo() {
	runIfCanOpenNewTab(() => {
		// C#에서 동영상의 자막 파일 탐색
		binder.openFileForVideo();
	});
}

let lastSave = 0; // 과도한 저장(Ctrl+S가 눌리거나 한 경우) 중복 실행 방지용
let exporting = false;
function saveFile(asNew, isExport) {
	const now = new Date().getTime();
	if (lastSave > (now - 5000)) {
		// 중복 실행인 경우 실행하지 않음
		// 5초를 넘긴 경우는 튕긴 걸로 간주해서 허용
		return;
	}
	lastSave = now;
	
	setTimeout(() => {
		const funcSince = log("saveFile start");
		
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
		
		let withSmi = !isExport && currentTab.withSmi; // SMI 내보내기 시엔 처리하지 않음
		let smiPath = "";
		if (withSmi) {
			// 프로젝트 파일 경로 기반으로
			if (path) {
				if (path.toLowerCase().endsWith(".sami")
				 || path.toLowerCase().endsWith(".smi")) {
					withSmi = false; // smi 파일을 직접 프로젝트로 쓰는 경우 별도 저장 없음
					
				} else {
					if (path.indexOf("\\") > 0 || path.indexOf("/") >= 0) {
						// 웹샘플 파일명이면 여기로 못 들어옴
						if (path.toLowerCase().endsWith(".jmk")) {
							smiPath = path.substring(0, path.length - 3) + "smi";
						} else {
							smiPath = path + ".smi";
						}
					} else if (currentTab.smiPath) {
						// 웹샘플에서 이미 저장한 적 있을 경우
						smiPath = currentTab.smiPath;
					}
				}
			} else {
				alert("최초 프로젝트 파일 생성 시엔 SMI 파일이 생성되지 않습니다.");
				withSmi = false;
			}
		}
		
		let withSrt = !isExport && currentTab.withSrt; // SMI 내보내기 시엔 처리하지 않음
		let srtPath = "";
		if (withSrt) {
			// 프로젝트 파일 경로 기반으로
			if (path) {
				if (path.indexOf("\\") > 0 || path.indexOf("/") >= 0) {
					// 웹샘플 파일명이면 여기로 못 들어옴
					if (path.toLowerCase().endsWith(".sami")) {
						srtPath = path.substring(0, path.length - 4) + "srt";
					} else if (path.toLowerCase().endsWith(".smi")) {
						srtPath = path.substring(0, path.length - 3) + "srt";
					} else if (path.toLowerCase().endsWith(".jmk")) {
						srtPath = path.substring(0, path.length - 3) + "srt";
					} else {
						srtPath = path + ".srt";
					}
				} else if (currentTab.srtPath) {
					// 웹샘플에서 이미 저장한 적 있을 경우
					srtPath = currentTab.srtPath;
				}
			} else {
				alert("최초 SMI 파일 생성 시엔 SRT 파일이 생성되지 않습니다.");
				withSmi = false;
			}
		}
		
		let withAss = !isExport && currentTab.withAss; // SMI 내보내기 시엔 처리하지 않음
		if (withAss) {
			const appendFile = currentTab.getAdditionalToAss();
			const appendStyles = appendFile.getStyles();
			
			const assStyles = {};
			{
				for (let i = 0; i < appendStyles.body.length; i++) {
					const assStyle = appendStyles.body[i];
					const arrStyle = [];
					arrStyle.push(assStyle.Fontname);
					arrStyle.push(assStyle.Fontsize);
					arrStyle.push(assStyle.PrimaryColour  );
					arrStyle.push(assStyle.SecondaryColour);
					arrStyle.push(assStyle.OutlineColour  );
					arrStyle.push(assStyle.BackColour     );
					arrStyle.push(assStyle.Bold       );
					arrStyle.push(assStyle.Italic     );
					arrStyle.push(assStyle.Underline  );
					arrStyle.push(assStyle.StrikeOut  );
					arrStyle.push(assStyle.ScaleX     );
					arrStyle.push(assStyle.ScaleY     );
					arrStyle.push(assStyle.Spacing    );
					arrStyle.push(assStyle.Angle      );
					arrStyle.push(assStyle.BorderStyle);
					arrStyle.push(assStyle.Outline    );
					arrStyle.push(assStyle.Shadow     );
					arrStyle.push(assStyle.Alignment  );
					arrStyle.push(assStyle.MarginL    );
					arrStyle.push(assStyle.MarginR    );
					arrStyle.push(assStyle.MarginV    );
					assStyles[assStyle.Name] = SmiFile.parseStyle(arrStyle.join(","));
					assStyles[assStyle.Name].orig = assStyle;
				}
				
				const hold = currentTab.holds[0];
				const saveStyle = SmiFile.toSaveStyle(hold.style);
				
				const assStyle = assStyles["Default"];
				if (assStyle) {
					if (assStyle && SmiFile.toSaveStyle(assStyle) != saveStyle) {
						alert("ASS 추가 스크립트에서 설정한 스타일과 홀드의 스타일이 다릅니다.\n[메인] 홀드 스타일을 수정합니다.");
						hold.setStyle(assStyle);
					}
					assStyle.orig.hasHold = true;
				}
			}
			const smiStyles = {};
			for (let i = 1; i < currentTab.holds.length; i++) {
				const hold = currentTab.holds[i];
				const saveStyle = SmiFile.toSaveStyle(hold.style);
				
				const assStyle = assStyles[hold.name];
				if (assStyle) {
					// ASS 스타일이 있으면 따라감
					if (SmiFile.toSaveStyle(assStyle) != saveStyle) {
						alert("ASS 추가 스크립트에서 설정한 스타일과 홀드의 스타일이 다릅니다.\n[" + hold.name + "] 홀드 스타일을 수정합니다.");
						hold.setStyle(assStyle);
					}
					assStyle.orig.hasHold = true;
					
				} else {
					// ASS 스타일이 없으면 홀드 스타일끼리 비교
					if (typeof smiStyles[hold.name] == "string") {
						if (smiStyles[hold.name] != saveStyle) {
							const from = hold.name;
							let to = null;
							for (let j = 1; ; j++) {
								to = hold.name + j;
								if (typeof smiStyles[to] == "undefined") {
									break;
								}
							}
							alert("같은 이름의 홀드끼리 스타일이 일치하지 않습니다.\n임의로 이름을 변경합니다.\n" + from + " -> " + to);
							hold.name = to;
							hold.selector.find(".hold-name > span").text(hold.owner.holds.indexOf(hold) + "." + hold.name);
							hold.selector.attr({ title: hold.name });
							hold.afterChangeSaved(hold.isSaved());
							smiStyles[hold.name] = saveStyle;
						}
					} else {
						smiStyles[hold.name] = saveStyle;
					}
				}
			}
			
			let removeCount = 0;
			const requiredStyles = [];
			for (let i = 0; i < appendStyles.body.length; i++) {
				if (appendStyles.body[i].hasHold) {
					removeCount++;
				} else {
					requiredStyles.push(appendStyles.body[i]);
				}
			}
			if (removeCount) {
				appendStyles.body = requiredStyles;
				
				const appendWithoutEvents = new AssFile(" ");
				for (let i = 0; i < appendFile.parts.length; i++) {
					const part = appendFile.parts[i];
					if (part.name == "Events") continue;
					appendWithoutEvents.parts.push(part);
				}
				currentTab.area.find(".tab-ass-appends textarea").val(appendWithoutEvents.toText());
			}
		}
		
		let assPath = "";
		if (withAss) {
			// 프로젝트 파일 경로 기반으로
			if (path) {
				if (path.indexOf("\\") > 0 || path.indexOf("/") >= 0) {
					// 웹샘플 파일명이면 여기로 못 들어옴
					if (path.toLowerCase().endsWith(".sami")) {
						assPath = path.substring(0, path.length - 4) + "ass";
					} else if (path.toLowerCase().endsWith(".smi")) {
						assPath = path.substring(0, path.length - 3) + "ass";
					} else if (path.toLowerCase().endsWith(".jmk")) {
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
		}
		
		log("saveFile end", funcSince);
		
		function saveAfterConfirm() {
			lastSave = new Date().getTime();
			
			const saveText = path.endsWith(".jmk")
			               ? currentTab.getSaveText(false, false) // 프로젝트 파일에선 정규화하지 않고 원본 저장만 진행
			               : currentTab.getSaveText(setting.saveWithNormalize, true, (exporting = isExport) ? -1 : 1);
			
			const saveFrom = log("binder.save start");
			binder.save(tab, saveText, path, 0);
			log("binder.save end", saveFrom);
			
			if (withSmi || withSrt) {
				const smiText = currentTab.getSaveText(setting.saveWithNormalize, true, -1);
				
				if (withSmi) {
					const saveSmiFrom = log("binder.save smi start");
					binder.save(tab, smiText, smiPath, 1);
					log("binder.save smi end", saveSmiFrom);
				}
				if (withSrt) {
					// TODO: 위에서 getSaveText 구하는 중간 단계 SmiFile을 쓸 수 있으면 좀 더 효율적이겠지만...
					const syncs = new SmiFile(smiText).toSyncs();
					const srtFile = new SrtFile().fromSyncs(syncs);
					binder.save(tab, srtFile.toText(), srtPath, 3);
					const saveSrtFrom = log("binder.save srt start");
					
					log("binder.save srt end", saveSrtFrom);
				}
			}
			if (withAss) {
			    if (Subtitle.video.fs.length) {
					const assText = currentTab.toAss().toText();
					
					const saveAssFrom = log("binder.save ass start");
					binder.save(tab, assText, assPath, 2);
					log("binder.save ass end", saveAssFrom);
					
			    } else {
			        alert("동영상 프레임 분석이 끝나야 ASS 파일을 생성할 수 있습니다.");
				}
			}
			
			lastSave = 0;
		}
		
		if (syncError) {
			confirm("싱크 오류가 있습니다.\n저장하시겠습니까?", function() {
				saveAfterConfirm();
				
			}, function() {
				const hold = currentTab.holds[syncError[0]];
				currentTab.selectHold(hold);
				
				const lineNo = syncError[1];
				const cursor = (lineNo ? hold.text.split("\n").slice(0, lineNo).join("\n").length + 1 : 0);
				hold.setCursor(cursor);
				hold.scrollToCursor(lineNo);
			});
		} else {
			saveAfterConfirm();
		}
	});
}

// 저장 후 C# 쪽에서 호출
function afterSaveFile(tab, path) { // 저장 도중에 탭 전환할 수 있어서 파라미터로 유지함
	const funcSince = log("afterSaveFile start");
	
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
	
	log("afterSaveFile end", funcSince);
}
// 웹버전에서만 활용
function afterSaveSmiFile(tab, path) {
	tabs[tab].smiPath = path;
}
// 웹버전에서만 활용
function afterSaveAssFile(tab, path) {
	tabs[tab].assPath = path;
}
// 웹버전에서만 활용
function afterSaveSrtFile(tab, path) {
	tabs[tab].srtPath = path;
}

// TODO: 임시 저장은 현재 탭만이 아니라 모든 탭에 동작해야 하나...?
// 근데 그렇게 쓸 일 자체가 없을 듯하긴 함
function saveTemp() {
	const currentTab = tabs[tab];
	if (!currentTab) {
		return;
	}
	const funcSince = log("saveTemp start");
	
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
		const path = currentTab.path ? currentTab.path : "\\new.jmk";
		binder.saveTemp(currentTab.getSaveText(false, false), path);
		for (let i = 0; i < currentTab.holds.length; i++) {
			currentTab.holds[i].tempSavedText = texts[i];
		}
		currentTab.area.addClass("tmp-saved");
	}
	log("saveTemp end", funcSince);
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
	const funcSince = log("openNewTab start");
	
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
	log("openNeweTab end", funcSince);
	
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
	log("setVideo");
	
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
	log("setVideoInfo");
	
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
	log("loadFkf start");
	// C# 파일 객체를 js 쪽에 전달할 수 없으므로, 정해진 경로의 파일을 ajax 형태로 가져옴
	const req = new XMLHttpRequest();
	req.open("GET", "../temp/fkf/" + encodeURIComponent(fkfName));
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
	log("loadFkfFile start");
	const fr = new FileReader();
	fr.onload = function(e) {
		afterLoadFkfFile(e.target.result);
	}
	fr.readAsArrayBuffer(file);
}
function afterLoadFkfFile(buffer) {
	log("afterLoadFkfFile");
	
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
	const funcSince = log("afterSetFkf start");
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
	log("afterSetFkf end", funcSince);
}

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
	let funcSince = log("loadAssFile start");
	
	// SMI -> ASS 변환 결과
	const originFile = currentTab.toAss(true);
	funcSince = log("loadAssFile - originFile", funcSince);
	
	// 따로 불러온 ASS 파일
	const targetFile = new AssFile(text);
	funcSince = log("loadAssFile - targetFile", funcSince);
	
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
	funcSince = log("loadAssFile - 정렬완료", funcSince);
	
	// 불일치 부분 확인 및 보정
	const appendFile = new AssFile(currentTab.area.find(".tab-ass-appends textarea").val());
	{
		const stylePart = appendFile.getStyles();
		appendFile.parts.length = 0;
		
		// 스타일 이외의 부분은 ASS 파일에서 불러온 값으로 채워줌
		for (let i = 0; i < targetFile.parts.length; i++) {
			const part = targetFile.parts[i];
			if (part.name == "Script Info") continue;
			if (part.name == "Events") continue;
			if (part.name == "V4+ Styles") {
				appendFile.parts.push(stylePart);
				continue;
			}
			appendFile.parts.push(part);
		}
	}
	funcSince = log("loadAssFile - appendFile", funcSince);
	
	// 홀드 스타일과 ASS 스타일 비교
	const styles = {}; // 아래에서도 필요해짐
	const changedStyles = [];
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
				let styleChanged = false;
				for (let j = 0; j < part.format.length; j++) {
					const f = part.format[j];
					if (style[f] != genStyle[f]) {
						changedStyles.push(style);
						styleChanged = true;
						break;
					}
				}
			} else {
				changedStyles.push(style);
			}
		}
	}
	funcSince = log("loadAssFile - 스타일 확인 완료", funcSince);
	
	{	// SMI->ASS 변환 결과와 불러온 ASS 비교
		
		// 체크 대상
		// SMI 주석 | ASS
		//  ○      |  × : SMI 기반 생성물 중 삭제해야 하는 것
		//      ○  |  × : 주석 기반 생성물 중 삭제해야 하는 것
		//  ○      |  ○ : SMI와 일치하는 것
		//  △      |  ○ : SMI 기반으로 수정 가능한 것
		//  ×      |  ○ : SMI 기반으로 만들 수 없는 것
		//      ○  |  ○ : 주석 기반 생성물과 일치하는 것
		//  ×  ×  |  ○ : 기존에 없던 스크립트
		
		// ASS에만 있는 부분은 기본적으로 화면 싱크로 간주
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
		let addCount = 0;
		let delCount = 0;
		while (ti < targetEvents.length) {
			const tEvent = targetEvents[ti];
			while ((oi < originEvents.length) && (originEvents[oi].Start < tEvent.Start)) {
				// ASS 출력 제외 대상
				const origin = originEvents[oi].origin;
				if (origin && !origin.origin.skip) {
					origin.origin.skip = true;
				}
				delCount++;
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
						if (t) {
							let targetTags = [];
							let targetText = t.Text;
							
							if (targetText.startsWith("{")) {
								const end = targetText.indexOf("}");
								if (end > 0) {
									targetTags = targetText.substring(1, end).split("\\").slice(1);
									targetText = targetText.substring(end + 1);
								}
							}
							
							let attrs = o.origin.text;
							// 원래 있던 추가 ass 태그 삭제 후 비교
							while (attrs.length && attrs[0].ass && !attrs[0].text) {
								attrs = attrs.slice(1);
							}
							while (attrs.length > 1 && attrs[attrs.length - 1].ass && !attrs[attrs.length - 1].text) {
								attrs.length--;
							}
							let originTexts = AssEvent.fromAttrs(attrs);
							if (originTexts.length == 1) {
								// RUBY 태그 등으로 여러 개로 분리됐으면 미지원
								
								let originTags = [];
								let originText = originTexts[0];
								
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
										
										let originSmi = o.origin.origin.text;
										if (attrs.length < o.origin.text.length) {
											// 비교 전에 제거한 게 있었으면 SMI 재구성
											// TODO: 완전 재구성보다는 ass 태그만 삭제할 수 있으면 그게 더 좋을 듯?
											originSmi = Smi.fromAttrs(attrs).split("\n").join("<br>");
											delCount++;
										}
										o.origin.origin.text = prev + originSmi + next;
										o.origin.origin.skip = false;
										o.found = t.found = true;
										t.origin = o.origin;
										addCount++;
									}
								}
							}
						}
					}
					
				} else {
					// ASS 전용 스크립트
					for (let tj = 0; tj < targets.length; tj++) {
						const t = targets[tj];
						if (t.found) {
							// 이미 매칭된 건 제외
							continue;
						}
						if (o.Style == t.Style && o.Text == t.Text) {
							if (o.comment) {
								// 주석에서 생성된 경우 원형 가져오기
								let assComments = (t.owner = o.owner).assComments;
								if (!assComments) {
									assComments = t.owner.assComments = [];
								}
								assComments.push(o.comment);
							} else {
								// ASS 에디터 생성물인 경우
							}
							t.found = o.found = true;
							break;
						}
					}
				}
				if (!o.found) {
					// SMI->ASS 변환 제외 필요
					if (o.origin) {
						o.origin.origin.skip = true;
					}
					delCount++;
				}
			}
			for (let tj = 0; tj < targets.length; tj++) {
				const t = targets[tj];
				if (!t.found) {
					// 기존에 없던 ASS 스크립트 카운트
					addCount++;
				}
				if (!t.origin && !t.owner) {
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
			delCount++;
			oi++;
		}
		for (oi = 0; oi < originEvents.length; oi++) {
			// 주석 기반 생성물 중 삭제 대상 확인
			const event = originEvents[oi];
			if (event.origin) {
				// SMI 기반 생성물
				continue;
			}
		}
		
		funcSince = log("loadAssFile - 비교 완료", funcSince);
		
		if (changedStyles.length + addCount + delCount > 0) {
			console.log(changedStyles);
			let msg = "스타일 수정 내역이 " + changedStyles.length + "건 있습니다. 적용하시겠습니까?";
			if (addCount + delCount) {
				let countMsg = [];
				if (addCount) countMsg.push("추가 " + addCount + "건");
				if (delCount) countMsg.push("삭제 " + addCount + "건");
				msg = "스크립트/태그 " + countMsg.join(", ") + "이 있습니다. 적용하시겠습니까?\n"
				    + "자막에 맞는 동영상 파일이 열려있어야 정상적인 결과를 얻을 수 있습니다.\n\n"
				    + "수정되지 않은 부분에도 레이어 재계산 등이 있을 수 있습니다.";
			}
			confirm(msg, () => {
				const funcSince = log("수정 내역 적용 start");
				
				if (changedStyles.length) {
					const stylePart = appendFile.getStyles();
					
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
							if (holdStyle) {
								// 홀드 스타일 수정
								// output은 유지
								SmiFile.fromAssStyle(style, holdStyle);
								
								// 해당 홀드 스타일 적용
								// 같은 이름의 홀드가 여러 개일 수 있음
								for (let h = 0; h < currentTab.holds.length; h++) {
									const hold = currentTab.holds[h];
									if (hold.name == styleName) {
										hold.setStyle(holdStyle);
									}
								}
								
							} else {
								// 비홀드 스타일 수정
								for (let j = 0; j < stylePart.body.length; j++) {
									const extendStyle = stylePart.body[j];
									if (extendStyle.Name == styleName) {
										stylePart.body[j] = style;
									}
								}
							}
						} else {
							stylePart.body.push(style);
						}
					}
				}
				const appendWithoutEvents = new AssFile(" ");
				for (let i = 0; i < appendFile.parts.length; i++) {
					const part = appendFile.parts[i];
					if (part.name == "Events") continue;
					appendWithoutEvents.parts.push(part);
				}
				currentTab.area.find(".tab-ass-appends textarea").val(appendWithoutEvents.toText());
				
				if (addCount + delCount) {
					// 스크립트는 홀드별로 분할해서 넣어야 함
					const holds = currentTab.holds;
					for (let h = 0; h < holds.length; h++) {
						holds[h].ass = [];
					}
					
					const appendEvents = appendFile.getEvents();
					const list = appendEvents.body;
					const appends = [];
					
					// 뒤쪽 싱크를 먼저 작업해야 span이 잘 생성됨
					list.sort((a, b) => {
						let result = b.start - a.start;
						if (result == 0) {
							// 시작 싱크가 같으면 먼저 끝나는 것부터
							result = a.end - b.end;
						}
						return result;
					});
					
					// 기존 SMI 홀드에 span 형태로 끼워넣을 수 있는지 확인
					ti = 0;
					while (ti < list.length) {
						let targets = [];
						const styles = [];
						
						let fromAssEditor = false;
						
						// target 싱크 그룹화
						const tEvent = list[ti];
						for (let i = ti; i < list.length; i++) {
							const event = list[i];
							if (event.start != tEvent.start) break;
							if (event.end   != tEvent.end  ) break;
							targets.push(event);
							
							const style = event.Style;
							if (styles.indexOf(style) < 0) {
								styles.push(style);
							}
							
							if (event.found) {
								fromAssEditor = true;
							}
						}
						
						const start = tEvent.start;
						const end = tEvent.end;
						let importSet = null;
						
						for (let s = 0; !fromAssEditor && s < styles.length; s++) {
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
										// SMI 싱크 그대로 쓰지 않고, 프레임 시간 가져와서 비교
										let sync = Subtitle.findSync(body[i].start);
										if (sync < start) {
											continue;
										}
										
										if (start < sync) {
											// 중간 싱크를 생성해야 함
											if (i == 0 || (body[i-1].isEmpty() && !body[i-1].assComments)) {
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
												if (i == 0 || (body[i-1].isEmpty() && !body[i-1].assComments)) {
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
									if (i == body.length) {
										// 홀드 내용물 전체보다 더 뒤쪽
										if (i == 0 || (body[i-1].isEmpty() && !body[i-1].assComments)) {
											if (replaceFrom < 0) {
												replaceFrom = i;
											}
											replaceTo = i;
											
										} else {
											canImport = false;
										}
									}
								}
								if (!canImport) {
									continue;
								}
								
								// 공백이 아닌 것도 분할해서 추가할 순 있겠지만, 연관된 것들 span 조정해야 함
								// 여기까지 가면 ASS 에디터의 의미도 더 퇴색됨
								
								// 우선순위 판단
								let point = 0;
								if (!fromEmpty) point += 1; // SMI 싱크 그대로 사용
								if (!toEmpty  ) point += 1; // SMI 싱크 그대로 사용
								if (hold.name == style) {
									point += 4; // 이름 동일
								} else if (style.startsWith(hold.name)) {
									point += 3; // 이름 포함
								}
								
								if (point < 2) {
									// 홀드명이 안 맞으면, 싱크도 앞뒤 모두 일치하는 게 아니면 넣지 않음
									continue;
								}
								if (h == 0 && point < 4) {
									// 메인 홀드에는 Default 스타일 없으면 넣지 않음
									continue;
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
									,	isDefault: (h == 0)
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
							
							const bodySkipped = body.slice(replaceFrom, replaceTo);
							const bodyEnd = body.slice(replaceTo);
							body.length = replaceFrom;
							
							if (fromEmpty) {
								// 공백 싱크 추가
								let syncType = SyncType.frame;
								if (importSet.isDefault) {
									syncType = SyncType.normal;
									for (let i = 0; i < targets.length; i++) {
										const item = targets[i];
										if (item.Text.startsWith("{}")) {
											// 과거에 {} 붙여서 화면싱크 체크하는 트릭 사용함
											syncType = SyncType.frame;
											break;
										}
									}
								}
								body.push(smi = new Smi(start, syncType, ""));
							}
							body.push(...bodySkipped);
							
							{
								// 종료 싱크 추가 필요
								let syncType = SyncType.frame;
								if (importSet.isDefault) {
									syncType = SyncType.normal;
									for (let i = 0; i < targets.length; i++) {
										const item = targets[i];
										if (item.Text.endsWith("{}")) {
											// 과거에 {} 붙여서 화면싱크 체크하는 트릭 사용함
											syncType = SyncType.frame;
											break;
										}
									}
								}
								if (toEmpty) {
									body.push(new Smi(end, syncType, "&nbsp;"));
									
								} else if (syncType == SyncType.frame && bodyEnd.length) {
									// 종료태그는 이미 일반 싱크로 추가됐을 수도 있음
									bodyEnd[0].syncType = SyncType.frame;
								}
							}
							body.push(...bodyEnd);
							
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
							if (smi.origin) {
								smi.text = smi.origin;
							}
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
								if (smi.text) {
									smi.text = "<!-- ASS X -->\n" + smi.text;
								} else {
									smi.text = "<!-- ASS X -->";
								}
							}
						}
						
						let cursor = hold.input[0].selectionStart;
						let cursorSync = 0;
						if (hold.text) {
							for (let i = hold.text.substring(0, cursor).split("\n").length - 1; i > 0; i--) {
								const line = hold.lines[i];
								if (line.TYPE) {
									cursorSync = line.SYNC;
									break;
								}
							}
						}
						
						const smiText = hold.smiFile.toText();
						hold.input.val(smiText);
						hold.render();
						
						cursor = 0;
						for (let i = 0; i < hold.lines.length; i++) {
							const line = hold.lines[i];
							cursor += line.TEXT.length + 1;
							if (line.TYPE) {
								if (line.SYNC >= cursorSync) {
									break;
								}
							}
						}
						
						hold.setCursor(cursor);
						hold.scrollToCursor();
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
				
				log("수정 내역 적용 end", funcSince);
			});
		} else {
			let msg = "ASS 자막에 특별한 수정사항이 없습니다.\n추가 정보 부분만 검토합니다.";
			confirm(msg, () => {
				const funcSince = log("추가 정보 검토 start");
				
				const appendWithoutEvents = new AssFile(" ");
				for (let i = 0; i < appendFile.parts.length; i++) {
					const part = appendFile.parts[i];
					if (part.name == "Events") continue;
					appendWithoutEvents.parts.push(part);
				}
				currentTab.area.find(".tab-ass-appends textarea").val(appendWithoutEvents.toText());
				
				log("추가 정보 검토 end", funcSince);
			});
		}
	}
}
// C#과 연관 없지만 기능이 ASS 전용 스크립트 처리와 비슷해서 이쪽에 구현
function splitHold(tab, styleName) {
	const funcSince = log("splitHold start");
	
	let holdName = styleName;
	if (holdName == "Default") {
		holdName = "Default1";
	}
	
	// 홀드에 적용할 스타일 찾기
	let style = Subtitle.DefaultStyle;
	for (let i = 0; i < tab.holds.length; i++) {
		const hold = tab.holds[i];
		if (hold.name == styleName) {
			style = JSON.parse(JSON.stringify(hold.style));
		}
	}
	if (style == Subtitle.DefaultStyle) {
		// ASS 추가 스크립트에서 찾기
		const appendFile = new AssFile(tab.area.find(".tab-ass-appends textarea").val());
		const styles = appendFile.getStyles();
		for (let i = 0; i < styles.body.length; i++) {
			if (styles.body[i].Name == styleName) {
				const assStyle = styles.body[i];
				const arrStyle = [];
				arrStyle.push(assStyle.Fontname);
				arrStyle.push(assStyle.Fontsize);
				arrStyle.push(assStyle.PrimaryColour  );
				arrStyle.push(assStyle.SecondaryColour);
				arrStyle.push(assStyle.OutlineColour  );
				arrStyle.push(assStyle.BackColour     );
				arrStyle.push(assStyle.Bold       );
				arrStyle.push(assStyle.Italic     );
				arrStyle.push(assStyle.Underline  );
				arrStyle.push(assStyle.StrikeOut  );
				arrStyle.push(assStyle.ScaleX     );
				arrStyle.push(assStyle.ScaleY     );
				arrStyle.push(assStyle.Spacing    );
				arrStyle.push(assStyle.Angle      );
				arrStyle.push(assStyle.BorderStyle);
				arrStyle.push(assStyle.Outline    );
				arrStyle.push(assStyle.Shadow     );
				arrStyle.push(assStyle.Alignment  );
				arrStyle.push(assStyle.MarginL    );
				arrStyle.push(assStyle.MarginR    );
				arrStyle.push(assStyle.MarginV    );
				style = SmiFile.parseStyle(arrStyle.join(","));
				
				const next = styles.body.slice(i + 1);
				styles.body.length = i;
				styles.body.push(...next);
				break;
			}
		}
		tab.area.find(".tab-ass-appends textarea").val(appendFile.toText());
	}
	if (style == Subtitle.DefaultStyle) {
		// 못 찾았을 경우
		style = JSON.parse(JSON.stringify(style));
		style.Fontname = "";
	}
	
	const hold = tab.addHold({
			name: holdName
		,	text: ""
		,	pos: 1
		,	style: style
	});
	const body = [];
	
	const frameSyncs = tab.assHold.assEditor.getFrameSyncs();
	const list = tab.assHold.assEditor.toEvents();
	const appends = [];
	
	// 신규 홀드이므로 SMI 내용물은 전무함. ASS 기반으로 필요한 모든 싱크를 생성하고 시작
	const syncs = [];
	for (let i = 0; i < list.length; i++) {
		const event = list[i];
		if (event.Style == styleName
		 || event.Style.startsWith(styleName)
		 || styleName.startsWith(event.Style)
		) {
			if (syncs.indexOf(event.start) < 0) {
				syncs.push(event.start);
			}
			if (syncs.indexOf(event.end) < 0) {
				syncs.push(event.end);
			}
		}
	}
	syncs.sort((a, b) => {
		return a - b;
	});
	
	for (let i = 0; i < syncs.length; i++) {
		const start = syncs[i];
		body.push(smi = new Smi(start, (Subtitle.findSync(start, frameSyncs, false) ? SyncType.frame : SyncType.normal), ""));
	}
	
	ti = 0;
	while (ti < list.length) {
		let targets = [];
		let hasStyle = false;
		
		// target 싱크 그룹화
		const tEvent = list[ti];
		for (let i = ti; i < list.length; i++) {
			const event = list[i];
			if (event.start != tEvent.start) break;
			if (event.end   != tEvent.end  ) break;
			targets.push(event);
			
			if (event.Style == styleName
			 || event.Style.startsWith(styleName)
			 || styleName.startsWith(event.Style)
			) {
				hasStyle = true;
			}
		}
		
		const start = tEvent.start;
		const end = tEvent.end;
		let importSet = null;
		
		// 스타일 겹치는 것만 진행
		if (hasStyle) {
			let replaceFrom = -1;
			let replaceTo = -1;
			
			{
				let i = 0;
				for (; i < body.length; i++) {
					let sync = body[i].start;
					if (sync == start) {
						replaceFrom = i;
						
						for (; i < body.length; i++) {
							sync = body[i].start;
							if (sync == end) {
								replaceTo = i;
								break;
							}
						}
						break;
					}
				}
			}
			importSet = {
					hold: hold
				,	replaceFrom: replaceFrom
				,	span: replaceTo - replaceFrom
			};
		}
		
		if (importSet) {
			const span = (importSet.span == 1 ? "" : importSet.span);
			const smi = body[importSet.replaceFrom];
			if (!smi.assComments) {
				smi.assComments = [];
			}
			for (let i = 0; i < targets.length; i++) {
				// 싱크 겹치도록 넣어줌
				const item = targets[i];
				smi.assComments.push([item.Layer, "", span, item.Style, item.Text].join(","));
			}
			
		} else {
			// SMI 홀드에 넣을 수 없는, ASS 전용 스크립트
			appends.push(...targets);
		}
		
		ti += targets.length;
	}
	
	// 홀드 SMI 재구성
	{
		for (let j = 0; j < body.length; j++) {
			const smi = body[j];
			if (smi.assComments) {
				smi.assComments.sort((a, b) => {
					return Number(a.split(",")[0]) - Number(b.split(",")[0]);
				});
				smi.text = "<!-- ASS\n" + smi.assComments.join("\n") + "\n-->";
				
			} else {
				smi.text = "&nbsp;";
			}
		}
		
		const smiFile = new SmiFile();
		smiFile.body = body;
		const smiText = smiFile.toText();
		hold.input.val(smiText);
		hold.setCursor(0);
		hold.scrollToCursor();
		hold.render();
	}
	
	tab.assHold.assEditor.setEvents(appends, tab.assHold.assEditor.getFrameSyncs());
	
	log("splitHold end", funcSince);
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
	const funcSince = log("srt2smi start");
	const result = new SmiFile().fromSync(new SrtFile(text).toSyncs()).toText();
	log("srt2smi end", funcSince);
	return result;
}

/**
 * frameSyncOnly: 화면 싱크만 맞춰주기
 * add: 과거 반프레임 보정치 안 넣었던 것들을 위해 추가
 */
function fitSyncsToFrame(frameSyncOnly=false, add=0) {
	if (!Subtitle.video.fs.length) {
		//*
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
	tabs[tab].assHold.fitSyncsToFrame();
}
SmiEditor.prototype._fitSyncsToFrame = SmiEditor.prototype.fitSyncsToFrame;
SmiEditor.prototype.fitSyncsToFrame = function(frameSyncOnly=false, add=0) {
	if (this.isAssHold) {
		for (let i = 0; i < this.assEditor.syncs.length; i++) {
			const item = this.assEditor.syncs[i];
			let sync = Subtitle.findSync(Number(item.inputStart.val()) + add);
			if (sync != null) item.inputStart.val(sync == 0 ? 1 : sync);
			sync = Subtitle.findSync(Number(item.inputEnd.val()) + add);
			if (sync != null) item.inputEnd.val(sync == 0 ? 1 : sync);
		}
		this.assEditor.update();
	} else {
		this._fitSyncsToFrame(frameSyncOnly, add);
	}
}

function generateSmiFromAss(keepHoldsAss=true) {
	const origins = [];
	
	const tab = tabs[window.tab];
	if (!tab) {
		return;
	}
	const funcSince = log("generateSmiFromAss start");
	
	// 현재 선택된 홀드 기준
	const origin = SmiEditor.selected.getText(true);
	if (origin.selection[0] != origin.selection[1]) {
		// 선택 범위만 작업
		origin.hold = SmiEditor.selected;
		origin.lines = SmiEditor.selected.lines;
		
		origin.start = origin.text.substring(0, origin.selection[0]).split("\n").length - 1;
		origin.end   = origin.text.substring(0, origin.selection[1]).split("\n").length;
		
		const lines = origin.lines.slice(origin.start, origin.end);
		for (let i = 0; i < lines.length; i++) {
			lines[i] = lines[i].TEXT;
		}
		origin.smiFile = new Subtitle.SmiFile(lines.join("\n"));
		
		origins.push(origin);
		
	} else {
		// 전체 작업
		const holds = tab.holds.slice(0);
		
		for (let i = 0; i < holds.length; i++) {
			const hold = holds[i];
			const origin = hold.getText(true);
			origin.hold = hold;
			origin.lines = hold.lines;
			
			origin.start = 0;
			origin.end = origin.text.split("\n").length;
			
			const lines = origin.lines.slice(origin.start, origin.end);
			for (let i = 0; i < lines.length; i++) {
				lines[i] = lines[i].TEXT;
			}
			origin.smiFile = new Subtitle.SmiFile(lines.join("\n"));
			
			origins.push(origin);
		}
	}
	
	for (let i = 0; i < origins.length; i++) {
		const origin = origins[i];
		const newLines = origin.text.split("\n");
		let selectedLine = origin.start;
		
		const keepHoldAss = (origin.hold.name == "메인") ? false : keepHoldsAss;
		
		for (let j = 0; j < origin.smiFile.body.length; j++) {
			const item = origin.smiFile.body[j];
			if (!item.text.startsWith("<!-- ASS\n")) continue;
			
			const commentEnd = item.text.indexOf("\n-->");
			if (commentEnd < 0) continue;
			
			if (item.text.indexOf("\nEND\n-->") > 0) {
				// 원래 SMI 무시하는 거였으면 건너뛰기
				continue;
			}
			
			if (item.text.substring(commentEnd + 4).trim()) {
				// 원래 SMI 내용물 있었으면 건너뛰기
				continue;
			}
			
			const assComment = item.text.substring(9, commentEnd);
			const assTexts = assComment.split("\n");
			const texts = [];
			let keepAss = keepHoldAss;
			let isPure = (assTexts.length == 1); // 한 싱크에 ASS 스크립트 하나면 순수하게 SMI로 구현될 가능성 있음
			let skipCount = 0;
			for (let j = 0; j < assTexts.length; j++) {
				if (!isPure) {
					// 마지막 하나 빼고 무시당했으면 순수 SMI 구현 가능성 있음
					isPure = (assTexts.length - skipCount == 1);
				}
				const assText = assTexts[j];
				let ass = assText.split(",");
				
				let style = null;
				let text = "";
				
				if (isFinite(ass[0])) {
					layer = ass[0];
					let type = null;
					
					if (ass.length >= 5) {
						if (ass[1] == "") { // span 형식
							type = "span";
							if (ass[2] == "") {
								// [Layer, -, -, Style, Text]
								style = ass[3];
								text = ass.slice(4).join(",");
								
							} else if (isFinite(ass[2])) {
								// [Layer, -, span, Style, Text]
								isPure = false; // span 있으면 SMI만으로 구현 못 함
								style = ass[3];
								text = ass.slice(4).join(",");
								
							} else if (ass[3].endsWith(")")) {
								let ass2 = ass[2].split("(");
								let ass3 = ass[3].split(")");
								if (ass2.length == 2
								 && isFinite(ass2[0])
								 && isFinite(ass2[1])
								 && isFinite(ass3[0])
								) {
									// [Layer, -, span(add, add), Style, Text]
									isPure = false; // span 있으면 SMI만으로 구현 못 함
									style = ass[4];
									text = ass.slice(5).join(",");
								}
							}
						} else if (isFinite(ass[1])) { // add 형식
							type = "add";
							isPure = false; // add 있으면 SMI만으로 구현 못 함
							style = ass[3];
							text = ass.slice(4).join(",");
						}
					}
					if (!type) {
						// 싱크 변형 없이 스타일이 나오는 형식
						// [Layer, Style, Text]
						style = ass[1];
						text = ass.slice(2).join(",");
					}
				} else {
					// 텍스트만 입력
					text = ass.join(",");
				}
				
				let correctStyle = origin.hold.name;
				if (correctStyle == "메인") correctStyle = "Default";
				if (style && style != correctStyle) {
					// 스타일이 맞을 때만 홀드 텍스트로 꺼냄
					isPure = false;
					skipCount++;
					continue;
				}
				
				// 문자열이 아닌 배경색 용도
				if (text.indexOf("■") >= 0) {
					text = text.split("■").join(" ");
					isPure = false;
					skipCount++;
				}
				if (text.indexOf("●") >= 0) {
					text = text.split("●").join(" ");
					isPure = false;
					skipCount++;
				}
				if (isPure) {
					// 순수 SMI로 구현 가능한지 확인
					if (text.startsWith("{}")) text = text.substring(2);
					if (text.endsWith("{}")) text = text.substring(0, text.length - 2);
					if (text.indexOf("{", 1) > 0) {
						// 맨 앞 말고도 태그가 있으면 SMI로 구현 불가
						// TODO: 줄표에 따른 fscx 정도는 없애는 것도? - 태그로 공백문자만 감싼 경우 걸러내기?
						// TODO: 위에서 중간 태그 없애기 성공한다면 SMI 구현 가능 상태로 남겨서 아래 로직을 태울 것
						isPure = false;
					}
				}
				
				if (isPure) {
					if (text.indexOf("{") == 0) {
						// ASS 태그로 시작할 경우
						const tagEnd = text.indexOf("}");
						if (tagEnd > 0) {
							const tags = text.substring(0, tagEnd).split("\\");
							let smiText = text.substring(tagEnd + 1);
							let smiCount = 0;
							let smiAttr = new Attr(null, smiText);
							let assTags = [];
							
							// 0번은 실제 태그 시작 전임
							for (let t = 1; t < tags.length; t++) {
								const tag = tags[t];
								if (tag.startsWith("t(")) {
									// \t 태그 끝날 때까지 ass 태그로 처리
									for (; t < tags.length; t++) {
										assTags.push(tags[t]);
										if (tags[t].indexOf(")") >= 0) {
											break;
										}
									}
								} else if (tag.startsWith("c&H")) {
									// 색상
									if (tag.length == 10) {
										smiAttr.fc = "#" + tag[7] + tag[8] + tag[5] + tag[6] + tag[3] + tag[4];
										smiCount++;
									} else if (tag.length == 12) { // 투명도 같이 쓴 경우
										smiAttr.fc = "#" + tag[9] + tag[10] + tag[7] + tag[8] + tag[5] + tag[6];
										smiCount++;
									}
								} else if (tag.startsWith("i") && tag.length > 1 && tag[1] == "1") {
									// 기울임 - 여기선 닫는 태그는 고려할 필요 없음
									smiAttr.i = true;
									smiCount++;
									
								} else if (tag.startsWith("u") && tag.length > 1 && tag[1] == "1") {
									// 밑줄
									smiAttr.u = true;
									smiCount++;
									
								} else if (tag.startsWith("s") && tag.length > 1 && tag[1] == "1") {
									// 취소선
									smiAttr.s = true;
									smiCount++;
									
								} else {
									assTags.push(tag);
								}
							}
							if (smiCount) {
								smiText = Smi.fromAttrs([smiAttr]);
							}
							if (assTags.length) {
								text = '<FONT ass="{\\' + assTags.join("\\") + '}"></FONT>\n' + smiText;
							} else {
								text = smiText;
							}
						}
					} else {
						// ASS 태그가 아예 없음
						keepAss = false;
					}
				} else {
					text = Subtitle.$tmp.html(text.split("{").join("<a ").split("}").join(">")).text();
				}
				if (!text.trim()) {
					continue;
				}
				texts.push(...text.split("\\N"));
			}
			if (!texts.length) continue;
			
			let smiText = texts.join(texts.length > 2 ? "<br>\n" : "<br>");
			while (smiText.indexOf("<br>\n<br>") > 0) { // ASS에서 의도적으로 줄바꿈 반복한 경우가 있음
				smiText = smiText.split("<br>\n<br>").join("<br>");
			}
			if (keepAss) {
				// SMI로 구현 성공했어도 ASS 원형을 유지
				// 완전히 변환해보니 ASS 스크립트 유지한 채로 SMI 결과물을 함부로 수정하기 힘들어짐
				smiText = "<!-- ASS\n" + assComment + "\nEND\n-->\n" + smiText;
				
			} else {
				if (isPure) { // 순수 SMI만으로 구현 가능
					if (assTexts.length > 1) {
						// SMI로 구현 성공했지만 건너뛴 추가 스크립트가 있었을 경우
						smiText = "<!-- ASS\n" + assTexts.slice(0, assTexts.length - 1).join("\n") + "\n-->\n" + smiText;
					}
				} else {
					smiText = "<!-- ASS\n" + assComment + "\nEND\n-->\n" + smiText;
				}
			}
			item.text = smiText;
		}
		const lines = origin.smiFile.toText().split("\n");
		const nexts = newLines.slice(origin.end);
		newLines.length = origin.start;
		newLines.push(...lines);
		newLines.push(...nexts);
		
		const cursor = 0;
		origin.hold.history.log();
		origin.hold.setText(newLines.join("\n"), [cursor]);
	}
	
	log("generateSmiFromAss end", funcSince);
}
