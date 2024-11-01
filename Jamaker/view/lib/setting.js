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
	var lastNotifyForCommand = "2023.04.07.v2";
	var lastNotifyForAutoComplete = "";
	var lastNotifyForStyle = "2023.04.06.v1";
	var lastNotifyForMenu = "2023.08.28.v1";
}

var DEFAULT_SETTING =
{	version: "2024.03.04.v1"
,	menu:
	// 유일하게 C#으로 그린 메뉴도 여기서 다 구성함
	[	[	"파일(&F)"
		,	"새 파일(&N)|newFile()"
		,	"열기(&O)...|openFile()"
		,	"현재 동영상의 자막 열기|openFileForVideo()"
		,	"저장(&S)|saveFile()"
		,	"다른 이름으로 저장(&A)...|saveFile(true)"
		]
	,	[	"편집(&E)"
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
		,	"니코동 효과(&N)|openAddon('Nico');"
		,	"ASS 자막으로 변환(&A)|openAddon('ToAss');"
		,	"재생 속도 조절|openAddon('Speed');"
		,	"맞춤법 검사기|extSubmit(\"post\", \"https://nara-speller.co.kr/speller/results\", \"text1\");"
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
	,	frame: true
	}
,	command:
	{	fn: // F1~F12: pqrstuvwxyz{
		{	't': '/* 기본 싱크 */\n' + 'editor.insertSync()'
		,	'u': '/* 화면 싱크 */\n' + 'editor.insertSync(true)'
		,	'v': '/* 기본/화면 싱크 토글 */\n' + 'editor.toggleSyncType()'
		,	'w': '/* 선택 영역 싱크 삭제 */\n' + 'editor.removeSync()'
		,	'x': '/* 재생/일시정지 */\n' + 'SmiEditor.PlayerAPI.playOrPause()'
		,	'y': '/* 재생 */\n' + 'SmiEditor.PlayerAPI.play();\n'
			   + '// ※ 정지화면 있을 경우 재생 중인지 확신이 안 설 때가 있어서\n'
			   + '//    토글이 아닌 재생이 있는 게 맞을 듯'
		,	'z': '/* 정지 */\n' + 'SmiEditor.PlayerAPI.stop()'
		}
	,	withCtrls:
		{	't': '/* 일괄 싱크 찍기 */\n' + 'editor.reSync();'
		,	'1': '/* 색상태그 */\n' + 'editor.tagging("<font color=\\"#aaaaaa\\">")'
		,	'2': '/* 한 줄씩 줄표 넣어주기 */\n'
			   + 'var text = editor.getText();\n'
			   + 'var lines = text.text.split("\\n");\n'
			   + 'var lineNo = text.text.substring(0, text.selection[0]).split("\\n").length - 1;\n'
			   + '// 현재 싱크 맨 윗줄 찾기\n'
			   + 'var syncLineNo = lineNo;\n'
			   + 'while (syncLineNo >= 0) {\n'
			   + '	if (lines[syncLineNo].substring(0, 6).toUpperCase() == "<SYNC ") {\n'
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
			   + 'var cursor = lines.slice(0, syncLineNo + 1).join("\\n").length + 1;\n'
			   + 'lines.splice(syncLineNo + 1, 2, (lines[syncLineNo + 1] + "<br>" + lines[syncLineNo + 2]));\n'
			   + 'editor.setText(lines.join("\\n"), [cursor, cursor]);'
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
		,	'9': '/* 색상태그 시작 */\n' + 'editor.inputText("<font color=\\"#aaaaaa\\">")'
		,	'0': '/* 색상태그 종료 */\n' + 'editor.inputText("</font>")'
		,	'D': '/* 줄 삭제 */\n' + 'editor.deleteLine();'
		,	'M': '/* 화면 싱크 매니저 실행 */\n' + 'openAddon("SyncManager");'
		,	'Q': '/* 현재 위치 재생 */\n' + 'editor.moveToSync();'
		}
	,	withAlts:
		{	't': '/* 일괄 싱크 입력 */\n' + 'editor.reSyncPrompt();'
		,	'1': '/* 맞춤법 검사기 */\n'
			   + 'var text = editor.getText();\n'
			   + 'extSubmit("post", "http://speller.cs.pusan.ac.kr/results", "text1");'
		,	'2': '/* 국어사전 */\n'
			   + 'var text = editor.getText();\n'
			   + 'extSubmit("get", "https://ko.dict.naver.com/%23/search", "query");'
		,	'Q': '/* 재생 위치 찾기 */\n' + 'editor.findSync();'
		}
	,	withCtrlAlts:
		{	'C': '/* 겹치는 대사 결합 */\n'      + 'openAddon("Combine");'
		,	'D': '/* 겹치는 대사 분리 */\n'      + 'openAddon("Devide");'
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
	
	, { from: "지구 상"   , to: "지구상"  , use: true } // 2017년 맞춤법 변경사항
	, { from: "지도 상"   , to: "지도상"  , use: true }
	, { from: "직선 상"   , to: "직선상"  , use: true }
	, { from: "궤도 상"   , to: "궤도상"  , use: true }
	, { from: "인터넷 상" , to: "인터넷상", use: true }
	
	, { from: "불어"      , to: "프랑스어", use: false }
	, { from: "더프랑스어", to: "더불어"  , use: false }
	, { from: "비어"      , to: "맥주"    , use: false }
	, { from: "맥주있"    , to: "비어있"  , use: false }
	, { from: "터키"      , to: "튀르키예", use: false }
	, { from: "켄튀르키예", to: "켄터키"  , use: false }
	]
,	tempSave: 300
,	useTab: false // 탭 사용 기본값은 꺼두는 걸로
,	css	:	".sync     { border-color: #000; }\n"
		+	".sync.error { background: #f88; }\n"
		+	".sync.equal { background: #8f8; }\n"
		+	".sync.range { color     : #888; }\n"
		+	".tab.not-saved { background: #f86; } /* 저장 안 됐을 때 표시 */\n"
		+	"\n"
		+	"/* 다크테마 예제 * /\n"
		+	".sync     { border-color: #fff; }\n"
		+	".sync.error { background: #088; }\n"
		+	".sync.equal { background: #808; }\n"
		+	".sync.range { color     : #888; }\n"
		+	"* { color: #fff; }\n"
		+	"body, .th.selected, .th:hover, .tab > .col-sync { background: #0f0f0f; }\n"
		+	".th.selected { border-bottom-color: #0f0f0f; }\n"
		+	"#tabSelector { background: #333; }\n"
		+	".th { background: #222; }\n"
		+	"input, textarea { background: #000; }\n"
		+	"button { background: #222; }\n"
		+	".tab > .input { border-color: #666; }\n"
		+	"/* */\n"
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