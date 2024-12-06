$(function() {
	var style = $("#style_highlight");
	if (style.length == 0) {
		$("head").append(style = $("<style>").attr({ id: "style_highlight" }));
	}
	style.html("\n"
		+	".highlight-textarea > div .clamp,\n"
		+	".highlight-textarea > div .tag   { color: #3F7F7F; }\n"
		+	".highlight-textarea > div .attr  { color: #AB0095; }\n"
		+	".highlight-textarea > div .value { color: #2A00FF; }\n"
		+	".highlight-textarea > div .comment,\n"
		+	".highlight-textarea > div .sync  { color: #3F5FBF; }\n"
	);
});

SmiEditor.highlightText = function(text, state=null) {
	var previewLine = $("<span>").data({ state: state });
	if (state == null && text.toUpperCase().startsWith("<SYNC ")) {
		return previewLine.addClass("sync").text(text).data({ next: null });
	}
	
	/*
	 * 상태값
	 * 텍스트: null
	 * 태그?!: /
	 * 태그명: <
	 * 태그내: >
	 * 속성명: a
	 * 속성값: =, ', "
	 * 주석  : !
	 */
	var pos = 0;
	var html = "";
	switch (state) {
		case '/': html = "<span class='clamp'>"; break;
		case '>': html = "<span class='tag'  >"; break;
		case "'": html = "<span class='value'>"; break;
		case '"': html = "<span class='value'>"; break;
		case '!': html = "<span class='comment'>"; break;
	}
	
	for (var pos = 0; pos < text.length; pos++) {
		var c = text[pos];
		switch (state) {
			case '/': { // 태그?!
				state = '<';
				if (c == '/') { // 종료 태그 시작일 경우
					html += "/</span><span class='tag'>";
					break;
				}
				// 종료 태그 아닐 경우 아래로 이어서 진행
				html += "</span><span class='tag'>";
			}
			case '<': { // 태그명
				switch (c) {
					case '>': { // 태그 종료
						html += "</span><span class='clamp'>&gt;</span>";
						state = null;
						break;
					}
					case ' ': { // 태그명 끝
						html += '</span>&nbsp;';
						state = '>';
						break;
					}
					case '\t': {
						html += '</span>&#09;';
						state = '>';
						break;
					}
					case '<': { // 잘못된 문법
						html += "&lt;";
						break;
					}
					case '&': {
						html += "&amp;";
						break;
					}
					default: {
						html += c;
						break;
					}
				}
				break;
			}
			case '>': { // 태그 내
				switch (c) {
					case '>': { // 태그 종료
						html += "</span><span class='clamp'>&gt;</span>";
						state = null;
						break;
					}
					case ' ': {
						html += '&nbsp;';
						break;
					}
					case '\t': {
						html += '&#09;';
						break;
					}
					case '<': { // 잘못된 문법
						html += "&lt;";
						break;
					}
					case '&': {
						html += "&amp;";
						break;
					}
					default: { // 속성명 시작
						html += "<span class='attr'>" + c;
						state = 'a';
						break;
					}
				}
				break;
			}
			case 'a': { // 속성명
				switch (c) {
					case '>': { // 태그 종료
						html += "</span></span><span class='clamp'>&gt;</span>";
						state = null;
						break;
					}
					case '=': { // 속성값 시작
						html += "</span>=<span class='value'>";
						state = '=';
						break;
					}
					/*
					case ' ': { // 속성 종료
						html += "</span>&nbsp;";
						state = '>';
						break;
					}
					case '\t': {
						html += "</span>&#09;";
						state = '>';
						break;
					}
					*/
					case ' ': { // 일단은 속성이 끝나지 않을 걸로 간주
						html += "&nbsp;";
						state = '`';
						break;
					}
					case '\t': {
						html += "&#09;";
						state = '`';
						break;
					}
					default: {
						html += c;
					}
				}
				break;
			}
			case '`': { // 속성명+공백문자
				switch (c) {
					case '>': { // 태그 종료
						html += "</span></span><span class='clamp'>&gt;</span>";
						state = null;
						break;
					}
					case '=': { // 속성값 시작
						html += "</span>=<span class='value'>";
						state = '=';
						break;
					}
					case ' ': { // 일단은 속성이 끝나지 않을 걸로 간주
						html += "&nbsp;";
						break;
					}
					case '\t': {
						html += "&nbsp;";
						break;
					}
					default: { // 속성값 없는 속성으로 확정, 새 속성 시작
						html += "</span><span class='attr'>" + c;
						state = 'a';
					}
				}
				break;
			}
			case '=': { // 속성값 시작 전
				switch (c) {
					case '>': { // 태그 종료
						html += "</span></span><span class='clamp'>&gt;</span>";
						state = null;
						break;
					}
					case '"': { // 속성값 따옴표 시작
						html += c;
						state = '"';
						break;
					}
					case "'": { // 속성값 따옴표 시작
						html += c;
						state = "'";
						break;
					}
					case ' ': { // 일단은 속성이 끝나지 않은 걸로 간주
						html += "&nbsp;";
						break;
					}
					case '\t': {
						html += "&#09;";
						break;
					}
					case '<': { // 따옴표 없는 속성값
						html += "&lt;";
						state = '~';
						break;
					}
					case '&': {
						html += "&amp;";
						state = '~';
						break;
					}
					default: {
						html += c;
						state = '~';
					}
				}
				break;
			}
			case '~': { // 따옴표 없는 속성값
				switch (c) {
					case '>': { // 태그 종료
						html += "</span></span><span class='clamp'>&gt;</span>";
						state = null;
						break;
					}
					case ' ': { // 속성 종료
						html += "</span>&nbsp;";
						state = '>';
						break;
					}
					case '\t': {
						html += "</span>&#09;";
						state = '>';
						break;
					}
					default: {
						html += c;
					}
				}
				break;
			}
			case '"': {
				switch (c) {
					case '"': {
						html += '"</span>';
						state = '>';
						break;
					}
					case ' ': {
						html += "&nbsp;";
						break;
					}
					case '\t': {
						html += "&#09;";
						break;
					}
					case '<': {
						html += "&lt;";
						break;
					}
					case '&': {
						html += "&amp;";
						break;
					}
					default: {
						html += c;
					}
				}
				break;
			}
			case "'": {
				switch (c) {
					case "'": {
						html += "'</span>";
						state = '>';
						break;
					}
					case ' ': {
						html += "&nbsp;";
						break;
					}
					case '\t': {
						html += "&#09;";
						break;
					}
					case '<': {
						html += "&lt;";
						break;
					}
					case '&': {
						html += "&amp;";
						break;
					}
					default: {
						html += c;
					}
				}
				break;
			}
			case '!': { // 주석
				if ((pos + 3 <= text.length) && (text.substring(pos, pos+3) == "-->")) {
					html += "--&gt;</span>";
					state = null;
					pos += 2;
				} else {
					switch (c) {
						case '<': {
							html += "&lt;";
							break;
						}
						case '&': {
							html += "&amp;";
							break;
						}
						default: {
							html += c;
						}
					}
				}
				break;
			}
			default: { // 텍스트
				switch (c) {
					case '<': { // 태그 시작
						if ((pos + 4 <= text.length) && (text.substring(pos, pos+4) == "<!--")) {
							html += "<span class='comment'>&lt;!--";
							state = '!';
							pos += 3;
						} else {
							html += "<span class='clamp'>&lt;";
							state = '/';
						}
						break;
					}
					case '&': {
						html += "&amp;";
						break;
					}
					case ' ': {
						html += '&nbsp;';
						break;
					}
					case '\t': {
						html += '&#09;';
						break;
					}
					default: {
						html += c;
					}
				}
			}
		}
	}

	switch (state) {
		case '<':
		case '/':
		case 'a':
		case '`':
		case '=':
		case '~':
			state = null;
	}
	return previewLine.html(html ? html : "").data({ next: state });
}