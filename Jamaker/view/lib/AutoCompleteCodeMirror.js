{
	const link = document.createElement("link");
	link.rel = "stylesheet";
	link.href = new URL("./AutoComplete.css", import.meta.url).href;
	document.head.append(link);
}

window.AutoCompleteCodeMirror = function(cm, sets, onSelect) {
	this.cm = cm;
	cm.ac = this;
	
	this.sets = sets ? sets : [];
	this.onSelect = onSelect;
	if (this.sets["-"]) {
		// 일반 단어 자동완성은 정렬해서 표시
		this.sets["-"][1].sort();
	} else {
		this.sets["-"] = ["", []];
	}
	
	if (!AutoCompleteCodeMirror.view) {
		const view = AutoCompleteCodeMirror.view = document.createElement("ol");
		view.classList.add("act-select");
		view.style.display = "none";
		view.addEventListener("click", (e) => {
			const li = e.target.closest("li");
			if (li) {
				const act = AutoCompleteCodeMirror.opened;
				act.input(li);
				act.close();
				if (act.onSelect) {
					act.onSelect();
				}
			}
		});
		document.body.append(view);
	}
	this.resize();
	this.SB = 16; // 스크롤바 폭 계산하는 걸 만드는 게?
	
	this.pos = 0;	// 입력 시작 위치
	this.text = "";	// 입력값
	this.list = [];	// 선택 목록
	this.lis = [];	// 선택 <li>
	this.selected = -1; // 선택 항목
	
	cm.on("keydown", (cm, e) => {
		if (cm.ac.selected >= 0) {
			cm.ac.onKeydown(e);
		}
	});
	cm.on("keyup", (cm, e) => {
		if (cm.ac.selected >= 0) {
			cm.ac.onKeyup(e);
		}
		// else가 아닌 이유: 자동완성 닫았다 다시 열 수도 있음
		if (cm.ac.selected < 0) {
			if (!e.ctrlKey && !e.altKey) {
				if (e.key.length == 1) {
					cm.ac.onCheck(e);
				}
			} else if (e.ctrlKey && (e.key == " ")) { // Ctrl+SpaceBar
				cm.ac.openedByCtrl = true;
				cm.ac.onCheckWord();
			}
		}
	});
	cm.on("click", (cm, e) => {
		cm.ac.close();
	});
}
AutoCompleteCodeMirror.prototype.resize = function() {
	const font = getComputedStyle(this.cm.getWrapperElement());
	this.font = {};
	AutoCompleteCodeMirror.view.style.fontFamily = this.font.fontFamily = font.fontFamily;
	AutoCompleteCodeMirror.view.style.fontSize   = this.font.fontSize   = font.fontSize  ;
	AutoCompleteCodeMirror.view.style.fontWeight = this.font.fontWeight = font.fontWeight;
	AutoCompleteCodeMirror.view.style.lineHeight = this.font.lineHeight = font.lineHeight;
	this.LH = parseFloat(font.lineHeight);
}
// 선택
AutoCompleteCodeMirror.prototype.select = function(index) {
	if (this.selected >= 0) {
		// 기존 항목 선택 해제
		this.lis[this.selected].classList.remove("selected");
	}
	this.lis[this.selected = index].classList.add("selected");
	
	// 스크롤됐을 수 있으므로 좌표도 한 번 갱신
	this.setPos();
}
// 열기
AutoCompleteCodeMirror.prototype.open = function(list) {
	if (list.length) {
		this.resize();
		this.list = list;
		this.lis = [];
		AutoCompleteCodeMirror.view.innerHTML = "";
		for (let i = 0; i < list.length; i++) {
			const li = document.createElement("li");
			li.innerText = list[i];
			this.lis.push(li);
			AutoCompleteCodeMirror.view.append(li);
		}
		AutoCompleteCodeMirror.view.style.height = (this.lis.length * this.LH) + "px";
		this.select(0);
		this.setPos();
		AutoCompleteCodeMirror.view.style.display = "block";
		AutoCompleteCodeMirror.opened = this;
	}
};
// 닫기
AutoCompleteCodeMirror.prototype.close = function() {
	AutoCompleteCodeMirror.view.style.display = "none";
	this.selected = -1;
	this.openedByCtrl = false;
	this.cm.focus();
};
// 커서 위치에 선택기 이동
AutoCompleteCodeMirror.prototype.setPos = function() {
	const wrapper = this.cm.getWrapperElement();
	const rect = wrapper.getBoundingClientRect();
	const offset = { top: rect.top, left: rect.left };
	{	const css = getComputedStyle(wrapper);
		offset.top  += parseFloat(css.paddingTop);
		offset.left += parseFloat(css.paddingLeft);
	}

	const coords = this.cm.cursorCoords(this.pos, "local");
	
	let top = offset.top + coords.top + this.LH - wrapper.scrollTop;
	let left = coords.left - (wrapper.scrollLeft - offset.left);
	
	// 아래쪽에 넘칠 경우 맞춤
	if (top + AutoCompleteCodeMirror.view.clientHeight > offset.top + wrapper.offsetHeight - this.SB) {
		top -= (AutoCompleteCodeMirror.view.clientHeight + LH);
	}
	
	// 오른쪽에 넘칠 경우 맞춤
	left = Math.max(0, Math.min(left, offset.left + wrapper.clientWidth - this.SB - AutoCompleteCodeMirror.view.clientWidth));
	
	AutoCompleteCodeMirror.view.style.top  = top  + "px";
	AutoCompleteCodeMirror.view.style.left = left + "px";
}
AutoCompleteCodeMirror.prototype.onKeydown = function(e) {
	switch (e.key) {
		case "ArrowUp": {
			e.preventDefault();
			// 선택 위로 이동
			const selected = this.selected - 1;
			if (selected >= 0) {
				this.select(selected);
			}
			break;
		}
		case "ArrowDown": {
			e.preventDefault();
			// 선택 아래로 이동
			const selected = this.selected + 1;
			if (selected < this.lis.length) {
				this.select(selected);
			}
			break;
		}
		case "Enter": {
			// 스크롤 튀는 것 방지
			e.preventDefault();
			break;
		}
		case "Tab": {
			// 포커스 이동 방지
			e.preventDefault();
			break;
		}
	}
};
AutoCompleteCodeMirror.prototype.onKeyup = function(e) {
	switch (e.key) {
		case "ArrowUp": // ↑
		case "ArrowDown": // ↓
			// keydown에서 동작 완료
			e.preventDefault();
			break;
		case "Control":
			if (this.openedByCtrl) {
				// Ctrl+SpaceBar로 연 직후
				e.preventDefault();
				this.openedByCtrl = false;
				break;
			}
			// 아니면 Alt/Esc와 같은 동작
		case "Alt":
		case "Escape": {
			e.preventDefault();
			// 선택 취소
			this.close();
			break;
		}
		case "Enter": {
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
			const cursor = this.cm.getCursor("end");
			if ((cursor.line != this.pos.line) || cursor.ch <= this.pos.ch) {
				this.close();
				break;
			}
			
			this.afterInput();
		}
	}
};
AutoCompleteCodeMirror.prototype.input = function(li) {
	let pos = this.pos;
	let value = li.innerText;
	if (value.indexOf("|") > 0) {
		value = value.split("|")[1];
	}
	this.cm.replaceRange(value, this.pos, this.cm.getCursor("end"));
	pos.ch += value.length;
	this.cm.setSelection(pos);
}
AutoCompleteCodeMirror.prototype.afterInput = function() {
	// 최초 리스트에서 현재 입력값에 대해 검색
	const value = this.cm.getRange(this.pos, this.cm.getCursor("end"));
	this.lis = [];
	AutoCompleteCodeMirror.view.innerHTML = "";
	for (let i = 0; i < this.list.length; i++) {
		// 설정 순서대로 표시하려고 정렬 없이 전체 비교를 돌리는데
		// 기능 특성상 전체를 돌려도 연산량이 과도하진 않을 듯함
		if (this.list[i].substring(0, value.length) == value) {
			const li = document.createElement("li");
			li.innerText = this.list[i];
			this.lis.push(li);
			AutoCompleteCodeMirror.view.append(li);
		}
	}
	if (this.lis.length) {
		AutoCompleteCodeMirror.view.style.height = (this.lis.length * this.LH) + "px";
		// 첫 번째 항목 선택
		this.select(0);
		
	} else {
		// 검색된 게 없으면 선택 취소
		this.close();
	}
}
const normalKeys = "`1234567890-=\\[];',./";
const shiftKeys  = "~!@#$%^&*()_+|{}:\"<>?";
AutoCompleteCodeMirror.prototype.onCheck = function(e) {
	const cursor = this.cm.getCursor("end");
	if (cursor.ch < 1) return;
	
	const pos = { line: cursor.line, ch: cursor.ch - 1 };
	const c = this.cm.getRange(pos, cursor);
	if (c != e.key) {
		const index = normalKeys.indexOf(e.key);
		if (index < 0) return;
		if (c != shiftKeys[index]) return;
	}
	
	const sets = this.sets[c];
	if (sets && sets[0] == c) {
		this.pos = pos;
		this.open(AutoCompleteCodeMirror.getList(this.cm.getValue(), pos, sets[1]));
	}
}
AutoCompleteCodeMirror.getList = function(text, pos, list) { // override용 추가 파라미터
	return list;
}
AutoCompleteCodeMirror.wordBreaker = " \t\r\n()<>[]{},.`'\"?!;:/\\";
AutoCompleteCodeMirror.prototype.onCheckWord = function(e) {
	const start = this.cm.getCursor("start");
	const end   = this.cm.getCursor("end"  );
	
	let ch = start.ch;
	if ((start.line == end.line) && (ch == end.ch)) {
		// 블록지정 없을 때
		const line = this.cm.getLine(start.line);
		
		while (ch > 0) {
			ch--;
			const c = line[ch];
			if (AutoCompleteCodeMirror.wordBreaker.indexOf(c) >= 0) {
				ch++;
				break;
			}
		}
	}
	if ((start.line == end.line) && (ch == end.ch)) {
		// 단어 없을 때
		return;
	}
	
	this.pos = { line: start.line, ch: ch };
	this.open(this.sets["-"][1]);
	this.afterInput();
}
