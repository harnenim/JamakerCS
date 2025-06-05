window.Combine = {
	css: 'font-family: 맑은 고딕;'
,	defaultSize: 18 // TODO: 설정에서 바뀌도록... 하려면 서브 프로그램에서도 설정을 불러와야 하는데...
};
{
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
	const ATTRS = 5;
	const LINES = 6;
	const WIDTH = 7;
	const SIZED = 8;
	
	const UPPER = 4;
	const LOWER = 5;
	
	const LOG = false;
	const NEW = true;
	const FIX_LINES = false;
	
	// 다중 결합에 대해 중간 싱크 처리를 위한 부분
	Subtitle.SyncType.combinedNormal = 4;
	Subtitle.SyncType.combinedFrame  = 5;
	Subtitle.SyncType.combinedInner  = 6;
	Subtitle.Smi.TypeParser[Subtitle.SyncType.combinedNormal] = "\t\t";
	Subtitle.Smi.TypeParser[Subtitle.SyncType.combinedFrame ] = " \t\t";
	Subtitle.Smi.TypeParser[Subtitle.SyncType.combinedInner ] = "\t\t\t";
	Subtitle.Smi._getSyncType = Subtitle.Smi.getSyncType;
	Subtitle.Smi.getSyncType = function(syncLine) {
		if (syncLine.endsWith("\t\t>")) {
			switch (syncLine[syncLine.length - 4]) {
				case '\t':
					return Subtitle.SyncType.combinedInner;
				case ' ':
					return Subtitle.SyncType.combinedFrame;
			}
			return Subtitle.SyncType.combinedNormal;
		}
		return Subtitle.Smi._getSyncType(syncLine);
	}
	
	if (!window.Line) {
		// SmiEditor의 Line에서 렌더링 기능 빼고 가져옴
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
	}
	
	function toText(html, checker) {
		// RUBY태그 없애고 계산
		return checker.html(html.split("<RT").join("<!--RT").split("</RT>").join("</RT-->")).text();
	}
	function isClear(attr) {
		// 공백문자가 들어가도 무관한 속성
		return !attr.u
		    && !attr.s
		    && !attr.fs
		    && !attr.fn
		    && !attr.typing // 타이핑 같은 건 결합 전에 사라져야 함
		    && !attr.furigana;
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
	function getAttrWidth(attrs, checker, withFs=false) {
		const cAttrs = [];
		for (let i = 0; i < attrs.length; i++) {
			const attr = new Subtitle.Attr(attrs[i], attrs[i].text.split("&nbsp;").join(" "), true);
			attr.fs = ((withFs && attr.fs) ? attr.fs : Combine.defaultSize);
			if (attr.fn && attr.fn != "맑은 고딕") {
				// 팟플레이어 폰트 크기 보정
				attr.fs = attr.fs * 586 / 456;
			}
			cAttrs.push(attr);
		}
		const width = checker.html(Subtitle.Smi.fromAttr(cAttrs, Combine.defaultSize).split("\n").join("<br>")).width();
		if (LOG) console.log(width, attrs);
		return width;
	}
	function getChecker() {
		if (!Combine.checker) {
			$("body").append(Combine.checker = $("<span class='width-checker'>"));
			$("style").append($("<style>").html("\n"
				+ ".width-checker, .width-checker * {\n"
				+ "white-space: pre;\n"
				+ "font-size: 144px;\n"
				+ "font-weight: bold;\n"
			));
		}
		Combine.checker.attr({ style: Combine.css });
		return Combine.checker.show();
	}
	
	const syncLines = { basic: {}, frame: {}, range: {} };
	function getSyncLine(sync, type) {
		let line = null;
		if (NEW) {
			if (window.SmiEditor) {
				line = SmiEditor.makeSyncLine(sync, type + 1);
			} else {
				line = "<Sync Start=" + sync + "><P Class=KRCC" + Subtitle.Smi.TypeParser[type] + ">";
			}
		} else {
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
		}
		return line;
	}
	
	function parse(text, checker) {
		if (NEW) {
			const smis = new Subtitle.SmiFile(text).body;
			smis.push(new Subtitle.Smi(99999999, Subtitle.SyncType.normal, "&nbsp;"));
						
			const syncs = [];
			let last = null;
			for (let i = 0; i < smis.length; i++) {
				const smi = smis[i];
				if (last) { // 이전 것 남아있으면 종료싱크 부여
					last[ETIME] = smi.start;
					last[ETYPE] = smi.syncType;
					last = null;
				}
				if (smi.text.split("&nbsp;").join("").trim()) {
					const lineCount = smi.text.split(/<br>/gi).length;
					
					const attrs = smi.toAttr(false);
					const defaultWidth = getAttrWidth(attrs, checker);
					const sizedWidth   = getAttrWidth(attrs, checker, true);
					syncs.push(last = [smi.start, smi.syncType, 0, 0, smi.text, attrs, lineCount, defaultWidth, sizedWidth]);
				}
			}
			
			return syncs;
			
		} else {
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
				let parsed = new Line(line);
				parseds.push(parsed);
	
				if (parsed.SYNC) {
					if (parsed.TYPE == TYPE.FRAME) {
						syncLines.frame[parsed.SYNC] = line;
					} else if (parsed.TYPE == TYPE.RANGE) {
						syncLines.range[parsed.SYNC] = line;
					} else {
						syncLines.basic[parsed.SYNC] = line;
					}
				}
			}
			parseds.push(new Line("&nbsp;", 99999999, TYPE.BASIC));
			
			const syncs = [];
			let last = null;
			for (let i = 0; i < parseds.length; i++) {
				const parsed = parseds[i];
				if (parsed.TYPE) {
					if (last) {
						const lines = [];
						for (let j = last[0] + 1; j < i; j++) {
							lines.push(parseds[j].TEXT);
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
	
							//[STIME, STYPE, ETIME, ETYPE, TEXT, ATTRS, LINES, WIDTH, SIZED];
							syncs.push([last[1], last[2], parsed.SYNC, parsed.TYPE, text, null, lineCount, defaultWidth, sizedWidth]);
						}
					}
					last = [i, parsed.SYNC, parsed.TYPE];
				}
			}
			
			return syncs;
		}
	}
	
	Combine.combine = (inputUpper, inputLower) => {
		// 결합 로직 돌아갈 때 문법 하이라이트가 있으면 성능 저하됨
		// ... 지금은 개선해서 큰 저하 없을지도?
		const hljs = $(".hljs").hide();
		const checker = getChecker();
		const upperSyncs = parse(inputUpper, checker);
		const lowerSyncs = parse(inputLower, checker);
		
		const groups = [];
		if (NEW) {
			{
				let group = null;
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
						 && (   ((us[STYPE] == Subtitle.SyncType.inner) || (us[STYPE] > 3)) // 중간 싱크
						     || (group.lower.length && (group.lower[group.lower.length - 1][ETIME] > us[STIME]))
						    )
						) { // 그룹 유지
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
						 && (  ((ls[STYPE] == Subtitle.SyncType.inner) || (ls[STYPE] > 3)) // 중간 싱크
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
						if ((us[STYPE] == Subtitle.SyncType.inner) || (us[STYPE] > 3) || (ls[STYPE] == Subtitle.SyncType.inner) || (ls[STYPE] > 3)) {
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
				const groupMaxWidth = withFontSize ? group.maxSized : group.maxWidth;
				group.lines = [];
				let last = null;
				
				// 팟플레이어 왼쪽 정렬에서 좌우로 흔들리지 않도록 최대한 잡아줌
				if (group.upper.length && group.lower.length) {
					if (LOG) {
						console.log(group);
						console.log("group width: " + group.maxWidth);
						console.log("group sized width: " + group.maxSized);
					}
					
					const lists = [group.upper, group.lower];
					for (let i = 0; i < lists.length; i++) {
						const list = lists[i];
						
						for (let j = 0; j < list.length; j++) {
							// 줄 길이 채워주기
							const sync = list[j];
							const attrs = sync[ATTRS];

							let pad = "";
							if (sync[WIDTH] < group.maxWidth && sync[SIZED] < group.maxSized) {
								// 여백을 붙여서 제일 적절한 값 찾기
								if (withFontSize) {
									// 글씨 크기 적용했을 때 더 작아졌으면 이걸 기준으로 구함

									/*
									if (sync[WIDTH] > groupMaxWidth) {
										// 크기 조절 안 했을 때의 폭을 이미 넘어섰으면 작업 안 함
										if (LOG) console.log("width over");
										sync[TEXT] = Subtitle.Smi.fromAttr(attrs).split("\n").join("<br>");
										continue;
									}
									*/
								}

								let isEmpty = true;
								let width = sync[SIZED];
								let padsAttrs = attrs;
								let lastPad;
								let lastAttrs;
								let lastWidth;
								let closeAttr = null;
								
								// 좌우 여백 붙이기 전 줄 단위로 분리 및 기존 Zero-Width-Space 삭제
								let wasClear = false;
								let trimedLine = { attrs: [], isEmpty: true };
								const trimedLines = [trimedLine];
								for (let k = 0; k < attrs.length; k++) {
									const attrText = attrs[k].text.split("​").join("");
									let attr = new Subtitle.Attr(attrs[k], attrText, true);
									
									if (attrText.length == 0) {
										// 내용물 없는 속성 무시
										if (k < attrs.length - 1) {
											continue;
											
										} else {
											// 종료 태그
											if (wasClear) {
												// 앞쪽에 공백문자 넣을 수 있으면 따로 뺌
												closeAttr = attr;
												break;
											}
										}
									}
									
									const attrLines = attrText.split("\n");
									if (attrLines.length > 1) {
										// 속성 안에 줄바꿈이 있었으면 분리 후 진행
										attr.text = attrLines[0];
										if (attr.text) {
											trimedLine.attrs.push(attr);
											wasClear = isClear(attr);
										} else {
											// 첫 줄바꿈 전에 내용 없으면 건너뜀
											wasClear = false;
										}
										
										if (trimedLine.isEmpty && attr.text.split("　").join("").trim().length) {
											trimedLine.isEmpty = isEmpty = false;
										}
										
										for (let l = 1; l < attrLines.length; l++) {
											attr = new Subtitle.Attr(attr, attrLines[l], true);
											if ((l == attrLines.length - 1) && (attr.text.split("​").join("").length == 0)) {
												// 마지막 줄바꿈 후에 내용 없으면 건너뜀
												trimedLines.push(trimedLine = { attrs: [], isEmpty: true });
											} else {
												attr.splitted = wasClear; // 재결합 대상
												trimedLines.push(trimedLine = { attrs: [attr], isEmpty: (attr.text.split("　").join("").trim().length == 0) });
											}
										}
										
									} else {
										if (attr.text) {
											trimedLine.attrs.push(attr);
										}
										wasClear = isClear(attr);
										if (trimedLine.isEmpty && attr.text.split("　").join("").trim().length) {
											trimedLine.isEmpty = isEmpty = false;
										}
									}
								}
								//console.log(attrs, trimedLines);
								
								if (!isEmpty) {
									const br = new Subtitle.Attr(null, "\n");
									do {
										lastPad = pad;
										lastAttrs = padsAttrs;
										lastWidth = width;
										pad = lastPad + " ";
										padsAttrs = [];
										
										for (let l = 0; l < trimedLines.length; l++) {
											if (l > 0) {
												padsAttrs.push(br);
											}
											const trimedLine = trimedLines[l];
											if (trimedLine.isEmpty) {
												// 빈 줄이면 그대로 추가
												padsAttrs.push(...trimedLine.attrs);
												
											} else {
												if (trimedLine.attrs.length == 0) {
													// 해당 줄에 속성이 없을 때..는 없는 게 맞음
													
												} else if (trimedLine.attrs.length == 1) {
													// 해당 줄에 속성이 하나일 때
													let attr = trimedLine.attrs[0];
													if (isClear(attr)) {
														// 속성에 공백문자 포함
														if (attr.splitted) {
															// 재결합 대상
															padsAttrs.pop(); // 미리 추가한 줄바꿈 제거
															const lastAttr = padsAttrs.pop();
															attr = new Subtitle.Attr(attr, lastAttr.text + "\n​" + pad + attr.text + pad + "​", true);
															padsAttrs.push(attr);
														} else {
															attr = new Subtitle.Attr(attr, "​" + pad + attr.text + pad + "​", true);
															padsAttrs.push(attr);
														}
													} else {
														// 속성 밖에 공백문자 추가
														padsAttrs.push(new Subtitle.Attr(null, "​" + pad));
														padsAttrs.push(attr);
														padsAttrs.push(new Subtitle.Attr(null, pad + "​"));
													}
													
												} else {
													// 해당 줄에 속성이 여러 개일 때
													
													// 처음 속성
													let attr = trimedLine.attrs[0];
													if (isClear(attr)) {
														// 속성에 공백문자 포함
														if (attr.splitted) {
															// 재결합 대상
															padsAttrs.pop(); // 미리 추가한 줄바꿈 제거
															const lastAttr = padsAttrs.pop();
															attr = new Subtitle.Attr(attr, lastAttr.text + "\n​" + pad + attr.text, true);
															padsAttrs.push(attr);
														} else {
															attr = new Subtitle.Attr(attr, "​" + pad + attr.text, true);
															padsAttrs.push(attr);
														}
													} else {
														// 속성 밖에 공백문자 추가
														padsAttrs.push(new Subtitle.Attr(null, "​" + pad));
														padsAttrs.push(attr);
													}
													
													// 중간 속성은 그대로 넣음
													for (let k = 1; k < trimedLine.attrs.length - 1; k++) {
														padsAttrs.push(trimedLine.attrs[k]);
													}
													
													// 마지막 속성
													attr = trimedLine.attrs[trimedLine.attrs.length - 1];
													if (isClear(attr)) {
														// 속성에 공백문자 포함
														padsAttrs.push(new Subtitle.Attr(attr, attr.text + pad + "​", true));
													} else {
														// 속성 밖에 공백문자 포함
														padsAttrs.push(attr);
														padsAttrs.push(new Subtitle.Attr(null, pad + "​"));
													}
												}
											}
										}
										if (closeAttr) {
											// 종료 태그 붙이기
											padsAttrs.push(closeAttr);
										}
										width = getAttrWidth(padsAttrs, checker, withFontSize);
										if (LOG) console.log(padsAttrs, width);
										
									} while (width < groupMaxWidth);
								}
								
								if ((width - groupMaxWidth) > (groupMaxWidth - lastWidth)) {
									pad = lastPad;
									padsAttrs = lastAttrs;
									width = lastWidth;
									if (LOG) console.log(padsAttrs, width);
								}
								
								sync[TEXT] = Subtitle.Smi.fromAttr(padsAttrs).split("\n").join("<br>");
								
							} else {
								sync[TEXT] = Subtitle.Smi.fromAttr(attrs).split("\n").join("<br>");
							}
							
							// 줄 높이 맞춰주기
							// TODO: 글씨 크기 있을 때 지원 필요? ... 그룹 범위 내에서 크기 바뀐다면 대처하기 어려울 듯?
							// TODO: 이게 자막을 플레이어 하단이 아닌 상단에 놔도 문제없으라고 공백 윗줄을 채우는 건데... 그냥 뺄까?
							// TODO: 공백줄을 넣어주면 3개 이상 결합 시 공백줄 위로만 쌓이게 되는 문제가 있음
							// TODO: 아예 그룹 내에서도 줄 높이가 가변이어야 하나...?
							if (FIX_LINES) {
								for (let k = sync[LINES]; k < group.maxLines[i]; k++) {
									sync[TEXT] = "<b>　</b><br>" + sync[TEXT];
								}
							}
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
			
		} else {
			{
				let group = null;
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
						) { // 그룹 유지
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
				
				// 팟플레이어 왼쪽 정렬에서 좌우로 흔들리지 않도록 잡아줌
				// ... 사실 폰트에 따라 흔들리긴 함...
				if (group.upper.length && group.lower.length) {
					if (LOG) {
						console.log(group);
						console.log("group width: " + group.maxWidth);
						console.log("group sized width: " + group.maxSized);
					}
					
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
									// TODO: attrs로 변환해서 처리해야 할 듯...?
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
										// 태그로 감싼 줄은 태그 안에 공백문자 넣기 <- 기능X, 그냥 소스 보기 좋게 만들기
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
											{	const tag = newLine.substring(0, tagEnd).toUpperCase();
												
												// 밑줄/취소선, RUBY태그는 공백문자 추가되면 안 됨
												if (tag == "<U>" || tag == "<S>" || tag == "<RUBY>") {
													break;
												}
												// TODO: font size 적용된 경우도 막아야 하나...?
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
											const tagEnd = newLine.lastIndexOf(">") + 1;
											if (tagEnd <= tagStart) {
												break;
											}
											{	const tag = newLine.substring(tagStart, tagEnd).toUpperCase();
												
												// 밑줄/취소선, RUBY태그는 공백문자 추가되면 안 됨
												if (tag == "</U>" || tag == "</S>" || tag == "</RUBY>") {
													break;
												}
												// TODO: font size 적용된 경우도 막아야 하나...?
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
							// TODO: 글씨 크기 있을 때 지원 필요? ... 그룹 범위 내에서 크기 바뀐다면 대처가 불가능할 듯?
							// RUBY 태그 있을 때도 유지 안 됨
							for (let k = sync[LINES]; k < group.maxLines[i]; k++) {
								sync[TEXT] = "<b>　</b><br>" + sync[TEXT];
							}
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
		}
		checker.text("").hide();
		hljs.show();
		
		const lines = [];
		let lastSync = 0;
		for (let gi = 0; gi < groups.length; gi++) {
			const group = groups[gi];
			const forEmpty = [[], []];
			// TODO: 윗줄은 안 채워주는 게 나으려나?
			for (let i = 0; i < 2; i++) {
				for (let j = 0; j < group.maxLines[i]; j++) {
					forEmpty[i].push("<b>　</b>");
				}
				forEmpty[i] = forEmpty[i].join("<br>");
			}
			
			for (let i = 0; i < group.lines.length; i++) {
				const line = group.lines[i];
				
				if (line[STIME] < 0) {
					// 건너뛰기
					continue;
				}
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
					if (FIX_LINES) {
						// 위쪽 공백줄 채우기
						const upper = (line[UPPER] ? line[UPPER][TEXT] : forEmpty[0]);
						lines.push((upper ? upper + "<br>" : "") + (line[LOWER] ? line[LOWER][TEXT] : forEmpty[1]));
						
					} else {
						// 위쪽 채우지 않기
						if (line[UPPER]) {
							let text = line[UPPER][TEXT];
							// 중간 공백줄 채우기
							for (let j = (line[LOWER] ? line[LOWER][LINES] : 0); j < group.maxLines[1]; j++) {
								text += "<br><b>　</b>";
							}
							// 아랫줄 있으면 넣기
							if (line[LOWER]) {
								text += "<br>" + line[LOWER][TEXT];
							}
							lines.push(text);
							
						} else {
							if (line[LOWER]) {
								// 아랫줄만 있을 때
								lines.push(line[LOWER][TEXT]);
								
							} else {
								// 그룹 내에서 둘 다 없을 수는 없음
							}
						}
					}
				}
				if (line[ETIME] < 99999999) {
					let syncLine = getSyncLine(lastSync = line[ETIME], line[ETYPE]);
					if (i < group.lines.length - 1 && !syncLine.endsWith("\t\t>")) {
						// 결합 시 임시 중간 싱크로 처리, 다중 결합 시 그룹화
						syncLine = syncLine.substring(0, syncLine.length - 1) + "\t\t>";
					}
					lines.push(syncLine);
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
				holds[0].text += hold.substring(end + 3);
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
		{	// 메인 홀드 ASS 변환용 스타일 확인
			const footer = holds[0].footer.split("\n<!-- Style\n");
			if (footer.length > 1) {
				holds[0].style = Subtitle.SmiFile.parseStyle(footer[1].split("\n")[0].trim());
				holds[0].footer = footer[0];
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
			const lines = (holds[i].text = new Subtitle.SmiFile(holds[i].text).antiNormalize()[0].toTxt().trim()).split("\n");
			
			if ((lines[0] == "<!-- Style" || lines[0] == "<!-- Preset")
			 && lines[2] == "-->") {
				holds[i].style = Subtitle.SmiFile.parseStyle(lines[1].trim());
				holds[i].text = lines.slice(3).join("\n");
			}
		}
		return holds;
	}
	
	// TODO: <BODY split> 형식일 때 동작 - 기능이 필요할까...? 일단 개발 보류
	Subtitle.SmiFile.prototype.isWithSplit = function() {
		const match = /<body( [^>]*)*>/gi.exec(this.header);
		return match && (match[0].indexOf("split") > 0);
	}
	Subtitle.SmiFile.holdsToText = (origHolds, withNormalize=true, withCombine=true, withComment=true, fps=23.976) => {
		const result = [];
		let logs = [];
		let originBody = [];
		
		// .text 동기화 안 끝났을 가능성 고려, 현재 값 다시 불러옴
		const main = new Subtitle.SmiFile(origHolds[0].input ? origHolds[0].input.val() : origHolds[0].text);
		if (main.isWithSplit()) { // 메인 홀드 이외에도 지원이 필요한가...?
			// 대사 사이 1프레임 공백 싱크 생성
			const body = main.body;
			const add = Math.round(1000 / fps);
			let before = null;
			for (let i = 0; i < body.length; i++) {
				const smi = body[i];
				if (smi.isEmpty()) {
					before = null;
				} else {
					if (smi.text.indexOf(" fade=") > 0) {
						before = null;
						// 페이드인일 경우 끊기지 않도록 다음 싱크도 건너뛰기
						i++;
						continue;
					}
					
					// TODO: 설정에 따른 예외처리 넣기? 정규식으로?
					if (smi.text.indexOf("harne") >= 0) {
						before = null;
						continue;
					}
					if (smi.text.startsWith("[")) {
						before = null;
						continue;
					}
					
					if (before) {
						// 대사끼리 붙어있을 때 1프레임 공백 싱크 생성
						const splitted = new Subtitle.Smi((smi.start + add), Subtitle.SyncType.split, (before = smi.text));
						body.splice(++i, 0, splitted);
						smi.text = "&nbsp;";
						/*
					} else if (smi.syncType == Subtitle.SyncType.frame) { // TODO: 설정으로 on/off? <BODY> 태그 플래그로?
						// 대사 사이 싱크가 화면 싱크일 때
						const splitted = new Subtitle.Smi((smi.start + add), Subtitle.SyncType.split, (before = smi.text));
						body.splice(++i, 0, splitted);
						smi.text = "&nbsp;";
						
						// TODO: 여기서 작업한 결과는 아래에 주석 생성 없도록 만들어야 함
						//*/
					} else {
						before = smi.text;
					}
				}
			}
		}
		//console.log(JSON.parse(JSON.stringify(body)));
		{	// 메인 홀드 스타일 저장
			const style = Subtitle.SmiFile.toSaveStyle(origHolds[0].style);
			if (style) {
				main.footer += "\n<!-- Style\n" + style + "\n-->";
			}
		}
		
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
				const holdText = hold.input ? hold.input.val() : hold.text; // .text 동기화 안 끝났을 가능성 고려, 현재 값 다시 불러옴
				let text = holdText;
				if (hold.style) {
					const style = Subtitle.SmiFile.toSaveStyle(hold.style);
					if (style) {
						text = "<!-- Style\n" + style + "\n-->\n" + text;
					}
				}
				result[hold.resultIndex = (hi + 1)] = "<!-- Hold=" + hold.pos + "|" + hold.name + "\n" + text.split("<").join("<​").split(">").join("​>") + "\n-->";
				hold.imported = false;
				hold.afterMain = false;
				
				// 홀드 위치가 1 또는 -1인 경우에만 내포 홀드 여부 확인
				if ((hold.pos > 1) || (hold.pos < -1)) {
					continue;
				}
				
				// 스타일 적용 필요하면 내포 홀드 처리 하지 않음
				if (hold.style) {
					style = Subtitle.SmiFile.toSaveStyle(hold.style);
					if (style) {
						//text = "<!-- Style\n" + style + "\n-->\n" + text;
						continue;
					}
				}
				
				// 내용물 없으면 내포 홀드 아님
				const holdBody = new Subtitle.SmiFile(holdText).body;
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
					if ((lastLine.start <= hold.start) && lastLine.isEmpty()) {
						hold.afterMain = true;
						if (withCombine) {
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
					if (withCombine && !hold.imported) {
						for (let i = 0; i < main.body.length; i++) {
							const line = main.body[i];
							if (hold.start < line.start) {
								if (hold.end <= line.start) {
									if ((i == 0) || main.body[i - 1].isEmpty()) {
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
					// TODO: 둘 중 하나가 다른 하나에 이중 내포 되는 경우 처리 필요?
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
					// 메인 홀드보다 뒤쪽에 독립된 경우, 종료싱크를 잡아주기 위해 +1
					// TODO: 독립 홀드 2개 이상이 있으면서 싱크가 붙어있으면 증발 문제 발생
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
			const normalized = main.normalize(withComment && !withCombine, fps);
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
				const holdText = hold.input ? hold.input.val() : hold.text;
				let text = holdText;
				if (hold.style) {
					const style = Subtitle.SmiFile.toSaveStyle(hold.style);
					if (style) {
						text = "<!-- Style\n" + style + "\n-->\n" + text;
					}
				}
				const smi = holdSmis[hi] = new Subtitle.SmiFile(text);
				if (withNormalize) {
					smi.normalize(false);
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
					if (main.body[mainBegin].isEmpty()) {
						mainBegin++;
					} else {
						// 중간 싱크는 함께 결합돼야 함
						while (mainBegin >= 0) {
							if ((main.body[mainBegin].syncType == Subtitle.SyncType.inner)
							 || (main.body[mainBegin].syncType == Subtitle.SyncType.combinedNormal)
							 || (main.body[mainBegin].syncType == Subtitle.SyncType.combinedFrame)
							 || (main.body[mainBegin].syncType == Subtitle.SyncType.combinedInner)
							) {
								mainBegin--;
							} else {
								break;
							}
						}
					}
					
					mainEnd = mainBegin;
					const last = smi.body[smi.body.length - 1];
					let isEnded = last.isEmpty();
					if (!isEnded) {
						// 미완성 자막인 경우 과도한 결합 발생
						// 마지막 대사가 5줄 넘어가면 미완성본으로 간주하고 종료 싱크로 처리, 결합 대상에서 제외
						isEnded = (last.text.split("\n").length > 5);
					}
					if (isEnded) {
						// 마지막 싱크가 종료 싱크일 경우 결합 범위 찾기
						const end = last.start;
						for (; mainEnd < main.body.length; mainEnd++) {
							if (main.body[mainEnd].start > end) {
								break;
							}
						}
					} else {
						// 대사가 남은 채 끝날 경우 끝까지 결합
						mainEnd = main.body.length;
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

			// TODO: 최종본에서 그룹 단위 윗줄 채워줄까?

			// 임시 중간 싱크 정상화
			for (let i = 0; i < main.body.length; i++) {
				const smi = main.body[i];
				if (smi.syncType == Subtitle.SyncType.combinedNormal) {
					smi.syncType = Subtitle.SyncType.normal;
				} else if (smi.syncType == Subtitle.SyncType.combinedFrame) {
					smi.syncType = Subtitle.SyncType.frame;
				} else if (smi.syncType == Subtitle.SyncType.combinedInner) {
					smi.syncType = Subtitle.SyncType.inner;
				}
			}
			
			// 프레임 단위로 볼 때 싱크 뭉친 부분 확인
			if (window.SmiEditor && SmiEditor.video && SmiEditor.video.fs && SmiEditor.video.fs.length) {
				const fs = SmiEditor.video.fs;
				let next = null;
				for (let i = main.body.length - 1; i > 0; i--) {
					const smi = main.body[i];
					if (next) {
						if (next.syncType == Subtitle.SyncType.frame) {
							// 1프레임 미만 중간싱크로 인해 화면싱크가 밀리는지 확인
							const startIndex = SmiEditor.findSyncIndex(smi .start, fs);
							const endIndex   = SmiEditor.findSyncIndex(next.start, fs);
							if (endIndex != null && startIndex == endIndex) {
								// 현재 대사 건너뛰기
								main.body.splice(i, 1);
								continue;
							}
						}
					}
					next = smi;
				}
			}
			
			if (withComment) {
				// 홀드 결합 있을 경우 주석처리 재계산
				logs = [];
				let oi = 0;
				let ni = 0;
				
				while ((oi < originBody.length) && (ni < main.body.length)) {
					if (originBody[oi].start == main.body[ni].start) {
						if (originBody[oi].text == main.body[ni].text) {
							oi++;
							ni++;
							continue;
						} else if (originBody[oi].isEmpty() && main.body[ni].isEmpty()) {
							// 파트 구분 등을 위해 의도적으로 &nbsp; 2개 넣거나 한 경우가 있음
							// 결합 결과가 아닌 원본대로 넣어, 불필요한 주석 생성 방지
							main.body[ni].text = originBody[oi].text;
							oi++;
							ni++;
							continue;
						} else if (originBody[oi].text.startsWith("<!--")) {
							const commentEnd = originBody[oi].text.indexOf("-->\n");
							if (commentEnd > 4 && originBody[oi].text.substring(commentEnd + 4) == main.body[ni].text) {
								// 주석 때문에 다르게 나온 거면 원본대로 넣어, 불필요한 주석 생성 방지 
								main.body[ni].text = originBody[oi].text;
								oi++;
								ni++;
								continue;
							}
						}
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
		if (withComment) {
			result[0] = main.toTxt();
			for (let i = 1; i < result.length; i++) {
				if (result[i].length == 0) {
					result.splice(i--, 1);
				}
			}
			return result.join("\n");
			
		} else {
			for (let i = 0; i < main.body.length; i++) {
				main.body[i].text = main.body[i].text.split("\n").join("");
			}
			return main.toTxt();
		}
	}
}
$(() => {
	if (window.SmiEditor) {
		TIDs[5] = Subtitle.Smi.TypeParser[4];
		TIDs[6] = Subtitle.Smi.TypeParser[5];
		TIDs[7] = Subtitle.Smi.TypeParser[6];
	}
});