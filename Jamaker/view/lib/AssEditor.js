// TODO: 일단 여기 적었는데, editor.js 등에서 쓸 방안을 강구하는 게?
let FormatToEdit = ["Layer", "Style", "Name", "MarginL", "MarginR", "MarginV", "Effect", "Text"];
let FormatToSave = ["Layer", "", "", "Style", "Name", "MarginL", "MarginR", "MarginV", "Effect", "Text"];
let FormatSimple = ["Layer", "Style", "Text"];

window.AssEditor = function(view, events=[], frameSyncs=null) {
	this.view = (view ? view : (view = $("<div>"))).addClass("ass-editor").data({ obj: this });
	this.savedSyncs = [];
	this.setEvents(events, frameSyncs);
	this.update();
	
	const self = this;
	this.view.on("input propertychange", "input, textarea", function() {
		$(this).parent().data("obj").update();
	}).on("focus", "input, textarea", function() {
		view.find(".item.focus").removeClass("focus");
		$(this).parent().addClass("focus");
	}).on("click", "button", function() {
		const item = $(this).parent();
		confirm("삭제하시겠습니까?", function() {
			self.removeEvent(item.data("obj"));
		});
	});
}
AssEditor.prototype.setEvents = function(events=[], frameSyncs=null) {
	this.syncs = [];
	this.view.empty();
	this.addEvents(events, frameSyncs, false);
	this.savedSyncs = this.syncs.slice(0);
}
AssEditor.prototype.addEvents = function(events=[], frameSyncs=null, withUpdate=true) {
	function findFrameSync(sync) {
		// 영상 정보 불러오기 전이면 프레임 싱크 보정은 안 돌아감
		sync += 15;
		// SmiEditor 의존성은 좀 안 내키지만...
		// TODO: SubtitleObject.video 뺄 예정
		return Subtitle.video.fs.length ? Subtitle.findSync(sync, Subtitle.video.fs) : sync;
	}
	
	const syncs = this.syncs = this.syncs.slice(0);
	const editor = this;
	
	let last = { start: -1, end: -1, scripts: [] };
	for (let i = 0; i < events.length; i++) {
		const item = events[i];
		// ASS 시간이 아닌 SMI 시간으로 관리
		item.start = findFrameSync(item.start);
		item.end   = findFrameSync(item.end  );
		const script = item.toText(FormatToEdit);
		
		if (item.start == last.start && item.end == last.end) {
			// 기존 싱크 그룹
			last.scripts.push(script);
			
		} else {
			// 기존 싱크 그룹 추가
			if (last.scripts.length) {
				const item = new AssEditor.Item(last);
				syncs.push(item);
				this.view.append(item.view);
				item.onUpdate = function() {
					editor.update();
				}
			}
			
			// 새 싱크 그룹 생성
			last = {
					start: item.start, startFrame: (frameSyncs == null ? true : frameSyncs.indexOf(item.Start) >= 0)
				,	end  : item.end  , endFrame  : (frameSyncs == null ? true : frameSyncs.indexOf(item.End  ) >= 0)
				,	scripts: [script]
			};
		}
	}
	if (last.scripts.length) {
		// 마지막 싱크 그룹
		const item = new AssEditor.Item(last);
		syncs.push(item);
		this.view.append(item.view);
		item.onUpdate = function() {
			editor.update();
		}
	}
	
	if (withUpdate) {
		this.update();
	}
}
AssEditor.prototype.removeEvent = function(item) {
	const index = this.syncs.indexOf(item);
	if (index >= 0) {
		const item = this.syncs.splice(index, 1)[0];
		item.view.remove();
		this.update();
	}
}
AssEditor.prototype.update = function() {
	if (this.syncs.length != this.savedSyncs.length) {
		this.isSaved = false;
	} else {
		let isSaved = true;
		for (let i = 0; i < this.syncs.length; i++) {
			const sync = this.syncs[i];
			if (sync != this.savedSyncs[i]) {
				isSaved = false;
				break;
			}
			if (!sync.isSaved) {
				isSaved = false;
				break;
			}
		}
		this.isSaved = isSaved;
	}
	{
		const sorts = this.syncs.slice(0);
		sorts.sort((a, b) => {
			let c = a.start - b.start;
			if (c == 0) {
				c = a.end - b.end;
			}
			return c;
		});
		let sorted = true;
		for (let i = 0; i < sorts.length; i++) {
			if (sorts[i] != this.syncs[i]) {
				sorted = false;
				break;
			}
		}
		if (!sorted) {
			const input = this.view.find(":focus");
			this.sycns = sorts;
			for (let i = 0; i < sorts.length; i++) {
				this.view.append(sorts[i].view);
			}
			input.focus();
		}
	}
	if (this.onUpdate) {
		this.onUpdate();
	}
}
AssEditor.prototype.toText = function() {
	let text = [];
	for (let i = 0; i < this.syncs.length; i++) {
		const sync = this.syncs[i];
		text.push(sync.text);
	}
	return text.join("\n");
}
AssEditor.prototype.getFrameSyncs = function() {
	// 프레임 싱크 구해오기
	const syncs = [];
	for (let i = 0; i < this.syncs.length; i++) {
		syncs.push(...this.syncs[i].getFrameSyncs());
	}
	// 정렬
	syncs.sort((a, b) =>  {
		if (a < b) {
			return -1;
		} else if (a > b) {
			return 1;
		}
		return 0;
	});
	
	// 중복 제외 후 출력
	const result = [];
	let last = null;
	for (let i = 0; i < syncs.length; i++) {
		const sync = syncs[i];
		if (last == sync) {
			continue;
		}
		result.push(last = sync);
	}
	return result;
}
AssEditor.prototype.setSaved = function() {
	for (let i = 0; i < this.syncs.length; i++) {
		this.syncs[i].setSaved();
	}
	this.isSaved = true;
}

AssEditor.Item = function(info) {
	const view = this.view = $("<div>").addClass("item").data({ obj: this });
	view.append(this.inputStart = $("<input>").attr({ type: "number"  , name: "start"      }).val(info.start));
	view.append(this.checkStart = $("<input>").attr({ type: "checkbox", name: "startFrame", title: "시작싱크 화면 맞춤" }).prop("checked", info.startFrame));
	view.append(this.inputEnd   = $("<input>").attr({ type: "number"  , name: "end"        }).val(info.end));
	view.append(this.checkEnd   = $("<input>").attr({ type: "checkbox", name: "endFrame"  , title: "종료싱크 화면 맞춤" }).prop("checked", info.endFrame  ));
	view.append(this.inputText  = $("<textarea>").attr({ name: "text", spellcheck: "false" }).val(info.scripts.join("\n")));
	view.append(this.btnDelete  = $("<button>").attr({ type: "button" }).text("×"));
	
	const item = this;
	this.savedText = this.getText();
	this.isSaved = true;
	return this;
}
AssEditor.Item.prototype.getText = function() {
	const start = AssEvent.toAssTime((this.start = Number(this.inputStart.val())) - 15);
	const end   = AssEvent.toAssTime((this.end   = Number(this.inputEnd  .val())) - 15);
	const sync = "," + start + "," + end;
	const lines = this.inputText.val().split("\n");
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const index = line.indexOf(",");
		if (index >= 0) {
			lines[i] = "Dialogue: " + line.substring(0, index) + sync + line.substring(index);
		}
	}
	return this.text = lines.join("\n");
}
AssEditor.Item.prototype.update = function() {
	this.isSaved = (this.getText() == this.savedText);
	if (this.onUpdate) {
		this.onUpdate();
	}
}
AssEditor.Item.prototype.getFrameSyncs = function() {
	const syncs = [];
	if (this.checkStart.prop("checked")) {
		syncs.push(AssEvent.toAssTime(Number(this.inputStart.val()) - 15));
	}
	if (this.checkEnd.prop("checked")) {
		syncs.push(AssEvent.toAssTime(Number(this.inputEnd  .val()) - 15));
	}
	return syncs;
}
AssEditor.Item.prototype.setSaved = function() {
	this.savedText = this.getText();
}
