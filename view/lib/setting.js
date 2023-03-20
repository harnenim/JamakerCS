var DEFAULT_SETTING =
{	menu:
	// 유일하게 C#으로 그린 메뉴도 여기서 다 구성함
	// TODO: 설정 기능..이 필요한가??
	[	[	"파일(&F)"
		,	"새 파일(&N)|saveFile()"
		,	"열기(&O)|openFile()"
		,	"저장(&S)|saveFile()"
		,	"다른 이름으로 저장(&A)|saveFile(true)"
		]
	,	[	"편집(&S)"
		,	"찾기/바꾸기(&F)|SmiEditor.Finder.open()"
		,	"색상코드 입력(&C)|alert('어느 세월에 개발해')" // TODO: C#에서 작업 필요...
		,	"특수태그 정규화(&N)|tabs[tab].normalize()"
		,	"미리보기창 실행|SmiEditor.Viewer.open()"
		]
	,	[	"부가기능(&A)"
		,	"화면 싱크 매니저(&M)|openAddon('SyncManager')"
		,	"겹치는 대사 합치기(&C)|openAddon('Combine');"
		,	"겹치는 대사 나누기(&D)|openAddon('Devide');"
		,	"싱크 유지 텍스트 대체(&F)|openAddon('Fusion');"
		,	"맞춤법 검사기|extSubmit(\"post\", \"http://speller.cs.pusan.ac.kr/results\", \"text1\");"
		,	"국어사전|extSubmit(\"get\", \"https://ko.dict.naver.com/%23/search\", \"query\");"
		,	"설정(&S)|openSetting()"
		]
	,	[	"도움말(&H)"
		,	"프로그램 정보|alert(\"설명 페이지 만들어야 되는데 귀찮\\n\\n변태적인 SMI 자막 제작 기능을 위해 만든 허접한 프로그램\")"
		,	"화면 싱크 매니저 사용법(구버전임)|SmiEditor.Addon.open('https://noitamina.moe/SyncManager/index.html')"
		,	"싱크 표현에 대하여|alert(\"설명 페이지 만들어야 되는데 귀찮\\n\\n본 프로그램에선 일반적인 프로그램과 달리, 화면 싱크 기능이 존재합니다.\\n화면 싱크는 싱크 줄 맨 뒤의 닫는 꺽쇠(>) 앞의 공백문자로 구분되며\\n화면 싱크 매니저를 통해 Aegisub에서 편집할 수 있도록 지원합니다.\\n\\n그 외에, 탭문자로 중간 싱크를 체크하고 있으며\\n정규화를 거치면 자동으로 중간 싱크가 생성됩니다.\\n해당 기능과 관련해서, 한 싱크의 대사가 여러 줄이 되는 경우를 권장하지 않습니다.\")"
		,	"특수 태그에 대하여|alert(\"설명 페이지 만들어야 되는데 귀찮\\n\\n다음과 같은 특수 태그가 존재하며, 정규화를 통해 출력값을 만들어줍니다.\\n해당 기능은 탭문자로 체크된 중간 싱크를 생성합니다.\\n(─라고 써놓고 파싱 로직 수정하다 말았음)\\n\\n<font color=\\\"#9abcde\\\" fade=\\\"in\\\">페이드 인</font>\\n<font color=\\\"#89abcd\\\" fade=\\\"out\\\">페이드 아웃</font>\\n<font typing='typewriter'>테스트텍스트</font>\\n<font typing='keyboard'>테스트텍스트</font>\\n<font typing='keyboard(]'>테스트텍스트</font>\\n<font typing='keyboard[]'>테스트텍스트</font>\\n<font typing='keyboard invisible'>테스트텍스트</font>\\n<font typing='keyboard hangeul'>test텍스트</font>\\n\\n페이드 기능은 한 대사에 여러개를 넣을 수 있지만\\n타이핑 기능은 한 대사에 하나로 제한됩니다.\")"
		]
	]
,	window:
	{	x: 0
	,	y: 0
	,	width: 640
	,	height: 920
	,	follow: true // 미리보기/플레이어 창 따라오기... 설정하지 말고 무조건?
	}
,	sync:
	{	insert: 1    // 싱크 입력 시 커서 이동
	,	update: 2    // 싱크 수정 시 커서 이동 (기본: 0 / 싱크 새로 찍기: 2 등)
	,	weight: -450 // 가중치 설정
	,	unit: 42     // 싱크 조절량 설정 (24fps이면 1프레임당 41.7ms)
	,	move: 2000   // 앞으로/뒤로 이동 단위
	,	lang: "KRCC" // 그냥 아래 preset 설정으로 퉁치는 게 나은가...?
	,	preset: "<Sync Start={sync}><P Class={lang}{type}>" // 싱크 태그 형태
	}
,	command:
	{	withCtrls:
		{	'1': 'editor.tagging("<font color=\\"#aaaaaa\\">")'
		,	'2': '// 여러 줄에 자동으로 줄표 넣어주기\n'
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
			   + 'while (lineRange[1] < lines.length) {\n'
			   + '	if (lines[lineRange[1]].substring(0, 6).toUpperCase() == "<SYNC ") {\n'
			   + '		lineRange[1]--;\n'
			   + '		break;\n'
			   + '	}\n'
			   + '	lineRange[1]++;\n'
			   + '}\n'
			   + 'if (lineRange[0] < lineRange[1]) {\n'
			   + '	lineRange[1]++;\n'
			   + '	var newText = "- " + lines.slice(lineRange[0], lineRange[1]).join("<br>- ");\n'
			   + '	lines.splice(lineRange[0], (lineRange[1] - lineRange[0]), newText);\n'
			   + '	editor.setText(lines.join("\\n"), lineRange[0]);\n'
			   + '}'
		,	'3': 'editor.inputText("<br><b>　</b>")'
		,	'4': 'editor.taggingRange("<i>")'
		,	'5': 'editor.taggingRange("<u>")'
		,	'6': '// RUBY 태그 생성([쓰기|읽기])\n'
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
		,	'M': 'openAddon("SyncManager");' // 예제
		}
	,	withAlts:
		{	"1": "var text = editor.getText();\nextSubmit(\"post\", \"http://speller.cs.pusan.ac.kr/results\", { text1: text.text.substring(text.selection[0], text.selection[1]) });"
		,	"2": "var text = editor.getText();\nextSubmit(\"get\", \"https://ko.dict.naver.com/%23/search\", { query: text.text.substring(text.selection[0], text.selection[1]) });"
		,	'M': 'openAddon("SyncManager");' // 예제
		,	'N': 'openAddon("Normalizer");' // 예제 -> self.normalize()가 나은가...?
		}
	,	withCtrlAlts:
		{	'C': 'openAddon("Combine");'
		,	'D': 'openAddon("Devide");'
		,	'F': 'openAddon("Fusion");'
		}
	,	withCtrlShifts:
		{	'F': 'editor.fillSync();'
		,	'Q': 'editor.findSync();' // 웹브라우저로 테스트할 때 Alt+Q 안 돼서 넣은 건데 익숙해져버림...
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
,	newFile:"<SAMI>\n"
		+	"<HEAD>\n"
		+	"<TITLE>제목</TITLE>\n"
		+	"<STYLE TYPE=\"text/css\">\n"
		+	"<!--\n"
		+	"P { margin-left:8pt; margin-right:8pt; margin-bottom:2pt; margin-top:2pt;\n"
		+	"text-align:center; font-size:14pt; font-family:맑은 고딕, 굴림, arial, sans-serif;\n"
		+	"font-weight:normal; color:white;\n"
		+	"background-color:black; }\n"
		+	".KRCC { Name:한국어; lang:ko-KR; SAMIType:CC; }\n"
		+	"-->\n"
		+	"</STYLE>\n"
		+	"<!--\n"
		+	"우선 이 자막은 상업적으로 이용할만한 가치가 없으므로 이건 생략\n"
		+	"\n"
		+	"오역이 있으면 수정하지 마시고 블로그나 트위터 멘션을 주세요.\n"
		+	"하느@harne_\n"
		+	"-->\n"
		+	"</HEAD>\n"
		+	"<BODY>\n"
		+	"\n"
		+	"</BODY>\n"
		+	"</SAMI>"
,	viewer: {
		window:
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
	,	exts: "mp4,mkv,avi,ts,m2ts" // 동영상 파일 찾기 우선순위 순으로 -> TODO: 기능 안 만듦...
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