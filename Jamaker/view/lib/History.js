/*
 * <textarea> 히스토리 지원
 * 
 * <textarea> 자체의 히스토리 기능은 value를 외부에서 바꾸는 순간 기록이 끊김
 * 히스토리 기능 자체를 새로 구현 
 */

// TODO: 커서 위치 같은 게 좀 불안한가...?
// 실행취소 쉬 커서가 전 단계가 아니라 현 단계 시작점으로?

// 입력에서 삭제로 전환 시 기록 

window.History = function(input, limit, doAfter, activateDefaultKeyEvent=true) {
	this.input = input.length ? input[0] : input; // jQuery일 경우 0번 객체 선택
	this.limit = (limit ? limit : 32);
	this.doAfter = doAfter;
	this.data = new Array(limit);
	this.range = [0, 0];
	
	const text = this.lastText = this.input.value;
	this.last = this.data[this.cnt = 0] = [this.lastText = text, [this.lastCursor = 0, -1]]; // [텍스트, [현재값 됐을 때 커서, 값 변경 직전 커서]]
	this.isInserting = false;
	
	this.lastLogged = this.lastChanged = new Date().getTime();
	const history = this;
	this.input.addEventListener("input", (e) => {
		history.passiveLog();
		history.updateCursor();
	});
	this.input.addEventListener("click", (e) => {
		// 내용 수정 후 히스토리 로깅 안 된 상태에서 클릭으로 커서 옮겼을 경우 기존 커서 기억
		// 수정 없었을 경우 무시해야 함
		history.log(null, true);
		history.updateCursor();
	});
	if (activateDefaultKeyEvent) {
		// 독립적인 라이브러리로 기능할 때 기본 키 입력 활성화
		this.input.addEventListener("keydown", (e) => {
			switch (e.keyCode) {
				case 33: // PgUp
				case 34: // PgDn
				case 35: // End
				case 36: // Home
				case 38: // ↑
				case 40: // ↓
				case 37: // ←
				case 39: // →
					history.logIfCursorMoved();
					break;
				case 90: { // Z
					if (!e.ctrlKey || e.shiftKey || e.altKey)  break;
					history.back();
					break;
				}
				case 89: { // Y
					if (!e.ctrlKey || e.shiftKey || e.altKey)  break;
					history.forward();
					break;
				}
			}
		});
	}
};
History.prototype.test = function() {
	for (let i = this.range[0]; i < this.range[1]; i++) {
		const data = this.data[i % this.limit];
	}
}
History.prototype.log = function(text, withoutCursor=false) {
	// 마지막 로그와 차이가 없으면 취소
	if (!text) {
		text = this.input.value;
	}
	if (this.last[0] == text) {
		if (!withoutCursor) {
			this.last[1][1] = this.updateCursor();
		}
		return;
	}
	
	if (this.last[1][1] == -1) {
		this.last[1][1] = this.lastCursor;
	}
	if (++this.cnt > this.limit * 2) {
		this.cnt -= this.limit;
	}
	this.last = this.data[this.cnt % this.limit] = [this.lastText = text, [this.updateCursor(), -1]];
	this.lastLength = text.length;
	this.range[0] = Math.max(0, this.cnt - this.limit + 1);
	this.range[1] = this.cnt;
	
	// passiveLog 추가 동작 안 하도록
	this.lastChanged = 0;
	this.lastLogged = new Date().getTime();
	this.isInserting = false;
};
History.prototype.passiveLog = function() {
	// 실행취소 상태에서 수정일 경우
	if (this.cnt < this.range[1]) {
		this.last[1][1] = -1;
		this.range[1] = this.cnt;
	}
	
	// 값 변경 직전 커서 설정
	if (this.last[1][1] == -1) {
		this.last[1][1] = this.lastCursor;
	}
	
	const text = this.input.value;
	
	if (this.isInserting && text.length < this.lastText.length) {
		// 입력에서 삭제로 전환 시 기록
		this.log(this.lastText);
		
	} else {
		this.lastText = text;
		this.isInserting = true;
		
		const now = new Date().getTime();
		
		// 마지막 로그 이후 후 5초 이상 경과한 상태에서
		if (now - this.lastLogged < 5000) return;
		
		// 1초 동안 입력 없었으면 기록
		this.lastChanged = now;
		const history = this;
		setTimeout(() => {
			if (history.lastChanged == now) {
				history.log();
			}
		}, 1000);
	}
};
History.prototype.back = function() {
	this.log(); // 마지막 로그 후 변동사항 있으면 기록
	if (this.cnt <= this.range[0]) return;

	this.last = this.data[--this.cnt % this.limit];
	this.input.value = this.last[0];
	this.input.setSelectionRange(this.last[1][1], this.last[1][1]);
	
	if (this.doAfter) {
		this.doAfter();
	}
};
History.prototype.forward = function() {
	if (this.cnt >= this.range[1]) return;
	
	if (this.last[0] != this.input.value) {
		// 마지막 로그와 차이가 있으면 정지
		this.range[1] = this.cnt;
		return;
	}
	this.last = this.data[++this.cnt % this.limit];
	this.input.value = this.last[0];
	this.input.setSelectionRange(this.last[1][0], this.last[1][0]);
	
	if (this.doAfter) {
		this.doAfter();
	}
};
History.prototype.updateCursor = function() {
	return this.lastCursor = this.input.selectionEnd;
};
History.prototype.logIfCursorMoved = function() {
	const cursor = this.input.selectionEnd;
	if (cursor != this.lastCursor) {
		this.log();
	}
};
