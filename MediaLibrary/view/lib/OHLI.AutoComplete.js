/**
 * 자동완성 컴포넌트
 */

{	// OHLI.js import 안 됐을 경우에도 동작 보장
	if (!window.OHLI) OHLI = {};
	if (!String.prototype.replace) {
		String.prototype.replace = function(a, b) {
			return this.split(a).join(b);
		};
	}
	if (!String.prototype.startsWith) {
		String.prototype.startsWith = function(a) {
			if (typeof(a) == "string") {
				if (this.length >= a.length) {
					return this.substring(0, a.length) == a;
				}
			}
			return false;
		}
	}
}

/*
 * <input data-ajax="자동완성 목록 url {query}" data-key="key로 쓸 속성명" data-display="입력폼 값의 속성명" />
 * 
 * selected
 * -2: non-searching mode - 목록이 닫힌 상태
 * -1: not-selected       - 입력 중, 목록은 열렸으나 미선택
 * 0~: 목록에서 선택 중
 */

OHLI.AutoComplete = function(input) {
	this.input = input.attr("autocomplete", "off"); // 브라우저 자동완성 차단
	var data = input.data();
	if (data == null) data = {};
	this.key     = data.key     ? data.key     : "key";
	this.display = data.display ? data.display : "value";
	this.ajax = data.ajax; // 자동완성 목록 url
	this.func = data.func; // 자동완성 목록 호출 함수
	this.appendex = []; // 기능 테스트용 값 넣을 부분
	this.selected = -2; // 초기 상태: non-searching mode
	if (data.selected) { // 초기값 있을 경우
		input.data({"key": data.selected, "value": input.val()}).addClass("selected");
	} else {
		input.data({"key": 0, "value": ""});
	}

	var obj = this;
	var combobox = this.combobox = $("<ol>").hide();
	combobox.addClass("auto-complete").css({
			"width"    : data.width  ? this.width = data.width  : input.outerWidth() // 별도 margin 입력을 지원할지?
		,	"maxHeight": data.height ? data.height : 300
	});
	$("body").append(combobox);

	// li, setLiText 재정의 가능
	this.li = $("<li>").css({
			"fontFamily": input.css("fontFamily")
		,	"fontSize"  : input.css("fontSize"  )
	});
	this.setLiText = function(li, text) {
		li.text(text);
	}
	this.newLi = function(index, key, text) {
		var li = this.li.clone();
		li.data("index", index);
		li.data("key", key);
		this.setLiText(li, text);
		return li;
	}

	// ↑↓키 연속 입력 상태 체크
	this.movingUp = 0;
	this.movingDn = 0;
	
	input.on("keydown", function(e) { obj.keydown(e); });
	input.on("keyup"  , function(e) { obj.keyup  (e); });
	input.on("focusin", function() { obj.keyup({keyCode:1}) });
	input.on("focusout", function() { setTimeout(function() { obj.closeCombobox(true); }, 100); /* setTimeout 안 하면 click이 안 됨 */ });
	combobox.on("mousemove", "li", function() { obj.selecting($(this)); });
	combobox.on("mouseup"  , "li", function() { obj.select   ($(this)); });
	
	input.data("obj", this);
}
OHLI.AutoComplete.prototype.setLi = function(li) {
	this.li = li;
}

// 현재 좌표를 구해서 combobox 열기
OHLI.AutoComplete.prototype.openCombobox = function() {
	this.selected = -1; // searching mode - not selected
	var css = {
			left: this.input.offset().left
		,	top : this.input.offset().top + this.input.outerHeight() - 1
	};
	if (!this.width) {
		css.width = this.input.outerWidth();
	}
	if (this.combobox.css("position") == "fixed") {
		css.left -= $(document).scrollLeft();
		css.top  -= $(document).scrollTop();
	}
	this.combobox.css(css);
	this.combobox.show();
};

// combobox 닫기
OHLI.AutoComplete.prototype.closeCombobox = function(isCancel) {
	if (this.selected == -2) {
		// combobox가 열려있지 않았으면 그냥 끝
		return;
	}
	this.selected = -2; // non-searching mode
	this.combobox.hide();
	if (isCancel) {
		// 선택 취소하고 닫는 경우 원래 입력값 복구
		this.input.val(this.input.data("key") ? this.input.data("value") : this.query);
	}
};

// 방향키 등으로 선택 항목이 바뀔 때
OHLI.AutoComplete.prototype.selecting = function(li) {
	// 기존 것 선택 해제
	this.combobox.find("li.selected").removeClass("selected");

	// 새로 선택된 항목
	this.selected = li.addClass("selected").data("index");
	
	// 위아래로 스크롤해야 보이는 항목일 경우 조절
	var value = li.offset().top - this.combobox.offset().top;
	if (value < 0) {
		this.combobox.scrollTop(this.combobox.scrollTop() + value);
		
	} else {
		value = (li.offset().top + li.height()) - (this.combobox.offset().top + this.combobox.height());
		if (value > 0) {
			this.combobox.scrollTop(this.combobox.scrollTop() + value);
		}
	}

	var item = this.list[this.selected];
	if (item[this.key]) {
		// 선택 항목이 있을 경우: 선택값으로 채워주기
		this.input.val(item[this.display]);
		this.anti229 = true; // 크롬에서 한글 입력 종료 시 이벤트 막기
	} else {
		// 선택 항목이 없을 경우 = 맨 위로 올라가거나 했을 경우: 원래 입력값 복구
		this.input.val(this.query);
	}
}

// 선택을 마칠 때
OHLI.AutoComplete.prototype.select = function(li) {
	if (li == null) {
		// 선택된 게 없을 경우
		this.clear();
		
	} else {
		this.selected = li.data("index");
		
		var item = this.list[this.selected];
		if (item[this.key]) {
			// 선택 key값/display값 채워주기
			this.input.val(this.query = item[this.display])
			          .data("key", item[this.key])
			          .data("item", item)
			          .data("value", this.query)
			          .addClass("selected");
			
		} else if (item.func && typeof(item.func) == "function") {
			// 별도의 선택 함수가 정의된 경우 - 테스트 시에만 존재
			this.input.val(this.query)
			          .data("key", 0)
			          .data("item", {})
			          .data("value", "")
			          .removeClass("selected");
			item.func();
		}
	}
	this.closeCombobox();
	this.query = "";
	
	// 선택 후 작업이 있을 경우
	if (this.afterSelect) {
		this.afterSelect();
	}
};
OHLI.AutoComplete.prototype.clear = function(withValue) {
	this.input.data("key", 0).data("value", "").removeClass("selected");
	if (withValue) this.input.val("");
}

OHLI.AutoComplete.prototype.keydown = function(e) {
	switch(e.keyCode) {
		case 13 : // Enter
			if (this.selected < -1) {
				// not select mode
				
			} else {
				e.preventDefault();
				
				if (this.selected < 0) {
					// no selected item
					this.select(null);
					
				} else {
					// set from selected item
					this.select($(this.combobox.children()[this.selected]));
				}
			}
			
			break;
		
		case 27 : // Esc
			this.closeCombobox(true);
			break;
	
		case 38 : // ↑
			e.preventDefault();
			this.moveToUp((this.movingUp = new Date().getTime()), 500); // 초기속도 지정
			break;
	
		case 40 : // ↓
			e.preventDefault();
			this.moveToDn((this.movingDn = new Date().getTime()), 500);
			break;
	}
};
OHLI.AutoComplete.prototype.keyup = function(e) {
	this.movingUp = this.movingDn = false;
	switch(e.keyCode) {
		case 13 : // Enter
		case 27 : // Esc
		case 38 : // ↑
		case 40 : // ↓
			break;
			
		case 36 : // Home
			if (this.selected < 0) break;
			var li = this.combobox.find("li:eq(0)");
			this.selecting(li);
			break;
	
		case 35 : // End
			if (this.selected < -1) break;
			if (this.selected == -1) {
				var li = this.combobox.find("li:eq(0)");
				this.selecting(li);
			} else {
				var li = this.combobox.find("li:eq(" + (this.list.length - 1) + ")");
				this.selecting(li);
			}
			break;
			
		case 1 : // onfocus
			if (this.input.data("key") > 0) {
				// 기존에 선택된 게 있었으면 무시
				break;
			}
			// 기존에 선택된 게 없었으면 아래의 검색과 같은 과정을 거침
	
		default : // search
			if (!this.ajax && !this.func) {
				break;
			}
			if (this.anti229 && e.keyCode == 229) { // 크롬에서 한글 입력 종료 시 229 찍히는 것 무시
				this.anti229 = false;
				break;
			}
			var query = this.query = this.input.val();
			
			if (query.length > 0) {
				query = query.replace("?", "").replace("#", "").replace(".", " ").replace("　", " ").trim();
				if (this.ajax) {
					var ac = this;
					$.ajax({"url" : this.ajax.replace("{query}", encodeURIComponent(query))
						,	"dataType": "json"
						,	"success" : function(result) {
								ac.afterSearch(query, result);
							}
					});
				} else {
					OHLI.AutoComplete.last = this;
					//eval(this.func)(query, "OHLI.AutoComplete.afterSearch");
					var keys = this.func.split(".");
					var item = window;
					for (var i = 0; i < keys.length - 1; i++) {
						item = item[keys[i]];
					}
					item[keys[keys.length - 1]](query, "OHLI_AutoComplete_afterSearch");
				}
				// 선택된 게 없는 상태로 combobox 열기
				this.input.removeClass("selected");
				this.openCombobox();
	
			} else {
				// 선택된 게 없는 상태로 combobox 닫기
				this.input.removeClass("selected");
				this.closeCombobox();
			}
	}
}
OHLI.AutoComplete.prototype.afterSearch = function(query, list) {
	// 검색어로 시작하는 것들이 먼저 나오도록 함
	var startsWiths = [];
	for (var i=0, item; item = list[i]; i++) {
		if (item[this.display].toUpperCase().startsWith(query.toUpperCase())) {
			startsWiths.push(item);
			list.splice(i--, 1);
		}
	}
	this.list = startsWiths.concat(list);
	
	var lis = [];
	for (var i=0, item; item = this.list[i]; i++) {
		lis.push(this.newLi(i, item[this.key], item[this.display]));
	}
	
	// 테스트로 만들어보던 것, 실제론 쓰이지 않음.
	this.list = this.list.concat(this.appendex);
	for (var i=0, item; item = this.appendex[i]; i++) {
		var li = this.li.clone();
		li.data("index", result.length + i);
		li.data("func", item.func);
		li.setText(item.display);
		lis.push(li);
	}
	
	this.combobox.empty().append(lis);
}
OHLI_AutoComplete_afterSearch = function(query, list) {
	if (OHLI.AutoComplete.last) {
		OHLI.AutoComplete.last.afterSearch(query, list);
		OHLI.AutoComplete.last = null;
	}
}
OHLI.AutoComplete.prototype.moveToUp = function(movingUp, timer) {
	// ↑키 눌린 상태가 아니거나, 뗐다가 다시 누름
	if (movingUp != this.movingUp) return;
	
	// combobox에서 선택 중일 때
	if (this.selected >= 0) {
		this.combobox.find("li").removeClass("selected");
		if (this.selected > 0) {
			this.selecting($(this.combobox.children()[this.selected - 1]));
			var ac = this;
			setTimeout(function() { ac.moveToUp(movingUp, timer*3/4); }, timer); // 누르고 있는 동안 가속해서 이동
		} else {
			// 맨 위까지 올라감
			this.selected = -1;
			this.input.val(this.query).removeClass("selected");
		}
	}
};
OHLI.AutoComplete.prototype.moveToDn = function(movingDn, timer) {
	// ↓키 눌린 상태가 아니거나, 뗐다가 다시 누름
	if (movingDn != this.movingDn) return;
	
	// combobox가 열려있고, 맨 아래에 도달하지 않았을 때
	if (this.selected > -2 && this.selected + 1 < this.list.length) {
		this.selecting($(this.combobox.children()[this.selected + 1]));
		var ac= this;
		setTimeout(function() { ac.moveToDn(movingDn, timer*3/4); }, timer); // 누르고 있는 동안 가속해서 이동
	}
};
