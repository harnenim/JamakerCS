let FormatToEdit = ["Layer", "Style", "Name", "MarginL", "MarginR", "MarginV", "Effect", "Text"];
let FormatToSave = ["Layer", "", "", "Style", "Name", "MarginL", "MarginR", "MarginV", "Effect", "Text"];
let FormatSimple = ["Layer", "Style", "Text"];

window.AssEditor = function(view, events=[], frameSyncs=null) {
	this.view = (view ? view : (view = $("<div>"))).addClass("ass-editor").data({ obj: this });
	this.setEvents(events, frameSyncs);
	this.savedSyncs = this.syncs;
	this.update();
}
AssEditor.prototype.setEvents = function(events=[], frameSyncs=null) {
	this.syncs = [];
	this.view.empty();
	this.addEvents(events, frameSyncs);
	this.savedSyncs = this.syncs;
}
AssEditor.prototype.addEvents = function(events=[], frameSyncs=null) {
	function findSync(sync) {
		return SmiEditor.findSync(sync, SmiEditor.video.fs);
	}
	
	const syncs = this.syncs = this.syncs.slice(0);
	
	let last = { start: -1, end: -1, scripts: [] };
	for (let i = 0; i < events.length; i++) {
		const item = events[i];
		// ASS 시간이 아닌 SMI 시간으로 관리
		item.start = findSync(item.start + 15);
		item.end   = findSync(item.end   + 15);
		const script = item.toText(FormatToEdit);
		
		if (item.start == last.start && item.end == last.end) {
			// 기존 싱크 그룹
			last.scripts.push(script);
			
		} else {
			// 기존 싱크 그룹 추가
			if (last.scripts.length) {
				syncs.push(new AssEditor.Item(last));
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
		syncs.push(new AssEditor.Item(last));
	}
	syncs.sort((a, b) => {
		return Number(a.inputStart.val()) - Number(b.inputStart.val());
	});
	
	const editor = this;
	
	for (let i = 0; i < syncs.length; i++) {
		this.view.append(syncs[i].view);
		syncs[i].onUpdate = function() {
			editor.update();
		}
	}
	
	this.update();
}
AssEditor.prototype.update = function() {
	if (this.syncs != this.savedSyncs) {
		this.isSaved = false;
	} else {
		let isSaved = true;
		for (let i = 0; i < this.syncs.length; i++) {
			const sync = this.syncs[i];
			if (!sync.isSaved) {
				isSaved = false;
				break;
			}
		}
		this.isSaved = isSaved;
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
	
	const item = this;
	this.view.on("input propertychange", "input, textarea", function() {
		item.update();
	});
	this.savedText = this.getText();
	this.isSaved = true;
	return this;
}
AssEditor.Item.prototype.getText = function() {
	const start = Subtitle.AssEvent.toAssTime(Number(this.inputStart.val()) - 15);
	const end   = Subtitle.AssEvent.toAssTime(Number(this.inputEnd  .val()) - 15);
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
		syncs.push(Subtitle.AssEvent.toAssTime(Number(this.inputStart.val()) - 15));
	}
	if (this.checkEnd.prop("checked")) {
		syncs.push(Subtitle.AssEvent.toAssTime(Number(this.inputEnd  .val()) - 15));
	}
	return syncs;
}
AssEditor.Item.prototype.setSaved = function() {
	this.savedText = this.getText();
}
