var AutoCompleteTextarea = function(ta, sets, onSelect) {
	this.ta = ta;
	this.sets = sets ? sets : [];
	this.onSelect = onSelect;

	var font = getComputedStyle(ta[0]);
	this.font = {
			"font-family": font.fontFamily
		,	"font-size"  : font.fontSize
		,	"font-weight": font.fontWeight
		,	"line-height": font.lineHeight
	};
	$("body").append(this.view = $("<ol class='act-select'>").css(this.font).hide());
	
	this.LH = Number(this.font["line-height"].split("px")[0]);
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
		if (ta.ac.selected < 0 && !e.ctrlKey && !e.altKey) {
			ta.ac.onCheck(e);
		}
	});
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
		this.list = list;
		this.lis = [];
		this.view.empty();
		for (var i = 0; i < list.length; i++) {
			var li = $("<li>").text(list[i]);
			this.lis.push(li);
			this.view.append(li);
		}
		this.view.height(this.lis.length * this.LH);
		this.select(0);
		this.setPos();
		this.view.show();
	}
};
// 닫기
AutoCompleteTextarea.prototype.close = function() {
	this.view.hide();
	this.selected = -1;
};
// 커서 위치에 선택기 이동
AutoCompleteTextarea.prototype.setPos = function() {
	var offset = this.getOffset();
	
	var css = {};
	
	// 입력 위치 이전 내용
	var tmp = this.ta.val().substring(0, this.pos).split("\n");
	
	// 줄 높이로 top 계산
	css.top = offset.top + tmp.length * this.LH - this.ta.scrollTop();
	
	// 마지막 줄 width 계산해서 left로 활용
	tmp = tmp[tmp.length - 1];
	this.ta.parent().append(tmp = $("<span>").css(this.font).text(tmp));
	css.left = tmp.width() - (this.ta.scrollLeft() - offset.left);
	tmp.remove();
	
	// 아래쪽에 넘칠 경우 맞춤
	if (css.top + this.view.height() > offset.top + this.ta.height() - this.SB) {
		css.top -= (this.view.height() + LH);
	}

	// 오른쪽에 넘칠 경우 맞춤
	css.left = Math.min(css.left, offset.left + this.ta.width() - this.SB - this.view.width());
	
	this.view.css(css);
}
AutoCompleteTextarea.prototype.getOffset = function() {
	var offset = this.ta.offset();
	offset.top  += Number(this.ta.css("padding-top" ).split("px")[0]);
	offset.left += Number(this.ta.css("padding-left").split("px")[0]);
	return offset;
}
AutoCompleteTextarea.prototype.onKeyup = function(e) {
	switch (e.keyCode) {
		case 38: { // ↑
			e.preventDefault();
			// 선택 위로 이동
			var selected = this.selected - 1;
			if (selected >= 0) {
				this.select(selected);
			}
			break;
		}
		case 40: { // ↓
			e.preventDefault();
			// 선택 아래로 이동
			var selected = this.selected + 1;
			if (selected < this.lis.length) {
				this.select(selected);
			}
			break;
		}
		case 27: { // Esc
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
				var pos = this.pos;
				var value = this.lis[this.selected].text();
				if (value.indexOf("|") > 0) {
					value = value.split("|")[1];
				}
				this.ta.val(this.text.substring(0, pos) + value + this.text.substring(pos+1));
				pos += value.length;
				this.ta[0].setSelectionRange(pos, pos);
				
				// 커서 위치에 맞게 스크롤 이동
				var tmp = this.ta.val().substring(0, pos).split("\n");
				tmp = tmp[tmp.length - 1];
				this.ta.parent().append(tmp = $("<span>").text(tmp));
				var targetLeft = tmp.width() - this.ta.width() + this.SB;
				tmp.remove();
				if (targetLeft > this.ta.scrollLeft()) {
					this.ta.scrollLeft(targetLeft);
				}
			}
			
			// 선택 닫기
			this.close();
			
			if (this.onSelect) {
				this.onSelect();
			}
			
			break;
		}
		default: {
			var end = this.ta[0].selectionEnd;
			
			// 백스페이스든 방향키든 뒤로 간 경우: 선택 취소
			var length = end - this.pos;
			if (length <= 0) {
				this.close();
				break;
			}
			
			// 최초 리스트에서 현재 입력값에 대해 검색
			var value = this.ta.val().substring(this.pos, end);
			this.lis = [];
			this.view.empty();
			for (var i = 0; i < this.list.length; i++) {
				if (this.list[i].substring(0, length) == value) {
					var li = $("<li>").text(this.list[i]);
					this.lis.push(li);
					this.view.append(li);
				}
			}
			if (this.lis.length) {
				this.view.height(this.lis.length * this.LH);
				// 첫 번째 항목 선택
				this.select(0);
				
			} else {
				// 검색된 게 없으면 선택 취소
				this.close();
			}
		}
	}
};
AutoCompleteTextarea.prototype.onCheck = function(e) {
	var c = e.keyCode;
	var text = this.ta.val();
	var pos = this.ta[0].selectionEnd - 1;
	
	var sets = this.sets[""+e.keyCode];
	if (sets && sets[0] == text[pos]) {
		this.text = text;
		this.pos = pos;
		this.open(sets[1]);
	}
}
AutoCompleteTextarea.prototype.on = function(a, b) {
	this.ta.on(a, b);
}
