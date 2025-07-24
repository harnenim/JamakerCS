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
	
	// 다중 결합에 대해 중간 싱크 처리를 위한 부분
	SyncType.combinedNormal = 4;
	SyncType.combinedFrame  = 5;
	SyncType.combinedInner  = 6;
	Smi.TypeParser[SyncType.combinedNormal] = "\t\t";
	Smi.TypeParser[SyncType.combinedFrame ] = " \t\t";
	Smi.TypeParser[SyncType.combinedInner ] = "\t\t\t";
	Smi._getSyncType = Smi.getSyncType;
	Smi.getSyncType = function(syncLine) {
		if (syncLine.endsWith("\t\t>")) {
			switch (syncLine[syncLine.length - 4]) {
				case '\t':
					return SyncType.combinedInner;
				case ' ':
					return SyncType.combinedFrame;
			}
			return SyncType.combinedNormal;
		}
		return Smi._getSyncType(syncLine);
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
	function isClear(attr, br=null) {
		// 공백문자가 들어가도 무관한 속성
		return !attr.u
		    && !attr.s
		    && (br ? (br.fs == attr.fs) : !attr.fs)
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
			const attr = new Attr(attrs[i], attrs[i].text.split("&nbsp;").join(" "), true);
			attr.fs = ((withFs && attr.fs) ? attr.fs : Combine.defaultSize);
			if (attr.fn && attr.fn != "맑은 고딕") {
				// 팟플레이어 폰트 크기 보정
				attr.fs = attr.fs * 586 / 456;
			}
			attr.furigana = null;
			cAttrs.push(attr);
		}
		const width = checker.html(Smi.fromAttr(cAttrs, Combine.defaultSize).split("\n").join("<br>")).width();
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
	
	function getSyncLine(sync, type) {
		let line = null;
		if (window.SmiEditor) {
			line = SmiEditor.makeSyncLine(sync, type + 1);
		} else {
			line = "<Sync Start=" + sync + "><P Class=KRCC" + Smi.TypeParser[type] + ">";
		}
		return line;
	}
	
	function parse(text, checker) {
		const smis = new SmiFile(text).body;
		smis.push(new Smi(99999999, SyncType.normal, "&nbsp;"));
						
		const syncs = [];
		let last = null;
		for (let i = 0; i < smis.length; i++) {
			const smi = smis[i];
			if (last) { // 이전 것 남아있으면 종료싱크 부여
				last[ETIME] = smi.start;
				last[ETYPE] = smi.syncType;
				last = null;
			}
			if (smi.text.startsWith("<!--")) {
				// 결합 전 주석 제거
				let commentEnd = smi.text.indexOf("-->\n");
				if (commentEnd > 0) {
					smi.text = smi.text.substring(commentEnd + 4);
				}
			}
			if (smi.text.split("&nbsp;").join("").trim()) {
				const lineCount = smi.text.split(/<br>/gi).length;
					
				const attrs = smi.toAttrs(false);
				const defaultWidth = getAttrWidth(attrs, checker);
				const sizedWidth   = getAttrWidth(attrs, checker, true);
				syncs.push(last = [smi.start, smi.syncType, 0, 0, smi.text, attrs, lineCount, defaultWidth, sizedWidth]);
			}
		}
		return syncs;
	}
	
	Combine.combine = (inputUpper, inputLower) => {
		// 결합 로직 돌아갈 때 문법 하이라이트가 있으면 성능 저하됨
		// ... 지금은 개선해서 큰 저하 없을지도?
		const hljs = $(".hljs").hide();
		const checker = getChecker();
		const upperSyncs = parse(inputUpper, checker);
		const lowerSyncs = parse(inputLower, checker);
		
		const groups = [];
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
						&& (   (   (us[STYPE] == SyncType.inner) // 중간 싱크
						        || (us[STYPE] == SyncType.combinedInner)
						       )
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
						&& (   (   (ls[STYPE] == SyncType.inner) // 중간 싱크
						        || (ls[STYPE] == SyncType.combinedInner)
						       )
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
					if ((us[STYPE] == SyncType.inner) || (us[STYPE] == SyncType.combinedInner)
					 || (ls[STYPE] == SyncType.inner) || (ls[STYPE] == SyncType.combinedInner)) {
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
						if (LOG) {
							console.log(sync);
						}
						
						// 전체가 기본보다 작은 글씨로 감싸여 있을 경우
						// 과도한 줄바꿈 크기가 생기지 않도록 공백문자도 작게 넣어주기
						let maxFs = 0;
						for (let k = 0; k < attrs.length; k++) {
							const attr = attrs[k];
							if (attr.text) {
								if (!attr.text.split("　").join("").split("​").join("").trim()) {
									continue;
								}
								if (attr.fs) {
									maxFs = Math.max(maxFs, attr.fs);
								} else {
									maxFs = Combine.defaultSize;
									break;
								}
							}
						}
						
						let pad = "";
						if (sync[WIDTH] < group.maxWidth && sync[SIZED] < group.maxSized) {
							// 여백을 붙여서 제일 적절한 값 찾기
							if (withFontSize) {
								// 글씨 크기 적용했을 때 더 작아졌으면 이걸 기준으로 구함

								/*
								if (sync[WIDTH] > groupMaxWidth) {
									// 크기 조절 안 했을 때의 폭을 이미 넘어섰으면 작업 안 함
									if (LOG) console.log("width over");
									sync[TEXT] = Smi.fromAttr(attrs).split("\n").join("<br>");
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
							const br = new Attr(null, "\n");
							
							// 좌우 여백 붙이기 전 줄 단위로 분리 및 기존 Zero-Width-Space 삭제
							let wasClear = false;
							let trimedLine = { attrs: [], isEmpty: true };
							const trimedLines = [trimedLine];
							for (let k = 0; k < attrs.length; k++) {
								const attrText = attrs[k].text.split("​").join("");
								let attr = new Attr(attrs[k], attrText, true);
									
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
										wasClear = isClear(attr, br);
									} else {
										// 첫 줄바꿈 전에 내용 없으면 건너뜀
										wasClear = false;
									}
										
									if (trimedLine.isEmpty && attr.text.split("　").join("").trim().length) {
										trimedLine.isEmpty = isEmpty = false;
									}
										
									for (let l = 1; l < attrLines.length; l++) {
										attr = new Attr(attr, attrLines[l], true);
										const isEmptyAttr = (attr.text.split("​").join("").trim().length == 0);
										if ((l == attrLines.length - 1) && isEmptyAttr) {
											// 마지막 줄바꿈 후에 내용 없으면 건너뜀
											trimedLines.push(trimedLine = { attrs: [], isEmpty: true });
										} else {
											attr.splitted = wasClear; // 재결합 대상
											trimedLines.push(trimedLine = { attrs: [attr], isEmpty: isEmptyAttr });
											if (!isEmptyAttr) {
												isEmpty = false;
											}
										}
									}
										
								} else {
									if (attr.text) {
										trimedLine.attrs.push(attr);
									}
									wasClear = isClear(attr, br);
									if (trimedLine.isEmpty && attr.text.split("　").join("").trim().length) {
										trimedLine.isEmpty = isEmpty = false;
									}
								}
							}
							if (LOG) {
								console.log(attrs, trimedLines, isEmpty);
							}
							
							if (!isEmpty) {
								// 전체가 기본보다 작은 글씨로 감싸여 있을 경우
								// 과도한 줄바꿈 크기가 생기지 않도록 공백문자도 작게 넣어주기
								if (maxFs < Combine.defaultSize) {
									br.fs = maxFs;
								}
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
												if (isClear(attr, br)) {
													// 속성에 공백문자 포함
													if (attr.splitted) {
														// 재결합 대상
														padsAttrs.pop(); // 미리 추가한 줄바꿈 제거
														const lastAttr = padsAttrs.pop();
														attr = new Attr(attr, lastAttr.text + "\n​" + pad + attr.text + pad + "​", true);
														padsAttrs.push(attr);
													} else {
														attr = new Attr(attr, "​" + pad + attr.text + pad + "​", true);
														padsAttrs.push(attr);
													}
												} else {
													// 속성 밖에 공백문자 추가
													padsAttrs.push(new Attr(br, "​" + pad));
													padsAttrs.push(attr);
													padsAttrs.push(new Attr(br, pad + "​"));
												}
													
											} else {
												// 해당 줄에 속성이 여러 개일 때
													
												// 처음 속성
												let attr = trimedLine.attrs[0];
												if (isClear(attr, br)) {
													// 속성에 공백문자 포함
													if (attr.splitted) {
														// 재결합 대상
														padsAttrs.pop(); // 미리 추가한 줄바꿈 제거
														const lastAttr = padsAttrs.pop();
														attr = new Attr(attr, lastAttr.text + "\n​" + pad + attr.text, true);
														padsAttrs.push(attr);
													} else {
														attr = new Attr(attr, "​" + pad + attr.text, true);
														padsAttrs.push(attr);
													}
												} else {
													// 속성 밖에 공백문자 추가
													padsAttrs.push(new Attr(br, "​" + pad));
													padsAttrs.push(attr);
												}
													
												// 중간 속성은 그대로 넣음
												for (let k = 1; k < trimedLine.attrs.length - 1; k++) {
													padsAttrs.push(trimedLine.attrs[k]);
												}
													
												// 마지막 속성
												attr = trimedLine.attrs[trimedLine.attrs.length - 1];
												if (isClear(attr, br)) {
													// 속성에 공백문자 포함
													padsAttrs.push(new Attr(attr, attr.text + pad + "​", true));
												} else {
													// 속성 밖에 공백문자 포함
													padsAttrs.push(attr);
													padsAttrs.push(new Attr(br, pad + "​"));
												}
											}
										}
									}
									if (closeAttr) {
										// 종료 태그 붙이기
										padsAttrs.push(closeAttr);
									} else {
										padsAttrs.push(new Attr()); // 종료태그 필수
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
							
							sync[TEXT] = Smi.fromAttr(padsAttrs).split("\n").join("<br>");
								
						} else {
							sync[TEXT] = Smi.fromAttr(attrs).split("\n").join("<br>");
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

if (SmiFile) {
	SmiFile.textToHolds = (text) => {
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
		const normalized = new SmiFile(holds[0].text).antiNormalize();
		normalized[0].pos = 0;
		normalized[0].name = "메인";
		holds = normalized.concat(holds.slice(1));
		if (holds[0].isWithSplit()) {
			// 대사 사이 1프레임 공백 싱크 제거
			const body = holds[0].body;
			for (let i = 1; i < body.length; i++) {
				const smi = body[i];
				if (smi.syncType == SyncType.split) {
					body[i - 1].text = smi.text;
					body.splice(i, 1);
				}
			}
		}
		{	// 메인 홀드 ASS 변환용 스타일: footer 확인
			let footer = holds[0].footer.split("\n<!-- Style\n"); // <!-- Style이 두 번 있는 경우는 오류로, 상정하지 않음
			if (footer.length > 1) {
				const styleEnd = footer[1].indexOf("\n-->");
				if (styleEnd > 0) {
					holds[0].style = SmiFile.parseStyle(footer[1].substring(0, styleEnd).trim());
					footer = footer[0] + footer[1].substring(styleEnd + 4); // 뒤에 추가로 주석 남아있을 수 있음
				} else {
					footer = footer[0];
				}
			} else {
				footer = footer[0];
			}
			footer = footer.split("\n<!-- ASS\n"); // <!-- ASS가 두 번 있는 경우는 오류로, 상정하지 않음
			if (footer.length > 1) {
				const assEnd = footer[1].indexOf("\n-->");
				if (assEnd > 0) {
					holds[0].ass = footer[1].substring(0, assEnd).trim();
					footer = footer[0] + footer[1].substring(assEnd + 4); // 뒤에 추가로 주석 남아있을 수 있음
				} else {
					footer = footer[0];
				}
			} else {
				footer = footer[0];
			}
			
			holds[0].footer = footer;
		}
		holds[0].text = holds[0].toText().trim();
		
		for (let i = 1; i < normalized.length; i++) {
			// 내포 홀드는 ASS 추가 스크립트 영역 없음
			// ... 그냥 홀드마다가 아니라 메인 홀드 주석에 몰아주는 게 나을 듯?
			
			// 내포된 홀드는 종료싱크가 빠졌을 수 있음
			const hold = holds[i];
			if (hold.next && !hold.body[hold.body.length - 1].isEmpty()) {
				hold.body.push(new Smi(hold.next.start, hold.next.syncType, "&nbsp;"));
			}
			holds[i].text = hold.toText().trim();
			
			// 출력 선택 확인
			const names = holds[i].name.split("|");
			let output = 3;
			if (names.length > 1) {
				holds[i].name = names[0];
				if (names[1] == "X") {
					// 처음에 방향성을 잘못 잡음...
					output = 1;
				} else {
					output = Number(names[1]);
				}
			}
			const style = JSON.parse(JSON.stringify(DefaultStyle));
			style.output = output;
			holds[i].style = style;
		}
		for (let i = normalized.length; i < holds.length; i++) {
			const hold = new SmiFile(holds[i].text).antiNormalize()[0];
			let text = (holds[i].text = hold.toText().trim());
			let lines = text.split("\n");

			// ASS 출력 제외 확인
			const names = holds[i].name.split("|");
			let output = 3;
			if (names.length > 1) {
				holds[i].name = names[0];
				if (names[1] == "X") {
					// 처음에 방향성을 잘못 잡음...
					output = 1;
				} else {
					output = Number(names[1]);
				}
			}
			// 홀드 스타일: header 확인
			{	let style = null;
				if ((lines[0] == "<!-- Style" || lines[0] == "<!-- Preset") && lines[2] == "-->") {
					style = holds[i].style = SmiFile.parseStyle(lines[1].trim());
					text = (lines = lines.slice(3)).join("\n");
				} else {
					style = JSON.parse(JSON.stringify(DefaultStyle));
				}
				style.output = output;
				holds[i].style = style;
			}
			/*
			if ((lines[0] == "<!-- ASS")) {
				for (let j = 1; j < lines.length; j++) {
					if (lines[j] == "-->") {
						holds[i].ass = lines.slice(1, j).join("\n");
						text = (lines = lines.slice(j + 1)).join("\n");
						break;
					}
				}
			}
			*/
			holds[i].text = text;
		}
		return holds;
	}
	
	// TODO: <BODY split> 형식일 때 동작 - 기능이 필요할까...? 일단 개발 보류
	SmiFile.prototype.isWithSplit = function() {
		const match = /<body( [^>]*)*>/gi.exec(this.header);
		return match && (match[0].indexOf("split") > 0);
	}
	SmiFile.holdsToTexts = (origHolds, withNormalize=true, withCombine=true, withComment=true, fps=23.976) => {
		const result = [];
		let logs = [];
		let originBody = [];
		
		// .text 동기화 안 끝났을 가능성 고려, 현재 값 다시 불러옴
		const main = new SmiFile(origHolds[0].input ? origHolds[0].input.val() : origHolds[0].text);
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
						const splitted = new Smi((smi.start + add), SyncType.split, (before = smi.text));
						body.splice(++i, 0, splitted);
						smi.text = "&nbsp;";
						/*
					} else if (smi.syncType == SyncType.frame) { // TODO: 설정으로 on/off? <BODY> 태그 플래그로?
						// 대사 사이 싱크가 화면 싱크일 때
						const splitted = new Smi((smi.start + add), SyncType.split, (before = smi.text));
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
			const style = SmiFile.toSaveStyle(origHolds[0].style);
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
				hold.exportName = hold.name;
				if (hold.style) {
					const style = SmiFile.toSaveStyle(hold.style);
					if (style) {
						text = "<!-- Style\n" + style + "\n-->\n" + text;
					}
					if (hold.style.output != 3) {
						// 출력 선택
						hold.exportName += "|" + hold.style.output;
					}
				}
				result[hold.resultIndex = (hi + 1)] = "<!-- Hold=" + hold.pos + "|" + hold.exportName + "\n" + text.split("<").join("<​").split(">").join("​>") + "\n-->";
				hold.imported = false;
				hold.afterMain = false;
				
				// 홀드 위치가 1 또는 -1인 경우에만 내포 홀드 여부 확인
				if ((hold.pos > 1) || (hold.pos < -1)) {
					continue;
				}
				
				if (hold.style) {
					// SMI 출력 없으면 내포 홀드 처리하지 않음
					if (!(hold.style.output & 0x01)) {
						// 홀드 결합 대상에선 제외되도록 완료 처리
						hold.imported = true;
						continue;
					}
					// 스타일 적용 필요하면 내포 홀드 처리하지 않음
					style = SmiFile.toSaveStyle(hold.style);
					if (style) {
						//text = "<!-- Style\n" + style + "\n-->\n" + text;
						continue;
					}
				}
				
				// 내용물 없으면 내포 홀드 아님
				const holdBody = new SmiFile(holdText).body;
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
					
				} else {
					// 메인 홀드가 비어있음
					hold.afterMain = true;
					
					if (withCombine) {
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
					importBody[0].text = "<!-- End=" + holdEnd + "\nHold=" + hold.pos + "|" + hold.exportName + "\n-->\n" + importBody[0].text;
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
					const style = (typeof hold.style == "string") ? hold.style : SmiFile.toSaveStyle(hold.style);
					if (style) {
						text = "<!-- Style\n" + style + "\n-->\n" + text;
					}
				}
				const smi = holdSmis[hi] = new SmiFile(text);
				if (withNormalize) {
					smi.normalize(false);
				}
				{	// 실질 내용물 없으면 공백으로 변환 후 처리
					for (let i = 0; i < smi.body.length; i++) {
						let syncText = smi.body[i].text;
						if (syncText.startsWith("<!--")) {
							const endComment = syncText.indexOf("-->");
							if (endComment > 0) {
								syncText = syncText.substring(endComment + 3).trim();
							}
						}
						if (syncText.split("&nbsp;").join("").trim().length == 0) {
							smi.body[i].text = "&nbsp;";
						}
					}
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
						// 위쪽 내포 홀드에서 처리돼서 여기 올 일 없어졌을 듯 <- 스타일 넣으면서 생겼을 듯?
						main.body = main.body.concat(smi.body);
						continue;
					}
					if (main.body[mainBegin].isEmpty()) {
						mainBegin++;
					} else {
						// 중간 싱크는 함께 결합돼야 함
						while (mainBegin >= 0) {
							if ((main.body[mainBegin].syncType == SyncType.inner)
								|| (main.body[mainBegin].syncType == SyncType.combinedNormal)
								|| (main.body[mainBegin].syncType == SyncType.combinedFrame)
								|| (main.body[mainBegin].syncType == SyncType.combinedInner)
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
						// 위쪽 내포 홀드에서 처리돼서 여기 올 일 없어졌을 듯 <- 스타일 넣으면서 생겼을 듯?
						main.body = smi.body.concat(main.body);
						continue;
					}
				}

				// 홀드 결합
				const sliced = new SmiFile();
				sliced.body = main.body.slice(mainBegin, mainEnd);

				const slicedText = sliced.toText().trim();
				const combineText = smi.toText().trim();
				const combined = new SmiFile(((hold.pos < 0) ? Combine.combine(slicedText, combineText) : Combine.combine(combineText, slicedText)).join("\n"));
				// 원칙상 normalized.result를 다뤄야 맞을 것 같지만...
				main.body = main.body.slice(0, mainBegin).concat(combined.body).concat(main.body.slice(mainEnd));
			}

			{	// 최종본에서 그룹 단위 윗줄 채워주기
				let begin = 0;
				let maxLine = 0;
				for (let i = 0; i < main.body.length; i++) {
					const smi = main.body[i];
					const line = smi.text.split("<br>").length;
					if (smi.syncType == SyncType.combinedNormal
					 || smi.syncType == SyncType.combinedFrame
					 || smi.syncType == SyncType.combinedInner) {
						maxLine = Math.max(maxLine, line);

					} else {
						const end = i;
						if (end - begin > 1) {
							for (let j = begin; j < end; j++) {
								const item = main.body[j];
								const add = maxLine - item.text.split("<br>").length;
								for (let k = 0; k < add; k++) {
									item.text = "<b>　</b><br>" + item.text;
								}
							}
						}

						maxLine = line;
						begin = i;
					}
				}
			}

			{	// 임시 중간 싱크 정상화
				for (let i = 0; i < main.body.length; i++) {
					const smi = main.body[i];
					if (smi.syncType == SyncType.combinedNormal) {
						smi.syncType = SyncType.normal;
					} else if (smi.syncType == SyncType.combinedFrame) {
						smi.syncType = SyncType.frame;
					} else if (smi.syncType == SyncType.combinedInner) {
						smi.syncType = SyncType.inner;
					}
				}
			}
			
			// 프레임 단위로 볼 때 싱크 뭉친 부분 확인
			if (Subtitle.video.fs.length) {
				const fs = Subtitle.video.fs;
				let next = null;
				for (let i = main.body.length - 1; i > 0; i--) {
					const smi = main.body[i];
					if (next) {
						if (next.syncType == SyncType.frame) {
							// 1프레임 미만 중간싱크로 인해 화면싱크가 밀리는지 확인
							const startIndex = Subtitle.findSyncIndex(smi .start, fs);
							const endIndex   = Subtitle.findSyncIndex(next.start, fs);
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
				
				const origin = new SmiFile();
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
					let comment = origin.toText().trim();
					
					main.body[log.to[0]].text = "<!-- End=" + log.end + "\n" + (comment.split("<").join("<​").split(">").join("​>")) + "\n-->\n" + main.body[log.to[0]].text;
				}
			}
		}
		if (withComment) {
			result[0] = main.toText();
			for (let i = 1; i < result.length; i++) {
				if (result[i].length == 0) {
					result.splice(i--, 1);
				}
			}
			return result;
			
		} else {
			for (let i = 0; i < main.body.length; i++) {
				main.body[i].text = main.body[i].text.split("\n").join("");
			}
			return [main.toText()];
		}
	}
	SmiFile.holdsToText = (origHolds, withNormalize=true, withCombine=true, withComment=true, fps=23.976) => {
		return SmiFile.holdsToTexts(origHolds, withNormalize, withCombine, withComment, fps).join("\n");
	}
}
$(() => {
	if (window.SmiEditor) {
		TIDs[5] = Smi.TypeParser[4];
		TIDs[6] = Smi.TypeParser[5];
		TIDs[7] = Smi.TypeParser[6];
	}
});