var DPI = 1;

var time = 0;
var FR = 23976;
var FL = 1000000 / FR;

var tabs = [];
var tab = 0;
var closingTab = null;
var tabToCloseAfterRun = null;

var autoSaveTemp = null;

var autoFindSync = false;

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
		FL = 1000000 / (FR = fr);
		if (showFps == null) {
			showFps = $("#showFps");
		}
		showFps.text((Math.floor(fr*10+0.5)/10000) + " fps");
	}
}
var showFps = null;

var Tab = function(text, path) {
	this.holdSelector = $("<div class='hold-selector'>");
	this.holdArea = $("<div class='holds'>");
	this.area = $("<div class='tab'>").append(this.holdSelector).append(this.holdArea);
	this.holds = [];
	this.hold = 0;
	this.path = path;
	
	var texts = text.split("\r\n").join("\n").split("\n<!-- Hold=");
	var holdInfos = [{ text: texts[0] }];
	for (var i = 1; i < texts.length; i++) {
		var hold = texts[i];
		var begin = hold.indexOf("\n");
		var end = hold.indexOf("-->");
		if (begin < 0 || end < 0) {
			holdInfos[0].text += "\n<!-- Hold=" + hold;
			continue;
		}
		// Hold 내용물 뒤에 뭐가 더 붙어있을 경우
		if (end < hold.length - 3) {
			holdInfos[0].text += hold.substring(end);
		}
		var name = hold.substring(0, begin).trim();
		var pos = 1;
		var index = name.indexOf("|");
		if (index) {
			try {
				pos = Number(name.substring(0, index));
			} catch (e) {
				console.log(e);
			}
			name = name.substring(index + 1);
		}
		holdInfos.push({
				pos: pos
			,	name: name
			,	text: hold.substring(begin, end).trim().split("<​").join("<").split("​>").join(">")
		});
	}
	
	// SMI 파일 역정규화
	var normalized = new Subtitle.SmiFile(holdInfos[0].text).antiNormalize();
	normalized[0].pos = 0;
	normalized[0].name = "메인";
	holdInfos = normalized.concat(holdInfos.slice(1));
	holdInfos[0].text = holdInfos[0].toTxt().trim();
	for (var i = 1; i < normalized.length; i++) {
		// 내포된 홀드는 종료싱크가 빠졌을 수 있음
		var hold = holdInfos[i];
		if (hold.next && hold.body[hold.body.length - 1].text.split("&nbsp;").join("").trim().length > 0) {
			hold.body.push(new Subtitle.Smi(hold.next.start, hold.next.syncType, "&nbsp;"));
		}
		holdInfos[i].text = hold.toTxt().trim();
	}
	for (var i = normalized.length; i < holdInfos.length; i++) {
		holdInfos[i].text = new Subtitle.SmiFile(holdInfos[i].text).antiNormalize()[0].toTxt().trim();
	}
	
	for (var i = 0; i < holdInfos.length; i++) {
		this.addHold(holdInfos[i], i == 0, i == 0);
	}
	
	var tab = this;
	this.holdSelector.on("click", ".selector", function() {
		var hold = SmiEditor.selected = $(this).data("hold");
		tab.holdSelector.find(".selector").removeClass("selected");
		tab.holdArea.find(".hold").hide();
		hold.selector.addClass("selected");
		hold.area.show();
		hold.input.focus();
		tab.hold = tab.holds.indexOf(hold);
		SmiEditor.Viewer.refresh();
		
	}).on("dblclick", ".hold-name", function(e) {
		e.stopPropagation();
		var hold = $(this).parents(".selector").data("hold");
		if (hold == tab.holds[0]) {
			// 메인 홀드는 이름 변경 X
			return;
		}
		prompt("홀드 이름 변경", function(input) {
			if (!input) {
				alert("잘못된 입력입니다.");
				return;
			}
			hold.selector.find(".hold-name > span").text(hold.name = input);
			tab.onChangeSaved();
		});
		
	}).on("click", ".btn-hold-remove", function(e) {
		e.stopPropagation();
		var hold = $(this).parents(".selector").data("hold");
		confirm("삭제하시겠습니까?", function() {
			var index = tab.holds.indexOf(hold);
			tab.holds.splice(index, 1);
			hold.selector.remove();
			hold.area.remove();
			delete hold;
			
			// 선택된 걸 삭제했을 경우 메인 홀드로
			if (tab.hold == index) {
				tab.holds[0].selector.click();
			}
			tab.holdEdited = true;
			tab.updateHoldSelector();
			tab.onChangeSaved();
			SmiEditor.Viewer.refresh();
		});
		
	}).on("click", ".btn-hold-upper", function(e) {
		e.stopPropagation();
		var hold = $(this).parents(".selector").data("hold");
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
		var hold = $(this).parents(".selector").data("hold");
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
	var hold = new SmiEditor(info.text);
	this.holds.push(hold);
	this.holdSelector.append(hold.selector = $("<div class='selector'>").data({ hold: hold }));
	var divName = $("<div class='hold-name'>");
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
		hold.selector.click();
	}
}
Tab.prototype.updateHoldSelector = function() {
	if (this.holds.length <= 1) {
		this.area.removeClass("with-hold");
		return;
	}
	this.area.addClass("with-hold");

	var BEGIN = 1;
	var END = -1;
	
	// 홀드 여부 달라질 수 있음
	SmiEditor.refreshStyle(setting, getAppendStyle());
	
	var timers = [];
	for (var i = 0; i < this.holds.length; i++) {
		var hold = this.holds[i];
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
	
	for (var i = 0; i < timers.length - 1; i++) {
		if (timers[i].time == timers[i+1].time) {
			timers[i].holds.push(timers[i+1].holds[0]);
			timers.splice(i + 1, 1);
			i--;
		}
	}
	
	var add = 0;
	{	var begins = [];
		for (var i= 0; i < timers.length; i++) {
			var timer = timers[i];
			
			var a = 0;
			for (var j = 0; j < timer.holds.length; j++) {
				if (timer.holds[j].type == END) {
					var min = begins[timer.holds[j].index] + 4;
					if (i + add < min) {
						Math.max(a = min - (i + add));
					}
				}
			}
			if (a) {
				add += a;
			}
			timer.rate = i + add;
			
			for (var j = 0; j < timer.holds.length; j++) {
				if (timer.holds[j].type == BEGIN) {
					begins[timer.holds[j].index] = timer.rate;
				}
			}
		}
	}
	
	var posStatus = {};
	for (var i = 0; i < timers.length; i++) {
		var timer = timers[i];
		var rate = (timer.rate / (timers.length + add - 1) * 100);
		for (var j = 0; j < timer.holds.length; j++) {
			var selector = timer.holds[j];
			var hold = this.holds[selector.index];
			if (selector.type == BEGIN) {
				// 홀드 시작
				hold.selector.css({ left: rate + "%" });
				
				// 홀드끼리 영역 겹칠 경우 보완 필요
				var pos = hold.pos;
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
				
				var top = 30;
				if (pos > 0) {
					for (var k = 0; k < pos; k++) {
						top /= 2;
					}
				} else if (hold.pos < 0) {
					for (var k = 0; k < -pos; k++) {
						top /= 2;
					}
					top = 60 - top;
				}
				hold.selector.css({ top: top + "%" });
				
			} else {
				// 홀드 끝
				hold.selector.css({ right: (100 - rate) + "%" });
				
				// 홀드 위치 사용 중 해제
				for (var pos in posStatus) {
					var posHolds = posStatus[pos];
					var index = posHolds.indexOf(hold);
					if (index >= 0) {
						posHolds.splice(index, 1);
					}
				}
			}
		}
	}
}
Tab.prototype.replaceBeforeSave = function() {
	for (var i = 0; i < this.holds.length; i++) {
		var text = this.holds[i].text = this.holds[i].input.val(); // .text 동기화 실패 가능성 고려, 현재 값 다시 불러옴
		var changed = false;
		
		// 커서 기준 3개로 나눠서 치환
		var cursor = this.holds[i].getCursor();
		text = [text.substring(0, cursor[0]), text.substring(cursor[0], cursor[1]), text.substring(cursor[1])];
		for (var j = 0; j < setting.replace.length; j++) {
			var item = setting.replace[j];
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
			for (var j = 0; j < setting.replace.length; j++) {
				var item = setting.replace[j];
				if (item.use) {
					var index = text[0].indexOf(item.from);
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
			for (var j = 0; j < setting.replace.length; j++) {
				var item = setting.replace[j];
				if (item.use) {
					var index = text.indexOf(item.from);
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
	var result = [];
	var logs = [];
	var originBody = [];
	
	var main = new Subtitle.SmiFile(this.holds[0].text);
	withCombine = withCombine && this.holds.length > 1;
	
	// 정규화 등 작업
	if (setting.saveWithNormalize) {
		var normalized = Subtitle.Smi.normalize(main.body, withComment && !withCombine);
		originBody = normalized.origin;
		logs = normalized.logs;
	} else {
		if (this.holds.length > 1) {
			originBody = main.body.slice(0, main.body.length);
		}
	}
	
	if (withCombine) {
		// 시작 시간 순으로 저장
		var holds = this.holds.slice(1);
		holds.sort(function(a, b) {
			return a.start - b.start;
		});
		for (var hi = 0; hi < holds.length; hi++) {
			var hold = holds[hi];
			result[hold.resultIndex = (hi + 1)] = "<!-- Hold=" + hold.pos + "|" + hold.name + "\n" + hold.text.split("<").join("<​").split(">").join("​>") + "\n-->";
		}
		
		// 메인에 가까운 걸 먼저 작업해야 함
		// 단, 아래쪽부터 쌓아야 함
		holds = this.holds.slice(0);
		holds.sort(function(a, b) {
			var aPos = a.viewPos;
			var bPos = b.viewPos;
			if (aPos < 0) {
				if (bPos > 0) {
					return -1;
				}
			} else {
				if (bPos < 0) {
					return 1;
				}
			}
			if (aPos < 0) aPos = -aPos;
			if (bPos < 0) bPos = -bPos;
			if (aPos < bPos) return -1;
			if (aPos > bPos) return 1;
			return 0;
		});
		
		var holdSmis = [];
		for (var hi = 1; hi < holds.length; hi++) {
			var hold = holds[hi];
			var smi = holdSmis[hi] = new Subtitle.SmiFile(hold.text);
			smi.header = smi.footer = "";
			if (setting.saveWithNormalize) {
				Subtitle.Smi.normalize(smi.body, false);
			}
			
			if (smi.body.length == 0) {
				continue;
			}
			
			var start = smi.body[0].start;
			var end = smi.body[smi.body.length - 1].start;
			
			// 메인에서 홀드와 겹치는 영역 찾기
			var mainBegin = 0;
			for (var i = 0; i < main.body.length; i++) {
				if (main.body[i].start >= start) {
					break;
				}
				mainBegin = i;
			}
			if (mainBegin == main.body.length) {
				// 홀드 전체가 메인보다 뒤에 있음
				main.body = main.body.concat(smi.body);
				continue;
			}
			if (main.body[mainBegin].text.split("&nbsp;").join("").trim().length == 0) {
				mainBegin++;
			}
			
			var mainEnd = mainBegin;
			for (; mainEnd < main.body.length; mainEnd++) {
				if (main.body[mainEnd].start > end) {
					break;
				}
			}
			if (mainEnd == 0) {
				// 홀드 전체가 메인보다 앞에 있음
				main.body = smi.body.concat(main.body);
				continue;
			}
			
			// 홀드 결합
			var sliced = new Subtitle.SmiFile();
			sliced.body = main.body.slice(mainBegin, mainEnd);
			
			var slicedText = sliced.toTxt().trim();
			var combineText = smi.toTxt().trim();
			var combined = new Subtitle.SmiFile(((hold.pos < 0) ? Combine.combine(slicedText, combineText) : Combine.combine(combineText, slicedText)).join("\n"));
			// 원칙상 normalized.result를 다뤄야 맞을 것 같지만...
			end = (mainEnd < main.body.length) ? main.body[mainEnd].start : 999999999;
			main.body = main.body.slice(0, mainBegin).concat(combined.body).concat(main.body.slice(mainEnd));
		}
		
		if (withComment) {
			if (withCombine) {
				// 홀드 결합 있을 경우 주석처리 재계산
				logs = [];
				var oi = 0;
				var ni = 0;

				while ((oi < originBody.length) && (ni < main.body.length)) {
					if ((originBody[oi].start == main.body[ni].start)
					 && (originBody[oi].text  == main.body[ni].text )) {
						oi++;
						ni++;
						continue;
					}

					// 변환결과가 원본과 동일하지 않은 범위 찾기
					var newLog = {
							from: [oi]
						,	to  : [ni]
						,	start: main.body[ni].start
					};
					while ((oi < originBody.length) && (ni < main.body.length)) {
						if (originBody[oi].start < main.body[ni].start) {
							oi++;
							continue;
						}
						if (originBody[oi].start > main.body[ni].start) {
							ni++;
							continue;
						}
						if (originBody[oi].text != main.body[ni].text) {
							oi++;
							ni++;
							continue;
						}
						// 싱크-내용 모두 동일한 곳 찾음
						newLog.from[1] = oi;
						newLog.to  [1] = ni;
						newLog.end = main.body[ni].start;
						logs.push(newLog);
						break;
					}
				}
				// 메인 홀드에 없는 내용만 남음
				if (ni < main.body.length) {
					var newLog = {
							from: [oi, oi]
						,	to  : [ni, main.body.length]
						,	start: main.body[ni].start
					};
					logs.push(newLog);
				}
			}

			var origin = new Subtitle.SmiFile();
			for (var i = 0; i < logs.length; i++) {
				var log = logs[i];
				if (!log.end) {
					if (log.from[1] < originBody.length - 1) {
						log.end = originBody[log.from[1]].start;
					} else  {
						log.end = 999999999;
					}
				}
				origin.body = originBody.slice(log.from[0], log.from[1]);
				var comment = origin.toTxt().trim();
				
				// 메인 홀드 내용이 없으면 다른 홀드가 통째로 들어왔는지 확인
				if (comment.length == 0) {
					var start = log.to[0];
					for (var hi = 1; hi < holds.length; hi++) {
						var smi = holdSmis[hi];
						var isEqual = true;
						for (var j = 0; j < smi.body.length; j++) {
							if (smi.body[j].start != main.body[start+j].start) {
								isEqual = false;
								break;
							}
							if (smi.body[j].text != main.body[start+j].text) {
								if (j == smi.body.length - 1) {
									// 마지막 싱크일 경우 공백이면 통과시키기
									if (smi.body[j].text.split("&nbsp;").join("").trim().length == 0) {
										continue;
									}
								}
								isEqual = false;
								break;
							}
						}
						if (isEqual) {
							var hold = holds[hi];
							comment = "Hold=" + hold.pos + "|" + hold.name;
							result[hold.resultIndex] = "";
							break;
						}
					}
				}
				main.body[log.to[0]].text = "<!-- End=" + log.end + "\n" + (comment.split("<").join("<​").split(">").join("​>")) + "\n-->\n" + main.body[log.to[0]].text;
			}
		}
	}
	result[0] = main.toTxt();
	for (var i = 1; i < result.length; i++) {
		if (result[i].length == 0) {
			result.splice(i--, 1);
		}
	}
	return withComment ? result.join("\n") : result[0];
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
	var saved = true;
	if (this.holdEdited) {
		saved = false;
	} else {
		for (var i = 0; i < this.holds.length; i++) {
			if (!this.holds[i].isSaved()) {
				saved = false;
				break;
			}
		}
	}
	return saved;
}

SmiEditor.prototype.isSaved = function() {
	return (this.name == this.savedName) && (this.pos == this.savedPos) && (this.saved == this.input.val());
};
SmiEditor.prototype.onChangeSaved = function(saved) {
	// 수정될 수 있는 건 열려있는 탭이므로
	if (!tabs.length) return;
	var currentTab = tabs[tab];
	if (!currentTab) return;
	currentTab.onChangeSaved(this);
};
SmiEditor.prototype.updateTimeRange = function() {
	var start = 999999999;
	var end = 0;
	for (var i = 0; i < this.lines.length; i++) {
		var line = this.lines[i];
		if (line[LINE.TYPE]) {
			start = Math.min(start, line[LINE.SYNC]);
			end   = Math.max(end  , line[LINE.SYNC]);
		}
	}
	if (end) {
		this.start = start;
		this.end   = (start == end) ? 999999999 : end;
	} else {
		this.start = 0;
		this.end = 1;
	}
}

function deepCopyObj(obj) {
	if (obj && typeof obj == "object") {
		if (Array.isArray(obj)) {
			return JSON.parse(JSON.stringify(obj));
		}
		
		var out = {};
		for (var key in obj) {
			out[key] = deepCopyObj(obj[key]);
		}
		return out;
		
	} else {
		return obj;
	}
}
function setDefault(target, dflt) {
	var count = 0; // 변동 개수... 쓸 일이 있으려나?
	for (var key in dflt) {
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
		
		var notified = checkVersion(setting.version);
		
		// C#에서 보내준 세팅값 오류로 빠진 게 있으면 채워주기
		if (typeof setting == "object" && !Array.isArray(setting)) {
			var count = setDefault(setting, DEFAULT_SETTING);
			if (setting.version != DEFAULT_SETTING.version) {
				setting.version = DEFAULT_SETTING.version;
				count++;
				
				if (notified.menu) {
					// 메뉴 기본값이 바뀌었을 경우
					
					for (var di = 0; di < DEFAULT_SETTING.menu.length; di++) {
						var exist0 = false;
						
						var dMenu = DEFAULT_SETTING.menu[di];
						var dMenu0 = dMenu[0];
						var dMenu0name = dMenu0.split("(&")[0];
						
						for (var si = 0; si < setting.menu.length; si++) {
							var sMenu = setting.menu[si];
							var sMenu0 = sMenu[0];
							var sMenu0name = sMenu0.split("(&")[0];
							
							if (sMenu0name == dMenu0name) {
								// 이름이 같은 메뉴를 찾았을 경우
								exist0 = true;
								
								if (sMenu0.indexOf("(&") < 0 && dMenu0.indexOf("(&") > 0) {
									// 단축키가 추가된 경우
									sMenu[0] = dMenu0;
									count++;
								}
								
								for (var dj = 1; dj < dMenu.length; dj++) {
									var exist1 = false;
									
									var dMenu1 = dMenu[dj];
									var dMenu1name = dMenu1.split("|")[0].split("(&")[0];
									
									for (var sj = 1; sj < sMenu.length; sj++) {
										var sMenu1 = sMenu[sj];
										var sMenu1name = sMenu1.split("|")[0].split("(&")[0];
										
										if (sMenu1name == dMenu1name) {
											// 이름이 같은 메뉴를 찾았을 경우
											exist1 = true;
											var updated = false;
											
											var sLen = sMenu1.indexOf("|");
											var dLen = dMenu1.indexOf("|");
											var sMenuName = sMenu1.substring(0, sLen);
											var dMenuName = dMenu1.substring(0, dLen);
											if (sMenuName.indexOf("(&") < 0 && dMenuName.indexOf("(&") > 0) {
												// 단축키가 추가된 경우
												sMenuName = dMenuName;
												updated = true;
											}
											
											var sMenuFunc = sMenu1.substring(sLen + 1);
											var dMenuFunc = dMenu1.substring(dLen + 1);
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
	
	var btnAddHold = $("#btnAddHold").on("click", function() {
		if (tabs.length == 0) return;
		tabs[tab].addHold();
	});
	var inputWeight = $("#inputWeight").bind("input propertychange", function() {
		var weight = inputWeight.val();
		if (isFinite(weight)) {
			SmiEditor.sync.weight = Number(weight);
		} else {
			alert("숫자를 입력하세요.");
			var cursor = inputWeight[0].selectionEnd - 1;
			inputWeight.val(SmiEditor.sync.weight);
			inputWeight[0].setSelectionRange(cursor, cursor);
		}
	});
	var inputUnit = $("#inputUnit").bind("input propertychange", function() {
		var unit = inputUnit.val();
		if (isFinite(unit)) {
			SmiEditor.sync.unit = Number(unit);
		} else {
			alert("숫자를 입력하세요.");
			var cursor = inputUnit[0].selectionEnd - 1;
			inputUnit.val(SmiEditor.sync.unit);
			inputUnit[0].setSelectionRange(cursor, cursor);
		}
	});
	var btnMoveToBack = $("#btnMoveToBack").on("click", function() {
		if (tabs.length == 0) return;
		tabs[tab].holds[tabs[tab].hold].moveSync(false);
		tabs[tab].holds[tabs[tab].hold].input.focus();
	});
	var btnMoveToForward = $("#btnMoveToForward").on("click", function() {
		if (tabs.length == 0) return;
		tabs[tab].holds[tabs[tab].hold].moveSync(true);
		tabs[tab].holds[tabs[tab].hold].input.focus();
	});
	
	var checkAutoFindSync = $("#checkAutoFindSync").on("click", function() {
		autoFindSync = $(this).prop("checked");
		if (tabs.length == 0) return;
		tabs[tab].holds[tabs[tab].hold].input.focus();
	});
	
	var btnNewTab = $("#btnNewTab").on("click", function() {
		openNewTab();
	});
	
	var tabSelector = $("#tabSelector").on("click", ".th:not(#btnNewTab)", function() {
		var th = $(this);
		if (th[0] == closingTab) {
			return;
		}
		
		tabSelector.find(".selected").removeClass("selected");
		var currentTab = th.addClass("selected").data("tab");
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
		
		// 홀드 여부 달라질 수 있음
		SmiEditor.refreshStyle(setting, getAppendStyle());
		
	}).on("click", ".btn-close-tab", function(e) {
		e.preventDefault();
		
		var th = $(this).parent();
		closingTab = th[0];
		setTimeout(function() { // 탭 선택 이벤트 방지... e.preventDefault()로 안 되네...
			closingTab == null;
		}, 1);
		
		var currentTab = th.data("tab");
		var saved = (currentTab.holds[currentTab.hold].input.val() != currentTab.holds[currentTab.hold].saved);
		var saved = true;
		for (var i = 0; i < currentTab.holds.length; i++) {
			if (currentTab.holds[i].input.val() != currentTab.holds[i].saved) {
				saved = false;
				break;
			}
		}
		
		confirm((saved ? "저장되지 않았습니다.\n" : "") + "탭을 닫으시겠습니까?", function() {
			var index = closeTab(th);

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
				var selector = "#tabSelector .th:eq(" + tab + ")";
				$(selector).click();
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
	
	var needToUpdate = (setting.useHighlight != SmiEditor.useHighlight);
	SmiEditor.setSetting(setting, getAppendStyle());
	if (needToUpdate) {
		for (var i = 0; i < tabs.length; i++) {
			for (var j = 0; j < tabs[i].holds.length; j++) {
				tabs[i].holds[j].updateHighlight();
			}
		}
	}
	
	// 기본 단축키
	SmiEditor.withCtrls["N"] = newFile;
	SmiEditor.withCtrls["O"] = openFile;
	SmiEditor.withCtrls["S"] = saveFile;
	SmiEditor.withCtrls.reserved += "NOS";
	
	// 가중치 등
	$("#inputWeight").val(setting.sync.weight);
	$("#inputUnit"  ).val(setting.sync.unit  );
	var dll = setting.player.control.dll;
	if (dll) {
		var playerSetting = setting.player.control[dll];
		if (playerSetting) {
			binder.setPlayer(dll, playerSetting.path, playerSetting.withRun);
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
		SmiEditor.refreshStyle(setting, getAppendStyle());
	}, 1);
}

// C# 쪽에서 호출
function setDpiBy(width) {
	// C#에서 보내준 창 크기와 js에서 구한 브라우저 크기의 불일치를 이용해 DPI 배율을 구함
	setTimeout(function() {
		DPI = (width + 8) / (window.outerWidth + 10);
	}, 1000); // 로딩 덜 됐을 수가 있어서 딜레이 줌
}

var playerDlls = [];
// C# 쪽에서 호출
function setPlayerDlls(dlls) {
	playerDlls = dlls.split("\n");
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
		SmiEditor.refreshStyle(setting, getAppendStyle());
	}
}
function getAppendStyle() {
	// 에디터 하단 여백 재조정
	var holdTop = tabs.length ? Number(tabs[tab].area.find(".holds").css("top").split("px")[0]) : 0;
	var append = "\n#editor textarea { padding-bottom: " + ($("#editor").height() - holdTop - SB - LH - 2) + "px; }";
	return append;
}

function openHelp(name) {
	var url = (name.substring(0, 4) == "http") ? name : "help/" + name.split("..").join("").split(":").join("") + ".html";
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
			var currentTab = tabs[0];
			for (var i = 0; i < currentTab.holds.length; i++) {
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
	var targetTab = th.data("tab");
	var index = tabs.indexOf(targetTab);
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

var exporting = false;
function saveFile(asNew, isExport) {
	var currentTab = tabs[tab];
	for (var i = 0; i < currentTab.holds.length; i++) {
		currentTab.holds[i].history.log();
	}

	var path = currentTab.path;
	if (!path) {
		// 파일 경로가 없으면 다른 이름으로 저장 대화상자 필요
		asNew = true;
	}
	
	var texts = [];
	// 저장 전 일괄치환
	if (setting.replace.length > 0) {
		currentTab.replaceBeforeSave();
	}
	
	if (asNew) {
		path = "";
	} else if (isExport) {
		// 내보내기용 파일명 생성
		if (binder && !binder._) {
			var index = path.lastIndexOf("/");
			var prefix = "_"; // 설정 만들기?
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
	var currentTab = tabs[tab];
	if (exporting) {
		// 내보내기 동작일 땐 상태 바꾸지 않음
		exporting = false;
		return;
	}
	for (var i = 0; i < currentTab.holds.length; i++) {
		currentTab.holds[i].afterSave();
	}
	currentTab.path = path;
	var title = path ? ((path.length > 14) ? ("..." + path.substring(path.length - 14, path.length - 4)) : path.substring(0, path.length - 4)) : "새 문서";
	$("#tabSelector .th:eq(" + tab + ") span").text(title);
	currentTab.holdEdited = false;
}
SmiEditor.prototype._afterSave = SmiEditor.prototype.afterSave;
SmiEditor.prototype.afterSave = function() {
	this.savedName = this.name;
	this.savedPos = this.pos;
	this._afterSave();
}

function saveTemp() {
	var currentTab = tabs[tab];
	if (!currentTab) {
		return;
	}

	// 마지막 임시 저장 이후 변경 사항 없으면 무시
	var texts = [];
	var isChanged = false;
	for (var i = 0; i < currentTab.holds.length; i++) {
		var text = texts[i] = currentTab.holds[i].input.val();
		if (text == currentTab.holds[i].tempSavedText) {
			continue;
		}
		isChanged = true;
	}
	
	if (isChanged) {
		var path = currentTab.path;
		if (!path) {
			path = "\\new.smi";
		}
		//binder.saveTemp(texts.join("\n\n\n<!-- 홀드 -->\n\n\n"), path);
		binder.saveTemp(currentTab.getSaveText(false), path);
		for (var i = 0; i < currentTab.holds.length; i++) {
			currentTab.holds[i].tempSavedText = texts[i];
		}
	}
}

var _for_video_ = false;
function openNewTab(text, path, forVideo) {
	if (tabToCloseAfterRun) {
		closeTab(tabToCloseAfterRun);
		tabToCloseAfterRun = null;
	}
	if (tabs.length >= 4) {
		alert("탭은 4개까지 열 수 있습니다.");
		return;
	}
	
	var texts = [];
	if (path) {
		if (path.substring(path.length - 4).toUpperCase() == ".SRT") {
			// SRT 파일 불러왔을 경우 SMI로 변환
			path = path.substring(0, path.length - 4) + ".smi";
			texts.push(text = srt2smi(text));
		}
	}

	var title = path ? ((path.length > 14) ? ("..." + path.substring(path.length - 14, path.length - 4)) : path.substring(0, path.length - 4)) : "새 문서";
	
	var tab = new Tab(text ? text : setting.newFile, path);
	tabs.push(tab);
	$("#editor").append(tab.area);

	var th = $("<div class='th'>").append($("<span>").text(title));
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

// 종료 전 C# 쪽에서 호출
function beforeExit() {
	var saved = true;
	for (var i = 0; i < tabs.length; i++) {
		for (var j = 0; j < tabs[i].holds.length; j++) {
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

var REG_SRT_SYNC = /^([0-9]{2}:){1,2}[0-9]{2}[,.][0-9]{2,3}( )*-->( )*([0-9]{2}:){1,2}[0-9]{2}[,.][0-9]{2,3}$/;
function srt2smi(text) {
	return new Subtitle.SmiFile().fromSync(new Subtitle.SrtFile(text).toSync()).toTxt();
}
