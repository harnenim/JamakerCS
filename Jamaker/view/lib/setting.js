// 업데이트 메시지
let checkVersion;
{	checkVersion = (version) => {
		if (!version) version = "";
		
		const notify = [];
		const notified = {};
		if (version < lastNotifyForCommand) {
			notify.push("단축키");
			notified.command = true;
		}
		if (version < lastNotifyForAutoComplete) {
			notify.push("자동완성");
			notified.autoComplete = true;
		}
		if (version < lastNotifyForStyle) {
			notify.push("스타일");
			notified.style = true;
		}
		if (version < lastNotifyForMenu) {
			notify.push("메뉴");
			notified.menu = true;
		}
		if (notify.length) {
			/* 창 초기화 전에 동작하지 않도록 의도적으로 timeout
			 * 
			 * 설정값을 불러온 후, 설정값에 따라 창 위치를 옮기기 때문에
			 * 설정값 불러오는 과정에서의 버전 확인은 창 구성 이전일 수밖에 없고
			 * 창 구성 이후 콜백을 추가하기엔 지나치게 복잡도가 높아짐
			 */
			setTimeout(() => {
				alert(notify.join(", ") + " 기본값이 변경되었습니다.\n설정에서 검토하시기 바랍니다.");
			}, 1);
		}
		return notified;
	}
	const lastNotifyForCommand = "2025.07.30.v1";
	const lastNotifyForAutoComplete = "2025.04.19.v1";
	const lastNotifyForStyle = "2025.03.07.v1";
	const lastNotifyForMenu = "2025.12.06.v1";
}

window.DEFAULT_SETTING =
{	version: "2025.12.06.v2"
,	menu:
	[	[	"파일(&F)"
		,	"새 파일(&N)|newFile()"
		,	"열기(&O)...|openFile()"
		,	"현재 동영상의 자막 열기|openFileForVideo()"
		,	""
		,	"저장(&S)|saveFile()"
		,	"다른 이름으로 저장(&A)...|saveFile(true)"
		,	"내보내기(&E)...|saveFile(true, true)"
		]
	,	[	"편집(&E)"
		,	"찾기/바꾸기(&F)|SmiEditor.Finder.open()"
		,	"색상코드 입력(&C)|binder.runColorPicker()"
		,	""
		,	"특수태그 정규화|SmiEditor.selected && SmiEditor.selected.normalize()"
		,	"중간 싱크 생성|SmiEditor.selected && SmiEditor.selected.fillSync()"
		,	"ASS 기반 SMI 텍스트 생성|generateSmiFromAss()"
		,	""
		,	"미리보기창 실행|SmiEditor.Viewer.open()"
		,	"설정(&S)|openSetting()"
		]
	,	[	"부가기능(&A)"
		,	"화면 싱크 매니저(&M)|openAddon('SyncManager')"
		,	"여러 SMI 파일에서 찾기(&G)|openAddon('SearchFiles')"
		,	""
		,	"겹치는 대사 결합(&C)|openAddon('Combine');"
		,	"겹치는 대사 분리(&D)|openAddon('Devide');"
		,	"싱크 유지 텍스트 대체(&F)|openAddon('Fusion');"
		,	"노래방 자막(&K)|openAddon('Karaoke', 'karaoke');"
		,	"흔들기 효과(&S)|openAddon('Shake');"
		,	"니코동 효과(&N)|openAddon('Nico');"
		,	"재생 속도 조절|openAddon('Speed');"
		,	""
		,	"맞춤법 검사기|extSubmit(\"post\", \"https://nara-speller.co.kr/old_speller/results\", \"text1\");"
		,	"국어사전|extSubmit(\"get\", \"https://ko.dict.naver.com/%23/search\", \"query\");"
		]
	,	[	"도움말(&H)"
		,	"프로그램 정보|openHelp('info')"
		,	"기본 단축키|openHelp('key')"
		,	""
		,	"홀드에 대하여|openHelp('aboutHold')"
		,	"싱크 표현에 대하여|openHelp('aboutSync')"
		,	"특수 태그에 대하여|openHelp('aboutTag')"
		,	"ASS 변환에 대하여|openHelp('aboutAss')"
		,	"프로젝트 파일에 대하여|openHelp('aboutJmk')"
		,	""
		,	"업데이트 확인|openHelp('update')"
		]
	]
,	window:
	{	x: 1280
	,	y: 0
	,	width: 640
	,	height: 920
	,	follow: true // 미리보기/플레이어 창 따라오기
	}
,	sync:
	{	insert: 1    // 싱크 입력 시 커서 이동
	,	update: 2    // 싱크 수정 시 커서 이동 / 예) 싱크 새로 찍기: 2
	,	weight: -400 // 가중치 설정
	,	unit: 42     // 싱크 조절량 설정 (기본값: 24fps이면 1프레임당 41.7ms)
	,	move: 2000   // 재생 이동 단위
	,	lang: "KRCC" // 그냥 아래 preset 설정으로 퉁치는 게 나은가...?
	,	preset: "<Sync Start={sync}><P Class={lang}{type}>" // 싱크 태그 형태
	,	frame: true
	,	kframe: false
	,	kLimit: 200
	,	holds: true
	,	width: 192	// 화면 싱크 매니저 섬네일 크기
	,	height: 108
	,	uiWidth: 96
	,	uiHeight: 54
	}
,	command:
	{	fn: // F1~F12: pqrstuvwxyz{
		{	't': '/* 기본 싱크 */\n' + 'editor.insertSync()'
		,	'u': '/* 화면 싱크 */\n' + 'editor.insertSync(1)'
		,	'v': '/* 기본/화면 싱크 토글 */\n' + 'editor.toggleSyncType()'
		,	'w': '/* 선택 영역 싱크 삭제 */\n' + 'editor.removeSync()'
		,	'x': '/* 재생/일시정지 */\n' + 'SmiEditor.PlayerAPI.playOrPause()'
		,	'y': '/* 재생 */\n' + 'SmiEditor.PlayerAPI.play();\n'
			   + '// ※ 정지화면 있을 경우 재생 중인지 확신이 안 설 때가 있어서\n'
			   + '//    토글이 아닌 재생이 있는 게 맞을 듯'
		,	'z': '/* 정지 */\n' + 'SmiEditor.PlayerAPI.stop()'
		,	"s": "/* 되감기 */\nSmiEditor.PlayerAPI.move(-SmiEditor.sync.move);\nSmiEditor.PlayerAPI.play();"
		,	"r": "/* 실행 취소 */\neditor.history.back();"
		,	"q": "/* 홀드명 변경 */\neditor.rename();"
		}
	,	withCtrls:
		{	't': '/* 일괄 싱크 찍기 */\n' + 'editor.reSync();'
		,	'`': '/* 이전 홀드 선택 */\neditor.owner.selectLastHold();'
		,	'1': '/* 색상태그 */\n' + 'editor.tagging("<font color=\\"#aaaaaa\\">")'
		,	'2': '/* 한 줄씩 줄표 넣어주기 */\n'
			   + 'let text = editor.getText();\n'
			   + 'let lines = text.text.split("\\n");\n'
			   + 'let lineNo = text.text.substring(0, text.selection[0]).split("\\n").length - 1;\n'
			   + '// 현재 싱크 맨 윗줄 찾기 (공백 줄이어도 끊음)\n'
			   + 'let syncLineNo = lineNo;\n'
			   + 'while (syncLineNo >= 0) {\n'
			   + '	const line = lines[syncLineNo].trim();\n'
			   + '	if (line.length == 0\n'
			   + '	 || line == "&nbsp"\n'
			   + '	 || line.substring(0, 6).toUpperCase() == "<SYNC ") {\n'
			   + '		break;\n'
			   + '	}\n'
			   + '	syncLineNo--;\n'
			   + '}\n'
			   + '// 작업 대상 있는지 확인\n'
			   + 'if (syncLineNo + 2 > lines.length\n'
			   + ' || lines[syncLineNo + 1].substring(0, 6).toUpperCase() == "<SYNC "\n'
			   + ' || lines[syncLineNo + 2].substring(0, 6).toUpperCase() == "<SYNC ") {\n'
			   + '	return;\n'
			   + '}\n'
			   + '// 줄표 없으면 넣기\n'
			   + 'if (lines[syncLineNo + 1][0] != "-") {\n'
			   + '	lines[syncLineNo + 1] = "- " + lines[syncLineNo + 1];\n'
			   + '}\n'
			   + 'if (lines[syncLineNo + 2][0] != "-") {\n'
			   + '	lines[syncLineNo + 2] = "- " + lines[syncLineNo + 2];\n'
			   + '}\n'
			   + 'let cursor = lines.slice(0, syncLineNo + 1).join("\\n").length + 1;\n'
			   + 'lines.splice(syncLineNo + 1, 2, (lines[syncLineNo + 1] + "<br>" + lines[syncLineNo + 2]));\n'
			   + 'editor.setText(lines.join("\\n"), [cursor, cursor]);'
		,	'3': '/* 공백줄 */\n' + 'editor.inputText("<br><b>　</b>")'
		,	'4': '/* 기울임 */\n' + 'editor.taggingRange("<i>")'
		,	'5': '/* 밑줄 */\n'   + 'editor.taggingRange("<u>")'
		,	'6': '/* RUBY 태그 생성([쓰기|읽기]) */\n'
			   + 'let text = editor.getText();\n'
			   + 'if (text.selection[0] == text.selection[1]) {\n'
			   + '	return;\n'
			   + '}\n'
			   + '\n'
			   + 'let prev = text.text.substring(0, text.selection[0]);\n'
			   + 'let next = text.text.substring(text.selection[1]);\n'
			   + 'let blocks = text.text.substring(text.selection[0], text.selection[1]).split("[");\n'
			   + '\n'
			   + 'for (let i = 1; i < blocks.length; i++) {\n'
			   + '	let block = blocks[i];\n'
			   + '	let endIndex = block.indexOf("]");\n'
			   + '	if (endIndex > 0) {\n'
			   + '		let toRuby = block.substring(0, endIndex);\n'
			   + '		let divIndex = toRuby.indexOf("|");\n'
			   + '		if (divIndex > 0) {\n'
			   + '			let ruby = block.substring(0, divIndex);\n'
			   + '			let rt   = block.substring(divIndex + 1, endIndex);\n'
			   + '			let left = block.substring(endIndex + 1);\n'
			   + '			blocks[i] = "<RUBY>" + ruby + "<RT><RP>(</RP>" + rt + "<RP>)</RP></RT></RUBY>" + left;\n'
			   + '		} else {\n'
			   + '			blocks[i] = "[" + blocks[i];\n'
			   + '		}\n'
			   + '	} else {\n'
			   + '		blocks[i] = "[" + blocks[i];\n'
			   + '	}\n'
			   + '}\nlet result = blocks.join("");\n'
			   + '\n'
			   + 'editor.setText(prev + result + next, [text.selection[0], text.selection[0] + result.length]);'
		,	'7': '/* Zero-width */\neditor.inputText("​")'
		,	'8': '/* ㄱ한자1 */\neditor.inputText("　")'
		,	'9': '/* 색상태그 시작 */\n' + 'editor.inputText("<font color=\\"#aaaaaa\\">")'
		,	'0': '/* 색상태그 종료 */\n' + 'editor.inputText("</font>")'
		,	'D': '/* 줄 삭제 */\n' + 'editor.deleteLine();'
		,	'G': '/* 여러 SMI 파일에서 찾기 실행 */\n' + 'openAddon("SearchFiles");'
		,	'M': '/* 화면 싱크 매니저 실행 */\n' + 'openAddon("SyncManager");'
		,	'Q': '/* 현재 위치 재생 */\n' + 'editor.moveToSync(-2000);'
		,	'T': '/* 홀드 추가 */\n' + 'editor.owner.addHold();'
		}
	,	withAlts:
		{	't': '/* 일괄 싱크 입력 */\n' + 'editor.reSyncPrompt();'
		,	'1': '/* 맞춤법 검사기 */\n'
			   + 'extSubmit("post", "https://nara-speller.co.kr/old_speller/results", "text1");'
		,	'2': '/* 국어사전 */\n'
			   + 'extSubmit("get", "https://ko.dict.naver.com/%23/search", "query");'
		,	'N': '/* 홀드 추가 */\n' + 'tabs.length && tabs[tab].addHold();'
		,	'Q': '/* 재생 위치 찾기 */\n' + 'editor.findSync();'
		}
	,	withCtrlAlts:
		{	'C': '/* 겹치는 대사 결합 */\n'      + 'openAddon("Combine");'
		,	'D': '/* 겹치는 대사 분리 */\n'      + 'openAddon("Devide");'
		,	'F': '/* 싱크 유지 텍스트 대체 */\n' + 'openAddon("Fusion");'
		}
	,	withCtrlShifts:
		{	'`': '/* 메인홀드 선택 */\neditor.owner.selectHold(0);'
		,	'1': '/* 1번 홀드 선택 */\neditor.owner.selectHold(1);'
		,	'2': '/* 2번 홀드 선택 */\neditor.owner.selectHold(2);'
		,	'3': '/* 3번 홀드 선택 */\neditor.owner.selectHold(3);'
		,	'4': '/* 4번 홀드 선택 */\neditor.owner.selectHold(4);'
		,	'5': '/* 5번 홀드 선택 */\neditor.owner.selectHold(5);'
		,	'6': '/* 6번 홀드 선택 */\neditor.owner.selectHold(6);'
		,	'7': '/* 7번 홀드 선택 */\neditor.owner.selectHold(7);'
		,	'8': '/* 8번 홀드 선택 */\neditor.owner.selectHold(8);'
		,	'9': '/* 9번 홀드 선택 */\neditor.owner.selectHold(9);'
		,	'0': '/*10번 홀드 선택 */\neditor.owner.selectHold(10);'
		,	'F': '/* 중간 싱크 생성 */\n' + 'editor.fillSync();'
		,	'S': '/* 설정 */\n' + 'openSetting();'
		}
	}
,	autoComplete:
	{	"0" : ['', [
			'fade="in"'
		,	'fade="out"'
		,	'ㄹ|fade="in"'
		,	'ㄹ|fade="out"'
		,	'typing="keyboard"'
		,	'ㅅ|typing="keyboard"'
		,	'미노프스키 입자'
		,	'아스티카시아 학원'
		]]
	,	"50" : ['@', [
			'@naver.com'
		,	"@gmail.com"
		]]
	,	"51" : ['#', [
			'#ㅁㄴㅍㅅㅋ ㅇㅈ|미노프스키 입자'
		,	'#ㅇㅅㅌㅋㅅㅇ ㅎㅇ|아스티카시아 학원'
		]]
	,	"52" : ['$', []]
	,	"53" : ['%', []]
	,	"54" : ['^', []]
	,	"55" : ['&', ['&nbsp;', '&amp;', '&lt;', '&gt;']]
	,	"57" : ['(', ['(', '(|「', '(|『', '(|“', '()|「」', '()|『』', '()|“”']]
	,	"48" : [')', [')', ')|」', ')|』', ')|”']]
	,	"188": ['<', [
			'<br>'
		,	'<RUBY>쓰기<RT><RP>(</RP>읽기<RP>)</RP></RT></RUBY>'
		,	'<font color="#cccccc">'
		,	'<font fade="in">'
		,	'<font typing="keyboard">'
		]]
	,	"190": ['>', ['>>>|…']]
	}
,	saveWithNormalize: true
,	replace:
	[ { from: "...", to: "…", use: false }
	
	, { from: "됬"        , to: "됐"      , use: true }
	, { from: "왠걸"      , to: "웬걸"    , use: true }
	, { from: "않돼"      , to: "안 돼"   , use: true }
	, { from: "우겨넣"    , to: "욱여넣"  , use: true }
	, { from: "오랫만"    , to: "오랜만"  , use: true }
	, { from: "는 커녕"   , to: "는커녕"  , use: true }
	, { from: "수 밖에"   , to: "수밖에"  , use: true }
	, { from: "절대절명"  , to: "절체절명", use: true }
	, { from: "부재 중"   , to: "부재중"  , use: true }
	
	, { from: "신 난다"   , to: "신난다"  , use: true } // 2014년 맞춤법 변경사항
	, { from: "신 났"     , to: "신났"    , use: true }
	, { from: "신 났"     , to: "신났"    , use: true }
	
/*	, { from: "지구 상"   , to: "지구상"  , use: false } // '지구 상공'에 과잉 보정되는 경우 있음 */
	, { from: "지도 상"   , to: "지도상"  , use: true } // 2017년 맞춤법 변경사항
	, { from: "직선 상"   , to: "직선상"  , use: true }
	, { from: "궤도 상"   , to: "궤도상"  , use: true }
	, { from: "인터넷 상" , to: "인터넷상", use: true }
	
	, { from: "불어"      , to: "프랑스어", use: false }
	, { from: "더프랑스어", to: "더불어"  , use: false }
	, { from: "비어"      , to: "맥주"    , use: false }
	, { from: "맥주있"    , to: "비어있"  , use: false }
	, { from: "터키"      , to: "튀르키예", use: false }
	, { from: "켄튀르키예", to: "켄터키"  , use: false }
	
	, { from: "ㅇ벗", to: "없"  , use: true }
	, { from: "ㅇ낳", to: "않"  , use: true }
	, { from: "햇다", to: "했다", use: true }
	, { from: "햇어", to: "했어", use: true }
	, { from: "혓다", to: "혔다", use: true }
	, { from: "혓어", to: "혔어", use: true }
	]
,	tempSave: 300 // 임시 저장 주기 설정 현재 만들지 않음
,	useTab: false // 탭 사용 기본값은 꺼두는 걸로
,	highlight:
	{ parser: "full"
	, style : "eclipse"
	, enter : false
	, color : true
	, sync  : 0.5
	}
,	size: 1
,	scrollMargin: 3.5
,	scrollShow: 1
,	color:
	{ background: "#f0f0f0"
	, selector  : "#c1c1c1"
	, border    : "#aaaaaa"
	, tab       : "#dddddd"
	, tabBorder : "#888888"
	, editor    : "#ffffff"
	, text      : "#000000"
	, hover     : "#ffffff"
	, notSaved  : "#ff8866"
	, syncBorder: "#000000"
	, syncError : "#ff8888"
	, syncEqual : "#88ff88"
	}
,	colorPreset:
	{
		"기본":
		{ background: "#f0f0f0"
		, selector  : "#c1c1c1"
		, border    : "#aaaaaa"
		, tab       : "#dddddd"
		, tabBorder : "#888888"
		, editor    : "#ffffff"
		, text      : "#000000"
		, hover     : "#ffffff"
		, notSaved  : "#ff8866"
		, syncBorder: "#000000"
		, syncError : "#ff8888"
		, syncEqual : "#88ff88"
		}
	,	"다크테마":
		{ background: "#0f0f0f"
		, selector  : "#4c4c4c"
		, border    : "#888888"
		, tab       : "#222222"
		, tabBorder : "#aaaaaa"
		, editor    : "#000000"
		, text      : "#ffffff"
		, hover     : "#000000"
		, notSaved  : "#ff8866"
		, syncBorder: "#ffffff"
		, syncError : "#880088"
		, syncEqual : "#008888"
		}
	}
,	newFile:"<SAMI>\n"
		+	"<HEAD>\n"
		+	"<TITLE>제목</TITLE>\n"
		+	"<STYLE TYPE=\"text/css\">\n"
		+	"<!--\n"
		+	"P { margin-left:8pt; margin-right:8pt; margin-bottom:2pt; margin-top:2pt;\n"
		+	"    text-align:center; font-size:14pt; font-family:맑은 고딕, 굴림, arial, sans-serif;\n"
		+	"    font-weight:normal; color:white;\n"
		+	"    background-color:black; }\n"
		+	".KRCC { Name:한국어; lang:ko-KR; SAMIType:CC; }\n"
		+	"-->\n"
		+	"</STYLE>\n"
		+	"<!--\n"
		+	"개인적인 코멘트를 넣을 곳\n"
		+	"-->\n"
		+	"</HEAD>\n"
		+	"<BODY>\n"
		+	"\n"
		+	"\n"
		+	"\n"
		+	"</BODY>\n"
		+	"</SAMI>"
,	viewer:
	{	window:
		{	x: 0
		,	y: 720
		,	width: 1280
		,	height: 200
		}
	,	useAlign: false
	,	size: 18
	,	css : "background: #888;\n"
			+ "color: #fff;\n"
			+ "font-family: '맑은 고딕';\n"
			+ "font-weight: bold;\n"
			+ "text-shadow: -2px -2px #000\n"
			+ "           , -2px  2px #000\n"
			+ "           ,  2px  2px #000\n"
			+ "           ,  2px -2px #000\n"
			+ "           , -1px -1px 4px #000\n"
			+ "           , -1px  2px 4px #000\n"
			+ "           ,  2px  2px 4px #000\n"
			+ "           ,  2px -1px 4px #000;"
	}
,	player:
	{	window:
		{	x: 0
		,	y: 0
		,	width: 1280
		,	height: 720
		,	use: true
		}
	,	exts: "mp4,mkv,avi,ts,m2ts" // 동영상 파일 찾기 우선순위 순으로
	,	control: { // C#에서 플레이어 브리지 dll 폴더 긁어서 전달해주는 기능 필요?
			dll: "PotPlayer" // 재생기 설정
		,	PotPlayer:
			{	path: "C:\\Program Files (x86)\\DAUM\\PotPlayer\\PotPlayer.exe" // 재생기 실행 경로 설정
			,	withRun: true // 함께 실행
			,	withExit: true // 함께 종료
			}
		}
	}
};
window.setting = DEFAULT_SETTING;