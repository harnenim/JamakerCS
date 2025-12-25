document.head.querySelectorAll("link").forEach((el) => {
	if (el.href.endsWith("/popup.css")) {
		el.remove();
	}
});

const DEFAULT_LIST = ("2023.03.27"
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

const kanjiList = [];
function refreshKanji() {
	kanjiList.length = 0;
	const list = savedKanjiList.split("\n");
	for (let i = 1; i < list.length; i++) { // 첫 줄은 기본값 버전이므로 제외
		const item = list[i];
		if (item.length && (item.length % 2 == 0)) {
			const div = item.length / 2;
			const mora = item.substring(div);
			if (isFinite(mora)) {
				const word = item.substring(0, div);
				kanjiList.push([word, mora]);
			}
		}
	}
	document.getElementById("inputKanji").value = savedKanjiList.substring(savedKanjiList.indexOf("\n") + 1); // 첫 줄은 기본값 버전이므로 제외
}

window.windowName = "karaoke";

//let savedKanjiList = localStorage.getItem("kanjiList");
const KANJI_FILE = "Karaoke.txt";
let savedKanjiList = "";

function afterLoadKanji(text) {
	if (!text) {
		// 최초 실행
		saveKanjiList(DEFAULT_LIST);
		refreshKanji();
		
	} else {
		// 버전 체크
		const curr = savedKanjiList.split("\n");
		const dflt = DEFAULT_LIST  .split("\n");
		if (curr[0] != dflt[0]) { // 버전이 다를 경우
			const version = dflt[0];
			curr = curr.slice(1);
			dflt = dflt.slice(1);
			
			const exists = {}; // 현재 설정에 있는 것 체크
			for (let i = 0; i < curr.length; i++) {
				exists[curr[i].substring(0, curr[i].length/2)] = i;
			}
			for (let i = 0; i < dflt.length; i++) {
				const item = exists[dflt[i].substring(0, dflt[i].length/2)];
				if (item) {
					// 이미 존재하면 기본값으로 덮어쓰려고 했는데
					// 현재 설정 유지하는 게 나을 듯
				} else {
					curr.push(dflt[i]); // 현재 설정에 기본값 추가
				}
			}
			curr.sort((a, b) => {
				if (a.length < b.length) {
					return 1;
				} else if (a.length > b.length) {
					return -1;
				}
				return (a.substring(a.length/2) < b.substring(b.length/2)) ? 1 : -1;
			});
			saveKanjiList(version + "\n" + curr.join("\n"));
		}
		refreshKanji();
	}
}
//afterReadSetting(savedKanjiList);

function saveKanjiList(txtKanjiList) {
	//localStorage.setItem("kanjiList", savedKanjiList);
	saveAddonSetting(KANJI_FILE, savedKanjiList = txtKanjiList);
}

let gana
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
const vws = {};
for (let i = 0; i < gana.length; i++) {
	const vw = [];
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

const dataMap = new WeakMap();
window.eData = (el=null, key=null, value=null) => {
	if (!el) return null;
	
	let map = dataMap.get(el);
	if (!map) {
		dataMap.set(el, map = {});
	}
	if (key != null) {
		if (typeof key == "string") {
			if (value == null) {
				return map[key];
			}
			map[key] = value;
		} else if (typeof key == "object") {
			const paramMap = key;
			for (key in paramMap) {
				map[key] = paramMap[key];
			}
		}
	}
	return map;
}

ready(() => {
	if (loadAddonSetting) {
		loadAddonSetting(KANJI_FILE, (text) => {
			afterLoadKanji(savedKanjiList = text);
		});
	}
	
	const inputLyrics = document.getElementById("inputLyrics");
	const inputDivider = document.getElementById("inputDivider");
	
	const inputOrig = document.getElementById("inputOrig");
	const inputRead = document.getElementById("inputRead");
	const inputTran = document.getElementById("inputTran");
	
	const formEditLine = document.getElementById("formEditLine");
	const inputLineO = document.getElementById("inputLineO");
	const inputLineR = document.getElementById("inputLineR");
	const inputLineT = document.getElementById("inputLineT");
	
	const preview    = document.getElementById("preview");
	const formDesign = document.getElementById("formDesign");
	const output     = document.getElementById("output");
	const result = [];
	
	const inputOColorFrom = document.getElementById("inputOColorFrom");
	const inputOColorTo   = document.getElementById("inputOColorTo"  );
	const inputRColorFrom = document.getElementById("inputRColorFrom");
	const inputRColorTo   = document.getElementById("inputRColorTo"  );
	const inputTColor     = document.getElementById("inputTColor"    );
	
	const btnOpenKanji = document.getElementById("btnOpenKanji");
	const formKanji = document.getElementById("formKanji");
	const inputKanji = document.getElementById("inputKanji"); // 첫 줄은 기본값 버전이므로 제외
	const btnApplyKanji = document.getElementById("btnApplyKanji");
	
	const lefts = [	null
		,	"  30%"
		,	" -30%"
		,	" -90%"
		,	"-140%"
	];
	const validates = [ null
		,	() => { return true; }
		,	() => { return true; }
		,	() => { return true; }
		,	() => { return true; }
	];
	const runs = [ null ];
	
	let step = 1;
	document.getElementById("total").addEventListener("click", (e) => {
		const btn = e.target.closest(".button.active");
		if (!btn) return;
		
		const newStep = Number(btn.dataset.step);
		if (newStep > step && !validates[step]()) {
			alert("입력값이 불완전합니다.");
			if (step == 3) {
				document.getElementById("page3").querySelector(".line.error input[type=text]").focus();
			}
			return;
		}
		step = newStep;
		
		{	const total = document.getElementById("total");
			total.style.left = lefts[step];
			[...total.querySelectorAll(".button")].forEach((el) => {
				el.classList.remove("hide");
				el.classList.remove("active");
			});
		}
		[...document.getElementsByTagName("input")]
		.concat([...document.getElementsByTagName("textarea")])
		.concat([...document.getElementsByTagName("button")]).forEach((el) => {
			el.tabIndex = -1;
		});
		{	const page = document.getElementById("page" + step);
			page.querySelectorAll(".button").forEach((el) => {
				el.classList.add("hide");
			});
			[...page.getElementsByTagName("input")]
			.concat([...page.getElementsByTagName("textarea")])
			.concat([...page.getElementsByTagName("button")]).forEach((el) => {
				el.tabIndex = "";
			});
		}
		document.querySelectorAll(`#page${step-1} .button`).forEach((el) => {
			el.classList.add("active");
		});
		document.querySelectorAll(`#page${step+1} .button`).forEach((el) => {
			el.classList.add("active");
		});
		if (runs[step]) runs[step]();
	});
	
	{	// Step 1
		let run = runs[1] = () => {
			const lines = inputLyrics.value.trim().split("\n");
			const divider = Number(inputDivider.value);
			
			const lineGroups = [];
			{
				let lineGroup = [];
				let emptyCount = 0;
				
				for (let i in lines) {
					const line = lines[i].trim();
					if (line) {
						// 내용이 있는 줄
						if (emptyCount) {
							// 누적된 빈 라인 수에 따라 공백 라인 추가
							const emptyLines = Math.floor((emptyCount - 1) / divider);
							for (let j = 0; j < emptyLines; j++) {
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
			}
			
			const orig = [];
			const read = [];
			const tran = [];
			for (i in lineGroups) {
				const lineGroup = lineGroups[i];
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
			inputOrig.value = orig.join("\n");
			inputRead.value = read.join("\n");
			inputTran.value = tran.join("\n");
		}
		
		let checker = null;
		function runAfterCheck() {
			const c = checker = new Date();
			
			// 키 입력 멈추고 1초 후에 동작
			setTimeout(() => {
				// 그동안 새로 키 입력 있었으면 취소
				if (c != checker) {
					return;
				}
				run();
			}, 1000);
		}
		
		inputLyrics.addEventListener("keyup", () => {
			runAfterCheck();
		});
	}
	
	{	// Step 2
		validates[2] = () => {
			// 원문/독음/번역 줄 개수가 같아야 진행 가능
			const o = inputOrig.value.trim().split("\n").length;
			const r = inputRead.value.trim().split("\n").length;
			const t = inputTran.value.trim().split("\n").length;
			return o == r && r == t;
		};
		
		function run() {
			if (!validates[2]()) {
				return;
			}
			
			const orig = inputOrig.value.trim().split("\n");
			const read = inputRead.value.trim().split("\n");
			const tran = inputTran.value.trim().split("\n");

			{	// Step 1 역방향 적용
				const lines = [];
				for (let i = 0; i < orig.length; i++) {
					const o = orig[i];
					const r = read[i];
					const t = tran[i];
					
					let line = o;
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
				const divider = Number(inputDivider.value);
				let n = "";
				for (let i = 0; i < divider; i++) {
					n += "\n";
				}
				inputLyrics.value = lines.join(n);
			}
			
			{	// Step 3 비우고 재생성
				const area = document.getElementById("page3").children[0];
				area.innerHTML = "";
				for (let i = 0; i < orig.length; i++) {
					const o = orig[i];
					const r = read[i];
					const t = tran[i];
					const line = document.createElement("div");
					line.classList.add("line");
					line.classList.add(`line-${i}`);
					eData(line, { line: i });
					refreshLine(line, o, r, t);
					area.append(line);
				}
			}
		}
		runs[2] = run;
		
		let checker = null;
		function runAfterCheck() {
			const c = checker = new Date();
			
			// 키 입력 멈추고 1초 후에 동작
			setTimeout(() => {
				// 그동안 새로 키 입력 있었으면 취소
				if (c != checker) {
					return;
				}
				run();
			}, 1000);
		}
		
		[inputOrig, inputRead, inputTran].forEach((el) => {
			el.addEventListener("keyup", () => {
				runAfterCheck();
			});
		})
	}
	
	function refreshLine(line, o, r, t) {
		let sumO = 0;
		let sumR = 0;
		line.innerHTML = "";
		
		// 최종 결과물: [[문자,모라(,입력란)],[문자,모라(,입력란)], ...]
		// ort: 1-원문, 2-원문/번역, 3-원문/독음/번역
		
		if (o == r) {
			// 원문=독음 → 음절 입력 필요 없음
			const oc = [];
			
			const oLine = document.createElement("p");
			oLine.innerText = o;
			for (let j = 0; j < o.length; j++) {
				if (o[j] == " " || o[j] == "　" || o[j] == "\t") {
					oc.push([o[j], 0]);
				} else {
					oc.push([o[j], 1]);
					const input = document.createElement("input");
					input.type = "hidden";
					input.value = 1;
					oLine.append(input);
				}
			}
			eData(line, { oc: oc, rc: oc });
			line.append(oLine);
			
			eData(line, { tc: t });
			if (r == t) {
				eData(line, { ort: 1 });
			} else {
				eData(line, { ort: 2 });
				const p = document.createElement("p");
				p.innerText = t;
				line.append(p);
			}
			
		} else {
			{	// 원문
				let oc = [];
				
				// 후리가나 음절 고정
				let nokori = o;
				{
					let begin;
					while ((begin = nokori.indexOf('[')) >= 0) {
						const end = nokori.indexOf(']', begin);
						if (end > 0) {
							const d = nokori.indexOf('|');
							if (d > 0) {
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
				}
				
				// 한자 음절 프리셋 적용
				for (let j = 0; j < oc.length; j++) {
					// string: 후리가나 처리 안 되고 남은 것들
					if (typeof(nokori = oc[j]) == "string") {
						// 한자 음절 프리셋에서 검색
						for (let k = 0; k < kanjiList.length; k++) {
							const word = kanjiList[k][0];
							const index = nokori.indexOf(word);
							if (index >= 0) {
								// 春夏冬004 → [..., ['春',0,true],['夏',0,true],['冬',4,true], ...]
								const mora = kanjiList[k][1];
								const ock = [];
								ock.push(nokori.substring(0, index));
								for (let l = 0; l < word.length; l++) {
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
				for (let j = 0; j < oc.length; j++) {
					// string: 위에서 처리 안 되고 남은 것들
					if (typeof(nokori = oc[j]) == "string") {
						const ocj = [];
						for (let k = 0; k < nokori.length; k++) {
							let c = nokori[k];
							if (c == ' ' || c == '　' || c == '\t') {
								// 공백 문자 0 고정
								ocj.push([c, 0, false]);
								
							} else if (('a'<=c && c<='z') || ('A'<=c && c<='Z')) {
								// 알파벳일 경우 1 고정
								ocj.push([c, 1, false]);
								
							} else {
								// 가나 문자가 아닐 경우 음절 입력 지원
								const isGana = (
										('ぁ'<=c && c<='ん')
									||	('ァ'<=c && c<='ヶ')
								);
								if (isGana) {
									// 요음 처리
									if (k + 1 < nokori.length) {
										const n = nokori[k + 1];
										const vw = vws[n];
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
				
				const tr0 = document.createElement("tr");
				const tr1 = document.createElement("tr");
				for (let j = 0; j < oc.length; j++) {
					let c = oc[j][0];
					if (typeof(c) != "string") {
						c = "<ruby>"+c[0]+"<rt>"+c[1]+"</rt></ruby>";
					}
					{	const td = document.createElement("td");
						td.innerHTML = c;
						tr0.append(td);
					}
					const len = oc[j][1];
					if (oc[j][2]) { // 음절 입력
						const td = document.createElement("td");
						const input = document.createElement("input");
						input.type = "text";
						input.value = len;
						td.append(input);
						tr1.append(td);
					} else {
						const td = document.createElement("td");
						td.innerText = ((len > 1) ? len : (len == 1 ? "-" : " "));
						const input = document.createElement("input");
						input.type = "hidden";
						input.value = len;
						td.append(input);
						tr1.append(td);
					}
					sumO += oc[j][1];
				}
				{	const td = document.createElement("td");
					td.rowspan = 2;
					td.classList.add("sum");
					td.innerText = sumO;
					tr0.append(td);
				}
				
				eData(line, { oc: oc });
				{	const table = document.createElement("table");
					table.append(tr0);
					table.append(tr1);
					line.append(table);
				}
			}
			
			{	// 읽기
				const rc = [];
				
				const tr0 = document.createElement("tr");
				const tr1 = document.createElement("tr");
				
				const 가 = '가'.charCodeAt();
				const 아 = '아'.charCodeAt();
				const 잏 = '잏'.charCodeAt();
				const 힣 = '힣'.charCodeAt();
				
				let last = -1;
				for (let j = 0; j < r.length; j++) {
					let c = r[j];
					let cc = c.charCodeAt();
					{	const td = document.createElement("td");
						td.innerHTML = c;
						tr0.append(td);
					}
					if (가<=cc && cc<=힣) {
						const batchim = (cc-가) % 28;
						if (아<=cc && cc<=잏) {
							// 초성 ㅇ
							if (batchim) {
								// 받침 존재: 1~2 입력 가능
								const cm = Math.floor(((cc-가) % 588) / 28);
								let len = (cm == 18) ? 1 : 2; // 모음 ㅡ일 경우: 거의 확실하게 1
								if (len == 2) {
									const lm = Math.floor(((last-가) % 588) / 28);
									len = (lm == cm) ? 1 : 2; // 앞 글자와 모음 같을 경우: 1일 가능성이 큼
								}
								rc.push([c, len]);
								{	const td = document.createElement("td");
									const input = document.createElement("input");
									input.type = "text";
									input.value = len;
									td.append(input);
									tr1.append(td);
								}
								sumR += len;
								
							} else {
								// 받침 없음: 1 고정
								rc.push([c, 1]);
								{	const td = document.createElement("td");
									const input = document.createElement("input");
									input.type = "hidden";
									input.value = 1;
									td.innerText = "-";
									td.append(input);
									tr1.append(td);
								}
								sumR++;
							}
						} else {
							// 초성 있음
							if (batchim) {
								// 받침 존재: 거의 확실하게 2
								rc.push([c, 2]);
								{	const td = document.createElement("td");
									const input = document.createElement("input");
									input.type = "text";
									input.value = 2;
									td.append(input);
									tr1.append(td);
								}
								sumR += 2;
							} else {
								// 받침 없으면 1 고정
								rc.push([c, 1]);
								{	const td = document.createElement("td");
									const input = document.createElement("input");
									input.type = "hidden";
									input.value = 1;
									td.innerText = "-";
									td.append(input);
									tr1.append(td);
								}
								sumR++;
							}
						}
					} else {
						if (c == ' ' || c == '　' || c == '\t') {
							// 공백 문자 0 고정
							rc.push([c, 0]);
							{	const td = document.createElement("td");
								const input = document.createElement("input");
								input.type = "hidden";
								input.value = 0;
								td.innerText = " ";
								td.append(input);
								tr1.append(td);
							}
						} else if (('a'<=c && c<='z') || ('A'<=c && c<='Z')) {
							// 알파벳일 경우 1 고정
							rc.push([c, 1]);
							{	const td = document.createElement("td");
								const input = document.createElement("input");
								input.type = "hidden";
								input.value = 1;
								td.innerText = "-";
								td.append(input);
								tr1.append(td);
							}
							sumR++;
							
						} else {
							rc.push([c, 1]);
							{	const td = document.createElement("td");
								const input = document.createElement("input");
								input.type = "text";
								input.value = 1;
								td.append(input);
								tr1.append(td);
							}
							sumR++;
						}
					}
					last = cc;
				}
				{	const td = document.createElement("td");
					td.rowspan = 2;
					td.classList.add("sum");
					td.innerText = sumR;
					tr0.append(td);
				}
				
				eData(line, { rc: rc });
				{	const table = document.createElement("table");
					table.append(tr0);
					table.append(tr1);
					line.append(table);
				}
			}
			
			{	// 번역
				eData(line, { tc: t });
				const p = document.createElement("p");
				p.innerText = t;
				line.append(p);
			}
			
			eData(line, { ort: 3 });
		}
		
		if (sumO == sumR) {
			line.classList.remove("error");
		} else {
			line.classList.add   ("error");
		}
	}
	
	// Step 3 해당 줄만 수정
	function openEditLine(i) {
		inputLineO.value = inputOrig.value.trim().split("\n")[i];
		inputLineR.value = inputRead.value.trim().split("\n")[i];
		inputLineT.value = inputTran.value.trim().split("\n")[i];
		formEditLine.style.display = "block";
		eData(formEditLine, { line: i });
	}
	function saveEditLine() {
		formEditLine.style.display = "none";
		const i = eData(formEditLine).line;
		const orig = inputOrig.value.trim().split("\n");
		const read = inputRead.value.trim().split("\n");
		const tran = inputTran.value.trim().split("\n");
		
		// Step 3 해당 줄 갱신
		refreshLine(document.getElementById("page3").querySelector(".line-"+i)
			,	orig[i] = inputLineO.value
			,	read[i] = inputLineR.value
			,	tran[i] = inputLineT.value
		);
		// Step 2 역방향 갱신
		inputOrig.value = orig.join("\n");
		inputRead.value = read.join("\n");
		inputTran.value = tran.join("\n");
		// Step 4 결과물 재계산
		runs[3];
	}
	
	{	// Step 3
		validates[3] = () => {
			// 음절 수 맞춰졌어야 진행 가능
			return !document.getElementById("page3").querySelector(".line.error");
		};
		
		function nokori(c, i) {
			let result = "";
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
			const orig = inputOrig.value.trim().split("\n");
			const read = inputRead.value.trim().split("\n");
			const tran = inputTran.value.trim().split("\n");
			
			result.length = 0;
			
			document.getElementById("page3").querySelectorAll(".line").forEach((line) => {
				const lineData = eData(line);
				let ort = lineData.ort;
				let oc  = lineData.oc ;
				let rc  = lineData.rc ;
				let tc  = lineData.tc ;
				
				let length = 0;
				
				if (line.children.length == 1) {
					for (let i = 0; i < oc.length; i++) {
						length += oc[i][1];
					}
				} else {
					// oc, rc의 음절 값을 입력된 값으로 대체
					line.querySelector   ("table")   .querySelectorAll("input").forEach((el, i) => {
						length += (oc[i][1] = Number(el.value));
					});
					line.querySelectorAll("table")[1].querySelectorAll("input").forEach((el, i) => {
						rc[i][1] = Number(el.value);
					});
				}
				
				// 음절 입력값 0일 때 묶음 처리
				// 예: [..., ['春',0,true],['夏',0,true],['冬',4,true], ...] → [..., ['春夏冬',4], ...]
				{
					const noc = [];
					let tmp = "";
					for (let i = 0; i < oc.length; i++) {
						const oci = oc[i];
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
				}
				
				const or = [];
				{
					let oi = 0;
					let oCmp = "";
					let oSum = 0;
					let ri = 0;
					let rCmp = "";
					let rSum = 0;
					for (let i = 1; i <= length; i++) {
						const orio = [];
						const orir = [];
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
								const gi = (i - oSum);
								const gc = oc[oi][0];
								const gl = oc[oi][1];
								
								orio[2] = "";
								
								if (gc.length == 1 || typeof(gc) != "string") {
									// 한 글자면 그대로 반영
									orio[1] = [gc, gi, gl]; // [문자(열), 진행도, 전체]
									
								} else {
									// 여러 글자 묶음이면 다시 문자별로 계산
									const r = gc.length * gi / gl;
									const r1 = r % 1;
									if (r1 == 0) {
										orio[0]+= gc.substring(0, r);
										orio[1] = null;
										orio[2] = gc.substring(r);
									} else {
										const j = Math.floor(r);
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
				}
				result.push([ort, or, tc]);
			});
			
			runs[4]();
		}
		runs[3] = run;
		
		let checker = null;
		function runAfterCheck() {
			const c = checker = new Date();
			
			// 키 입력 멈추고 1초 후에 동작
			setTimeout(() => {
				// 그동안 새로 키 입력 있었으면 취소
				if (c != checker) {
					return;
				}
				run();
			}, 1000);
		}
		
		document.getElementById("page3").addEventListener("keyup", (e) => {
			const input = e.target.closest("input");
			if (!input) return;
			
			// 입력 있을 경우 음절 수 재계산
			const table = input.closest("table");
			let sum = 0;
			table.querySelectorAll("input").forEach((el) => {
				sum += Number(el.value);
			});
			table.querySelector(".sum").innerText = sum;
			
			// 원문/독음 따로일 경우 음절 수 맞는지 확인
			const line = input.closest(".line");
			const tables = line.querySelectorAll("table");
			if (tables.length == 2) {
				if (tables[0].querySelector(".sum").innerText == tables[1].querySelector(".sum").innerText) {
					line.classList.remove("error");
				} else {
					line.classList.add   ("error");
				}
			}
			runAfterCheck();
		});

		document.getElementById("page3").addEventListener("click", (e) => {
			const el = e.target.closest(".sum");
			if (!el) return;
			// 해당 줄 텍스트 편집
			openEditLine(eData(el.closest(".line")).line);
		});
		formEditLine.addEventListener("click", (e) => {
			if (e.target.closest("button")) {
				saveEditLine();
			}
		});
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
		const result = ["","",""];
		
		// 활성, 비활성
		for (let i = 0; i <= 2; i += 2) {
			if (line[i]) {
				const lineI = [];
				
				// 후리가나 그룹으로 배열 분리
				{	let nokori = line[i];
					let begin;
					while ((begin = nokori.indexOf('[')) >= 0) {
						const end = nokori.indexOf(']', begin);
						if (end) {
							const d = nokori.indexOf('|');
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
				}
				
				// 색상태그 입히기
				const color = colorCode(i==0 ? to : from);
				for (let j = 0; j < lineI.length; j++) {
					if (typeof(lineI[j]) == "string") {
						result[i] += `<FONT color="${color}">${lineI[j]}</FONT>`;
					} else {
						result[i] += `<RUBY><FONT color="${color}">${lineI[j][0]}</FONT><RT><FONT color="${color}">${lineI[j][1]}</FONT></RT></RUBY>`;
					}
				}
			}
		}
		
		// 중간 단계
		if (line[1]) {
			const gc = line[1][0];
			const gi = line[1][1];
			const gl = line[1][2];
			if (typeof(gc) == "string") {
				// 한 글자 문자면 바로 색상 처리
				const color = [
						Math.floor((from[0]*(gl-gi) + to[0]*gi) / gl)
					,	Math.floor((from[1]*(gl-gi) + to[1]*gi) / gl)
					,	Math.floor((from[2]*(gl-gi) + to[2]*gi) / gl)
				];
				result[1] = `<FONT color="${colorCode(color)}">${gc}</FONT>`;
				
			} else {
				// RUBY 태그 처리
				const ruby = [];
				
				for (let i = 0; i < 2; i++) {
					const r = gc[i].length * gi / gl;
					const r1 = r % 1;
					if (r1 == 0) {
						//글자 수 딱 떨어질 때
						ruby[i] = `<FONT color="${colorCode(to  )}">${ gc[i].substring(0, r) }</FONT>`
						        + `<FONT color="${colorCode(from)}">${ gc[i].substring(r   ) }</FONT>`;
						
					} else {
						// 중간 색이 필요할 때
						const color = [
								Math.floor(from[0] + (to[0] - from[0]) * r1)
							,	Math.floor(from[1] + (to[1] - from[1]) * r1)
							,	Math.floor(from[2] + (to[2] - from[2]) * r1)
						];
						const j = Math.floor(r);
						ruby[i] = "";
						if (j > 0) {
							ruby[i] += `<FONT color="${ colorCode(to   ) }">${ gc[i].substring(0, j  ) }</FONT>`;
						}
						{
							ruby[i] += `<FONT color="${ colorCode(color) }">${ gc[i].substring(j, j+1) }</FONT>`;
						}
						if (j+1 < gc[i].length) {
							ruby[i] += `<FONT color="${ colorCode(from ) }">${ gc[i].substring(j+1   ) }</FONT>`;
						}
					}
				}
				
				result[1] = `<RUBY>${ruby[0]}<RT>${ruby[1]}</RT></RUBY>`;
			}
		}
		return result.join("");
	}
	
	{	// Step 4
		function run() {
			let oColorFrom = inputOColorFrom.value;
			let oColorTo   = inputOColorTo  .value;
			let rColorFrom = inputRColorFrom.value;
			let rColorTo   = inputRColorTo  .value;
			let tColor     = inputTColor    .value;
			
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
			
			let preset = "";
			[...formDesign.querySelectorAll("input[name=preset]")].forEach((input) => {
				if (input.checked) {
					preset = input.value;
				}
			});
			
			const html = [];
			
			for (let i = 0; i < result.length; i++) {
				const line = result[i];
				
				for (let j = 0; j < line[1].length; j++) {
					let sync = [];
					for (let k = 0; k < preset.length; k++) {
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
									sync.push(`<FONT color="${ colorCode(tColor) }">${line[2]}</FONT>`);
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
						sync = [`<RUBY>${sync[1]}<RT>${sync[0]}</RT></RUBY>`, sync[2]]; 
					}
					html.push(sync.join("<br>"));
				}
			}
			
			preview.innerHTML = (`<p>${ html.join("</p><p>") }</p>`);
			output.value = html.join("\n").replaceAll("<RT>", "<RP>(</RP><RT>").replaceAll("</RT>", "</RT><RP>)</RP>");
		}
		runs[4] = run;
		
		let checker = null;
		function runAfterCheck() {
			const c = checker = new Date();
			
			// 키 입력 멈추고 1초 후에 동작
			setTimeout(() => {
				// 그동안 새로 키 입력 있었으면 취소
				if (c != checker) {
					return;
				}
				run();
			}, 1000);
		}
		
		const page4 = document.getElementById("page4");
		page4.addEventListener("click", (el) => {
			if (!el.target.closest("input")) return;
			runAfterCheck();
		});
		page4.addEventListener("keyup", (el) => {
			if (!el.target.closest("input")) return;
			runAfterCheck();
		});
		page4.addEventListener("change", (el) => {
			if (!el.target.closest("input")) return;
			runAfterCheck();
		});
		
		formDesign.addEventListener("change", (e) => {
			let el;
			if (el = e.target.closest("input[type=color]")) {
				el.nextSibling.value = el.value;
				return;
			}
			if (el = e.target.closest("input.color")) {
				el.previousSibling.value = el.value;
				return;
			}
		});
	}
	
	// 한자 음절 기본값 편집
	btnOpenKanji.addEventListener("click", () => {
		if (formKanji.style.display == "none") {
			formKanji.style.display = "block";
		} else {
			formKanji.style.display = "none";
		}
	});
	btnApplyKanji.addEventListener("click", () => {
		const lines = inputKanji.value.split("\n");
		const list = [];
		const checker = {};
		for (let i = 0; i < lines.length; i++) {
			const item = lines[i];
			
			// 중복 제외
			if (checker[item]) continue;
			checker[item] = true;
			
			let sum = 0;
			if (item.length % 2 == 0) {
				const div = item.length / 2;
				const mora = item.substring(div);
				if (!isFinite(mora)) {
					alert("오류가 있습니다.\n" + item);
					return;
				} else {
					for (let j = 0; j < mora.length; j++) {
						sum += Number(mora[j]);
					}
					list.push([item, mora, sum]);
				}
			} else {
				alert("오류가 있습니다.\n" + item);
				return;
			}
		}
		list.sort((a, b) => {
			if (a[1].length < b[1].length) {
				return 1;
			} else if (a[1].length > b[1].length) {
				return -1;
			}
			return (a[2] < b[2]) ? 1 : -1;
		});
		
		for (let i = 0; i < list.length; i++) {
			list[i] = list[i][0];
		}
		
		const result = list.join("\n");
		saveKanjiList(savedKanjiList.substring(0, savedKanjiList.indexOf("\n") + 1) + result);
		refreshKanji();
		inputKanji.value = result;
		inputKanji.scrollTop = 0;
		runs[2]();
		formKanji.style.display = "none";
	});
	
	runs[1]();
});
