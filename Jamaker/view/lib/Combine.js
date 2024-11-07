var Combine = {
	css: { font: '100px "맑은 고딕"' }	
};
{
	var STIME = 0;
	var STYPE = 1;
	var ETIME = 2;
	var ETYPE = 3;
	var TEXT  = 4;
	var LINES = 5;
	var WIDTH = 6;
	var UPPER = 4;
	var LOWER = 5;

	var LOG = false;
	
	function getWidth(smi, css) {
		if (!css) {
			css = Combine.css;
		}
		// RUBY태그 문법이 미묘하게 달라서 가공 필요
		smi = smi.split("<RP").join("<!--RP").split("</RP>").join("</RP-->");
		var checker = $("<span>");
		checker.css(css);
		checker.html(smi);
		$("body").append(checker);
		var width = checker.width();
		checker.remove();
		return width;
	}

	function parse(text) {
		var lines = text.split("\n");
		var parseds = [];
		
		// 싱크값을 제외하면 별도의 값을 취하지 않는 간이 파싱
		// SMI는 태그 꺽쇠 내에서 줄바꿈을 하는 경우는 일반적으로 없다고 가정
		for (var i = 0; i < lines.length; i++) {
			var line = lines[i];
			var parsed = [line, null, null];
			parseds.push(parsed);
			
			var j = 0;
			var k = 0;
			var hasSync = false;
			var sync = 0;
			
			while ((k = line.indexOf("<", j)) >= 0) {
				// 태그 열기
				j = k + 1;

				// 태그 닫힌 곳까지 탐색
				var closePos = line.indexOf(">", j);
				if (j < closePos) {
					// 태그명 찾기
					for (k = j; k < closePos; k++) {
						var c = line[k];
						if (c == ' ' || c == '\t' || c == '"' || c == "'" || c == '\n') {
							break;
						}
					}
					var tagName = line.substring(j, k);
					j = k;
					
					hasSync = (tagName.toUpperCase() == "SYNC");

					if (hasSync) {
						while (j < closePos) {
							// 속성 찾기
							for (; j < closePos; j++) {
								var c = line[j];
								if (('0'<=c&&c<='9') || ('a'<=c&&c<='z') || ('A'<=c&&c<='Z')) {
									break;
								}
								//html += c;
							}
							for (k = j; k < closePos; k++) {
								var c = line[k];
								if ((c<'0'||'9'<c) && (c<'a'||'z'<c) && (c<'A'||'Z'<c)) {
									break;
								}
							}
							var attrName = line.substring(j, k);
							j = k;
							
							// 속성 값 찾기
							if (line[j] == "=") {
								j++;
								
								var q = line[j];
								if (q == "'" || q == '"') { // 따옴표로 묶인 경우
									k = line.indexOf(q, j + 1);
									k = (0 <= k && k < closePos) ? k : closePos;
								} else {
									q = "";
									k = line.indexOf(" ");
									k = (0 <= k && k < closePos) ? k : closePos;
									k = line.indexOf("\t");
									k = (0 <= k && k < closePos) ? k : closePos;
								}
								var value = line.substring(j + q.length, k);
								
								if (q.length && k < closePos) { // 닫는 따옴표가 있을 경우
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
						j = closePos;
					}
					
					// 태그 닫기
					j++;
				}
			}
			
			if (parsed[LINE.SYNC] = sync) { // 어차피 0이면 플레이어에서도 씹힘
				// 화면 싱크 체크
				parsed[LINE.TYPE] = TYPE.BASIC;
				var typeCss = "";
				if (line.indexOf(" >") > 0) {
					parsed[LINE.TYPE] = TYPE.FRAME;
					typeCss = " frame";
				} else if (line.indexOf("\t>") > 0) {
					parsed[LINE.TYPE] = TYPE.RANGE;
					typeCss = " range";
				}
			} else {
				parsed[LINE.TYPE] = TYPE.TEXT;
			}
		}
		parseds.push(["&nbsp;", 99999999, TYPE.BASIC]);
		
		var syncs = [];
		var last = null;
		for (var i = 0; i < parseds.length; i++) {
			var parsed = parseds[i];
			if (parsed[LINE.TYPE]) {
				if (last) {
					var text = [];
					for (var j = last[0] + 1; j < i; j++) {
						text.push(parseds[j][LINE.TEXT]);
					}
					text = text.join("\n");
					if (text.split("&nbsp;").join("").trim()) {
						var lineCount = text.split(/<br>/gi).length;
						//[STIME, STYPE, ETIME, ETYPE, TEXT, LINES, WIDTH];
						syncs.push([last[LINE.SYNC], last[LINE.TYPE], parsed[LINE.SYNC], parsed[LINE.TYPE], text, lineCount, getWidth(text)]);
					}
				}
				last = [i, parsed[LINE.SYNC], parsed[LINE.TYPE]];
			}
		}
		
		return syncs;
	}
	
	Combine.combine = function (inputUpper, inputLower) {
		var upperSyncs = parse(inputUpper);
		var lowerSyncs = parse(inputLower);
		
		var ui = 0;
		var li = 0;
		var groups = [];
		var group = null;
		while  ((ui <= upperSyncs.length) && (li <= lowerSyncs.length)) {
			if ((ui == upperSyncs.length) && (li == lowerSyncs.length)) {
				break;
			}
			var us = (ui < upperSyncs.length) ? upperSyncs[ui] : [99999999, 99999999, null, 0];
			var ls = (li < lowerSyncs.length) ? lowerSyncs[li] : [99999999, 99999999, null, 0];
			if (us[STIME] < ls[STIME]) { // 위가 바뀜
				if (group && group.lower.length && (group.lower[group.lower.length - 1][ETIME] > us[STIME])) { // 그룹 유지
					group.upper.push(us);
					group.maxLines[0] = Math.max(group.maxLines[0], us[LINES]);
					group.maxWidth = Math.max(group.maxWidth, us[WIDTH]);
					
				} else { // 아래가 없거나 끝남 -> 그룹 끊김
					groups.push(group = {
							upper: [us]
					,	lower: []
					,	maxLines: [us[LINES], 0]
					,	maxWidth: us[WIDTH]
					});
				}
				ui++;
				
			} else if (ls[STIME] < us[STIME]) { // 아래가 바뀜
				if (group && group.upper.length && (group.upper[group.upper.length - 1][ETIME] > ls[STIME])) { // 그룹 유지
					group.lower.push(ls);
					group.maxLines[1] = Math.max(group.maxLines[1], ls[LINES]);
					group.maxWidth = Math.max(group.maxWidth, ls[WIDTH]);
					
				} else { // 위가 없거나 끝남 -> 그룹 끊김
					groups.push(group = {
							upper: []
					,	lower: [ls]
					,	maxLines: [0, ls[LINES]]
					,	maxWidth: ls[WIDTH]
					});
				}
				li++;
				
			} else { // 둘이 같이 바뀜 -> 새 그룹
				groups.push(group = {
						upper: [us]
				,	lower: [ls]
				,	maxLines: [us[LINES], ls[LINES]]
				,	maxWidth: Math.max(us[WIDTH], ls[WIDTH])
				});
				ui++;
				li++;
			}
		}
		
		for (var gi = 0; gi < groups.length; gi++) {
			var group = groups[gi];
			group.lines = [];
			var last = null;
			
			if (LOG) console.log("group width: " + group.maxWidth);
			
			// 팟플레이어 왼쪽 정렬에서 좌우로 흔들리지 않도록 잡아줌
			// ... 사실 폰트에 따라 흔들리긴 함...
			var lists = [group.upper, group.lower];
			for (var i = 0; i < lists.length; i++) {
				var list = lists[i];
				
				for (var j = 0; j < list.length; j++) {
					// 줄 길이 채워주기
					var sync = list[j];
					if (sync[WIDTH] < group.maxWidth) {
						var line = sync[TEXT];
						var lines = line.split(/<br>/gi);
						
						// 여러 줄일 경우 제일 긴 줄 찾기
						if (lines.length > 1) {
							var maxWidth = 0;
							for (var k = 0; k < lines.length; k++) {
								var width = getWidth(lines[k]);
								if (width > maxWidth) {
									maxWidth = width;
									line = lines[k];
								}
							}
						}
						
						// 여백을 붙여서 제일 적절한 값 찾기
						var pad = "";
						var width = getWidth(line);
						var lastPad;
						var lastWidth;
						if (LOG) console.log(line.split("&nbsp;").join(" ") + ": " + width);
						do {
							lastPad = pad;
							lastWidth = width;
							pad = lastPad + "&nbsp;";
							var curr = "​" + pad + line + pad + "​";
							width = getWidth(curr);
							if (LOG) console.log(curr.split("&nbsp;").join(" ") + ": " + width);
							
						} while (width < group.maxWidth);
						
						if ((width - group.maxWidth) > (group.maxWidth - lastWidth)) {
							pad = lastPad;
							if (LOG) {
								var curr = "​" + pad + line + pad + "​";
								width = getWidth(curr);
								console.log(curr.split("&nbsp;").join(" ") + ": " + width);
							}
						}
						pad = pad.split("&nbsp;").join(" ");
						for (var k = 0; k < lines.length; k++) {
							var line = lines[k].split("​").join(""); // Zero-Width-Space 중복으로 들어가지 않도록
							
							if ($("<span>").html(line).text().split("　").join("").split(" ").join("").length) {
								// 공백 줄인 경우는 별도 처리 하지 않음
								// 태그로 감싼 줄은 태그 안에 공백문자 넣기
								var prev = "", next = "";
								while (line.startsWith("\n")) {
									prev += "\n";
									line = line.substring(1);
								}
								while (line.startsWith("<")) {
									var tagEnd = line.indexOf(">") + 1;
									if (tagEnd == 0) {
										break;
									}
									prev += line.substring(0, tagEnd);
									line = line.substring(tagEnd);
								}
								while (line.endsWith(">")) {
									var tagStart = line.lastIndexOf("<");
									if (tagStart < 0) {
										break;
									}
									next = line.substring(tagStart) + next;
									line = line.substring(0, tagStart);
								}
								line = "​" + prev + pad + line + pad + next + "​";
								lines[k] = line;
							}
						}
						sync[TEXT] = lines.join("<br>");
					}
					
					// 줄 높이 맞춰주기
					for (var k = sync[LINES]; k < group.maxLines[i]; k++) {
						sync[TEXT] = "<b>　</b><br>" + sync[TEXT];
					}
				}
			}
			
			ui = li = 0;
			while  ((ui <= group.upper.length) && (li <= group.lower.length)) {
				if ((ui == group.upper.length) && (li == group.lower.length)) {
					break;
				}
				var us = (ui < group.upper.length) ? group.upper[ui] : [99999999, 99999999, null, 0];
				var ls = (li < group.lower.length) ? group.lower[li] : [99999999, 99999999, null, 0];
				
				if (us[STIME] < ls[STIME]) { // 위가 바뀜
					if (!last) { // 첫 싱크
						group.lines.push(last = [us[STIME], us[STYPE], us[ETIME], us[ETYPE], us, null]);
						
					} else {
						// 아래는 유지하고 위는 바뀐 걸 추가
						if (last[STIME] == us[STIME]) {
							last[UPPER] = us;
						} else {
							var curr = [us[STIME], us[STYPE], last[2], last[3], us, last[LOWER]];
							last[ETIME] = us[STIME];
							last[ETYPE] = us[STYPE];
							group.lines.push(last = curr);
						}
						
						if (us[ETIME] < last[ETIME]) { // 위가 먼저 끝남
							var curr = [us[ETIME], us[ETYPE], last[ETIME], last[ETYPE], null, last[LOWER]];
							last[ETIME] = us[ETIME];
							last[ETYPE] = us[ETYPE];
							group.lines.push(last = curr);
						} else if (us[ETIME] > last[ETIME]) { // 아래가 먼저 끝남
							group.lines.push(last = [last[ETIME], last[ETYPE], us[ETIME], us[ETYPE], us, null]);
						} else {
							// 둘 다 끝남 -> 그룹 끝
						}
					}
					ui++;
					
				} else if (ls[STIME] < us[STIME]) { // 아래가 바뀜
					if (!last) { // 첫 싱크
						group.lines.push(last = [ls[STIME], ls[STYPE], ls[ETIME], ls[ETYPE], null, ls]);
						
					} else {
						// 위는 유지하고 아래는 바뀐 걸 추가
						if (last[STIME] == ls[STIME]) {
							last[LOWER] = ls;
						} else {
							var curr = [ls[STIME], ls[STYPE], last[ETIME], last[ETYPE], last[UPPER], ls];
							last[ETIME] = ls[STIME];
							last[ETYPE] = ls[STYPE];
							group.lines.push(last = curr);
						}
						
						if (ls[ETIME] < last[ETIME]) { // 아래가 먼저 끝남
							var curr = [ls[ETIME], ls[ETYPE], last[ETIME], last[ETYPE], last[TEXT], null];
							last[ETIME] = ls[ETIME];
							last[ETYPE] = ls[ETYPE];
							group.lines.push(last = curr);
						} else if (ls[ETIME] > last[ETIME]) { // 위가 먼저 끝남
							group.lines.push(last = [last[ETIME], last[ETYPE], ls[ETIME], ls[ETYPE], null, ls]);
						} else {
							// 둘 다 끝남 -> 그룹 끝
						}
					}
					li++;
					
				} else { // 둘이 같이 바뀜(그룹 첫 싱크에서만 가능)
					var ss = us;
					if (ls[ETIME] < us[ETIME]) {
						ss = ls;
						li++;
					} else {
						ui++;
					}
					group.lines.push(last = [us[STIME], us[STYPE], ss[ETIME], ss[ETYPE], us, ls]);
				}
			}
		}
		
		var lines = [];
		var lastSync = 0;
		for (var gi = 0; gi < groups.length; gi++) {
			var group = groups[gi];
			var forEmpty = [[], []];
			for (var i = 0; i < 2; i++) {
				for (var j = 0; j < group.maxLines[i]; j++) {
					forEmpty[i].push("<b>　</b>");
				}
				forEmpty[i] = forEmpty[i].join("<br>");
			}
			
			for (var i = 0; i < group.lines.length; i++) {
				var line = group.lines[i];
				
				if (lastSync < line[STIME]) {
					if (gi > 0) { // 처음일 땐 제외
						lines.push("&nbsp;");
					}
					lines.push(SmiEditor.makeSyncLine(line[STIME], line[STYPE]));
				}
				if (group.upper.length == 0) {
					lines.push(line[LOWER] ? line[LOWER][TEXT] : "&nbsp;");
				} else if (group.lower.length == 0) {
					lines.push(line[UPPER] ? line[UPPER][TEXT] : "&nbsp;");
				} else {
					lines.push((line[UPPER] ? line[UPPER][TEXT] : forEmpty[0]) + "<br>" + (line[LOWER] ? line[LOWER][TEXT] : forEmpty[1]));
				}
				if (line[ETIME] < 99999999) {
					lines.push(SmiEditor.makeSyncLine(lastSync = line[ETIME], line[ETYPE]));
				} else {
					lastSync = 0;
				}
			}
		}
		if (lastSync) {
			lines.push("&nbsp;");
		}
		return lines;
	}
}
