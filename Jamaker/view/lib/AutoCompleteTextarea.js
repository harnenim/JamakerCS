window.AutoCompleteTextarea = function(ta, sets, onSelect) {
	this.ta = ta;
	this.sets = sets ? sets : [];
	this.onSelect = onSelect;
	if (this.sets[0]) {
		// 일반 단어 자동완성은 정렬해서 표시
		this.sets[0][1].sort();
	} else {
		this.sets[0] = ["", []];
	}
	
	if (!AutoCompleteTextarea.view) {
		AutoCompleteTextarea.view = $("<ol class='act-select'>").hide().on("click", "li", function() {
			const act = AutoCompleteTextarea.opened;
			act.input($(this));
			act.close();
			if (act.onSelect) {
				act.onSelect();
			}
		});
		$("body").append(AutoCompleteTextarea.view);
	}
	this.resize();
	this.SB = 16; // 스크롤바 폭 계산하는 걸 만드는 게?
	
	this.pos = 0;	// 입력 시작 위치
	this.text = "";	// 입력값
	this.list = [];	// 선택 목록
	this.lis = [];	// 선택 <li>
	this.selected = -1; // 선택 항목
	
	ta.ac = this;
	
	ta.on("keydown", function(e) {
		if (ta.ac.selected >= 0) {
			switch (e.keyCode) {
				case 38: // ↑
				case 40: // ↓
				case 13: // Enter
				{	// 스크롤 튀는 것 방지
					e.preventDefault();
					break;
				}
			}
		}
	});
	ta.on("keyup", function(e) {
		if (ta.ac.selected >= 0) {
			ta.ac.onKeyup(e);
		}
		// else가 아닌 이유: 자동완성 닫았다 다시 열 수도 있음
		if (ta.ac.selected < 0) {
			if (!e.ctrlKey && !e.altKey) {
				ta.ac.onCheck(e);
			} else if (e.ctrlKey && (e.keyCode == 32)) { // Ctrl+SpaceBar
				ta.ac.openedByCtrl = true;
				ta.ac.onCheckWord();
			}
		}
	});
	ta.on("click", function() {
		ta.ac.close();
	});
}
AutoCompleteTextarea.prototype.resize = function() {
	const font = getComputedStyle(this.ta[0]);
	this.font = {
			"font-family": font.fontFamily
		,	"font-size"  : font.fontSize
		,	"font-weight": font.fontWeight
		,	"line-height": font.lineHeight
	};
	AutoCompleteTextarea.view.css(this.font);
	this.LH = Number(this.font["line-height"].split("px")[0]);
}
// 선택
AutoCompleteTextarea.prototype.select = function(index) {
	if (this.selected >= 0) {
		// 기존 항목 선택 해제
		this.lis[this.selected].removeClass("selected");
	}
	this.lis[this.selected = index].addClass("selected");
	
	// 스크롤됐을 수 있으므로 좌표도 한 번 갱신
	this.setPos();
}
// 열기
AutoCompleteTextarea.prototype.open = function(list) {
	if (list.length) {
		this.resize();
		this.list = list;
		this.lis = [];
		AutoCompleteTextarea.view.empty();
		for (let i = 0; i < list.length; i++) {
			const li = $("<li>").text(list[i]);
			this.lis.push(li);
			AutoCompleteTextarea.view.append(li);
		}
		AutoCompleteTextarea.view.height(this.lis.length * this.LH);
		this.select(0);
		this.setPos();
		AutoCompleteTextarea.view.show();
		AutoCompleteTextarea.opened = this;
	}
};
// 닫기
AutoCompleteTextarea.prototype.close = function() {
	AutoCompleteTextarea.view.hide();
	this.selected = -1;
	this.openedByCtrl = false;
};
// 커서 위치에 선택기 이동
AutoCompleteTextarea.prototype.setPos = function() {
	const offset = this.getOffset();
	
	const css = {};
	
	// 입력 위치 이전 내용
	let tmp = this.ta.val().substring(0, this.pos).split("\n");
	
	// 줄 높이로 top 계산
	css.top = offset.top + tmp.length * this.LH - this.ta.scrollTop();
	
	// 마지막 줄 width 계산해서 left로 활용
	tmp = tmp[tmp.length - 1];
	this.ta.parent().append(tmp = $("<span>").css(this.font).text(tmp));
	css.left = tmp.width() - (this.ta.scrollLeft() - offset.left);
	tmp.remove();
	
	// 아래쪽에 넘칠 경우 맞춤
	if (css.top + AutoCompleteTextarea.view.height() > offset.top + this.ta.outerHeight() - this.SB) {
		css.top -= (AutoCompleteTextarea.view.height() + LH);
	}
	
	// 오른쪽에 넘칠 경우 맞춤
	css.left = Math.min(css.left, offset.left + this.ta.width() - this.SB - AutoCompleteTextarea.view.width());
	
	AutoCompleteTextarea.view.css(css);
}
AutoCompleteTextarea.prototype.getOffset = function() {
	const offset = this.ta.offset();
	offset.top  += Number(this.ta.css("padding-top" ).split("px")[0]);
	offset.left += Number(this.ta.css("padding-left").split("px")[0]);
	return offset;
}
AutoCompleteTextarea.prototype.onKeyup = function(e) {
	switch (e.keyCode) {
		case 38: { // ↑
			e.preventDefault();
			// 선택 위로 이동
			const selected = this.selected - 1;
			if (selected >= 0) {
				this.select(selected);
			}
			break;
		}
		case 40: { // ↓
			e.preventDefault();
			// 선택 아래로 이동
			const selected = this.selected + 1;
			if (selected < this.lis.length) {
				this.select(selected);
			}
			break;
		}
		case 17: // Ctrl
		{
			if (this.openedByCtrl) {
				// Ctrl+SpaceBar로 연 직후
				e.preventDefault();
				this.openedByCtrl = false;
				break;
			}
			// Alt/Esc와 마찬가지로 끄기
		}
		case 18: // Alt
		case 27: // Esc
		{
			e.preventDefault();
			// 선택 취소
			this.close();
			break;
		}
		case 13: { // Enter
			if (e.altKey || e.ctrlKey || e.shiftKey) {
				// 선택 취소로 간주
				
			} else {
				e.preventDefault();
				
				// 현재 항목 입력 및 커서 이동
				this.input(this.lis[this.selected]);
			}
			
			// 선택 닫기
			this.close();
			
			if (this.onSelect) {
				this.onSelect();
			}
			
			break;
		}
		default: {
			// 백스페이스든 방향키든 뒤로 간 경우: 선택 취소
			if (this.ta[0].selectionEnd <= this.pos) {
				this.close();
				break;
			}
			
			this.afterInput();
		}
	}
};
AutoCompleteTextarea.prototype.input = function(li) {
	let pos = this.pos;
	let value = li.text();
	if (value.indexOf("|") > 0) {
		value = value.split("|")[1];
	}
	this.ta.val(this.text.substring(0, pos) + value + this.text.substring(this.end));
	pos += value.length;
	this.ta[0].setSelectionRange(pos, pos);
	
	// 커서 위치에 맞게 스크롤 이동
	let tmp = this.ta.val().substring(0, pos).split("\n");
	tmp = tmp[tmp.length - 1];
	this.ta.parent().append(tmp = $("<span>").text(tmp));
	const targetLeft = tmp.width() - this.ta.width() + this.SB;
	tmp.remove();
	if (targetLeft > this.ta.scrollLeft()) {
		this.ta.scrollLeft(targetLeft);
	}
}
AutoCompleteTextarea.prototype.afterInput = function() {
	// 최초 리스트에서 현재 입력값에 대해 검색
	const value = this.ta.val().substring(this.pos, this.ta[0].selectionEnd);
	this.lis = [];
	AutoCompleteTextarea.view.empty();
	for (let i = 0; i < this.list.length; i++) {
		// 설정 순서대로 표시하려고 정렬 없이 전체 비교를 돌리는데
		// 기능 특성상 전체를 돌려도 연산량이 과도하진 않을 듯함
		if (this.list[i].substring(0, value.length) == value) {
			const li = $("<li>").text(this.list[i]);
			this.lis.push(li);
			AutoCompleteTextarea.view.append(li);
		}
	}
	if (this.lis.length) {
		AutoCompleteTextarea.view.height(this.lis.length * this.LH);
		// 첫 번째 항목 선택
		this.select(0);
		
	} else {
		// 검색된 게 없으면 선택 취소
		this.close();
	}
}
AutoCompleteTextarea.prototype.onCheck = function(e) {
	const c = e.keyCode;
	const text = this.ta.val();
	const pos = this.ta[0].selectionEnd - 1;
	
	const sets = this.sets[""+e.keyCode];
	if (sets && sets[0] == text[pos]) {
		this.text = text;
		this.pos = pos;
		this.end = pos + 1;
		this.open(AutoCompleteTextarea.getList(text, pos, sets[1]));
	}
}
AutoCompleteTextarea.getList = function(text, pos, list) {
	return list;
}
AutoCompleteTextarea.wordBreaker = " \t\r\n()<>[]{},.`'\"?!;:/\\";
AutoCompleteTextarea.prototype.onCheckWord = function(e) {
	const text = this.ta.val();
	
	const end = this.ta[0].selectionEnd;
	let start = this.ta[0].selectionStart;
	
	if (start == end) {
		// 블록지정 없을 때
		while (start > 0) {
			start--;
			const c = text[start];
			if (AutoCompleteTextarea.wordBreaker.indexOf(c) >= 0) {
				start++;
				break;
			}
		}
	}
	if (start == end) {
		// 단어 없을 때
		return;
	}
	
	const word = text.substring(start, end);
	{
		this.text = text;
		this.pos = start;
		this.end = end;
		this.open(this.sets[0][1]);
		this.afterInput();
	}
}
AutoCompleteTextarea.prototype.on = function(a, b) {
	this.ta.on(a, b);
}
