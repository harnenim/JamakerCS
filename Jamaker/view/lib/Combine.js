window.Combine = {
	css: 'font-family: 맑은 고딕;'
,	defaultSize: 18 // TODO: 설정에서 바뀌도록... 하려면 서브 프로그램에서도 설정을 불러와야 하는데...
};
{
	const LINE = {
			TEXT: 0
		,	SYNC: 1
		,	TYPE: 2
	};
	const TYPE = {
			TEXT: null
		,	BASIC: 1
		,	FRAME: 2
		,	RANGE: 3
	};
	
	const STIME = 0;
	const STYPE = 1;
	const ETIME = 2;
	const ETYPE = 3;
	const TEXT  = 4;
	const LINES = 5;
	const WIDTH = 6;
	const SIZED = 7;
	const UPPER = 4;
	const LOWER = 5;
	
	const LOG = false;
	
	function toText(html, checker) {
		// RUBY태그 없애고 계산
		return checker.html(html.split("<RT").join("<!--RT").split("</RT>").join("</RT-->")).text();
	}
	function getWidth(smi, checker) {
		// 태그 밖의 공백문자 치환
		{	const tags = smi.split("<");
			for (let i = 1; i < tags.length; i++) {
				const index = tags[i].indexOf(">");
				if (index > 0) {
					tags[i] = tags[i].substring(0, index) + tags[i].substring(index);
				}
			}
			smi = tags.join("<");
		}
		const width = checker.html(smi).width();
		if (LOG) console.log(width, smi);
		return width;
	}
	function getChecker() {
		if (!Combine.checker) {
			$("body").append(Combine.checker = $("<span class='width-checker'>"));
		}
		Combine.checker.attr({ style: Combine.css }).css({
				whiteSpace: "pre"
			,	fontSize: "144px"
			,	fontWeight: "bold"
			,	textShadow: ""
		});
		return Combine.checker.show();
	}
	
	const syncLines = { basic: {}, frame: {}, range: {} };
	function getSyncLine(sync, type) {
		let line = null;
		switch (type) {
			case TYPE.FRAME:
				line = syncLines.frame[sync];
				break;
			case TYPE.RANGE:
				line = syncLines.range[sync];
				break;
			default:
				line = syncLines.basic[sync];
		}
		return line;
	}
	
	function parse(text, checker) {
		{	// 주석 제거 후 결합
			const comments = text.split("\n<!--");
			text = comments[0];
			for (let i = 1; i < comments.length; i++) {
				const index = comments[i].indexOf("-->");
				if (index > 0) {
					text += comments[i].substring(index + 3);
				}
			}
		}
		const lines = text.split("\n");
		const parseds = [];
		
		// 싱크값을 제외하면 별도의 값을 취하지 않는 간이 파싱
		// SMI는 태그 꺽쇠 내에서 줄바꿈을 하는 경우는 일반적으로 없다고 가정
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			let parsed = [line, null, null];
			parseds.push(parsed);
			
			let j = 0;
			let k = 0;
			let hasSync = false;
			let sync = 0;
			
			while ((k = line.indexOf("<", j)) >= 0) {
				// 태그 열기
				j = k + 1;

				// 태그 닫힌 곳까지 탐색
				const closePos = line.indexOf(">", j);
				if (j < closePos) {
					// 태그명 찾기
					for (k = j; k < closePos; k++) {
						const c = line[k];
						if (c == ' ' || c == '\t' || c == '"' || c == "'" || c == '\n') {
							break;
						}
					}
					const tagName = line.substring(j, k);
					j = k;
					
					hasSync = (tagName.toUpperCase() == "SYNC");

					if (hasSync) {
						while (j < closePos) {
							// 속성 찾기
							for (; j < closePos; j++) {
								const c = line[j];
								if (('0'<=c&&c<='9') || ('a'<=c&&c<='z') || ('A'<=c&&c<='Z')) {
									break;
								}
							}
							for (k = j; k < closePos; k++) {
								const c = line[k];
								if ((c<'0'||'9'<c) && (c<'a'||'z'<c) && (c<'A'||'Z'<c)) {
									break;
								}
							}
							const attrName = line.substring(j, k);
							j = k;
							
							// 속성 값 찾기
							if (line[j] == "=") {
								j++;
								
								let q = line[j];
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
								const value = line.substring(j + q.length, k);
								
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
				let typeCss = "";
				if (line.indexOf("  >") > 0) {
					// 자동 생성 공백 싱크는 일반 싱크 취급
					syncLines.basic[sync] = line;
				} else if (line.indexOf(" >") > 0) {
					parsed[LINE.TYPE] = TYPE.FRAME;
					typeCss = " frame";
					syncLines.frame[sync] = line;
				} else if (line.indexOf("\t>") > 0) {
					parsed[LINE.TYPE] = TYPE.RANGE;
					typeCss = " range";
					syncLines.range[sync] = line;
				} else {
					syncLines.basic[sync] = line;
				}
			} else {
				parsed[LINE.TYPE] = TYPE.TEXT;
			}
		}
		parseds.push(["&nbsp;", 99999999, TYPE.BASIC]);
		
		const syncs = [];
		let last = null;
		for (let i = 0; i < parseds.length; i++) {
			const parsed = parseds[i];
			if (parsed[LINE.TYPE]) {
				if (last) {
					const lines = [];
					for (let j = last[0] + 1; j < i; j++) {
						lines.push(parseds[j][LINE.TEXT]);
					}
					const text = lines.join("\n");
					if (text.split("&nbsp;").join("").trim()) {
						const textLines = text.split(/<br>/gi);
						const lineCount = textLines.length;
						let defaultWidth = 0;
						for (let k = 0; k < textLines.length; k++) {
							defaultWidth = Math.max(defaultWidth, getWidth(toText(textLines[k], checker), checker));
						}

						let sizedWidth = defaultWidth;
						if (text.toLowerCase().indexOf("size=") > 0) {
							let attrs = Subtitle.Smi.toAttr(text);
							for (let k = 0; k < attrs.length; k++) {
								const attr = attrs[k];
								const attrLines = attr.text.split("\n");
								if (attrLines.length > 1) {
									const newAttrs = [];
									for (let l = 0; l < attrLines.length; l++) {
										if (l > 0) {
											const brAttr = new Subtitle.Attr();
											brAttr.text = "\n";
											newAttrs.push(brAttr);
										}
										const newAttr = new Subtitle.Attr(attr);
										newAttr.text = attrLines[l];
										newAttrs.push(newAttr);
									}
									attrs = attrs.slice(0, k).concat(newAttrs).concat(attrs.slice(k + 1));
									k += attrLines.length - 1;
								}
							}
							sizedWidth = getWidth(Subtitle.Smi.fromAttr(attrs, Combine.defaultSize), checker);
						}
						
						//[STIME, STYPE, ETIME, ETYPE, TEXT, LINES, WIDTH, SIZED];
						syncs.push([last[LINE.SYNC], last[LINE.TYPE], parsed[LINE.SYNC], parsed[LINE.TYPE], text, lineCount, defaultWidth, sizedWidth]);
					}
				}
				last = [i, parsed[LINE.SYNC], parsed[LINE.TYPE]];
			}
		}
		
		return syncs;
	}
	
	Combine.combine = (inputUpper, inputLower) => {
		const hljs = $(".hljs").hide(); // 결합 로직 돌아갈 때 문법 하이라이트가 있으면 성능 저하됨
		const checker = getChecker();
		const upperSyncs = parse(inputUpper, checker);
		const lowerSyncs = parse(inputLower, checker);
		
		const groups = [];
		{	let group = null;
			let ui = 0;
			let li = 0;
			while  ((ui <= upperSyncs.length) && (li <= lowerSyncs.length)) {
				if ((ui == upperSyncs.length) && (li == lowerSyncs.length)) {
					break;
				}
				const us = (ui < upperSyncs.length) ? upperSyncs[ui] : [99999999, 99999999, null, 0];
				const ls = (li < lowerSyncs.length) ? lowerSyncs[li] : [99999999, 99999999, null, 0];
				if (us[STIME] < ls[STIME]) { // 위가 바뀜
					if (group
					 && (   (us[STYPE] == TYPE.RANGE) // 중간 싱크
					     || (group.lower.length && (group.lower[group.lower.length - 1][ETIME] > us[STIME]))
					    )
					){ // 그룹 유지
						group.upper.push(us);
						group.maxLines[0] = Math.max(group.maxLines[0], us[LINES]);
						group.maxWidth = Math.max(group.maxWidth, us[WIDTH]);
						group.maxSized = Math.max(group.maxSized, us[SIZED]);
						
					} else { // 아래가 없거나 끝남 -> 그룹 끊김
						groups.push(group = {
								upper: [us]
							,	lower: []
							,	maxLines: [us[LINES], 0]
							,	maxWidth: us[WIDTH]
							,	maxSized: us[SIZED]
						});
					}
					ui++;
					
				} else if (ls[STIME] < us[STIME]) { // 아래가 바뀜
					if (group
					 && (  (ls[STYPE] == TYPE.RANGE) // 중간 싱크
					     || (group.upper.length && (group.upper[group.upper.length - 1][ETIME] > ls[STIME]))
					    )
					) { // 그룹 유지
						group.lower.push(ls);
						group.maxLines[1] = Math.max(group.maxLines[1], ls[LINES]);
						group.maxWidth = Math.max(group.maxWidth, ls[WIDTH]);
						group.maxSized = Math.max(group.maxSized, ls[SIZED]);
						
					} else { // 위가 없거나 끝남 -> 그룹 끊김
						groups.push(group = {
								upper: []
							,	lower: [ls]
							,	maxLines: [0, ls[LINES]]
							,	maxWidth: ls[WIDTH]
							,	maxSized: ls[SIZED]
						});
					}
					li++;
					
				} else { // 둘이 같이 바뀜
					if ((us[STYPE] == TYPE.RANGE) || (ls[STYPE] == TYPE.RANGE)) {
						// 하나라도 중간 싱크 - 그룹 유지
						group.upper.push(us);
						group.lower.push(ls);
						group.maxLines[0] = Math.max(group.maxLines[0], us[LINES]);
						group.maxLines[1] = Math.max(group.maxLines[1], ls[LINES]);
						group.maxWidth = Math.max(group.maxWidth, us[WIDTH]);
						group.maxWidth = Math.max(group.maxWidth, ls[WIDTH]);
						group.maxSized = Math.max(group.maxSized, us[SIZED]);
						group.maxSized = Math.max(group.maxSized, ls[SIZED]);
						
					} else {
						// 새 그룹
						groups.push(group = {
								upper: [us]
							,	lower: [ls]
							,	maxLines: [us[LINES], ls[LINES]]
							,	maxWidth: Math.max(us[WIDTH], ls[WIDTH])
							,	maxSized: Math.max(us[SIZED], ls[SIZED])
						});
					}
					ui++;
					li++;
				}
			}
		}
		for (let gi = 0; gi < groups.length; gi++) {
			const group = groups[gi];
			const withFontSize = group.maxSized < group.maxWidth;
			group.lines = [];
			let last = null;
			
			if (LOG) {
				console.log(group);
				console.log("group width: " + group.maxWidth);
				console.log("group sized width: " + group.maxSized);
			}
			
			// 팟플레이어 왼쪽 정렬에서 좌우로 흔들리지 않도록 잡아줌
			// ... 사실 폰트에 따라 흔들리긴 함...
			const lists = [group.upper, group.lower];
			for (let i = 0; i < lists.length; i++) {
				const list = lists[i];
				
				for (let j = 0; j < list.length; j++) {
					// 줄 길이 채워주기
					const sync = list[j];
					if (sync[WIDTH] < group.maxWidth && sync[SIZED] < group.maxSized) {
						const text = sync[TEXT];

						// 여백을 붙여서 제일 적절한 값 찾기
						let pad = "";
						{
							let groupMaxWidth;
							let lines;
							if (withFontSize) {
								// 글씨 크기 적용했을 때 더 작아졌으면 이걸 기준으로 구함
								
								if (sync[WIDTH] > group.maxSized) {
									// 크기 조절 안 했을 때의 폭을 이미 넘어섰으면 작업 안 함
									console.log("over??");
									continue;
								}
								
								groupMaxWidth = group.maxSized;
								
								if (text.toLowerCase().indexOf("size=") > 0) {
									let attrs = Subtitle.Smi.toAttr(text);
									for (let k = 0; k < attrs.length; k++) {
										const attr = attrs[k];
										const attrLines = attr.text.split("\n");
										if (attrLines.length > 1) {
											const newAttrs = [];
											for (let l = 0; l < attrLines.length; l++) {
												if (l > 0) {
													const brAttr = new Subtitle.Attr();
													brAttr.text = "\n";
													newAttrs.push(brAttr);
												}
												const newAttr = new Subtitle.Attr(attr);
												newAttr.text = attrLines[l];
												newAttrs.push(newAttr);
											}
											attrs = attrs.slice(0, k).concat(newAttrs).concat(attrs.slice(k + 1));
											k += attrLines.length - 1;
										}
									}
									lines = Subtitle.Smi.fromAttr(attrs, true).split(/<br>/gi);
									
								} else {
									// 현재 내용물에는 폰트 크기 적용 안 됨
									lines = text.split(/<br>/gi);
									for (let k = 0; k < lines.length; k++) {
										lines[k] = toText(lines[k], checker);
									}
								}
								
							} else {
								groupMaxWidth = group.maxWidth;
								lines = text.split(/<br>/gi);
								for (let k = 0; k < lines.length; k++) {
									lines[k] = toText(lines[k], checker);
								}
							}
							
							// 여러 줄일 경우 제일 긴 줄 찾기
							let maxLine = text;
							if (lines.length > 1) {
								let maxWidth = 0;
								for (let k = 0; k < lines.length; k++) {
									const width = getWidth(lines[k], checker);
									if (width > maxWidth) {
										maxWidth = width;
										maxLine = lines[k];
									}
								}
							}
							let width = getWidth(maxLine, checker);
							let lastPad;
							let lastWidth;
							if (LOG) console.log(maxLine.split("&nbsp;").join(" ") + ": " + width);
							const realLines = maxLine.split("\n"); // 실제론 여러 줄일 수 있음 <- ... 그 개념이 아니지 않나?
							do {
								lastPad = pad;
								lastWidth = width;
								pad = lastPad + " ";
								const curr = "​" + pad + realLines.join(pad + "​\n​" + pad) + pad + "​";
								width = getWidth(curr, checker);
								if (LOG) console.log(curr.split("&nbsp;").join(" ") + ": " + width);
								
							} while (width < groupMaxWidth);
							
							if ((width - groupMaxWidth) > (groupMaxWidth - lastWidth)) {
								pad = lastPad;
								if (LOG) {
									const curr = "​" + pad + realLines.join(pad + "​\n​" + pad) + pad + "​";
									width = getWidth(curr, checker);
								}
							}
							pad = pad.split("&nbsp;").join(" ");
						}
						
						// 다시 원본 가져와서 공백문자 붙이기
						const lines = text.split(/<br>/gi);
						for (let k = 0; k < lines.length; k++) {
							let newLine = lines[k].split("​").join(""); // Zero-Width-Space 중복으로 들어가지 않도록
							
							if (toText(newLine, checker).split("　").join("").split(" ").join("").length) {
								// 공백 줄인 경우는 별도 처리 하지 않음
								// 태그로 감싼 줄은 태그 안에 공백문자 넣기
								let prev = "";
								let next = "";
								while (newLine.startsWith("\n")) {
									prev += "\n";
									newLine = newLine.substring(1);
								}
								while (newLine.startsWith("<")) {
									let tagEnd = newLine.indexOf(">") + 1;
									if (tagEnd == 0) {
										break;
									}
									while (newLine.length > tagEnd && newLine[tagEnd] == "\n") {
										// 태그 직후에 줄바꿈을 한 경우가 있음
										tagEnd++;
									}
									prev += newLine.substring(0, tagEnd);
									newLine = newLine.substring(tagEnd);
								}
								while (newLine.endsWith(">")) {
									const tagStart = newLine.lastIndexOf("<");
									if (tagStart < 0) {
										break;
									}
									next = newLine.substring(tagStart) + next;
									newLine = newLine.substring(0, tagStart);
								}
								if (pad) {
									newLine = prev + "​" + pad + newLine + pad + "​" + next;
								} else {
									{	const c = newLine[0];
										if (c == ' ' || c == '　' || c == '\t') {
											newLine = "​" + newLine;
										}
									}
									{	const c = newLine[newLine.length - 1];
										if (c == ' ' || c == '　' || c == '\t') {
											newLine = newLine + "​";
										}
									}
									newLine = prev + newLine + next;
								}
								lines[k] = newLine;
							}
						}
						sync[TEXT] = lines.join("<br>");
						if (withFontSize && (sync[WIDTH] == sync[SIZED])) {
							sync[TEXT] = '<font size="' + Combine.defaultSize + '">' + sync[TEXT] + '</font>';
						}
					}
					
					// 줄 높이 맞춰주기
					// TODO: 글씨 크기 있을 때 지원 필요? ... 그룹 범위 내에서 크기 바뀐다면 대처하기 어려울 듯?
					for (let k = sync[LINES]; k < group.maxLines[i]; k++) {
						sync[TEXT] = "<b>　</b><br>" + sync[TEXT];
					}
				}
			}
			{	let ui = 0;
				let li = 0;
				while  ((ui <= group.upper.length) && (li <= group.lower.length)) {
					if ((ui == group.upper.length) && (li == group.lower.length)) {
						break;
					}
					const us = (ui < group.upper.length) ? group.upper[ui] : [99999999, 99999999, null, 0];
					const ls = (li < group.lower.length) ? group.lower[li] : [99999999, 99999999, null, 0];
					
					if (us[STIME] < ls[STIME]) { // 위가 바뀜
						if (!last) { // 첫 싱크
							group.lines.push(last = [us[STIME], us[STYPE], us[ETIME], us[ETYPE], us, null]);
							
						} else {
							// 아래는 유지하고 위는 바뀐 걸 추가
							if (last[STIME] == us[STIME]) {
								last[UPPER] = us;
							} else if (us[STIME] < last[ETIME]) {
								const curr = [us[STIME], us[STYPE], last[ETIME], last[ETYPE], us, last[LOWER]];
								last[ETIME] = us[STIME];
								last[ETYPE] = us[STYPE];
								group.lines.push(last = curr);
							}
							
							if (us[ETIME] < last[ETIME]) { // 위가 먼저 끝남
								const curr = [us[ETIME], us[ETYPE], last[ETIME], last[ETYPE], null, last[LOWER]];
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
							} else if (ls[STIME] < last[ETIME]) {
								const curr = [ls[STIME], ls[STYPE], last[ETIME], last[ETYPE], last[UPPER], ls];
								last[ETIME] = ls[STIME];
								last[ETYPE] = ls[STYPE];
								group.lines.push(last = curr);
							}
							
							if (ls[ETIME] < last[ETIME]) { // 아래가 먼저 끝남
								const curr = [ls[ETIME], ls[ETYPE], last[ETIME], last[ETYPE], last[TEXT], null];
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
						let ss = us;
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
		}
		checker.text("").hide();
		hljs.show();
		
		const lines = [];
		let lastSync = 0;
		for (let gi = 0; gi < groups.length; gi++) {
			const group = groups[gi];
			const forEmpty = [[], []];
			for (let i = 0; i < 2; i++) {
				for (let j = 0; j < group.maxLines[i]; j++) {
					forEmpty[i].push("<b>　</b>");
				}
				forEmpty[i] = forEmpty[i].join("<br>");
			}
			
			for (let i = 0; i < group.lines.length; i++) {
				const line = group.lines[i];
				
				if (lastSync < line[STIME]) {
					if (gi > 0) { // 처음일 땐 제외
						lines.push("&nbsp;");
					}
					lines.push(getSyncLine(line[STIME], line[STYPE]));
				}
				if (group.upper.length == 0) {
					lines.push(line[LOWER] ? line[LOWER][TEXT] : "&nbsp;");
				} else if (group.lower.length == 0) {
					lines.push(line[UPPER] ? line[UPPER][TEXT] : "&nbsp;");
				} else {
					lines.push((line[UPPER] ? line[UPPER][TEXT] : forEmpty[0]) + "<br>" + (line[LOWER] ? line[LOWER][TEXT] : forEmpty[1]));
				}
				if (line[ETIME] < 99999999) {
					lines.push(getSyncLine(lastSync = line[ETIME], line[ETYPE]));
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

if (Subtitle && Subtitle.SmiFile) {
	Subtitle.SmiFile.textToHolds = (text) => {
		const texts = text.split("\r\n").join("\n").split("\n<!-- Hold=");
		let holds = [{ text: texts[0] }];
		for (let i = 1; i < texts.length; i++) {
			const hold = texts[i];
			const begin = hold.indexOf("\n");
			const end = hold.indexOf("-->");
			if (begin < 0 || end < 0) {
				holds[0].text += "\n<!-- Hold=" + hold;
				continue;
			}
			// Hold 내용물 뒤에 뭐가 더 붙어있을 경우
			if (end < hold.length - 3) {
				holds[0].text += hold.substring(end);
			}
			let name = hold.substring(0, begin).trim();
			let pos = 1;
			const index = name.indexOf("|");
			if (index) {
				try {
					pos = Number(name.substring(0, index));
				} catch (e) {
					console.log(e);
				}
				name = name.substring(index + 1);
			}
			holds.push({
					pos: pos
				,	name: name
				,	text: hold.substring(begin, end).trim().split("<​").join("<").split("​>").join(">")
			});
		}
		
		// SMI 파일 역정규화
		const normalized = new Subtitle.SmiFile(holds[0].text).antiNormalize();
		normalized[0].pos = 0;
		normalized[0].name = "메인";
		holds = normalized.concat(holds.slice(1));
		if (holds[0].isWithSplit()) {
			// 대사 사이 1프레임 공백 싱크 제거
			const body = holds[0].body;
			for (let i = 1; i < body.length; i++) {
				const smi = body[i];
				if (smi.syncType == Subtitle.SyncType.split) {
					body[i - 1].text = smi.text;
					body.splice(i, 1);
				}
			}
		}
		holds[0].text = holds[0].toTxt().trim();
		
		for (let i = 1; i < normalized.length; i++) {
			// 내포된 홀드는 종료싱크가 빠졌을 수 있음
			const hold = holds[i];
			if (hold.next && !hold.body[hold.body.length - 1].isEmpty()) {
				hold.body.push(new Subtitle.Smi(hold.next.start, hold.next.syncType, "&nbsp;"));
			}
			holds[i].text = hold.toTxt().trim();
		}
		for (let i = normalized.length; i < holds.length; i++) {
			holds[i].text = new Subtitle.SmiFile(holds[i].text).antiNormalize()[0].toTxt().trim();
		}
		return holds;
	}
	
	Subtitle.SmiFile.holdsToText = (origHolds, withNormalize=true, withCombine=true, withComment=true, fps=23.976) => {
		const result = [];
		let logs = [];
		let originBody = [];
		
		const main = new Subtitle.SmiFile(origHolds[0].text);
		if (main.isWithSplit()) { // TODO: 메인 홀드 이외에도 가능하게 해야 하나?
			// 대사 사이 1프레임 공백 싱크 생성
			const body = main.body;
			const add = Math.round(1000 / fps);
			let before = null;
			for (let i = 0; i < body.length; i++) {
				const smi = body[i];
				if (smi.text.split("&nbsp;").join(" ").trim().length == 0) {
					before = null;
				} else {
					if (smi.text.indexOf(" fade=") > 0) {
						before = null;
						// 페이드인일 경우 끊기지 않도록 다음 싱크도 건너뛰기
						i++;
						continue;
					}
					
					// TODO: 설정에 따른 예외처리 넣기... 정규식으로?
					if (smi.text.indexOf("harne") >= 0) {
						before = null;
						continue;
					}
					if (smi.text.startsWith("[")) {
						before = null;
						continue;
					}
					
					if (before) {
						const splitted = new Subtitle.Smi((smi.start + add), Subtitle.SyncType.split, (before = smi.text));
						body.splice(++i, 0, splitted);
						smi.text = "&nbsp;";
						/*
					} else if (smi.syncType == Subtitle.SyncType.frame) {
						const splitted = new Subtitle.Smi((smi.start + add), Subtitle.SyncType.split, (before = smi.text));
						body.splice(++i, 0, splitted);
						smi.text = "&nbsp;";
						//*/
					} else {
						before = smi.text;
					}
				}
			}
			
			// TODO: 여기서 작업한 결과는 아래에 주석 생성 없도록 만들어야 함
		}
		//console.log(JSON.parse(JSON.stringify(body)));
		
		withCombine = withCombine && origHolds.length > 1;
		
		{	// 시작 시간 순으로 저장
			const holdsWithoutMain = origHolds.slice(1);
			holdsWithoutMain.sort((a, b) => {
				return a.start - b.start;
			});
			
			// 홀드 결합 대상 확인
			const imports = [];
			for (let hi = 0; hi < holdsWithoutMain.length; hi++) {
				const hold = holdsWithoutMain[hi];
				result[hold.resultIndex = (hi + 1)] = "<!-- Hold=" + hold.pos + "|" + hold.name + "\n" + hold.text.split("<").join("<​").split(">").join("​>") + "\n-->";
				hold.imported = false;
				hold.afterMain = false;
				
				// 내용물 없으면 내포 홀드 아님
				const holdBody = new Subtitle.SmiFile(hold.text).body;
				if (holdBody.length == 0) {
					continue;
				}
				if (!hold.end) {
					hold.end = holdBody[holdBody.length - 1].start;
				}
				
				if (main.body.length) {
					// 메인 홀드보다 뒤에 있는지 확인
					const i = main.body.length;
					const lastLine = main.body[i - 1];
					if (lastLine.start <= hold.start && (lastLine.text.split("&nbsp;").join("").trim().length == 0)) {
						hold.afterMain = true;
						if (withCombine) {
							let hasImport = false;
							for (let j = 0; j < imports.length; j++) {
								if (imports[j][0] == i) {
									hasImport = true;
								}
							}
							if (!hasImport) {
								// 내포 홀드는 결합 대상에서 제외
								imports.push([i, hold, holdBody]);
								result[hold.resultIndex] = "";
								hold.imported = true;
							}
						}
					}
					if (withCombine && !hold.imported) {
						for (let i = 0; i < main.body.length; i++) {
							const line = main.body[i];
							if (hold.start < line.start) {
								if (hold.end <= line.start) {
									if ((i == 0) || (main.body[i - 1].text.split("&nbsp;").join("").trim().length == 0)) {
										let hasImport = false;
										for (let j = 0; j < imports.length; j++) {
											const imported = imports[j];
											if (imported[0] == i) {
												// 기존 내포 홀드와 겹치면 내포 홀드 불가능
												if (hold.start < imported[1].end) {
													hasImport = true;
													break;
												}
											}
										}
										if (!hasImport) {
											// 내포 홀드는 결합 대상에서 제외
											imports.push([i, hold, holdBody]);
											result[hold.resultIndex] = "";
											hold.imported = true;
										}
									}
								}
								break;
							}
						}
					}
				} else if (withCombine) {
					// 메인 홀드 없으면 서로 겹치지만 않으면 내포 홀드 처리
					let hasImport = false;
					for (let j = 0; j < imports.length; j++) {
						if (hold.start < imports[j][1].end) {
							hasImport = true;
							break;
						}
					}
					if (!hasImport) {
						// 내포 홀드는 결합 대상에서 제외
						imports.push([0, hold, holdBody]);
						result[hold.resultIndex] = "";
						hold.imported = true;
					}
				}
			}
			// 내포 홀드 처리
			for (let i = imports.length - 1; i >= 0; i--) {
				const index = imports[i][0];
				const hold = imports[i][1];
				const importBody = imports[i][2];
				const removePrev = (index > 0 && main.body[index - 1].start == hold.start);
				let holdEnd = hold.end;
				if (index < main.body.length) {
					if (hold.end == main.body[index].start) {
						importBody.pop();
					}
				}
				if (hold.afterMain) {
					holdEnd++;
				}
				if (withComment) {
					importBody[0].text = "<!-- End=" + holdEnd + "\nHold=" + hold.pos + "|" + hold.name + "\n-->\n" + importBody[0].text;
				}
				main.body = main.body.slice(0, (removePrev ? index - 1 : index)).concat(importBody).concat(main.body.slice(index));
			}
		}
		
		// 정규화 등 작업
		if (withNormalize) {
			const normalized = Subtitle.Smi.normalize(main.body, withComment && !withCombine, fps);
			originBody = normalized.origin;
			logs = normalized.logs;
		} else {
			if (origHolds.length > 1) {
				originBody = main.body.slice(0, main.body.length);
			}
		}
		
		if (withCombine) {
			// 메인에 가까운 걸 먼저 작업해야 함
			// 단, 아래쪽부터 쌓아야 함
			const holds = origHolds.slice(0);
			holds.sort((a, b) => {
				let aPos = a.viewPos;
				let bPos = b.viewPos;
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
			
			const holdSmis = [];
			for (let hi = 1; hi < holds.length; hi++) {
				const hold = holds[hi];
				if (hold.imported) {
					continue;
				}
				const smi = holdSmis[hi] = new Subtitle.SmiFile(hold.text);
				smi.header = smi.footer = "";
				if (withNormalize) {
					Subtitle.Smi.normalize(smi.body, false);
				}
				
				if (smi.body.length == 0) {
					continue;
				}
				
				// 메인에서 홀드와 겹치는 영역 찾기
				let mainBegin = 0;
				let mainEnd = 0;
				{
					const start = smi.body[0].start;
					for (let i = 0; i <= main.body.length; i++) {
						if (i == main.body.length) {
							mainBegin = i;
							break;
						}
						if (main.body[i].start >= start) {
							break;
						}
						mainBegin = i;
					}
					if (mainBegin == main.body.length) {
						// 홀드 전체가 메인보다 뒤에 있음
						// 위쪽 내포 홀드에서 처리돼서 여기 올 일 없어졌을 듯
						main.body = main.body.concat(smi.body);
						continue;
					}
					if (main.body[mainBegin].text.split("&nbsp;").join("").trim().length == 0) {
						mainBegin++;
					}
					
					mainEnd = mainBegin;
					const end = smi.body[smi.body.length - 1].start;
					for (; mainEnd < main.body.length; mainEnd++) {
						if (main.body[mainEnd].start > end) {
							break;
						}
					}
					if (mainEnd == 0) {
						// 홀드 전체가 메인보다 앞에 있음
						// 위쪽 내포 홀드에서 처리돼서 여기 올 일 없어졌을 듯
						main.body = smi.body.concat(main.body);
						continue;
					}
				}
				
				// 홀드 결합
				const sliced = new Subtitle.SmiFile();
				sliced.body = main.body.slice(mainBegin, mainEnd);
				
				const slicedText = sliced.toTxt().trim();
				const combineText = smi.toTxt().trim();
				const combined = new Subtitle.SmiFile(((hold.pos < 0) ? Combine.combine(slicedText, combineText) : Combine.combine(combineText, slicedText)).join("\n"));
				// 원칙상 normalized.result를 다뤄야 맞을 것 같지만...
				main.body = main.body.slice(0, mainBegin).concat(combined.body).concat(main.body.slice(mainEnd));
			}
			
			if (withComment) {
				// 홀드 결합 있을 경우 주석처리 재계산
				logs = [];
				let oi = 0;
				let ni = 0;
				
				while ((oi < originBody.length) && (ni < main.body.length)) {
					if ((originBody[oi].start == main.body[ni].start)
					 && (originBody[oi].text  == main.body[ni].text )) {
						oi++;
						ni++;
						continue;
					}
					
					// 변환결과가 원본과 동일하지 않은 범위 찾기
					const newLog = {
							from: [oi, originBody.length]
						,	to  : [ni, main.body.length]
						,	start: main.body[ni].start
						,	end: 999999999
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
						break;
					}
					logs.push(newLog);
				}
				// 메인 홀드에 없는 내용만 남음
				if (ni < main.body.length) {
					logs.push({
							from: [oi, oi]
						,	to  : [ni, main.body.length]
						,	start: main.body[ni].start
						,	end  : main.body[main.body.length - 1].start + 1
					});
				}
				
				const origin = new Subtitle.SmiFile();
				for (let i = 0; i < logs.length; i++) {
					const log = logs[i];
					if (!log.end) {
						if (log.from[1] < originBody.length - 1) {
							log.end = originBody[log.from[1]].start;
						} else {
							log.end = 999999999;
						}
					}
					origin.body = originBody.slice(log.from[0], log.from[1]);
					let comment = origin.toTxt().trim();
					
					main.body[log.to[0]].text = "<!-- End=" + log.end + "\n" + (comment.split("<").join("<​").split(">").join("​>")) + "\n-->\n" + main.body[log.to[0]].text;
				}
			}
		}
		result[0] = main.toTxt();
		for (let i = 1; i < result.length; i++) {
			if (result[i].length == 0) {
				result.splice(i--, 1);
			}
		}
		return withComment ? result.join("\n") : result[0];
	}
}