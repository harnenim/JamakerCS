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
			tabs[tab].findSync();
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

SmiEditor.prototype.onChangeSaved = function(saved) {
	// 수정될 수 있는 건 열려있는 탭이므로
	if (tabs.length && tabs[tab]) {
		var area = tabs[tab].area;
		if (saved) {
			area.removeClass("not-saved");
		} else {
			area.addClass("not-saved");
		}
	}
};

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
		
		checkVersion(setting.version);
		setting.version = DEFAULT_SETTING.version;
		
		// C#에서 보내준 세팅값 오류로 빠진 게 있으면 채워주기
		if (typeof setting == "object" && !Array.isArray(setting)) {
			if (setDefault(setting, DEFAULT_SETTING)) {
				saveSetting();
			}
		} else {
			setting = deepCopyObj(DEFAULT_SETTING);
			saveSetting();
		}
		
	} catch (e) {
		setting = deepCopyObj(DEFAULT_SETTING);
		saveSetting();
	}
	
	var btnSync = $("#btnSync").on("click", function() {
		if (tabs.length == 0) return;
		tabs[tab].insertSync();
		tabs[tab].input.focus();
	});
	var btnSyncFrame = $("#btnSyncFrame").on("click", function() {
		if (tabs.length == 0) return;
		tabs[tab].insertSync(true);
		tabs[tab].input.focus();
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
		tabs[tab].moveSync(false);
		tabs[tab].input.focus();
	});
	var btnMoveToForward = $("#btnMoveToForward").on("click", function() {
		if (tabs.length == 0) return;
		tabs[tab].moveSync(true);
		tabs[tab].input.focus();
	});
	
	var checkAutoFindSync = $("#checkAutoFindSync").on("click", function() {
		autoFindSync = $(this).prop("checked");
		if (tabs.length == 0) return;
		tabs[tab].input.focus();
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
		var selectedTab = th.addClass("selected").data("tab");
		if (selectedTab) {
			tab = tabs.indexOf(selectedTab);
			$("#editor > .tab").hide();
			selectedTab.area.show();
			if (_for_video_) { // 동영상 파일명으로 자막 파일을 연 경우 동영상 열기 불필요
				_for_video_ = false;
			} else if (selectedTab.path && selectedTab.path.length > 4 && binder) {
				binder.checkLoadVideoFile(selectedTab.path);
			}
		}
		SmiEditor.selected = selectedTab;
		SmiEditor.Viewer.refresh();
		
	}).on("click", ".btn-close-tab", function(e) {
		e.preventDefault();
		
		var th = $(this).parent();
		closingTab = th[0];
		setTimeout(function() { // 탭 선택 이벤트 방지... e.preventDefault()로 안 되네...
			closingTab == null;
		}, 1);
		
		var selectedTab = th.data("tab");
		var saved = (selectedTab.input.val() != selectedTab.saved);
		
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

	SmiEditor.setSetting(setting, getAppendStyle());
	
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
	var append = "\n#editor .input { padding-bottom: " + ($("#editor").height() - SB - LH - 2) + "px; }";
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
	if (!setting.useTab) {
		// 탭 미사용 -> 현재 파일 닫기
		if (tabs.length) {
			if (tabs[0].input.val() != tabs[0].saved) {
				confirm("현재 파일을 닫을까요?", function () {
					tabToCloseAfterRun = $("#tabSelector > .th:not(#btnNewTab)");
					func();
				});
				return;
			}
			tabToCloseAfterRun = $("#tabSelector > .th:not(#btnNewTab)");
		} else {
			tabToCloseAfterRun = null;
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
		// TODO: 미완성
	});
}

function saveFile(asNew) {
	var currentTab = tabs[tab];
	currentTab.history.log();

	var path = currentTab.path;
	if (!path) {
		asNew = true;
	}
	var text = currentTab.input.val(); // currentTab.text 동기화 실패 가능성 고려, 현재 값 다시 불러옴
	
	// 저장 전 일괄치환
	var cnt = setting.replace.length;
	if (cnt > 0) { // ON/OFF 기능이 필요한가...?
		var changed = false;
		
		// 커서 기준 3개로 나눠서 치환
		var cursor = currentTab.getCursor();
		text = [text.substring(0, cursor[0]), text.substring(cursor[0], cursor[1]), text.substring(cursor[1])];
		for (var i = 0; i < cnt; i++) {
			var item = setting.replace[i];
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
			for (var i = 0; i < cnt; i++) {
				var item = setting.replace[i];
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
			for (var i = 0; i < cnt; i++) {
				var item = setting.replace[i];
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
			currentTab.setText(text, cursor);
		}
	}
	
	if (asNew) {
		path = "";
	}
	
	/* // 수정된 게 없어 보여도, 다른 프로그램에서 수정한 걸 덮어쓸 수도 있음
	if (text == currentTab.saved) {
		// 마지막 저장 이후 수정된 게 없음
		//return false;
	}
	*/
	
	if (currentTab.area.find(".sync.error,.sync.equal").length) {
		confirm("싱크 오류가 있습니다.\n저장하시겠습니까?", function() {
			binder.save(text, path);
		});
	} else {
		binder.save(text, path);
	}
}
// 저장 후 C# 쪽에서 호출
function afterSaveFile(path) {
	tabs[tab].afterSave(path);
	
	var title = path ? ((path.length > 14) ? ("..." + path.substring(path.length - 14, path.length - 4)) : path.substring(0, path.length - 4)) : "새 문서";
	$("#tabSelector .th:eq(" + tab + ") span").text(title);
}

function saveTemp() {
	var currentTab = tabs[tab];
	if (!currentTab) {
		return;
	}

	// 마지막 임시 저장 이후 변경 사항 없으면 무시
	var text = currentTab.input.val();
	if (text == currentTab.tempSavedText) {
		return;
	}

	var path = currentTab.path;
	if (!path) {
		path = "\\new.smi";
	}
	binder.saveTemp(text, path);
	currentTab.tempSavedText = text;
}

var _for_video_ = false;
function openNewTab(text, path, forVideo) {
	if (tabToCloseAfterRun) {
		closeTab(tabToCloseAfterRun);
	}
	if (tabs.length >= 4) {
		alert("탭은 4개까지 열 수 있습니다.");
		return;
	}
	
	// SRT 파일 불러왔을 경우 SMI로 변환
	if (path && path.substring(path.length - 4).toUpperCase() == ".SRT") {
		path = path.substring(0, path.length - 4) + ".smi";
		text = srt2smi(text);
	}

	var title = path ? ((path.length > 14) ? ("..." + path.substring(path.length - 14, path.length - 4)) : path.substring(0, path.length - 4)) : "새 문서";
	
	var tab = new SmiEditor(text ? text : setting.newFile, path);
	tabs.push(tab);
	$("#editor").append(tab.area);
	tab.tempSavedText = text;

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
	confirm("동영상 파일을 같이 열까요?\n" + path, function() {
		binder.loadVideoFile(path);
	});
}

// 종료 전 C# 쪽에서 호출
function beforeExit() {
	var saved = true;
	for (var i = 0; i < tabs.length; i++) {
		if (tabs[i].saved != tabs[i].input.val()) {
			saved = false;
			break;
		}
	}
	/*
	var msg = "종료하시겠습니까?";
	if (!saved) {
		msg = "저장되지 않은 파일이 있습니다.\n" + msg;
	}
	confirm(msg, doExit);
	*/
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
	/*
	var lines = text.split("\r\n").join("\n").split("\n");
	var items = [];
	var last = { start: 0, end: 0, lines: [], length: 0 };
	var lastLength = 0;
	
	for (var i = 0; i < lines.length; i++) {
		var line = lines[i];
		if (line) {
			if (isFinite(line)) {
				// 숫자뿐인 대사줄 or 싱크 시작 불분명
				last.lines.push(line);
				last.length = Math.max(last.length, lastLength); // 기존 숫자뿐인 줄은 대사줄로 편입
				lastLength = last.lines.length;
				
			} else {
				if (REG_SRT_SYNC.test(line)) {
					// 새 싱크 시작
					last.lines.length = last.length;
					items.push(last = { start: 0, end: 0, lines: [], length: 0 });
					var syncs = line.split("-->");
					{	// 시작 싱크
						var times = syncs[0].trim().split(",").join(".").split(":");
						var start = Number(times[0]) * 60 + Number(times[1]);
						if (times.length > 2) {
							start = start * 60 + Number(times[2]);
						}
						last.start = Math.round(start * 1000);
					}
					{	// 종료 싱크
						var times = syncs[1].trim().split(",").join(".").split(":");
						var end = Number(times[0]) * 60 + Number(times[1]);
						if (times.length > 2) {
							end = end * 60 + Number(times[2]);
						}
						last.end = Math.round(end * 1000);
					}
					lastLength = 0;
					
				} else {
					// 대사줄 추가
					last.lines.push(line);
					last.length = last.lines.length;
				}
			}
		} else {
			// 공백줄 or 싱크 종료 불분명
			last.lines.push(line);
		}
	}
	last.lines.length = last.length;
	
	lines = [];
	last = 0;
	for (var i = 0; i < items.length; i++) {
		var item = items[i];
		if (last && last < item.start) {
			lines.push(SmiEditor.makeSyncLine(last));
			lines.push("&nbsp;");
		}
		lines.push(SmiEditor.makeSyncLine(item.start));
		lines.push(item.lines.join("<br>"));
		last = item.end;
	}
	lines.push(SmiEditor.makeSyncLine(last));
	lines.push("&nbsp;");
	
	return lines.join("\n");
	*/
	/*
	var srt = new Subtitle.SrtFile().fromTxt(text);
	var smi = new Subtitle.SmiFile().fromSync(srt.toSync());
	return smi.toTxt();
	*/
	return new Subtitle.SmiFile().fromSync(new Subtitle.SrtFile().fromTxt(text).toSync()).toTxt();
}
