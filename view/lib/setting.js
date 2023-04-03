// 업데이트 메시지
var checkVersion;
{	checkVersion = function(version) {
		if (!version) version = "";

		var notify = [];
		if (version < lastNotifyForCommand) {
			notify.push("단축키");
		}
		if (version < lastNotifyForAutoComplete) {
			notify.push("자동완성");
		}
		if (version < lastNotifyForStyle) {
			notify.push("스타일");
		}
		if (version < lastNotifyForMenu) {
			notify.push("메뉴");
		}
		if (notify.length) {
			/* 창 초기화 전에 동작하지 않도록 의도적으로 timeout
			 * 
			 * 설정값을 불러온 후, 설정값에 따라 창 위치를 옮기기 때문에
			 * 설정값 불러오는 과정에서의 버전 확인은 창 구성 이전일 수밖에 없고
			 * 창 구성 이후 콜백을 추가하기엔 지나치게 복잡도가 높아짐
			 */
			setTimeout(function() {
				alert(notify.join(", ") + " 기본값이 변경되었습니다.\n설정에서 검토하시기 바랍니다.");
			}, 1);
		}
	}
	var lastNotifyForCommand = "";
	var lastNotifyForAutoComplete = "";
	var lastNotifyForStyle = "2023.04.02.v1";
	var lastNotifyForMenu = "2023.03.31.v1";
}

var DEFAULT_SETTING =
{	version: "2023.04.03.v1"
,	menu:
	// 유일하게 C#으로 그린 메뉴도 여기서 다 구성함
	[	[	"파일(&F)"
		,	"새 파일(&N)|newFile()"
		,	"열기(&O)...|openFile()"
		,	"현재 동영상의 자막 열기|openFileForVideo()"
		,	"저장(&S)|saveFile()"
		,	"다른 이름으로 저장(&A)...|saveFile(true)"
		]
	,	[	"편집(&S)"
		,	"찾기/바꾸기(&F)|SmiEditor.Finder.open()"
		,	"색상코드 입력(&C)|binder.runColorPicker()"
		,	"특수태그 정규화|tabs.length && tabs[tab].normalize()"
		,	"싱크 채우기|tabs.length && tabs[tab].fillSync()"
		,	"미리보기창 실행|SmiEditor.Viewer.open()"
		,	"설정(&S)|openSetting()"
		]
	,	[	"부가기능(&A)"
		,	"화면 싱크 매니저(&M)|openAddon('SyncManager')"
		,	"겹치는 대사 결합(&C)|openAddon('Combine');"
		,	"겹치는 대사 분리(&D)|openAddon('Devide');"
		,	"싱크 유지 텍스트 대체(&F)|openAddon('Fusion');"
		,	"노래방 자막(&K)|openAddon('Karaoke');"
		,	"흔들기 효과(&S)|openAddon('Shake');"
		,	"ASS 자막으로 변환(&A)|openAddon('ToAss');"
		,	"맞춤법 검사기|extSubmit(\"post\", \"http://speller.cs.pusan.ac.kr/results\", \"text1\");"
		,	"국어사전|extSubmit(\"get\", \"https://ko.dict.naver.com/%23/search\", \"query\");"
		]
	,	[	"도움말(&H)"
		,	"프로그램 정보|openHelp('info')"
		,	"기본 단축키|openHelp('key')"
		,	"싱크 표현에 대하여|openHelp('aboutSync')"
		,	"특수 태그에 대하여|openHelp('aboutTag')"
		,	"화면 싱크 매니저 도움말|openHelp('SyncManager')"
		]
	]
,	window:
	{	x: 0
	,	y: 0
	,	width: 640
	,	height: 920
	,	follow: true // 미리보기/플레이어 창 따라오기
	}
,	sync:
	{	insert: 1    // 싱크 입력 시 커서 이동
	,	update: 2    // 싱크 수정 시 커서 이동 / 예) 싱크 새로 찍기: 2
	,	weight: -450 // 가중치 설정
	,	unit: 42     // 싱크 조절량 설정 (기본값: 24fps이면 1프레임당 41.7ms)
	,	move: 2000   // 재생 이동 단위
	,	lang: "KRCC" // 그냥 아래 preset 설정으로 퉁치는 게 나은가...?
	,	preset: "<Sync Start={sync}><P Class={lang}{type}>" // 싱크 태그 형태
	}
,	command:
	{	withCtrls:
		{	'1': '/* 색상태그 */\n' + 'editor.tagging("<font color=\\"#aaaaaa\\">")'
		,	'2': '/* 여러 줄에 자동으로 줄표 넣어주기 */\n'
			   + 'var text = editor.getText();\n'
			   + 'var lines = text.text.split("\\n");\n'
			   + 'var lineNo = text.text.substring(0, text.selection[0]).split("\\n").length - 1;\n'
			   + 'var lineRange = [lineNo, lineNo];\n'
			   + 'while (lineRange[0] >= 0) {\n'
			   + '	if (lines[lineRange[0]].substring(0, 6).toUpperCase() == "<SYNC ") {\n'
			   + '		lineRange[0]++;\n'
			   + '		break;\n'
			   + '	}\n'
			   + '	lineRange[0]--;\n'
			   + '}\n'
			   + 'while (lineRange[1] < Math.min(lines.length, lineRange[0] + 5)) { // 과도한 작업 방지\n'
			   + '	if (lines[lineRange[1]].substring(0, 6).toUpperCase() == "<SYNC ") {\n'
			   + '		lineRange[1]--;\n'
			   + '		break;\n'
			   + '	}\n'
			   + '	lineRange[1]++;\n'
			   + '}\n'
			   + 'if (lineRange[0] < lineRange[1]) {\n'
			   + '	lineRange[1]++;\n'
			   + '	var newText = "- " + lines.slice(lineRange[0], lineRange[1]).join("<br>- ");\n'
			   + '	var cursor = lines.slice(0, lineRange[0]).join("\\n").length + 1;\n'
			   + '	lines.splice(lineRange[0], (lineRange[1] - lineRange[0]), newText);\n'
			   + '	editor.setText(lines.join("\\n"), [cursor, cursor]);\n'
			   + '}'
		,	'3': '/* 공백줄 */\n' + 'editor.inputText("<br><b>　</b>")'
		,	'4': '/* 기울임 */\n' + 'editor.taggingRange("<i>")'
		,	'5': '/* 밑줄 */\n'   + 'editor.taggingRange("<u>")'
		,	'6': '/* RUBY 태그 생성([쓰기|읽기]) */\n'
			   + 'var text = editor.getText();\n'
			   + 'if (text.selection[0] == text.selection[1]) {\n'
			   + '	return;\n'
			   + '}\n'
			   + '\n'
			   + 'var prev = text.text.substring(0, text.selection[0]);\n'
			   + 'var next = text.text.substring(text.selection[1]);\n'
			   + 'var blocks = text.text.substring(text.selection[0], text.selection[1]).split("[");\n'
			   + '\n'
			   + 'for (var i = 1; i < blocks.length; i++) {\n'
			   + '	var block = blocks[i];\n'
			   + '	var endIndex = block.indexOf("]");\n'
			   + '	if (endIndex > 0) {\n'
			   + '		var toRuby = block.substring(0, endIndex);\n'
			   + '		var divIndex = toRuby.indexOf("|");\n'
			   + '		if (divIndex > 0) {\n'
			   + '			var ruby = block.substring(0, divIndex);\n'
			   + '			var rt   = block.substring(divIndex + 1, endIndex);\n'
			   + '			var left = block.substring(endIndex + 1);\n'
			   + '			blocks[i] = "<RUBY>" + ruby + "<RT><RP>(</RP>" + rt + "<RP>)</RP></RT></RUBY>" + left;\n'
			   + '		} else {\n'
			   + '			blocks[i] = "[" + blocks[i];\n'
			   + '		}\n'
			   + '	} else {\n'
			   + '		blocks[i] = "[" + blocks[i];\n'
			   + '	}\n'
			   + '}\nvar result = blocks.join("");\n'
			   + '\n'
			   + 'editor.setText(prev + result + next, [text.selection[0], text.selection[0] + result.length]);'
		,	'M': '/* 화면 싱크 매니저 실행 */\n' + 'openAddon("SyncManager");'
		}
	,	withAlts:
		{	'1': '/* 맞춤법 검사기 */\n'
		       + 'var text = editor.getText();\n'
		       + 'extSubmit("post", "http://speller.cs.pusan.ac.kr/results", { text1: text.text.substring(text.selection[0], text.selection[1]) });'
		,	'2': '/* 국어사전 */\n'
		       + 'var text = editor.getText();\n'
		       + 'extSubmit("get", "https://ko.dict.naver.com/%23/search", { query: text.text.substring(text.selection[0], text.selection[1]) });'
		}
	,	withCtrlAlts:
		{	'C': '/* 겹치는 대사 합치기 */\n'    + 'openAddon("Combine");'
		,	'D': '/* 겹치는 대사 나누기 */\n'    + 'openAddon("Devide");'
		,	'F': '/* 싱크 유지 텍스트 대체 */\n' + 'openAddon("Fusion");'
		}
	,	withCtrlShifts:
		{	'F': '/* 중간 싱크 생성 */\n' + 'editor.fillSync();'
		,	'S': '/* 설정 */\n' + 'openSetting();'
		}
	}
,	autoComplete:
	{	"50" : ['@', [
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
	,	"57" : ['(', ['(|「', '(|『', '(|“', '()|「」', '()|『』', '()|“”']]
	,	"48" : [')', [')|」', ')|』', ')|”']]
	,	"188": ['<', [
			'<br>'
		,	'<RUBY>쓰기<RT><RP>(</RP>읽기<RP>)</RP></RT></RUBY>'
		,	'<font color="#cccccc">'
		]]
	,	"190": ['>', ['>>>|…']]
	}
,	useTab: true
,	css	:	".sync     { border-color: #000; }\n"
		+	".sync.error { background: #f88; }\n"
		+	".sync.equal { background: #8f8; }\n"
		+	".sync.range { color     : #888; }\n"
		+	"#editor .input { padding-bottom: 900px; } /* 에디터 하단 추가 스크롤 되도록 */\n"
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
		{	x: 640
		,	y: 720
		,	width: 1280
		,	height: 200
		}
	,	css : "background: #fff;\n"
			+ "color: #fff;\n"
			+ "font-size: 39.4px;\n"
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
		{	x: 640
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
var setting = DEFAULT_SETTING;