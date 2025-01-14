let time = 0;

let tabs = [];
let tab = 0;
let closingTab = null;
let tabToCloseAfterRun = null;

let autoSaveTemp = null;

let autoFindSync = false;

// C# 쪽에서 호출
function refreshTime(now, fr) {
	if (time != now) {
		time = now;
		if (autoFindSync && tabs.length && tabs[tab]) {
			tabs[tab].holds[tabs[tab].hold].findSync();
		}
	}
	if (fr) {
		if (fr == 23975) {
			fr = 23975.7; // 일부 영상 버그
		}
		SmiEditor.video.FL = 1000000 / (SmiEditor.video.FR = fr);
		if (showFps == null) {
			showFps = $("#showFps");
		}
		showFps.text((Math.floor(fr*10+0.5)/10000) + " fps");
	}
}
let showFps = null;

window.Tab = function(text, path) {
	this.holdSelector = $("<div class='hold-selector'>");
	this.holdArea = $("<div class='holds'>");
	this.area = $("<div class='tab'>").append(this.holdSelector).append(this.holdArea);
	this.holds = [];
	this.hold = 0;
	this.lastHold = 1;
	this.path = path;
	
	let holds = Subtitle.SmiFile.textToHolds(text);
	for (let i = 0; i < holds.length; i++) {
		this.addHold(holds[i], i == 0, i == 0);
	}
	this.savedHolds = this.holds.slice(0);
	
	let tab = this;
	this.holdSelector.on("click", ".selector", function() {
		tab.selectHold($(this).data("hold"));
		
	}).on("dblclick", ".hold-name", function(e) {
		e.stopPropagation();
		let hold = $(this).parents(".selector").data("hold");
		if (hold == tab.holds[0]) {
			// 메인 홀드는 이름 변경 X
			return;
		}
		prompt("홀드 이름 변경", function(input) {
			if (!input) {
				alert("잘못된 입력입니다.");
				return;
			}
			hold.selector.find(".hold-name > span").text(tab.holds.indexOf(hold) + "." + (hold.name = input));
			tab.onChangeSaved();
		});
		
	}).on("click", ".btn-hold-remove", function(e) {
		e.stopPropagation();
		let hold = $(this).parents(".selector").data("hold");
		confirm("삭제하시겠습니까?", function() {
			let index = tab.holds.indexOf(hold);
			
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
		let hold = $(this).parents(".selector").data("hold");
		if (hold.pos == -1) {
			hold.pos = 1;
		} else {
			hold.pos++;
		}
		tab.updateHoldSelector();
		tab.onChangeSaved();
		SmiEditor.Viewer.refresh();
		
	}).on("click", ".btn-hold-lower", function(e) {
		e.stopPropagation();
		let hold = $(this).parents(".selector").data("hold");
		if (hold.pos == 1) {
			hold.pos = -1;
		} else {
			hold.pos--;
		}
		tab.updateHoldSelector();
		tab.onChangeSaved();
		SmiEditor.Viewer.refresh();
	});
};
Tab.prototype.addHold = function(info, isMain=false, asActive=true) {
	if (!info) {
		info = {
				name: "새 홀드"
			,	text: ""
			,	pos: 1
		}
	}
	let hold = new SmiEditor(info.text);
	this.holds.push(hold);
	this.holdSelector.append(hold.selector = $("<div class='selector'>").data({ hold: hold }));
	let divName = $("<div class='hold-name'>");
	hold.selector.append(divName.append($("<span>").text(hold.name = hold.savedName = info.name)));
	hold.owner = this;
	hold.pos = hold.savedPos = info.pos;
	hold.tempSavedText = info.text;
	hold.updateTimeRange();
	if (isMain) {
		hold.selector.addClass("selected");
	} else {
		hold.selector.append($("<button type='button' class='btn-hold-remove'>"));
		hold.selector.append($("<button type='button' class='btn-hold-upper'>"));
		hold.selector.append($("<button type='button' class='btn-hold-lower'>"));
		hold.area.hide();
	}
	this.holdArea.append(hold.area);
	this.updateHoldSelector();
	if (asActive) {
		this.selectHold(hold);
	}
	this.onChangeSaved();
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
	
	let timers = [];
	for (let i = 0; i < this.holds.length; i++) {
		let hold = this.holds[i];
		if (i > 0) {
			hold.selector.find(".hold-name span").text(i + "." + hold.name);
		}
		timers.push({ time: hold.start, holds: [{ index: i, type: BEGIN }] });
		timers.push({ time: hold.end  , holds: [{ index: i, type: END   }] });
	}
	timers[0].time = timers[0].rate = 0; // 메인 홀드는 시작 시간 0으로 출력
	timers.sort(function(a, b) {
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
	
	let add = 0;
	{	let begins = [];
		for (let i= 0; i < timers.length; i++) {
			let timer = timers[i];
			
			let a = 0;
			for (let j = 0; j < timer.holds.length; j++) {
				if (timer.holds[j].type == END) {
					let min = begins[timer.holds[j].index] + 4;
					if (i + add < min) {
						Math.max(a = min - (i + add));
					}
				}
			}
			if (a) {
				add += a;
			}
			timer.rate = i + add;
			
			for (let j = 0; j < timer.holds.length; j++) {
				if (timer.holds[j].type == BEGIN) {
					begins[timer.holds[j].index] = timer.rate;
				}
			}
		}
	}
	
	let posStatus = {};
	for (let i = 0; i < timers.length; i++) {
		let timer = timers[i];
		let rate = (timer.rate / (timers.length + add - 1) * 100);
		for (let j = 0; j < timer.holds.length; j++) {
			let selector = timer.holds[j];
			let hold = this.holds[selector.index];
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
					let posHolds = posStatus[pos];
					let index = posHolds.indexOf(hold);
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
	hold.input.focus();
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
	}
}
Tab.prototype.replaceBeforeSave = function() {
	for (let i = 0; i < this.holds.length; i++) {
		let text = this.holds[i].text = this.holds[i].input.val(); // .text 동기화 실패 가능성 고려, 현재 값 다시 불러옴
		let changed = false;
		
		// 커서 기준 3개로 나눠서 치환
		let cursor = this.holds[i].getCursor();
		text = [text.substring(0, cursor[0]), text.substring(cursor[0], cursor[1]), text.substring(cursor[1])];
		for (let j = 0; j < setting.replace.length; j++) {
			let item = setting.replace[j];
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
				let item = setting.replace[j];
				if (item.use) {
					let index = text[0].indexOf(item.from);
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
				let item = setting.replace[j];
				if (item.use) {
					let index = text.indexOf(item.from);
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
Tab.prototype.getSaveText = function(withCombine=true, withComment=true) {
	return Subtitle.SmiFile.holdsToText(this.holds, setting.saveWithNormalize, withCombine, withComment);
}
Tab.prototype.onChangeSaved = function(hold) {
	if (this.isSaved()) {
		this.area.removeClass("not-saved");
	} else {
		this.area.addClass("not-saved");
	}
	
	// 홀드 갱신
	if (hold) {
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
	
	return true;
}

SmiEditor.prototype.isSaved = function() {
	return (this.name == this.savedName) && (this.pos == this.savedPos) && (this.saved == this.input.val());
};
SmiEditor.prototype.onChangeSaved = function(saved) {
	// 수정될 수 있는 건 열려있는 탭이므로
	if (!tabs.length) return;
	let currentTab = tabs[tab];
	if (!currentTab) return;
	currentTab.onChangeSaved(this);
};
SmiEditor.prototype.updateTimeRange = function() {
	let start = 999999998;
	let end = 0;
	for (let i = 0; i < this.lines.length; i++) {
		let line = this.lines[i];
		if (line[LINE.TYPE]) {
			start = Math.min(start, line[LINE.SYNC]);
			end   = Math.max(end  , line[LINE.SYNC]);
		}
	}
	if (end) {
		this.start = start;
		this.end   = (start == end) ? 999999999 : end;
	} else {
		this.end = 999999999;
	}
}

function deepCopyObj(obj) {
	if (obj && typeof obj == "object") {
		if (Array.isArray(obj)) {
			return JSON.parse(JSON.stringify(obj));
		}
		
		let out = {};
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
function init(jsonSetting) {
	try {
		setting = JSON.parse(jsonSetting);
		
		let notified = checkVersion(setting.version);
		
		// C#에서 보내준 세팅값 오류로 빠진 게 있으면 채워주기
		if (typeof setting == "object" && !Array.isArray(setting)) {
			let count = setDefault(setting, DEFAULT_SETTING);
			if (setting.version != DEFAULT_SETTING.version) {
				setting.version = DEFAULT_SETTING.version;
				count++;
				
				if (notified.menu) {
					// 메뉴 기본값이 바뀌었을 경우
					
					for (let di = 0; di < DEFAULT_SETTING.menu.length; di++) {
						let exist0 = false;
						
						let dMenu = DEFAULT_SETTING.menu[di];
						let dMenu0 = dMenu[0];
						let dMenu0name = dMenu0.split("(&")[0];
						
						for (let si = 0; si < setting.menu.length; si++) {
							let sMenu = setting.menu[si];
							let sMenu0 = sMenu[0];
							let sMenu0name = sMenu0.split("(&")[0];
							
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
									
									let dMenu1 = dMenu[dj];
									let dMenu1name = dMenu1.split("|")[0].split("(&")[0];
									
									for (let sj = 1; sj < sMenu.length; sj++) {
										let sMenu1 = sMenu[sj];
										let sMenu1name = sMenu1.split("|")[0].split("(&")[0];
										
										if (sMenu1name == dMenu1name) {
											// 이름이 같은 메뉴를 찾았을 경우
											exist1 = true;
											let updated = false;
											
											let sLen = sMenu1.indexOf("|");
											let dLen = dMenu1.indexOf("|");
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
		setting = deepCopyObj(DEFAULT_SETTING);
		saveSetting();
	}
	
	let btnAddHold = $("#btnAddHold").on("click", function() {
		if (tabs.length == 0) return;
		tabs[tab].addHold();
	});
	let inputWeight = $("#inputWeight").bind("input propertychange", function() {
		let weight = inputWeight.val();
		if (isFinite(weight)) {
			SmiEditor.sync.weight = Number(weight);
		} else {
			alert("숫자를 입력하세요.");
			let cursor = inputWeight[0].selectionEnd - 1;
			inputWeight.val(SmiEditor.sync.weight);
			inputWeight[0].setSelectionRange(cursor, cursor);
		}
	});
	let inputUnit = $("#inputUnit").on("input propertychange", function() {
		let unit = inputUnit.val();
		if (isFinite(unit)) {
			SmiEditor.sync.unit = Number(unit);
		} else {
			alert("숫자를 입력하세요.");
			let cursor = inputUnit[0].selectionEnd - 1;
			inputUnit.val(SmiEditor.sync.unit);
			inputUnit[0].setSelectionRange(cursor, cursor);
		}
	});
	let btnMoveToBack = $("#btnMoveToBack").on("click", function() {
		if (tabs.length == 0) return;
		tabs[tab].holds[tabs[tab].hold].moveSync(false);
		tabs[tab].holds[tabs[tab].hold].input.focus();
	});
	let btnMoveToForward = $("#btnMoveToForward").on("click", function() {
		if (tabs.length == 0) return;
		tabs[tab].holds[tabs[tab].hold].moveSync(true);
		tabs[tab].holds[tabs[tab].hold].input.focus();
	});
	
	let checkAutoFindSync = $("#checkAutoFindSync").on("click", function() {
		autoFindSync = $(this).prop("checked");
		if (tabs.length == 0) return;
		tabs[tab].holds[tabs[tab].hold].input.focus();
	});
	let checkTrustKeyframe = $("#checkTrustKeyframe").on("click", function() {
		SmiEditor.trustKeyFrame = $(this).prop("checked");
		if (tabs.length == 0) return;
	});
	
	let btnNewTab = $("#btnNewTab").on("click", function() {
		openNewTab();
	});
	
	let tabSelector = $("#tabSelector").on("click", ".th:not(#btnNewTab)", function() {
		let th = $(this);
		if (th[0] == closingTab) {
			return;
		}
		
		tabSelector.find(".selected").removeClass("selected");
		let currentTab = th.addClass("selected").data("tab");
		if (currentTab) {
			tab = tabs.indexOf(currentTab);
			hold = tab.hold;
			$("#editor > .tab").hide();
			currentTab.area.show();
			if (_for_video_) { // 동영상 파일명으로 자막 파일을 연 경우 동영상 열기 불필요
				_for_video_ = false;
			} else if (currentTab.path && currentTab.path.length > 4 && binder) {
				binder.checkLoadVideoFile(currentTab.path);
			}
		}
		SmiEditor.selected = currentTab.holds[currentTab.hold];
		SmiEditor.Viewer.refresh();
		
		// 탭에 따라 홀드 여부 다를 수 있음
		refreshPaddingBottom();
		
	}).on("click", ".btn-close-tab", function(e) {
		e.preventDefault();
		
		let th = $(this).parent();
		closingTab = th[0];
		setTimeout(function() { // 탭 선택 이벤트 방지... e.preventDefault()로 안 되네...
			closingTab == null;
		}, 1);
		
		let currentTab = th.data("tab");
		let saved = true;
		for (let i = 0; i < currentTab.holds.length; i++) {
			if (currentTab.holds[i].input.val() != currentTab.holds[i].saved) {
				saved = false;
				break;
			}
		}
		
		confirm((saved ? "저장되지 않았습니다.\n" : "") + "탭을 닫으시겠습니까?", function() {
			let index = closeTab(th);

			setTimeout(function() {
				if (tabs.length && $("#tabSelector .th.selected").length == 0) {
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
			}, 1);
		});
	});
	$(document).on("keydown", function(e) {
		// Ctrl+F4 닫기
		if (e.ctrlKey && e.keyCode == 115 && setting.useTab) {
			if (tabs.length && tabs[tab]) {
				$("#tabSelector .th:eq(" + tab + ") .btn-close-tab").click();
			}
		}
	});
	
	SmiEditor.activateKeyEvent();
	SmiEditor.Viewer.open();
	
	setSetting(setting);
	moveWindowsToSetting();

	autoSaveTemp = setInterval(function () {
		saveTemp();
	}, setting.tempSave * 1000);
}

function setSetting(setting) {
	// 탭 on/off 먼저 해야 height값 계산 가능
	if (setting.useTab) {
		$("body").addClass("use-tab");
	} else {
		$("body").removeClass("use-tab");
		if (tabs.length == 0) {
			// 탭 기능 껐을 땐 에디터 하나 열린 상태
			newFile();
		}
	}
	
	SmiEditor.setSetting(setting);
	{
		if (setting.css) {
			delete(setting.css);
		}

		// 스크롤바 버튼 새로 그려야 함
		let button = "";
		let disabled = "";
		{
			let canvas = SmiEditor.canvas;
			if (!canvas) canvas = SmiEditor.canvas = document.createElement("canvas");
			canvas.width = 34;
			canvas.height = 34;
			
			let c = canvas.getContext("2d");
			let x;
			let y;
			x =  8; y =  8; c.moveTo(x, y-1.5); c.lineTo(x+3.5, y+2), c.lineTo(x-3.5, y+2); c.closePath();
			x =  8; y = 25; c.moveTo(x, y+1.5); c.lineTo(x+3.5, y-2), c.lineTo(x-3.5, y-2); c.closePath();
			x = 25; y =  8; c.moveTo(x-1.5, y); c.lineTo(x+2, y-3.5), c.lineTo(x+2, y+3.5); c.closePath();
			x = 25; y = 25; c.moveTo(x+1.5, y); c.lineTo(x-2, y+3.5), c.lineTo(x-2, y-3.5); c.closePath();
			
			c.fillStyle = setting.color.tabBorder;
			c.fill();
			button = SmiEditor.canvas.toDataURL();
			
			c.fillStyle = setting.color.border;
			c.fill();
			disabled = SmiEditor.canvas.toDataURL();
		}

		$.ajax({url: "lib/SmiEditor.color.css"
			,	dataType: "text"
			,	success: function(preset) {
					for (let name in setting.color) {
						preset = preset.split("[" + name + "]").join(setting.color[name]);
					}
					preset = preset.split("[button]").join(button).split("[buttonDisabled]").join(disabled);
					
					let $style = $("#styleColor");
					if (!$style.length) {
						$("head").append($style = $("<style id='styleColor'>"));
					}
					$style.html(preset);
				}
		});
	}
	{
		function afterLoadHighlight() {
			SmiEditor.refreshHighlight();
			for (let i = 0; i < tabs.length; i++) {
				for (let j = 0; j < tabs[i].holds.length; j++) {
					let hold = tabs[i].holds[j];
					hold.highlightLines = [];
					hold.hview.empty();
					hold.updateHighlight();
				}
			}
		}
		if (setting.useHighlight == false) {
			setting.highlight = { parser: "", style: eclipse };
			delete(setting.useHighlight);
		} else if (setting.useHighlight) {
			delete(setting.useHighlight);
		}
		if (setting.highlight.parser && setting.highlight.style) {
			$.ajax({url: "lib/highlight/parser/" + setting.highlight.parser + ".js"
				,	dataType: "text"
				,	success: function(parser) {
						eval(parser);
						$.ajax({url: "lib/highlight/styles/" + setting.highlight.style + ".css"
							,	dataType: "text"
							,	success: function(style) {
									SmiEditor.highlightCss = style;
									afterLoadHighlight();
								}
						});
					}
			});
		} else {
			afterLoadHighlight();
		}
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
	SmiEditor.withCtrls.reserved += "NOS";
	
	// 가중치 등
	$("#inputWeight").val(setting.sync.weight);
	$("#inputUnit"  ).val(setting.sync.unit  );
	if (setting.sync.frame) {
		$(".for-frame-sync").show();
	} else {
		$(".for-frame-sync").hide();
	}
	
	{
		let dll = setting.player.control.dll;
		if (dll) {
			let playerSetting = setting.player.control[dll];
			if (playerSetting) {
				binder.setPlayer(dll, playerSetting.path, playerSetting.withRun);
			}
		}
	}
	
	Combine.css = setting.viewer.css;
	
	binder.setMenus(setting.menu);
	
	return setting;
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
	setTimeout(function() {
		refreshPaddingBottom();
	}, 1);
}

// C# 쪽에서 호출
function setDpiBy(width) {
	// C#에서 보내준 창 크기와 js에서 구한 브라우저 크기의 불일치를 이용해 DPI 배율을 구함
	setTimeout(function() {
		DPI = (width + 8) / (window.outerWidth + 10);
	}, 1000); // 로딩 덜 됐을 수가 있어서 딜레이 줌
}

let playerDlls = [];
let highlights = [];
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
			, setting.window.x + (40 * DPI)
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
		
		// 창 위치/크기 조절하고 일정 시간 지나면 C#에서 여기가 호출됨
		refreshPaddingBottom();
	}
}
function refreshPaddingBottom() {
	// 에디터 하단 여백 재조정
	let holdTop = tabs.length ? Number(tabs[tab].area.find(".holds").css("top").split("px")[0]) : 0;
	let append = "\n#editor textarea { padding-bottom: " + ($("#editor").height() - holdTop - SB - LH - 2) + "px; }";
	let $style = $("#stylePaddingBottom");
	if (!$style.length) {
		$("head").append($style = $("<style id='stylePaddingBottom'>"));
	}
	$style.html(append);
}

function openHelp(name) {
	let url = (name.substring(0, 4) == "http") ? name : "help/" + name.split("..").join("").split(":").join("") + ".html";
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
			let currentTab = tabs[0];
			for (let i = 0; i < currentTab.holds.length; i++) {
				if (!currentTab.isSaved()) {
					confirm("현재 파일을 닫을까요?", function () {
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
	let targetTab = th.data("tab");
	let index = tabs.indexOf(targetTab);
	tabs.splice(index, 1);
	targetTab.area.remove();
	th.remove();
	delete targetTab;
	
	SmiEditor.selected = null;
	SmiEditor.Viewer.refresh();
	return index;
}

function newFile() {
	runIfCanOpenNewTab(openNewTab);
}

function openFile(path, text, forVideo) {
	// C#에서 파일 열 동안 canOpenNewTab 결과가 달라질 리는 없겠지만, 일단은 바깥에서 감싸주기
	runIfCanOpenNewTab(function() {
		if (path) {
			// 새 탭 열기
			openNewTab(text, path, forVideo);
		} else {
			// C#에서 파일 열기 대화상자 실행
			binder.openFile();
		}
	});
}
function openFileForVideo(path, text) {
	runIfCanOpenNewTab(function() {
		// C#에서 동영상의 자막 파일 탐색
		binder.openFileForVideo();
	});
}

let exporting = false;
function saveFile(asNew, isExport) {
	let currentTab = tabs[tab];
	for (let i = 0; i < currentTab.holds.length; i++) {
		currentTab.holds[i].history.log();
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
			let index = path.lastIndexOf("/");
			let prefix = "_"; // 설정 만들기?
			path = path.substring(0, index + 1) + prefix + path.substring(index + 1);
		} else {
			path = "";
			alert("웹버전에서는 파일명 지정이 필수입니다.");
		}
	}
	
	/* // 수정된 게 없어 보여도, 다른 프로그램에서 수정한 걸 덮어쓸 수도 있음
	if (text == currentTab.saved) {
		// 마지막 저장 이후 수정된 게 없음
		//return false;
	}
	*/
	
	if (currentTab.area.find(".sync.error,.sync.equal").length) {
		confirm("싱크 오류가 있습니다.\n저장하시겠습니까?", function() {
			binder.save(currentTab.getSaveText(true, !(exporting = isExport)), path);
		});
	} else {
		binder.save(currentTab.getSaveText(true, !(exporting = isExport)), path);
	}
}

// 저장 후 C# 쪽에서 호출
function afterSaveFile(path) {
	let currentTab = tabs[tab];
	if (exporting) {
		// 내보내기 동작일 땐 상태 바꾸지 않음
		exporting = false;
		return;
	}
	for (let i = 0; i < currentTab.holds.length; i++) {
		// currentTab.holds[i].afterSave(); // 최종 저장 여부는 탭 단위로 다뤄져야 해서 군더더기 작업이 됨
		currentTab.holds[i].saved = currentTab.holds[i].input.val();
	}
	currentTab.path = path;
	let title = path ? ((path.length > 14) ? ("..." + path.substring(path.length - 14, path.length - 4)) : path.substring(0, path.length - 4)) : "새 문서";
	$("#tabSelector .th:eq(" + tab + ") span").text(title);
	currentTab.holdEdited = false;
	currentTab.savedHolds = currentTab.holds.slice(0);
	
	// savedHolds가 교체된 후에 저장 여부 체크
	currentTab.onChangeSaved();
}
SmiEditor.prototype._afterSave = SmiEditor.prototype.afterSave;
SmiEditor.prototype.afterSave = function() {
	this.savedName = this.name;
	this.savedPos = this.pos;
	this._afterSave();
}

function saveTemp() {
	let currentTab = tabs[tab];
	if (!currentTab) {
		return;
	}

	// 마지막 임시 저장 이후 변경 사항 없으면 무시
	let texts = [];
	let isChanged = false;
	for (let i = 0; i < currentTab.holds.length; i++) {
		let text = texts[i] = currentTab.holds[i].input.val();
		if (text == currentTab.holds[i].tempSavedText) {
			continue;
		}
		isChanged = true;
	}
	
	if (isChanged) {
		let path = currentTab.path ? currentTab.path : "\\new.smi";
		binder.saveTemp(currentTab.getSaveText(false), path);
		for (let i = 0; i < currentTab.holds.length; i++) {
			currentTab.holds[i].tempSavedText = texts[i];
		}
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
	
	let texts = [];
	if (path) {
		if (path.substring(path.length - 4).toUpperCase() == ".SRT") {
			// SRT 파일 불러왔을 경우 SMI로 변환
			path = path.substring(0, path.length - 4) + ".smi";
			texts.push(text = srt2smi(text));
		}
	}

	let title = path ? ((path.length > 14) ? ("..." + path.substring(path.length - 14, path.length - 4)) : path.substring(0, path.length - 4)) : "새 문서";
	
	let tab = new Tab(text ? text : setting.newFile, path);
	tabs.push(tab);
	$("#editor").append(tab.area);

	let th = $("<div class='th'>").append($("<span>").text(title));
	th.append($("<button type='button' class='btn-close-tab'>").text("×"));
	$("#btnNewTab").before(th);
	
	_for_video_ = forVideo;
	th.data("tab", tab).click();
	tab.th = th;
	
	return tab;
}
// C# 쪽에서 호출
function confirmLoadVideo(path) {
	setTimeout(function () {
		confirm("동영상 파일을 같이 열까요?\n" + path, function () {
			binder.loadVideoFile(path);
		});
	}, 1);
}

// C# 쪽에서 호출
function setVideo(path) {
	if (SmiEditor.video.path != path) {
		SmiEditor.video.path = path;
		SmiEditor.video.fs = [];
		SmiEditor.video.kfs = [];
		$("#forFrameSync").addClass("disabled");
		$("#checkTrustKeyframe").attr({ disabled: true });
		binder.requestFrames(path);
	}
}
// C# 쪽에서 호출
function loadFkf(fkfName) {
	// C# 파일 객체를 js 쪽에 전달할 수 없으므로, 정해진 경로의 파일을 ajax 형태로 가져옴
	let req = new XMLHttpRequest();
	req.open("GET", "../temp/" + fkfName);
	req.responseType = "arraybuffer";
	req.onload = function(e) {
		let buffer = req.response;
		
		let fkf = new Int32Array(buffer);
		let vfsLength = fkf[0];
		let kfsLength = fkf[1];
		
		let vfs = [];
		let kfs = [];
		
		let offset = 8;
		let view = new DataView(buffer.slice(offset, offset + (vfsLength * 4)));
		for (let i = 0; i < vfsLength; i++) {
			vfs.push(view.getInt32(i * 4, true));
		}
		offset = offset + (vfsLength * 4);
		view = new DataView(buffer.slice(offset, offset + (kfsLength * 4)));
		for (let i = 0; i < kfsLength; i++) {
			kfs.push(view.getInt32(i * 4, true));
		}
		
		SmiEditor.video.fs  = vfs;
		SmiEditor.video.kfs = kfs;
		
		// 키프레임 신뢰 기능 활성화
		$("#forFrameSync").removeClass("disabled");
		$("#checkTrustKeyframe").attr({ disabled: false });
		Progress.set("#forFrameSync", 0);
	}
	req.onerror = function(e) {
		// 실패했어도 프로그레스바는 없애줌
		Progress.set("#forFrameSync", 0);
	}
	req.send();
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

let REG_SRT_SYNC = /^([0-9]{2}:){1,2}[0-9]{2}[,.][0-9]{2,3}( )*-->( )*([0-9]{2}:){1,2}[0-9]{2}[,.][0-9]{2,3}$/;
function srt2smi(text) {
	return new Subtitle.SmiFile().fromSync(new Subtitle.SrtFile(text).toSync()).toTxt();
}
