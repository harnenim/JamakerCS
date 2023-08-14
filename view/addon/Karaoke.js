var DEFAULT_LIST = ("2023.03.27"
	+ "\n五里霧中1112\n混凝土006\n春夏冬004\n真っ赤111\n夜明け111\n真実22\n往来22\n並行22\n曖昧22\n頂戴22\n血管22\n抑制22\n運命22\n衝動22\n逃亡22\n毎日22"
	+ "\n窮屈22\n条件22\n後悔22\n稲妻22\n朝食22\n東京22\n体温22\n彩り31\n着信22\n完成22\n自覚12\n自分12\n無情12\n期待12\n未来12\n脳裏21\n深紅21\n笑顔12"
	+ "\n記憶12\n刹那21\n時計12\n形見21\n季節12\n言葉21\n降下21\n間違12\n無力12\n子供12\n時代12\n彷徨03\n欠片03\n剥離21\n剝離21\n明日03\n二人03\n一人03"
	+ "\n物足21\n表裏21\n都合12\n矛盾12\n夕日21\n2人03\n縁取21\n仕事12\n速度21\n化粧12\n貴方03\n光る21\n光り21\n光っ21\n見上11\n風邪11\n永久11\n目指11"
	+ "\n魂4\n諦3\n疑3\n桜3\n滴3\n呪3\n綻3\n隣3\n体3\n囁3\n私3\n絆3\n貫3\n争3\n嵐3\n表3\n光3\n儚3\n淚3\n形3\n欺3\n誘3\n印3\n鎧3\n喜3\n輝3\n失3\n必3\n心3"
	+ "\n瞳3\n扉3\n幸3\n涙3\n姿3\n漂3\n働3\n命3\n抗3\n炎3\n証3\n操3\n翼3\n鞄3\n昔3\n獣3\n例2\n荒2\n燦2\n回2\n０2\n漠2\n迫2\n方2\n箱2\n服2\n十2\n指2\n朝2"
	+ "\n他2\n叩2\n耳2\n交2\n熱2\n明2\n脈2\n逸2\n解2\n絡2\n線2\n条2\n歪2\n璧2\n恐2\n震2\n探2\n弄2\n像2\n共2\n犯2\n互2\n遊2\n広2\n歩2\n試2\n委2\n能2\n潰2"
	+ "\n臭2\n匂2\n癒2\n離2\n鮮2\n紅2\n残2\n冷2\n仄2\n天2\n粉2\n痛2\n握2\n同2\n観2\n傍2\n語2\n作2\n通2\n届2\n戻2\n零2\n麗2\n州2\n翔2\n島2\n叱2\n親2\n両2"
	+ "\n頬2\n頰2\n眺2\n電2\n校2\n転2\n然2\n喧2\n仲2\n休2\n密2\n冒2\n楽2\n間2\n嬉2\n本2\n帰2\n声2\n点2\n忘2\n将2\n波2\n病2\n臆2\n先2\n足2\n伝2\n潜2\n喉2"
	+ "\n眩2\n七2\n橋2\n近2\n少2\n影2\n塞2\n繋2\n側2\n映2\n笑2\n飾2\n室2\n教2\n狭2\n小2\n潮2\n淡2\n肌2\n強2\n束2\n約2\n寒2\n暗2\n独2\n祈2\n前2\n柔2\n上2"
	+ "\n寞2\n凍2\n嘆2\n雪2\n屑2\n檀2\n黑2\n赤2\n誰2\n運2\n想2\n守2\n数2\n鳥2\n鐘2\n海2\n沈2\n命2\n殺2\n永2\n崩2\n花2\n溢2\n豊2\n悲2\n思2\n信2\n法2\n惑2"
	+ "\n達2\n昼2\n白2\n謎2\n夏2\n顔2\n裏2\n違2\n屈2\n今2\n険2\n八2\n闇2\n走2\n始2\n街2\n夜2\n窓2\n隠2\n中2\n殻2\n軋2\n実2\n現2\n愚2\n外2\n動2\n秒2\n最2"
	+ "\n黙2\n叫2\n逆2\n界2\n反2\n的2\n望2\n絶2\n虹2\n跡2\n描2\n願2\n奥2\n息2\n遥2\n答2\n片2\n人2\n苦2\n何2\n畏2\n眠2\n神2\n感2\n怖2\n汚2\n一2\n返2\n鈍2"
	+ "\n石2\n胸2\n瞬2\n響2\n恵2\n誇2\n音2\n船2\n舟2\n流2\n渇2\n乾2\n青2\n開2\n億2\n遺2\n星2\n完2\n後2\n高2\n憂2\n全2\n重2\n露2\n由2\n愛2\n色2\n灰2\n遠2"
	+ "\n年2\n千2\n迷2\n森2\n深2\n霧2\n粕2\n優2\n擦2\n還2\n寂2\n静2\n歌2\n夢2\n恋2\n壊2\n登2\n奏2\n律2\n旋2\n傷2\n物2\n長2\n月2\n刻2\n大2\n救2\n君2\n洞2"
	+ "\n空2\n劇2\n俺2\n僕2\n勇2\n道2\n奪2\n風2\n嘘2\n脳2\n放2\n痕2\n戦2\n掴2\n結2\n紐2\n叶2\n頼2\n続2\n進2\n筋2\n暴2\n抱2\n招2\n確2\n辿2\n布2\n甘2\n翳2"
	+ "\n覗2\n拭2\n正2\n悪2\n瓶2\n壁2\n直2\n嫌2\n話2\n塩2\n盾2\n黒2\n選2\n勝2\n12\n憎2\n妬2\n認2\n為2\n弱2\n虫2\n許2\n雨2\n酷2\n煽2\n砕2\n堪2\n針2"
);

var kanjiList = [];
function refreshKanji() {
	kanjiList = [];
	var list = savedKanjiList.split("\n");
	for (var i = 1; i < list.length; i++) { // 첫 줄은 기본값 버전이므로 제외
		var item = list[i];
		var word = "", mora = 0;
		if (item.length % 2 == 0) {
			var div = item.length / 2;
			mora = item.substring(div);
			if (isFinite(mora)) {
				word = item.substring(0, div);
			} else {
				mora = "";
			}
		}
		if (word) {
			kanjiList.push([word, mora]);
		}
	}
	$("#inputKanji").val(savedKanjiList.substring(savedKanjiList.indexOf("\n") + 1)); // 첫 줄은 기본값 버전이므로 제외
}
function sortFunc(a, b) {
	if (a[1].length < b[1].length) {
		return 1;
	} else if (a[1].length > b[1].length) {
		return -1;
	}
	return (a[2] < b[2]) ? 1 : -1;
}

windowName = "addon";

//var savedKanjiList = localStorage.getItem("kanjiList");
var KANJI_FILE = "Karaoke.txt";
var savedKanjiList = "";

function afterLoadKanji(text) {
	if (!text) {
		// 최초 실행
		saveKanjiList(savedKanjiList = DEFAULT_LIST);
		refreshKanji();
		
	} else {
		// 버전 체크
		var curr = savedKanjiList.split("\n");
		var dflt = DEFAULT_LIST  .split("\n");
		if (curr[0] != dflt[0]) { // 버전이 다를 경우
			var version = dflt[0];
			curr = curr.slice(1);
			dflt = dflt.slice(1);

			var exists = {}; // 현재 설정에 있는 것 체크
			for (var i = 0; i < curr.length; i++) {
				exists[curr[i].substring(0, curr[i].length/2)] = i;
			}
			for (var i = 0; i < dflt.length; i++) {
				var item = exists[dflt[i].substring(0, dflt[i].length/2)];
				if (item) {
					// 이미 존재하면 기본값으로 덮어쓰려고 했는데
					// 현재 설정 유지하는 게 나을 듯
				} else {
					curr.push(dflt[i]); // 현재 설정에 기본값 추가
				}
			}
			curr = curr.sort(function sortFunc(a, b) {
				if (a.length < b.length) {
					return 1;
				} else if (a.length > b.length) {
					return -1;
				}
				return (a.substring(a.length/2) < b.substring(b.length/2)) ? 1 : -1;
			});
			savedKanjiList = version + "\n" + curr.join("\n");
			saveKanjiList();
		}
		refreshKanji();
	}
}
//afterReadSetting(savedKanjiList);

function saveKanjiList() {
	//localStorage.setItem("kanjiList", savedKanjiList);
	saveAddonSetting(KANJI_FILE, savedKanjiList);
}

var gana
	= "あいうえお" + "アイウエオ"
	+ "かきくけこ" + "カキクケコ"
	+ "がぎぐげご" + "ガギグゲゴ"
	+ "さしすせそ" + "サシスセソ"
	+ "ざじずぜぞ" + "ザジズゼゾ"
	+ "たちつてと" + "タチツテト"
	+ "だぢづでど" + "ダヂヅデド"
	+ "なにぬねの" + "ナニヌネノ"
	+ "はひふへほ" + "ハヒフヘホ"
	+ "ばびぶべぼ" + "バビブベボ"
	+ "ぱぴぷぺぽ" + "パピプペポ"
	+ "まみむめも" + "マミムメモ"
	+ "や　ゆ　よ" + "ヤ　ユ　ヨ"
	+ "らりるれろ" + "ラリルレロ"
	+ "わゐ　ゑを" + "ワヰ　ヱヲ"
	+ "　　　　　" + "　　ヴ　　"
	+ "ぁぃぅぇぉ" + "ァィゥェォ"
	+ "ゃ　ゅ　ょ" + "ャ　ュ　ョ"
	+ "ゎ　　　　" + "ヮ　　　　"
;
var vws = {};
for (var i = 0; i < gana.length; i++) {
	var vw = [];
	switch (Math.floor(i / 10)) {
		case  0: vw[0] = '';   break;
		case  1: vw[0] = 'k';  break;
		case  2: vw[0] = 'g';  break;
		case  3: vw[0] = 's';  break;
		case  4: vw[0] = 'z';  break;
		case  5: vw[0] = 't';  break;
		case  6: vw[0] = 'd';  break;
		case  7: vw[0] = 'n';  break;
		case  8: vw[0] = 'h';  break;
		case  9: vw[0] = 'b';  break;
		case 10: vw[0] = 'p';  break;
		case 11: vw[0] = 'm';  break;
		case 12: vw[0] = 'y';  break;
		case 13: vw[0] = 'r';  break;
		case 14: vw[0] = 'w';  break;
		case 15: vw[0] = 'v';  break;
		case 16: vw[0] = 'l';  break;
		case 17: vw[0] = 'ly'; break;
		case 18: vw[0] = 'lw'; break;
		case 19: vw[0] = '';   break;
	}
	switch (i % 5) {
		case 0: vw[1] = 'a'; break;
		case 1: vw[1] = 'i'; break;
		case 2: vw[1] = 'u'; break;
		case 3: vw[1] = 'e'; break;
		case 4: vw[1] = 'o'; break;
	}
	vws[gana[i]] = vw;
}

$(function() {
	loadAddonSetting(KANJI_FILE, function(text) {
		afterLoadKanji(savedKanjiList = text);
	});

	var inputLyrics = $("#inputLyrics");
	var inputDivider = $("#inputDivider");
	
	var inputOrig = $("#inputOrig");
	var inputRead = $("#inputRead");
	var inputTran = $("#inputTran");

	var formEditLine = $("#formEditLine");
	var inputLineO = $("#inputLineO");
	var inputLineR = $("#inputLineR");
	var inputLineT = $("#inputLineT");
	
	var preview    = $("#preview");
	var formDesign = $("#formDesign");
	var output     = $("#output");
	var result = [];
	
	var inputOColorFrom = $("#inputOColorFrom");
	var inputOColorTo   = $("#inputOColorTo"  );
	var inputRColorFrom = $("#inputRColorFrom");
	var inputRColorTo   = $("#inputRColorTo"  );
	var inputTColor     = $("#inputTColor"    );

	var btnOpenKanji = $("#btnOpenKanji");
	var formKanji = $("#formKanji");
	var inputKanji = $("#inputKanji"); // 첫 줄은 기본값 버전이므로 제외
	var btnApplyKanji = $("#btnApplyKanji");

	var lefts = [	null
		,	"  30%"
		,	" -30%"
		,	" -90%"
		,	"-140%"
	];
	var validates = [ null
		,	function() { return true; }
		,	function() { return true; }
		,	function() { return true; }
		,	function() { return true; }
	];
	var runs = [ null ];
	
	var step = 1;
	$("#total").on("click", ".button.active", function() {
		var newStep = $(this).data("step");
		if (newStep > step && !validates[step]()) {
			alert("입력값이 불완전합니다.");
			return;
		}
		step = newStep;
		
		$("#total").css("left", lefts[step]).find(".button").removeClass("hide").removeClass("active");
		$("input, textarea, button").attr("tabindex", -1);
		$("#page" + step).find(".button").addClass("hide");
		$("#page" + step).find("input, textarea, button").attr("tabindex", "");
		$("#page" + (step - 1)).find(".button").addClass("active");
		$("#page" + (step + 1)).find(".button").addClass("active");
		var run = runs[step];
		if (run) run();
	});
	
	{	// Step 1
		function run() {
			var lines = inputLyrics.val().trim().split("\n");
			var divider = Number(inputDivider.val());
			
			var lineGroups = [];
			var lineGroup = [];
			var emptyCount = 0;
			
			for (var i in lines) {
				var line = lines[i];
				if (line = line.trim()) {
					// 내용이 있는 줄
					if (emptyCount) {
						// 누적된 빈 라인 수에 따라 공백 라인 추가
						var emptyLines = Math.floor((emptyCount - 1) / divider);
						for (var j = 0; j < emptyLines; j++) {
							lineGroups.push([""]);
						}
					}
					lineGroup.push(line);
					emptyCount = 0;
					
				} else {
					// 내용이 없는 줄
					if (emptyCount++ && lineGroup.length) {
						// 빈 라인 카운트
						lineGroups.push(lineGroup);
						lineGroup = [];
					}
				}
			}
			if (lineGroup.length) {
				lineGroups.push(lineGroup);
			}
			
			var orig = [];
			var read = [];
			var tran = [];
			for (i in lineGroups) {
				var lineGroup = lineGroups[i];
				if (lineGroup.length >= 3) {
					// 3줄 이상: 원문/독음/번역
					orig.push(lineGroup[0]);
					read.push(lineGroup[1]);
					tran.push(lineGroup[2]);
				} else if (lineGroup.length == 2) {
					// 2줄: 원문/번역
					orig.push(lineGroup[0]);
					read.push(lineGroup[0]);
					tran.push(lineGroup[1]);
				} else if (lineGroup.length == 1) {
					// 1줄: 원문
					orig.push(lineGroup[0]);
					read.push(lineGroup[0]);
					tran.push(lineGroup[0]);
				}
			}
			inputOrig.val(orig.join("\n"));
			inputRead.val(read.join("\n"));
			inputTran.val(tran.join("\n"));
		}
		runs[1] = run;
		
		function runAfterCheck() {
			var c = checker = new Date();
			setTimeout(function() {
				if (c != checker) {
					return;
				}
				run();
			}, 1000);
		}
		
		var checker = null;
		inputLyrics.on("keyup", function() {
			runAfterCheck();
		});
	}
	
	{	// Step 2
		validates[2] = function() {
			// 원문/독음/번역 줄 개수가 같아야 진행 가능
			var o = inputOrig.val().trim().split("\n").length;
			var r = inputRead.val().trim().split("\n").length;
			var t = inputTran.val().trim().split("\n").length;
			return o == r && r == t;
		};
		
		function run() {
			if (!validates[2]()) {
				return;
			}
			
			var orig = inputOrig.val().trim().split("\n");
			var read = inputRead.val().trim().split("\n");
			var tran = inputTran.val().trim().split("\n");
			
			{	// Step 1 역방향 적용
				var lines = [];
				for (var i = 0; i < orig.length; i++) {
					var o = orig[i];
					var r = read[i];
					var t = tran[i];
					
					var line = o;
					if (o) {
						if (o != r) {
							line += "\n" + r;
							if (o != t) {
								line += "\n" + t;
							}
						}
						line += "\n";
					}
					lines.push(line);
				}
				var divider = Number(inputDivider.val());
				var n = "";
				for (var i = 0; i < divider; i++) {
					n += "\n";
				}
				inputLyrics.val(lines.join(n));
			}
			
			{	// Step 3 비우고 재생성
				var area = $("#page3 > div:first-child").empty();
				for (var i = 0; i < orig.length; i++) {
					var o = orig[i];
					var r = read[i];
					var t = tran[i];
					var line = $("<div>").addClass("line").addClass("line-"+i).data("line", i);
					refreshLine(line, o, r, t);
					area.append(line);
				}
			}
		}
		runs[2] = run;
		
		function runAfterCheck() {
			var c = checker = new Date();
			setTimeout(function() {
				if (c != checker) {
					return;
				}
				run();
			}, 1000);
		}
		
		var checker = null;
		$("#inputOrig, #inputRead, #inputTran").on("keyup", function() {
			runAfterCheck();
		});
	}
	
	function refreshLine(line, o, r, t) {
		var sumO = 0, sumR = 0;
		line.empty();
		
		// 최종 결과물: [[문자,모라(,입력란)],[문자,모라(,입력란)], ...]
		// ort: 1-원문, 2-원문/번역, 3-원문/독음/번역
		
		if (o == r) {
			// 원문=독음 → 음절 입력 필요 없음
			var oc = [];
			
			var oLine = $("<p>").text(o);
			for (var j = 0; j < o.length; j++) {
				if (o[j] == " " || o[j] == "　" || o[j] == "\t") {
					oc.push([o[j], 0]);
				} else {
					oc.push([o[j], 1]);
					oLine.append($("<input type='hidden' value='1'>"));
				}
			}
			line.data("oc", oc).data("rc", oc).append(oLine);
			
			line.data("tc", t);
			if (r == t) {
				line.data("ort", 1);
			} else {
				line.data("ort", 2).append($("<p>").text(t));
			}
			
		} else {
			{	// 원문
				var oc = [], begin, end;
				
				// 후리가나 음절 고정
				var nokori = o;
				while ((begin = nokori.indexOf('[')) >= 0) {
					end = nokori.indexOf(']', begin);
					if (end) {
						var d = nokori.indexOf('|');
						if (d) {
							// [..., ['[生命|いのち]',3,false], ...]
							oc.push(nokori.substring(0, begin));
							oc.push([[nokori.substring(begin+1, d), nokori.substring(d+1, end)], (end - d - 1), false]);
							nokori = nokori.substring(end + 1);
						}
					}
				}
				if (nokori) {
					oc.push(nokori);
				}
				
				// 한자 음절 프리셋 적용
				for (var j = 0; j < oc.length; j++) {
					// string: 후리가나 처리 안 되고 남은 것들
					if (typeof(nokori = oc[j]) == "string") {
						// 한자 음절 프리셋에서 검색
						for (var k = 0; k < kanjiList.length; k++) {
							var word = kanjiList[k][0];
							var index = nokori.indexOf(word);
							if (index >= 0) {
								// 春夏冬004 → [..., ['春',0,true],['夏',0,true],['冬',4,true], ...]
								var mora = kanjiList[k][1];
								var ock = [];
								ock.push(nokori.substring(0, index));
								for (var l = 0; l < word.length; l++) {
									ock.push([word[l], Number(mora[l]), true]);
								}
								ock.push(nokori.substring(index + word.length));
								oc = oc.slice(0, j).concat(ock).concat(oc.slice(j+1));
								j--;
								break;
							}
						}
					}
				}
				
				// 나머지 음절 처리
				for (var j = 0; j < oc.length; j++) {
					// string: 위에서 처리 안 되고 남은 것들
					if (typeof(nokori = oc[j]) == "string") {
						var ocj = [];
						for (var k = 0; k < nokori.length; k++) {
							var c = nokori[k];
							if (c == ' ' || c == '　' || c == '\t') {
								// 공백 문자 0 고정
								ocj.push([c, 0, false]);
								
							} else if (('a'<=c && c<='z') || ('A'<=c && c<='Z')) {
								// 알파벳일 경우 1 고정
								ocj.push([c, 1, false]);
								
							} else {
								// 가나 문자가 아닐 경우 음절 입력 지원
								var isGana = (
										('ぁ'<=c && c<='ん')
									||	('ァ'<=c && c<='ヶ')
								);
								if (isGana) {
									// 요음 처리
									if (k + 1 < nokori.length) {
										var n = nokori[k + 1];
										var vw = vws[n];
										if (vw) {
											if (vw[0] == 'ly') {
												if (vws[c][1] == 'i' && vw[1] != 'i') {
													c = c + n;
													k++;
												}
											} else if (vw[0] == 'lw') {
												if (vws[c][1] == 'u') {
													c = c + n;
													k++;
												}
												
											} else if (vw[0] == 'l' && vw[1] != 'u') {
												if (vws[c][1] == 'u' || (vws[c][1] == 'e' && vw[1] == 'i')) {
													c = c + n;
													k++;
												}
											}
										}
									}
									ocj.push([c, 1, false]);
								} else {
									// 가나 문자가 아닐 경우 음절 입력 지원
									ocj.push([c, 1, true]);
								}
							}
						}
						oc = oc.slice(0, j).concat(ocj).concat(oc.slice(j+1));
						j += ocj.length - 1;
					}
				}
				
				var tr0 = $("<tr>"), tr1 = $("<tr>");
				for (var j = 0; j < oc.length; j++) {
					var c = oc[j][0];
					if (typeof(c) != "string") {
						c = "<ruby>"+c[0]+"<rt>"+c[1]+"</rt></ruby>";
					}
					tr0.append($("<td>").append(c));
					if (oc[j][2]) { // 음절 입력
						tr1.append($("<td>").append($("<input type='text'>").val(oc[j][1])));
					} else {
						var len = oc[j][1];
						tr1.append($("<td>").text(len>1 ? len : len==1 ? "-" : " ").append($("<input type='hidden'>").val(len)));
					}
					sumO += oc[j][1];
				}
				tr0.append($("<td rowspan='2' class='sum'>").text(sumO));
				
				line.data("oc", oc).append($("<table>").append(tr0).append(tr1));
			}
			
			{	// 읽기
				var rc = [];
			
				var tr0 = $("<tr>"), tr1 = $("<tr>");
				
				var last = -1;
				var 가 = '가'.charCodeAt();
				var 아 = '아'.charCodeAt();
				var 잏 = '잏'.charCodeAt();
				var 힣 = '힣'.charCodeAt();
				for (var j = 0; j < r.length; j++) {
					var c = r[j];
					var cc = c.charCodeAt();
					tr0.append($("<td>").text(c));
					if (가<=cc && cc<=힣) {
						var batchim = (cc-가) % 28;
						if (아<=cc && cc<=잏) {
							// 초성 ㅇ
							if (batchim) {
								// 받침 존재: 1~2 입력 가능
								var cm = Math.floor(((cc-가) % 588) / 28);
								var len = (cm == 18) ? 1 : 2; // 모음 ㅡ일 경우: 거의 확실하게 1
								if (len == 2) {
									var lm = Math.floor(((last-가) % 588) / 28);
									len = (lm == cm) ? 1 : 2; // 앞 글자와 모음 같을 경우: 1일 가능성이 큼
								}
								rc.push([c, len]);
								tr1.append($("<td>").append($("<input type='text'>").val(len)));
								sumR += len;
								
							} else {
								// 받침 없음: 1 고정
								rc.push([c, 1]);
								tr1.append($("<td>").text("-").append($("<input type='hidden'>").val(1)));
								sumR++;
							}
						} else {
							// 초성 있음
							if (batchim) {
								// 받침 존재: 거의 확실하게 2
								rc.push([c, 2]);
								tr1.append($("<td>").append($("<input type='text'>").val(2)));
								sumR += 2;
							} else {
								// 받침 없으면 1 고정
								rc.push([c, 1]);
								tr1.append($("<td>").text("-").append($("<input type='hidden'>").val(1)));
								sumR++;
							}
						}
					} else {
						if (c == ' ' || c == '　' || c == '\t') {
							// 공백 문자 0 고정
							rc.push([c, 0]);
							tr1.append($("<td>").append("&nbsp;<input type='hidden' value='0' />"));
							
						} else if (('a'<=c && c<='z') || ('A'<=c && c<='Z')) {
							// 알파벳일 경우 1 고정
							rc.push([c, 1]);
							tr1.append($("<td>").text("-").append("<input type='hidden' value='1' />"));
							sumR++;
							
						} else {
							rc.push([c, 1]);
							tr1.append($("<td>").append($("<input type='text'>").val(1)));
							sumR++;
						}
					}
					last = cc;
				}
				tr0.append($("<td rowspan='2' class='sum'>").text(sumR));
				
				line.data("rc", rc).append($("<table>").append(tr0).append(tr1));
			}
			
			{	// 번역
				line.data("tc", t).append($("<p>").text(t));
			}
			
			line.data("ort", 3);
		}
		
		if (sumO == sumR) {
			line.removeClass("error");
		} else {
			line.addClass("error");
		}
	}
	
	// Step 3 해당 줄만 수정
	function openEditLine(i) {
		inputLineO.val(inputOrig.val().trim().split("\n")[i]);
		inputLineR.val(inputRead.val().trim().split("\n")[i]);
		inputLineT.val(inputTran.val().trim().split("\n")[i]);
		formEditLine.show().data("line", i);
	}
	function saveEditLine() {
		var i = formEditLine.hide().data("line");
		var orig = inputOrig.val().trim().split("\n");
		var read = inputRead.val().trim().split("\n");
		var tran = inputTran.val().trim().split("\n");
		
		// Step 3 해당 줄 갱신
		refreshLine($("#page3 .line-"+i)
			,	orig[i] = inputLineO.val()
			,	read[i] = inputLineR.val()
			,	tran[i] = inputLineT.val()
		);
		// Step 2 역방향 갱신
		inputOrig.val(orig.join("\n"));
		inputRead.val(read.join("\n"));
		inputTran.val(tran.join("\n"));
		// Step 4 결과물 재계산
		runs[3];
	}
	
	{	// Step 3
		validates[3] = function() {
			// 음절 수 맞춰졌어야 진행 가능
			return $("#page3 .line.error").length == 0;
		};
		
		function nokori(c, i) {
			var result = "";
			for (; i < c.length; i++) {
				if (typeof(c[i][0]) == "string") {
					result += c[i][0];
				} else {
					result += "["+c[i][0][0]+"|"+c[i][0][1]+"]";
				}
			}
			return result;
		}
		
		function run() {
			if (!validates[3]()) {
				return;
			}
			var orig = inputOrig.val().trim().split("\n");
			var read = inputRead.val().trim().split("\n");
			var tran = inputTran.val().trim().split("\n");
			
			result = [];
			
			$("#page3 .line").each(function() {
				var line = $(this);
				var ort = line.data("ort");
				var oc = line.data("oc");
				var rc = line.data("rc");
				var tc = line.data("tc");
				
				var length = 0;
				
				if (line.children().length == 1) {
					for (var i = 0; i < oc.length; i++) {
						length += oc[i][1];
					}
				} else {
					// oc, rc의 음절 값을 입력된 값으로 대체
					line.find("table:eq(0) input").each(function(i) {
						length += (oc[i][1] = Number($(this).val()));
					});
					line.find("table:eq(1) input").each(function(i) {
						rc[i][1] = Number($(this).val());
					});
				}
				
				// 음절 입력값 0일 때 묶음 처리
				// 예: [..., ['春',0,true],['夏',0,true],['冬',4,true], ...] → [..., ['春夏冬',4], ...]
				var noc = [], tmp = "";
				for (var i = 0; i < oc.length; i++) {
					var oci = oc[i];
					if (typeof(oci[0]) != "string") {
						if (tmp) {
							noc.push([tmp, 0]);
							tmp = "";
						}
						noc.push(oci);
						
					} else if (oci[1] || (oci[0]==' ' || oci[0]=='　' || oci[0]=='\t')) {
						noc.push([tmp+oci[0], oci[1]]);
						tmp = "";
						
					} else {
						tmp += oci[0];
					}
				}
				oc = noc;
				
				var or = [];
				var oi = 0, oCmp = "", oSum = 0, ri = 0, rCmp = "", rSum = 0;
				for (var i = 1; i <= length; i++) {
					var orio = [], orir = [];
					or.push([orio, orir]);
					
					{	// 원문
						// 활성색으로 넘어간 문자열
						if (oSum < i) {
							while ((oi < oc.length) && oSum + oc[oi][1] <= i) {
								if (typeof(oc[oi][0]) == "string") {
									oCmp += oc[oi][0];
								} else {
									oCmp += "["+oc[oi][0][0]+"|"+oc[oi][0][1]+"]";
								}
								oSum += oc[oi++][1];
							}
						}
						orio[0] = oCmp;
						
						if (oSum == i) {
							// 딱 맞을 경우 중간 단계 문자 없음
							orio[1] = null;
							orio[2] = nokori(oc, oi);
							
						} else {
							// 현재 문자열 색상 변화 진행도
							var gi = (i - oSum);
							var gc = oc[oi][0];
							var gl = oc[oi][1];
							
							orio[2] = "";
							
							if (gc.length == 1 || typeof(gc) != "string") {
								// 한 글자면 그대로 반영
								orio[1] = [gc, gi, gl]; // [문자(열), 진행도, 전체]
								
							} else {
								// 여러 글자 묶음이면 다시 문자별로 계산
								var r = gc.length * gi / gl;
								var r1 = r % 1;
								if (r1 == 0) {
									orio[0]+= gc.substring(0, r);
									orio[1] = null;
									orio[2] = gc.substring(r);
								} else {
									var j = Math.floor(r);
									orio[0]+= gc.substring(0, j);
									orio[1] = [gc.substring(j, j+1), r1, 1]; // [문자(열), 진행도, 전체]
									orio[2] = gc.substring(j+1);
								}
							}
							
							// 나머지 비활성색 문자열
							orio[2] += nokori(oc, oi+1);
						}
					}
					
					{	// 읽기
						// 활성색 문자열
						if (rSum < i) {
							while ((ri < rc.length) && rSum + rc[ri][1] <= i) {
								rCmp += rc[ri][0];
								rSum += rc[ri++][1];
							}
						}
						orir[0] = rCmp;

						if (rSum == i) {
							// 딱 맞을 경우 나머지 비활성색
							orir[1] = null;
							orir[2] = nokori(rc, ri);
							
						} else {
							// 현재 문자 색상 변화 진행도 및 나머지 비활성색
							orir[1] = [rc[ri][0], i-rSum, rc[ri][1]]; // [문자(열), 진행도, 전체]
							orir[2] = nokori(rc, ri+1);
						}
					}
				}
				result.push([ort, or, tc]);
			});
			
			runs[4]();
		}
		runs[3] = run;
		
		function runAfterCheck() {
			var c = checker = new Date();
			setTimeout(function() {
				if (c != checker) {
					return;
				}
				run();
			}, 1000);
		}
		
		var checker = null;
		$("#page3").on("keyup", "input", function() {
			// 입력 있을 경우 음절 수 재계산
			var input = $(this);
			var table = input.parents("table");
			var sum = 0;
			table.find("input").each(function() {
				sum += Number($(this).val());
			});
			table.find(".sum").text(sum);
			
			// 원문/독음 따로일 경우 음절 수 맞는지 확인
			var line = input.parents(".line");
			var tables = line.find("table");
			if (tables.length == 2) {
				if ($(tables[0]).find(".sum").text() == $(tables[1]).find(".sum").text()) {
					line.removeClass("error");
				} else {
					line.addClass("error");
				}
			}
			runAfterCheck();
		});
		
		$("#page3").on("click", ".sum", function() {
			// 해당 줄 텍스트 편집
			openEditLine($(this).parents(".line").data("line"));
		});
		formEditLine.on("click", "button", saveEditLine);
	}
	
	function hexToNumber(hex) {
		return parseInt(hex, 16);
	}
	function numberToHex(c) {
		if (0 <= c && c < 16) {
			return "0" + c.toString(16);
		} else if (16 <= c && c < 256) {
			return c.toString(16);
		}
		return "00";
	}
	function colorCode(color) {
		return "#" + numberToHex(color[0]) + numberToHex(color[1]) + numberToHex(color[2]);
	}
	/**
	 * line: [활성,중간,비활성]
	 * from: 비활성색
	 * to  : 활성색
	 */
	function coloring(line, from, to) {
		var result = ["","",""];
		
		// 활성, 비활성
		for (var i = 0; i <= 2; i += 2){
			if (line[i]) {
				var lineI = [], nokori = line[i];
				var begin, end;

				// 후리가나 그룹으로 배열 분리
				while ((begin = nokori.indexOf('[')) >= 0) {
					end = nokori.indexOf(']', begin);
					if (end) {
						var d = nokori.indexOf('|');
						if (d) {
							if (begin > 0) {
								lineI.push(nokori.substring(0, begin));
							}
							lineI.push([nokori.substring(begin+1, d), nokori.substring(d+1, end)]);
							nokori = nokori.substring(end + 1);
						}
					}
				}
				if (nokori) {
					lineI.push(nokori);
				}
				
				// 색상태그 입히기
				var color = colorCode(i==0 ? to : from);
				for (var j = 0; j < lineI.length; j++) {
					if (typeof(lineI[j]) == "string") {
						result[i] += "<FONT color=\""+color+"\">" + lineI[j] + "</FONT>";
					} else {
						result[i] += "<RUBY><FONT color=\""+color+"\">" + lineI[j][0] + "</FONT><RT><FONT color=\""+color+"\">" + lineI[j][1] + "</FONT></RT></RUBY>";
					}
				}
			}
		}
		
		// 중간 단계
		if (line[1]) {
			var gc = line[1][0];
			var gi = line[1][1];
			var gl = line[1][2];
			if (typeof(gc) == "string") {
				// 한 글자 문자면 바로 색상 처리
				var color = [
						Math.floor((from[0]*(gl-gi) + to[0]*gi) / gl)
					,	Math.floor((from[1]*(gl-gi) + to[1]*gi) / gl)
					,	Math.floor((from[2]*(gl-gi) + to[2]*gi) / gl)
				];
				result[1] = "<FONT color=\""+colorCode(color)+"\">" + gc + "</FONT>";
				
			} else {
				// RUBY 태그 처리
				var ruby = [];
				
				for (var i = 0; i < 2; i++) {
					var r = gc[i].length * gi / gl;
					var r1 = r % 1;
					if (r1 == 0) {
						//글자 수 딱 떨어질 때
						ruby[i] = "<FONT color=\""+colorCode(to  )+"\">" + gc[i].substring(0, r) + "</FONT>"
						        + "<FONT color=\""+colorCode(from)+"\">" + gc[i].substring(r   ) + "</FONT>";
						
					} else {
						// 중간 색이 필요할 때
						var color = [
								Math.floor(from[0] + (to[0] - from[0]) * r1)
							,	Math.floor(from[1] + (to[1] - from[1]) * r1)
							,	Math.floor(from[2] + (to[2] - from[2]) * r1)
						];
						var j = Math.floor(r);
						ruby[i] = "";
						if (j > 0) {
							ruby[i] += "<FONT color=\""+colorCode(to   )+"\">" + gc[i].substring(0, j  ) + "</FONT>";
						}
						{
							ruby[i] += "<FONT color=\""+colorCode(color)+"\">" + gc[i].substring(j, j+1) + "</FONT>";
						}
						if (j+1 < gc[i].length) {
							ruby[i] += "<FONT color=\""+colorCode(from )+"\">" + gc[i].substring(j+1   ) + "</FONT>";
						}
					}
				}
				
				result[1] = "<RUBY>" + ruby[0] + "<RT>" + ruby[1] + "</RT></RUBY>";
			}
		}
		return result.join("");
	}
	
	{	// Step 4
		function run() {
			var oColorFrom = inputOColorFrom.val();
			var oColorTo   = inputOColorTo  .val();
			var rColorFrom = inputRColorFrom.val();
			var rColorTo   = inputRColorTo  .val();
			var tColor     = inputTColor    .val();
			
			if (oColorFrom.length == 7) oColorFrom = oColorFrom.substring(1);
			if (oColorTo  .length == 7) oColorTo   = oColorTo  .substring(1);
			if (rColorFrom.length == 7) rColorFrom = rColorFrom.substring(1);
			if (rColorTo  .length == 7) rColorTo   = rColorTo  .substring(1);
			if (tColor    .length == 7) tColor     = tColor    .substring(1);
			if (oColorFrom.length != 6) return;
			if (oColorTo  .length != 6) return;
			if (rColorFrom.length != 6) return;
			if (rColorTo  .length != 6) return;
			if (tColor    .length != 6) return;
			oColorFrom = [hexToNumber(oColorFrom.substring(0,2)), hexToNumber(oColorFrom.substring(2,4)), hexToNumber(oColorFrom.substring(4,6))];
			oColorTo   = [hexToNumber(oColorTo  .substring(0,2)), hexToNumber(oColorTo  .substring(2,4)), hexToNumber(oColorTo  .substring(4,6))];
			rColorFrom = [hexToNumber(rColorFrom.substring(0,2)), hexToNumber(rColorFrom.substring(2,4)), hexToNumber(rColorFrom.substring(4,6))];
			rColorTo   = [hexToNumber(rColorTo  .substring(0,2)), hexToNumber(rColorTo  .substring(2,4)), hexToNumber(rColorTo  .substring(4,6))];
			tColor     = [hexToNumber(tColor    .substring(0,2)), hexToNumber(tColor    .substring(2,4)), hexToNumber(tColor    .substring(4,6))];
			
			var preset = "";
			formDesign.find("input[name=preset]").each(function() {
				var input = $(this);
				if (input.prop("checked")) {
					preset = input.val();
				}
			});

			var html = [];
			
			for (var i = 0; i < result.length; i++) {
				var line = result[i];
				var syncs = [];
				
				for (var j = 0; j < line[1].length; j++) {
					var sync = [];
					for (var k = 0; k < preset.length; k++) {
						switch (preset[k]) {
							case "O":
								sync.push(coloring(line[1][j][0], oColorFrom, oColorTo));
								break;
							case "R":
							case "r":
								if (line[0] > 2) {
									sync.push(coloring(line[1][j][1], rColorFrom, rColorTo));
								}
								break;
							case "T":
								if (line[0] > 1) {
									sync.push("<FONT color=\""+colorCode(tColor)+"\">" + line[2] + "</FONT>");
								}
								break;
							case "t":
								if (line[0] > 1) {
									sync.push(line[2]);
								}
								break;
						}
					}
					if (line[0] == 3 && preset.substring(0,2) == "rO") {
						// 원문 위에 독음 RUBY 태그
						sync = ["<RUBY>" + sync[1] + "<RT>" + sync[0] + "</RT></RUBY>", sync[2]]; 
					}
					html.push(sync.join("<br>"));
				}
			}
			
			preview.html("<p>" + html.join("</p><p>") + "</p>");
			output.val(html.join("\n").split("<RT>").join("<RP>(</RP>").split("</RT>").join("<RP>)</RP>"));
		}
		runs[4] = run;
		
		function runAfterCheck() {
			var c = checker = new Date();
			setTimeout(function() {
				if (c != checker) {
					return;
				}
				run();
			}, 1000);
		}
		
		$("#page4").on("click", "input", function() {
			runAfterCheck();
		}).on("keyup", "input", function() {
			runAfterCheck();
		}).on("change", "input", function() {
			runAfterCheck();
		});

		$("#page4 #formDesign").on("change", "input[type=color]", function() {
			$(this).next().val($(this).val());
		});
		$("#page4 #formDesign").on("change", "input.color", function() {
			$(this).prev().val($(this).val());
		});
	}
	
	// 한자 음절 기본값 편집
	btnOpenKanji.on("click", function() {
		if (formKanji.css("display") == "none") {
			formKanji.show();
		} else {
			formKanji.hide();
		}
	});
	btnApplyKanji.on("click", function() {
		var lines = inputKanji.val().split("\n");
		var list = [];
		var checker = {};
		for (var i = 0; i < lines.length; i++) {
			var item = lines[i];
			
			// 중복 제외
			if (checker[item]) continue;
			checker[item] = true;
			
			var mora = "", sum = 0;
			if (item.length % 2 == 0) {
				var div = item.length / 2;
				mora = item.substring(div);
				if (!isFinite(mora)) {
					alert("오류가 있습니다.\n" + item);
					return;
				} else {
					for (var j = 0; j < mora.length; j++) {
						sum += Number(mora[j]);
					}
				}
			} else {
				alert("오류가 있습니다.\n" + item);
				return;
			}
			list.push([item, mora, sum]);
		}
		list = list.sort(function(a, b) {
			if (a[1].length < b[1].length) {
				return 1;
			} else if (a[1].length > b[1].length) {
				return -1;
			}
			return (a[2] < b[2]) ? 1 : -1;
		});
		
		for (var i = 0; i < list.length; i++) {
			list[i] = list[i][0];
		}
		
		var result = list.join("\n");
		savedKanjiList = savedKanjiList.substring(0, savedKanjiList.indexOf("\n") + 1) + result;
		saveKanjiList();
		refreshKanji();
		inputKanji.val(result);
		inputKanji.scrollTop(0);
		runs[2]();
		formKanji.hide();
	});
	
	runs[1]();
});
