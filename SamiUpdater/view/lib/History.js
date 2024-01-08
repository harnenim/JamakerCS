/*
 * <textarea> 히스토리 지원
 * 
 * <textarea> 자체의 히스토리 기능은 value를 외부에서 바꾸는 순간 기록이 끊김
 * 히스토리 기능 자체를 새로 구현 
 */

// TODO: 커서 위치 같은 게 좀 불안한가...?
// 실행취소 쉬 커서가 전 단계가 아니라 현 단계 시작점으로?

// 입력에서 삭제로 전환 시 기록 

var History = function(input, limit, doAfter) {
	this.input = input;
	this.limit = (limit ? limit : 32);
	this.doAfter = doAfter;
	this.data = new Array(limit);
	this.range = [0, 0];
	
	var text = this.lastText = input.val();
	this.last = this.data[this.cnt = 0] = [this.lastText = text, [this.lastCursor = 0, -1]]; // [텍스트, [현재값 됐을 때 커서, 값 변경 직전 커서]]
	this.isInserting = false;
	
	this.lastLogged = this.lastChanged = new Date().getTime();
	var history = this;
	input.on("input propertychange", function() {
		history.passiveLog();
		history.updateCursor();
	});
	input.on("click", function() {
		history.updateCursor();
	});
	/* 방향키는 에디터에서 logIfCursorMoved 구현하는 걸로
	input.on("keydown", function() {
		history.updateCursor();
	});
	*/
};
History.prototype.test = function() {
	for (var i = this.range[0]; i < this.range[1]; i++) {
		var data = this.data[i % this.limit];
		console.log(data[1]);
	}
}
History.prototype.log = function(text) {
	// 마지막 로그와 차이가 없으면 취소
	if (!text) {
		text = this.input.val();
	}
	if (this.last[0] == text) {
		this.last[1][1] = this.updateCursor();
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
	
	var text = this.input.val();
	
	if (this.isInserting && text.length < this.lastText.length) {
		// 입력에서 삭제로 전환 시 기록
		//console.log("입력에서 삭제로 전환 시 기록");
		this.log(this.lastText);
		
	} else {
		this.lastText = text;
		this.isInserting = true;
		
		var now = new Date().getTime();
		
		// 마지막 로그 이후 후 5초 이상 경과한 상태에서
		if (now - this.lastLogged < 5000) return;
		
		// 1초 동안 입력 없었으면 기록
		this.lastChanged = now;
		var history = this;
		setTimeout(function() {
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
	this.input.val(this.last[0]);
	this.input[0].setSelectionRange(this.last[1][1], this.last[1][1]);
	
	if (this.doAfter) {
		this.doAfter();
	}
};
History.prototype.forward = function() {
	if (this.cnt >= this.range[1]) return;

	if (this.last[0] != this.input.val()) {
		// 마지막 로그와 차이가 있으면 정지
		this.range[1] = this.cnt;
		return;
	}
	this.last = this.data[++this.cnt % this.limit];
	this.input.val(this.last[0]);
	this.input[0].setSelectionRange(this.last[1][0], this.last[1][0]);
	
	if (this.doAfter) {
		this.doAfter();
	}
};
History.prototype.updateCursor = function() {
	return this.lastCursor = this.input[0].selectionEnd;
};
History.prototype.logIfCursorMoved = function() {
	var cursor = this.input[0].selectionEnd;
	if (cursor != this.lastCursor) {
		this.log();
	}
};
