let time = 0;

const tabs = [];
let tab = 0;
let closingTab = null;
let tabToCloseAfterRun = null;

let autoSaveTemp = null;

let autoFindSync = false;

// C# 쪽에서 호출
function refreshTime(now) {
	if (time != now) {
		time = now;
		if (autoFindSync && tabs.length && tabs[tab]) {
			tabs[tab].holds[tabs[tab].hold].findSync();
		}
	}
}
let showFps = null;

window.Tab = function(text, path) {
	this.area = SmiEditor.tabPreset.clone();
	this.holdSelector = this.area.find(".hold-selector");
	this.holdArea = this.area.find(".holds");
	this.holds = [];
	this.hold = 0;
	this.lastHold = 1;
	this.path = path;
	
	const tab = this;
	
	{	const holds = Subtitle.SmiFile.textToHolds(text);
		let assFile = null;
		{
			const hold = holds[0];
			if (hold.ass) {
				assFile = new Subtitle.AssFile2(hold.ass);
			}
			hold.ass = [];
		}
		for (let i = 1; i < holds.length; i++) {
			holds[i].ass = [];
		}
		const assHold = tab.assHold = new SmiEditor();
		{
			assHold.assEditor = new AssEditor(tab.area.find("div.tab-ass-script > div"));
			assHold.assEditor.onUpdate = function() {
				if (this.isSaved) {
					tab.area.find(".tab-ass-btn").removeClass("not-saved");
				} else {
					tab.area.find(".tab-ass-btn").addClass("not-saved");
				}
				tab.onChangeSaved();
			};
		}
		
		let frameSyncs = [];
		if (assFile) {
			const list = assFile.getEvents().body;
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
			assFile.getEvents().body = appends;
			
			console.log(assFile);
			console.log(holds);
			
			this.area.find(".tab-ass-styles textarea").val(assFile.getStyles().toText(false));
			
			const info = assFile.getInfo();
			if (info) {
				let strFrameSyncs = info.get("FrameSyncs");
				if (strFrameSyncs) {
					frameSyncs = strFrameSyncs.split(",");
				}
			}
			assHold.assEditor.setEvents(appends, frameSyncs);
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
	hold.savedStyle = Subtitle.SmiFile.toSaveStyle(style);
	hold.savedAss = hold.ass = info.ass;
	hold.tempSavedText = info.text;
	hold.updateTimeRange();
	
	if (isMain) {
		hold.area.addClass("main");
		hold.selector.addClass("selected");
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
						}
						return;
					}
				}
			}
			tab.withAss = false;
			tab.area.removeClass("ass");
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
			
			area.find(".btn-close-preset").on("click", function() {
				hold.area.removeClass("style");
				if (SmiEditor.Viewer.window) {
					SmiEditor.Viewer.refresh();
				}
			});
			
			hold.setStyle(style);
		}
		
		hold.area.append(hold.assArea = $("<div class='hold-ass-area'>"));
		{
			const area = SmiEditor.assPreset.clone();
			hold.assArea.append(area);
			
			const part = new Subtitle.AssPart("Events", Subtitle.AssPart.EventsFormat);
			if (hold.ass) {
				part.body = hold.ass;
			} else {
				hold.ass = part.body;
			}
			hold.assEditor = new AssEditor(hold.assArea.find("div.hold-ass-script"), part.body, info.frameSyncs);
			hold.assEditor.onUpdate = function() {
				hold.afterChangeSaved(hold.isSaved());
			};
			
			area.find(".btn-close-preset").on("click", function() {
				hold.area.removeClass("ass");
			});
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
	this.style = style;
	const area = this.styleArea.find(".hold-style");
	
	area.find("input[name=Fontname]     ").val(style.Fontname);
	area.find("input[name=PrimaryColour]").val(style.PrimaryColour).next().val(style.PrimaryColour);
	area.find("input[name=Italic]   ").prop("checked", style.Italic);
	area.find("input[name=Underline]").prop("checked", style.Underline);
	area.find("input[name=StrikeOut]").prop("checked", style.StrikeOut);

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
	if (this.area.hasClass("ass")) {
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
	if (this.area.hasClass("ass")) {
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
SmiEditor.prototype._toggleSyncType = SmiEditor.prototype.toggleSyncType;
SmiEditor.prototype.toggleSyncType = function() {
	// 스타일 편집일 때 무시
	if (this.area.hasClass("style")) return;
	
	// ASS 편집일 때 무시
	if (this.area.hasClass("ass")) return;
	
	this._toggleSyncType();
}
SmiEditor.prototype._moveToSync = SmiEditor.prototype.moveToSync;
SmiEditor.prototype.moveToSync = function(add=0) {
	// 스타일 편집일 때 무시
	if (this.area.hasClass("style")) return;

	// ASS 편집일 때 동작
	if (this.area.hasClass("ass")) {
		// 선택된 객체 찾기
		const $item = $(document.activeElement).parents(".item");
		if (!$item.length) return;
		const item = $item.data("obj");
		if (!item) return;
		
		console.log(item.inputStart.val(), add);
		console.log(Number(item.inputStart.val()) + add);
		
		SmiEditor.PlayerAPI.play();
		SmiEditor.PlayerAPI.moveTo(Number(item.inputStart.val()) + add);
		
		return;
	}
	
	this._moveToSync(add);
}
SmiEditor.prototype._getText = SmiEditor.prototype.getText;
SmiEditor.prototype.getText = function(forced) {
	if (this.area.hasClass("style")
	 || this.area.hasClass("ass")) {
		if (!forced) {
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
	if (this.holds.length <= 1) {
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
		if (!(hold = this.holds[hold])) {
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
	if ((this.hold = index) > 0) {
		this.lastHold = this.hold;
	}
	SmiEditor.Viewer.refresh();
}
Tab.prototype.selectLastHold = function() {
	if (this.holds.length == 0) {
		return;
	}
	if (this.hold > 0) {
		this.selectHold(0);
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
Tab.prototype.getAdditioinalToAss = function() {
	let assTexts = [];
	
	let frameSyncs = [];
	{
		let syncs = [];
		for (let h = 0; h < this.holds.length; h++) {
			const hold = this.holds[h];
			syncs.push(...hold.assEditor.getFrameSyncs());
		}
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
	let info = ["[Script Info]", "VideoInfo: " + SmiEditor.video.path, "FrameSyncs: " + frameSyncs.join(",")].join("\n");
	assTexts.push(info);
	
	let styles = "";
	{
		styles = this.assStyles = this.area.find(".tab-ass-styles textarea").val();
		if (styles) {
			styles = "[V4+ Styles]\nFormat: " + Subtitle.AssPart.StylesFormat.join(", ") + "\n" + styles
			assTexts.push(styles);
		}
	}
	
	let scripts = [];
	{
		for (let h = 0; h < this.holds.length; h++) {
			const hold = this.holds[h];
			const script = hold.assEditor.toText();
			if (script) {
				scripts.push(script);
			}
		}
		{	// 홀드에 없는 추가 내용
			const script = this.assHold.assEditor.toText();
			if (script) {
				scripts.push(script);
			}
		}
		if (scripts.length) {
			scripts = "[Events]\nFormat: " + Subtitle.AssPart.EventsFormat.join(", ") + "\n" + (this.assScript = scripts.join("\n"));
			assTexts.push(scripts);
		} else {
			this.assScript = scripts = "";
		}
	}
	return (styles || scripts) ? ("\n<!-- ASS\n" + (this.assText = assTexts.join("\n\n")) + "\n-->") : "";
}
Tab.prototype.getSaveText = function(withCombine=true, withComment=true) {
	return Subtitle.SmiFile.holdsToText(this.holds, setting.saveWithNormalize, withCombine, withComment, SmiEditor.video.FR / 1000)
		+ this.getAdditioinalToAss(); // ASS 추가 내용 footer에 넣어주기
}
Tab.prototype.onChangeSaved = function(hold) {
	if (this.isSaved()) {
		this.area.removeClass("tmp-saved").removeClass("not-saved");
		for (let i = 0; i < this.holds.length; i++) {
			this.holds[i].selector.removeClass("not-saved");
		}
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

Tab.prototype.toAss = function() {
	const assFile = new Subtitle.AssFile2(null, SmiEditor.video.width, SmiEditor.video.height);
	
	const appendText = "[V4+ Styles]\nFormat: " + Subtitle.AssPart.StylesFormat.join(", ") + "\n" + this.assStyles
	                 + "\n\n[Events]\nFormat: " + Subtitle.AssPart.EventsFormat.join(", ") + "\n" + this.assScript;
	const append = new Subtitle.AssFile2(appendText);
	
	// ASS에서 추가한 내용은 대사가 아닌 배경 -> 뒤에 깔릴 가능성이 높으므로 먼저 추가
	// 완벽한 순서는 보장 못 함...
	assFile.getEvents().body.push(...append.getEvents().body);
	
	const holds = this.holds;
	let mainSyncs = null;
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
		
		syncs.push((hold.smiFile = new Subtitle.SmiFile(hold.text)).toSyncs());
		if (h == 0) {
			mainSyncs = syncs[0];
		} else {
			assFile.addFromSyncs(syncs[h], name);
		}
	}
	for (let h = 1; h < holds.length; h++) {
		const hold = holds[h];
		// 메인 홀드보다 위쪽이면 건너뜀
		if (hold.pos > 0) continue;

		// 정렬 위치가 중앙 하단이 아니면 건너뜀
		if (hold.style && hold.style.Alignment != 2) continue;

		// 메인 홀드보다 아래에 깔린 내용일 경우, 겹치는 메인 홀드의 내용물이 기본적으로 위로 올라가도록 함
		const holdSyncs = syncs[h];
		let mi = 0;
		for (let i = 0; i < holdSyncs.length; i++) {
			const sync = holdSyncs[i];
			while (mi < mainSyncs.length && mainSyncs[mi].end < sync.start) {
				mi++;
			}
			while (mi < mainSyncs.length && mainSyncs[mi].start < sync.end) {
				mainSyncs[mi].bottom
					= (mainSyncs[mi].bottom ? mainSyncs[mi].bottom : 0)
					+ sync.getTextOnly().split("\n").length;
				mi++;
			}
		}
	}
	assFile.addFromSync(mainSyncs, "Default");
	
	// 홀드에 없는 스타일 추가
	assFile.getStyles().body.push(...append.getStyles().body);
	
	const eventsBody = assFile.getEvents().body;
	{	// ASS 자막은 SMI와 싱크 타이밍이 미묘하게 달라서 보정 필요
		// TODO: 팟플레이어 최신버전 오면서 보정치가 다 틀어졌는데...?
		
		 // TODO: SubtitleObject.js 쪽으로 옮기는 게 나은가?
		function optimizeSync(sync) {
			return (findSync(sync + 5) - 15);
		}
		function findSync(sync) {
			return SmiEditor.findSync(sync, SmiEditor.video.fs);
		}
		
		if (SmiEditor.sync && SmiEditor.sync.frame) {
			if (SmiEditor.video.fs.length) {
				for (let i = 0; i < eventsBody.length; i++) {
					const item = eventsBody[i];
					item.Start = Subtitle.AssEvent.toAssTime(item.start = optimizeSync(Subtitle.AssEvent.fromAssTime(item.Start)));
					item.End   = Subtitle.AssEvent.toAssTime(item.end   = optimizeSync(Subtitle.AssEvent.fromAssTime(item.End  )));
				}
			} else {
				const FL = SmiEditor.video.FL;
				for (let i = 0; i < eventsBody.length; i++) {
					const item = eventsBody[i];
					item.Start = Math.max(1, ((Math.round(item.start / FL) - 0.5) * FL));
					item.End   = Math.max(1, ((Math.round(item.end   / FL) - 0.5) * FL));
				}
			}
		}
		
		for (let i = 0; i < eventsBody.length; i++) {
			eventsBody[i].clearEnds();
		}
	}
	
	eventsBody.sort((a, b) => {
		let cmp = a.start - b.start;
		if (cmp == 0) {
			cmp = a.Layer - b.Layer;
		}
		return cmp;
	});
	return assFile;
}
Tab.prototype.getAssText = function(appendText) {
	return this.toAss().toText(appendText);
}

SmiEditor.prototype.isSaved = function() {
	return (this.savedName  == this.name )
		&& (this.savedPos   == this.pos  )
		&& (this.savedStyle == Subtitle.SmiFile.toSaveStyle(this.style))
		&& (this.saved == this.input.val()
		&& (this.assEditor && this.assEditor.isSaved)
	);
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
		if (input.indexOf("|") >= 0) {
			alert("구분자는 입력할 수 없습니다.");
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
		const styles = { "Default": Subtitle.SmiFile.toSaveStyle(currentTab.holds[0].style) };
		for (let i = 1; i < currentTab.holds.length; i++) {
			const hold = currentTab.holds[i];
			if (hold.name.indexOf(",") >= 0) {
				alert("ASS 자막 변환을 하는 경우 홀드명에 ,(쉼표)가 들어갈 수 없습니다.");
				currentTab.selectHold(hold);
				return;
			}
			const saveStyle = Subtitle.SmiFile.toSaveStyle(hold.style);
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
		if (SmiEditor.video.path) {
			const index = SmiEditor.video.path.lastIndexOf(".");
			if (index > 0) {
				assPath = SmiEditor.video.path.substring(0, index) + ".ass";
			} else {
				assPath = SmiEditor.video.path + ".ass";
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
				binder.save(currentTab.getAssText(), assPath, false);
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
			binder.save(currentTab.getAssText(), assPath, false);
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
		hold.savedStyle = Subtitle.SmiFile.toSaveStyle(hold.style);
		hold.assEditor.setSaved();
	}
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
		/* 수동 읽기로 전환
		if (withAss) {
			// 이미 자막에 해당하는 동영상 정보를 가져왔었으면 ASS 파일 읽기 수행
			// TODO: ASS Script Info에 동영상 파일 이름을 따로 넣어야 할 듯함
			//       맞지 않는 영상일 경우 수행하지 않아야 함
			if (SmiEditor.video.path) {
				let assPath = SmiEditor.video.path.substring(0, SmiEditor.video.path.lastIndexOf(".")) + ".ass";
				binder.loadAssFile(assPath, tabs.length - 1);
			}
		}
		*/
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
	if (SmiEditor.video.path == path) return;
	
	SmiEditor.video.path = path;
	SmiEditor.video.fs = [];
	SmiEditor.video.kfs = [];
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
		SmiEditor.video.isAudio = false;
		binder.requestFrames(path);
		
	} else {
		// 오디오 파일을 불러온 경우 ms 단위 싱크로 동작
		SmiEditor.video.isAudio = true;
		SmiEditor.video.FR = 1000000;
		SmiEditor.video.FL = 1;
	}
}
// C# 쪽에서 호출 - requestFrames
function setVideoInfo(w=1920, h=1080, fr=23976) {
	SmiEditor.video.width = w;
	SmiEditor.video.height = h;
	
	// TODO: fps 관련은 이제 날리는 게 맞나...?
	if (fr == 23975) {
		fr = 23975.7; // 일부 영상 버그
	}
	SmiEditor.video.FL = 1000000 / (SmiEditor.video.FR = fr);
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
	SmiEditor.video.fs  = vfs;
	SmiEditor.video.kfs = kfs;
	
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
	
	// ASS 파일 읽기는 수동으로 하는 쪽으로
	/*
	// 프레임값까지 가져온 후에 ASS 파일 읽기 수행
	if (SmiEditor.video.path.indexOf(":")) { // 웹버전에선 온전한 파일 경로를 얻지 못해 콜론 없음
		if (tabs.length && tabs[tab].withAss) {
			let assPath = SmiEditor.video.path.substring(0, SmiEditor.video.path.lastIndexOf(".")) + ".ass";
			binder.loadAssFile(assPath, tab);
		}
	}
	*/
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
	currentTab.getAdditioinalToAss();
	const originFile = currentTab.toAss();
	
	// 따로 불러온 ASS 파일
	const targetFile = new Subtitle.AssFile2(text);
	{
		const targetBody = targetFile.getEvents().body;
		for (let i = 0; i < targetBody.length; i++) {
			targetBody[i].clearEnds();
		}
		// 시간 순 정렬 돌리고 시작
		targetBody.sort((a, b) => {
			let cmp = a.start - b.start;
			if (cmp == 0) {
				cmp = a.Layer - b.Layer;
			}
			return cmp;
		});
	}
	
	console.log(originFile);
	console.log(targetFile);
	
	// TODO:
	// 불일치 부분 확인 및 보정
	const appendFile = new Subtitle.AssFile2();

	// 홀드 스타일과 ASS 스타일 비교
	let styleTexts = currentTab.area.find(".tab-ass-styles textarea").val();
	styleTexts = styleTexts ? [styleTexts] : [];
	const styles = {}; // 아래에서도 필요해짐
	{
		let part = originFile.getStyles();
		for (let i = 0; i < part.body.length; i++) {
			const style = part.body[i];
			styles[style.Name] = style;
		}
		const addPart = appendFile.getStyles();
		part = targetFile.getStyles();
		console.log(part);
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
						styleChanged = true;
						break;
					}
				}
				if (styleChanged) {
					part.body[i] = styles[style.Name];
					
					// 기존 스타일 가져오기
					let holdStyle = null;
					for (let h = 0; h < currentTab.holds.length; h++) {
						const hold = currentTab.holds[h];
						if (hold.name == style.Name) {
							holdStyle = JSON.parse(JSON.stringify(hold.style));
							break;
						}
					}
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
						for (let h = 0; h < currentTab.holds.length; h++) {
							const hold = currentTab.holds[h];
							if (hold.name == style.Name) {
								hold.setStyle(holdStyle);
							}
						}
					}
				}
			} else {
				console.log("SMI에서 해당하는 홀드가 없음");
				addPart.body.push(style);
			}
		}
		if (addPart.body.length) {
			styleTexts.push(addPart.toText(false));
		}
	}
	
	{	// TODO: 홀드 스크립트와 ASS 스크립트 비교
		
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
		
		//*
		function optimizeSync(sync) { // TODO: SubtitleObject.js 쪽으로 옮기는 게 나은가?
			return (findSync(sync + 5) - 15);
		}
		function findSync(sync) {
			return SmiEditor.findSync(sync, SmiEditor.video.fs);
		}
		for (let i = 0; i < targetEvents.length; i++) {
			targetEvents[i].Start = Subtitle.AssEvent.toAssTime(targetEvents[i].start = optimizeSync(Subtitle.AssEvent.fromAssTime(targetEvents[i].Start)));
			targetEvents[i].End   = Subtitle.AssEvent.toAssTime(targetEvents[i].end   = optimizeSync(Subtitle.AssEvent.fromAssTime(targetEvents[i].End  )));
		}
		//*/
		for (let i = 0; i < targetEvents.length; i++) {
			let assText = targetEvents[i].Text.split("}{").join("");

			// 뒤쪽에 붙은 군더더기 종료태그 삭제
			let removed = false;
			while (assText.endsWith("}")) {
				if (assText.endsWith("{}")) {
					// 의도적으로 넣은 것
					break;
				}
				let end = assText.lastIndexOf("{");
				if (end > 0) {
					const tag = assText.substring(end);
					assText = assText.substring(0, end);
					if (tag.indexOf("\\fad") > 0
					 || tag.indexOf("\\pos") > 0
					 || tag.indexOf("\\mov") > 0
					 || tag.indexOf("\\clip") > 0) {
						// 종료태그가 아닌 전체적으로 쓰이는 태그일 경우 앞으로 이동
						if (assText.startsWith("{")) {
							end = assText.indexOf("}");
							if (end > 0) { // 없을 리는 없음
								assText = assText.substring(0, end) + tag.substring(1) + assText.substring(end + 1);
							}
						} else {
							assText = tag + assText;
						}
					}
					removed = true;
				} else {
					break;
				}
			}
			/*
			if (removed) {
				assText += "​"; // 군더더기 태그 삭제한 대신 Zero-width-space로 끝맺음
			}
			*/
			targetEvents[i].Text = assText;
		}
		
		let oi = 0; let ti = 0;
		let count = 0;
		while (ti < targetEvents.length) {
			const tEvent = targetEvents[ti];
			while ((oi < originEvents.length) && (originEvents[oi].Start < tEvent.Start)) {
				// ASS 출력 제외 대상
				if (originEvents[oi].origin) {
					const o = originEvents[oi].origin.origin;
					o.text = "<!-- ASS\nEND\n-->\n" + o.text;
				} else {
					// origin이 없었으면 기존에 ASS 전용으로 넣었던 것이므로 삭제 대상
				}
				count++;
				oi++;
			}
			// Start 싱크가 일치할 경우
			let origins = [];
			let targets = [];
			const groups = {};
			const oStyles = [];
			const tStyles = [];
			let oStyle = null;
			for (let i = oi; i < originEvents.length; i++) {
				// 싱크 일치하는 것 확인
				const event = originEvents[i];
				if (event.Start != tEvent.Start) continue;
				if (event.End   != tEvent.End  ) continue;
				origins.push(event);
				
				const style = event.Style;
				let group = groups[style];
				if (!group) {
					oStyles.push(style);
					groups[style] = group = { o: [], t: [] };
				}
				group.o.push(event);
				
				if (!oStyle && event.origin) {
					oStyle = style;
				}
			}
			for (let i = ti; i < targetEvents.length; i++) {
				// 싱크 일치하는 것 확인
				const event = targetEvents[i];
				if (event.Start != tEvent.Start) continue;
				if (event.End   != tEvent.End  ) continue;
				targets.push(event);
				
				const style = event.Style;
				let group = groups[style];
				if (!group) {
					tStyles.push(style); // 스타일 리스트만 채워두고
					group = groups[""]; // 내용물은 한쪽에 몰아넣음
				}
				if (!group) groups[""] = group = { o: [], t: [] };
				group.t.push(event);
			}

			let imported = false;
			if (!oStyle) {
				// SMI에 없는 내용
				console.log("SMI에 없는 내용", origins, targets);
				const start = SmiEditor.findSync(targets[0].start, SmiEditor.video.fs);
				const end   = SmiEditor.findSync(targets[0].end  , SmiEditor.video.fs);
				
				// 스타일에 해당하는 기존 홀드에 넣을 수 있는지 확인
				oStyles.push(...tStyles);
				for (let s = 0; s < oStyles.length; s++) {
					const style = (oStyles[s] == "Default") ? "메인" : oStyles[s];
					
					for (let h = 0; h < currentTab.holds.length; h++) {
						const hold = currentTab.holds[h];
						
						let canImport = (hold.name == style) && hold.smiFile; // ASS 출력 제외 홀드에는 넣을 수 없음
						if (!canImport) continue;
						
						const body = hold.smiFile.body;
						let replaceFrom = 0;
						let replaceTo = 0;
						
						if (canImport) {
							// 스타일에 맞는 홀드 찾음
							let i = 0;
							for (; i < body.length; i++) {
								if (start < body[i].start) { // 다음 싱크에 도달
									if (i == 0 || body[i-1].isEmpty()) {
										// 직전이 공백 싱크임
										replaceFrom = replaceTo = i;
									} else {
										// 공백 아니면 겹칠 수 없음
										canImport = false;
									}
									break;
								}
								if (start == body[i].start) { // 싱크가 겹침
									if (body[i].isEmpty()) {
										// 해당 싱크가 공백이면 replace 함
										replaceFrom = i;
										replaceTo = i + 1;
									} else {
										// 공백 아니면 겹칠 수 없음
										canImport = false;
									}
									break;
								}
							}
							if (i == body.length) {
								// 끝까지 돌았으면 겹치는 싱크 없음
								replaceFrom = replaceTo = i;
							}
						}
						
						if (canImport) {
							if (end > body[replaceTo]) {
								// 다음 싱크와 겹침
								canImport = false;
							}
						}
						if (canImport) {
							// 공백 싱크 자리에 넣을 수 있음
							console.log("공백 싱크 자리에 넣을 수 있음");
							let newText = "<!-- ASS\n";
							for (i = 0; i < targets.length; i++) {
								const item = targets[i];
								if (item.Name == "" && item.MarginL == 0 && item.MarginR == 0 && item.MarginV == 0 && item.Effect == "") {
									newText += [item.Layer, item.Style, item.Text].join(",") + "\n";
								} else {
									newText += [item.Layer, "", "", item.Style, item.Name, item.MarginL, item.MarginR, item.MarginV, item.Effect, item.Text].join(",") + "\n";
								}
							}
							newText += "END\n-->";
							console.log("ASS 전용 SMI 싱크 생성", newText);
							
							const newSmis = [];
							if (replaceFrom < replaceTo) {
								// 공백 싱크 replace
								const smi = body[replaceFrom];
								smi.text = newText;
								newSmis.push(smi);
							} else {
								// 신규 싱크 추가 - SMI에 없던 것이므로 화면 싱크로 예측 진행
								newSmis.push(new Subtitle.Smi(start, Subtitle.SyncType.frame, newText));
							}
							if ((body.length == 0) || (replaceTo >= body.length) || end < body[replaceTo].start) {
								// 다음 싱크와 떨어져 있으면 공백 싱크 추가
								newSmis.push(new Subtitle.Smi(end, Subtitle.SyncType.frame, "&nbsp;"));
							}
							hold.smiFile.body = body.slice(0, replaceFrom).concat(newSmis).concat(body.slice(replaceTo));
							imported = true;
							break;
						}
					}
					if (imported) {
						break;
					}
				}
				
				if (!imported) {
					console.log("ASS 전용 스크립트로 처리", targets);
					appendEvents.push(...targets);
					count++;
				}
				oi += origins.length;
				ti += targets.length;
				
				continue;
			}
			
			// SMI에 없는 스타일인 경우 첫 홀드 SMI 주석으로 몰아주기
			if (groups[""]) {
				console.log("SMI에 없는 스타일인 경우 첫 홀드 SMI 주석으로 몰아주기");
				targets = groups[""].t;
				// SMI에서 가져온 게 뒤쪽으로 와야 함
				targets.push(...groups[oStyles[0]].t);
				groups[oStyles[0]].t = targets;
			}
			
			// 각 스타일 그룹별로 작업
			for (let s = 0; s < oStyles.length; s++) {
				const group = groups[oStyles[s]];
				origins = group.o;
				targets = group.t;
				
				let modified = (origins.length != targets.length);
				if (!modified) {
					// 개수가 그대로면 결과물 검사
					console.log("개수가 그대로면 결과물 검사");
					for (let i = 0; i < origins.length; i++) {
						if (origins[i].Text != targets[i].Text) {
							modified = true;
							break;
						}
					}
				}
				if (modified) {
					// 수정 내역이 존재
					console.log("수정 내역이 존재");
					const origin = origins[origins.length - 1];
					if (origin.origin && origin.origin.origin) {
						// SMI 기반
						const smi = origin.origin.origin;
						console.log("SMI 기반", smi);
						let smiText = smi.text;
						let assComment = "";
						if (smiText.startsWith("<!-- ASS\n")) {
							const endComment = smiText.indexOf("-->\n");
							if (endComment > 0) {
								assComment = smiText.substring(0, endComment + 4);
								smiText = smiText.substring(endComment + 4);
							}
						}
						
						const prepends = [];
						let addCount = targets.length - origins.length;
						for (let i = 0; i < addCount; i++) {
							prepends.push(targets[i]);
						}
						// 1:N이든 N:M이든 일단 ASS 출력물이 더 많음
						if (addCount >= 0) {
							// SMI에 기반한 결과물 개수 확인
							let i = 0;
							for (; i < origins.length; i++) {
								if (origins[i].origin) {
									break;
								}
								prepends.push(targets[addCount + i]);
							}
							let generatedCount = origins.length - i;
							
							// SMI에 기반한 결과물만 가지고 일치 여부 확인
							let replaced = false;
							for (; i < origins.length; i++) {
								if (origins[i].Text != targets[addCount + i].Text) {
									assComment = "";
									replaced = true;
									break;
								}
							}
							
							let completed = false;
							if (replaced && generatedCount == 1) {
								let canReplace = false;
								const sync = origin.origin;
								let requireNext = false;
								const newPrev = [];
								
								let originText = origin.Text;
								let originPrev = [];
								if (originText.startsWith("{")) {
									const end = originText.indexOf("}");
									if (end > 0) {
										originPrev = originText.substring(1, end).split("\\");
										originText = originText.substring(end + 1);
									}
								}
								let targetText = targets[targets.length - 1].Text;
								let targetPrev = [];
								if (targetText.startsWith("{")) {
									const end = targetText.indexOf("}");
									if (end > 0) {
										targetPrev = targetText.substring(1, end).split("\\");
										targetText = targetText.substring(end + 1);
									}
								}
								
								// 스타일이 일치할 때만 확인
								let tStyle = targets[targets.length - 1].Style;
								if (origin.Style == tStyle) {
									// 일부 태그만 추가해서 결과물 가능한지 확인
									/*
									const beginIndex = targetText.indexOf(originText);
									if (beginIndex >= 0) {
										// TODO: 원본 SMI에서 수정할 위치를 역산해서 수정해야 함
										originText = originText.substring(beginIndex)
									*/
									
									if (targetText.startsWith(originText)) {
										// 앞쪽에 붙은 ASS 전용 태그 삭제
										for (let j = 0; j < sync.text.length; j++) {
											// 옛날에 attrs로 만들었어야 했는데, text로 해버려서 좀 헷갈림...
											if (sync.text[j].ass) {
												sync.text[j].ass = null;
											} else {
												break;
											}
										}
										// ASS 변환 결과물 재생성
										let regenAss = Subtitle.AssEvent.fromSync(sync, styles[origin.origin.style]);
										regenAss = regenAss[regenAss.length - 1]; // 여기까지 오려면 반드시 1개 생성돼야 함
										
										// 순수 SMI 태그에서 생성된 ASS 태그
										originPrev = [];
										if (regenAss.Text.startsWith("{")) {
											const end = regenAss.Text.indexOf("}");
											if (end > 0) {
												originPrev = regenAss.Text.substring(1, end).split("\\");
											}
										}
										if (originPrev.length) {
											// 만들어져야 하는 ASS 태그 중에
											let regenOriginCount = 0;
											for (let j = 1; j < targetPrev.length; j++) {
												const tag = targetPrev[j];
												let generated = false;
												// 이미 SMI에서 만들어졌는지 확인
												for (let k = 1; k < originPrev.length; k++) {
													if (tag == originPrev[k]) {
														regenOriginCount++;
														generated = true;
														break;
													}
												}
												if (!generated) {
													// 만들어졌으면 제외
													newPrev.push(tag);
												}
											}
											if (newPrev.length) {
												// ASS 전용으로 추가할 태그 있음
												requireNext = (targetText != originText); // 뒤쪽에 추가로 붙일 내용이 있는지 확인
												canReplace = true; // 원본에 ASS용 태그 붙인 형태로 생성 가능
											} else {
												// 태그 추가만으로 완성할 수 없음
												// 아래에서 완전히 ASS 전용 스크립트로 대체
												// & 위에서 ass 제거한 것도 어차피 불용 태그
											}
										} else {
											// 순수 SMI에선 앞쪽에 붙은 게 없을 때
											if (targetPrev.length) {
												newPrev.push(...targetPrev.slice(1));
											}
											requireNext = (targetText != originText); // 뒤쪽에 추가로 붙일 내용이 있는지 확인
											canReplace = true; // 원본에 ASS용 태그 붙인 형태로 생성 가능
										}
										
									} else {
										/* 일단 기각
										// TODO: 중간 내용물이 바뀐 경우 확인
										// 한 군데만 찾음 - 두 군데 이상 건드려야 하면 그냥 덮어씌우는 게 나을 듯함
										const add = targetText.length - originText.length
										let eqs = 0;
										for (; eqs < originText.length; eqs++) {
											if (targetText[eqs] != originText[eqs]) {
												break;
											}
										}
										let eqe = originText.length;
										for (; eqe > eqs; eqe--) {
											if (targetText[eqe - 1 + add] != originText[eqe - 1]) {
												break;
											}
										}
										if (add < 0) {
											eqe = Math.max(eqe, eqs - add);
										}
										
										// TODO: 이게 돌아가려면 ASS 결과물이 아닌, 원본 SMI에서 수정할 위치를 역산해서 수정해야 함
										console.log("수정할 영역 비중:", ((eqe - eqs) / originText.length));
										if ((eqe - eqs) < (originText.length / 5)) { // 80% 이상 원본 그대로
											let pos = 0;
											for (let j = 0; j < sync.text.length; j++) {
												// ASS 변환 시 공백문자 제거 등이 돌아가기 전 원본임
												console.log(sync.text[j]);
											}
											if (sync.text.length == 1) {
												// 원본에서 속성이 하나일 때만 확인함
												const lines = sync.text[0].text.split("\n");
												const part1 = originText.substring(0, eqs).split("\\N");
												const part2 = originText.substring(eqe);
												const partFrom = originText.substring(eqs, eqe);
												const partTo = targetText.substring(eqs, eqe + add);
												
												console.log(lines, part1, part2, partFrom, partTo);
											}
											// ......... 버릴까
										}
										*/
									}
								}
								
								if (canReplace) {
									// 원본에 ASS용 태그 붙인 형태로 생성 가능
									smi.fromAttrs(sync.text);
									if (newPrev.length) {
										// 앞쪽에 추가 내용 필요
										smiText = '<FONT ass="{\\' + newPrev.join("\\") + '}"></FONT>\n' + smiText;
									}
									if (requireNext) {
										// 뒤쪽에 추가 내용 필요
										const next = targetText.substring(originText.length);
										smiText = smiText + '\n<FONT ass="' + next + '"></FONT>';
									}
									replaced = false;
								} else {
									// 태그 추가로 해결되지 않음
								}
							}
							
							if (!completed) {
								if (replaced) {
									// 기본 내용도 달라짐 - 전체를 신규 내용으로 덮어쓰기
									let newText = "<!-- ASS\n";
									for (i = 0; i < targets.length; i++) {
										const item = targets[i];
										if (item.Name == "" && item.MarginL == 0 && item.MarginR == 0 && item.MarginV == 0 && item.Effect == "") {
											newText += [item.Layer, item.Style, item.Text].join(",") + "\n";
										} else {
											newText += [item.Layer, "", "", item.Style, item.Name, item.MarginL, item.MarginR, item.MarginV, item.Effect, item.Text].join(",") + "\n";
										}
									}
									newText += "END\n-->\n" + smiText;
									smiText = newText;
									
									
								} else if (addCount > 0) {
									// 기본 내용은 동일, 위에 주석만 추가
									let newText = "<!-- ASS\n";
									for (i = 0; i < prepends.length; i++) {
										const item = prepends[i];
										if (item.Name == "" && item.MarginL == 0 && item.MarginR == 0 && item.MarginV == 0 && item.Effect == "") {
											newText += [item.Layer, item.Style, item.Text].join(",") + "\n";
										} else {
											newText += [item.Layer, "", "", item.Style, item.Name, item.MarginL, item.MarginR, item.MarginV, item.Effect, item.Text].join(",") + "\n";
										}
									}
									newText += "-->\n" + smiText;
									smiText = newText;
									
								} else {
									// 변환 결과 그대로 - 동작 X
								}
							}
							smi.text = assComment + smiText;
						}
					} else {
						// ASS 독자 내용
						console.log("ASS 독자 내용", targets);
						appendEvents.push(...targets);
					}
					count++;
				}
				
				// 그룹별 순서가 맞는단 보장은 없지만, 루프 다 돈 다음 개수는 맞음
				oi += origins.length;
				ti += targets.length;
			}
		}
		while (oi < originEvents.length) {
			// ASS 출력 제외 대상
			if (originEvents[oi].origin) {
				const o = originEvents[oi].origin.origin;
				o.text = "<!-- ASS\nEND\n-->\n" + o.text;
			} else {
				// origin이 없었으면 기존에 ASS 전용으로 넣었던 것이므로 삭제 대상
			}
			count++;
			oi++;
		}
		/* 위쪽 루프에서 ti가 끝까지 돌아가게 만듦
		while (ti < targetEvents.length) {
			// 일치하는 게 없으면 추가 내용
			appendEvents.push(targetEvents[ti]);
			ti++;
			count++;
		}
		*/
		
		if (count > 0) {
			confirm("ASS 자막 수정 내역이 있습니다. 적용하시겠습니까?", () => {
				for (let i = 0; i < currentTab.holds.length; i++) {
					const hold = currentTab.holds[i];
					if (!hold.smiFile) continue;
					
					const smiText = hold.smiFile.toText();
					hold.input.val(smiText);
					hold.setCursor(0);
					hold.scrollToCursor();
					hold.render();
				}
				
				// 추가 스타일
				currentTab.area.find(".tab-ass-styles textarea").val(styleTexts.join("\n"));
				
				// 스크립트는 홀드별로 분할해서 넣어야 함
				const holds = currentTab.holds;
				for (let h = 0; h < holds.length; h++) {
					holds[h].ass = [];
				}
				
				const appendEvents = appendFile.getEvents();
				const list = appendEvents.body;
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
				appendEvents.body = appends;
				
				/*
				// TODO: SMI에서 화면 싱크인 것 뽑아오기... 필요한가?
				// 일단 안 넣어주면 모두 화면 싱크로 처리되는 중
				const totalFrameSyncs = [];
				for (let h = 0; h < currentTab.holds.length; h++) {
					const lines = currentTab.holds[h].lines;
					for (let i = 0; i < lines.length; i++) {
						const line = lines[i];
						if (line.TYPE == TYPE.FRAME) {
							
						}
					}
				}
				*/
				
				currentTab.assHold.assEditor.setEvents(appendEvents.body);
				
				// 각 홀드 ASS 에디터
				for (let h = 0; h < holds.length; h++) {
					const hold = holds[h];
					hold.assEditor.setEvents(hold.ass);
				}
				
			}, () => {
				// TODO: 적용 안 하면 어쩔?
				// 기존 ASS 파일 .bak 파일이라도 만들?
				// ... 영상 불러오면 자동으로 가져오려고 했는데, 수동으로 가져온다면 필요 없을지도?
			});
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
	return new Subtitle.SmiFile().fromSync(new Subtitle.SrtFile(text).toSyncs()).toText();
}

/**
 * frameSyncOnly: 화면 싱크만 맞춰주기
 * add: 과거 반프레임 보정치 안 넣었던 것들을 위해 추가
 */
function fitSyncsToFrame(frameSyncOnly=false, add=0) {
	if (!SmiEditor.video.fs.length) {
		/*
		return;
		/*/
		// 테스트용 코드
		for (let s = 0; s < 2000000; s += 50) {
			SmiEditor.video.fs.push(s);
			if (s % 1000 == 0) {
				SmiEditor.video.kfs.push(s);
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