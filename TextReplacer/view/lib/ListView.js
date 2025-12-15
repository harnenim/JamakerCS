window.ListView = function(div) {
	const self = this;
	
	this.area = div.length ? div[0] : div; // jQuery일 경우 0번 객체 선택
	this.area.innerHTML = "";
	this.area.classList.add("list-selectable");
	this.area.append(this.view = document.createElement("ol"));
	
	this.width = 0;
	this.list = [];
	this.clearSelection(true);
	
	this.area.tabIndex = 0;
	this.area.onSelectStart = () => { return false; };
	if (!this.area.id) {
		this.area.id = "id_" + Math.random();
	}
	
	this.area.addEventListener("click", (e) => {
		const li = e.target.closest("li");
		if (li) {
			e.stopPropagation();
			e.preventDefault();
			self.onClick(li.index, e);
			return;
		}
		//self.clearSelection();
	});
	this.area.addEventListener("keydown", (e) => {
		switch (e.key) {
			case "ArrowUp": {
				self.onCursorMove(-1, e);
				break;
			}
			case "ArrowDown": {
				self.onCursorMove(+1, e);
				break;
			}
			case "Home": {
				if (self.list.length) {
					self.onSelect(0, e);
				}
				break;
			}
			case "End": {
				if (self.list.length) {
					self.onSelect(self.list.length - 1, e);
				}
				break;
			}
			case " ": {
				self.select(self.cursor, e.ctrlKey);
				break;
			}
			case "Delete": {
				self.remove();
				break;
			}
			case "a": {
				if (e.ctrlKey) { // Ctrl+A
					self.list.forEach((item) => {
						item.li.classList.add("selected");
						item.selected = true;
					});
				}
				break;
			}
			case "Shift": {
				if (self.shiftFrom < 0) {
					self.shiftFrom = self.cursor;
				}
			}
		}
	});
	
	let draggableArea = [0,0,0,0];
	let dragLayer = null;
	let dragFrom = [0, 0, false];
	this.area.addEventListener("mousedown", (e) => {
		draggableArea = [ self.area.offsetLeft, self.area.offsetTop, self.area.offsetWidth, self.area.offsetHeight ];
		if (ListView.dragLayer) {
			dragLayer = ListView.dragLayer;
		} else {
			document.body.append(ListView.dragLayer = dragLayer = document.createElement("div"));
			dragLayer.classList.add("selection");
		}
		dragFrom = [ e.clientX, e.clientY, (e.ctrlKey || e.shiftKey) ];
	});
	function showDragLayer(clientX, clientY) {
		let x = Math.min(clientX, dragFrom[0]);
		let y = Math.min(clientY, dragFrom[1]);
		let w = (clientX < dragFrom[0] ? dragFrom[0] - clientX : clientX - dragFrom[0]);
		let h = (clientY < dragFrom[1] ? dragFrom[1] - clientY : clientY - dragFrom[1]);
		
		if (x < draggableArea[0]) {
			w -= (draggableArea[0] - x);
			x = draggableArea[0];
		}
		if (y < draggableArea[1]) {
			h -= (draggableArea[1] - y);
			y = draggableArea[1];
		}
		if (x + w > draggableArea[0] + draggableArea[2]) {
			w = draggableArea[0] + draggableArea[2] - x;
		}
		if (y + h > draggableArea[1] + draggableArea[3]) {
			h = draggableArea[1] + draggableArea[3] - y;
		}
		
		dragLayer.style.top    = y + "px";
		dragLayer.style.left   = x + "px";
		dragLayer.style.width  = w + "px";
		dragLayer.style.height = h + "px";
		if (dragLayer.style.display != "block") {
			if (!dragFrom[2]) { // Ctrl/Shift 안 눌렀으면 선택 해제
				self.list.forEach((item) => {
					if (item.selected) {
						item.li.classList.remove("selected");
						item.selected = false;
					}
				});
			}
			dragLayer.style.display = "block";
		}
		
		self.list.forEach((item) => {
			const li = item.li;
			const top = li.offsetTop;
			const bottom = top + li.offsetHeight;
			if (bottom >= y && top <= y + h) {
				li.classList.add("dragging");
			} else {
				li.classList.remove("dragging");
			}
		});
	}
	document.addEventListener("mousemove", (e) => {
		if (!dragLayer) return;
		showDragLayer(e.clientX, e.clientY);
	});
	document.addEventListener("mouseup", (e) => {
		if (!dragLayer) return;
		e.stopPropagation();
		e.preventDefault();

		self.list.forEach((item) => {
			if (item.li.classList.contains("dragging")) {
				item.li.classList.remove("dragging");
				if (!item.selected) {
					item.li.classList.add("selected");
					item.selected = true;
				}
			}
		});
		dragLayer.style.display = "";
		dragLayer = null;
	});
	
	this.area.addEventListener("dblclick", (e) => {
		const li = e.target.closest("li");
		if (li) {
			if (self.run) {
				self.run(self.list[li.index]);
			}
		}
	});
}
ListView.prototype.add = function(value, checkDuplication) {
	if (this.lock) return;
	
	if (checkDuplication) {
		for (let i = 0; i < this.list.length; i++) {
			if (this.list[i].value == value) {
				return;
			}
		}
	}
	const span = document.createElement("span");
	const li = document.createElement("li");
	span.innerText = value;
	li.append(span);
	this.view.append(li);
	
	const item = { li: li, value: value, selected: false };
	this.list.push(item);
	this.clearSelection();
	
	const self = this;
	setTimeout(() => {
		if ((item.width = span.offsetWidth) > self.width) {
			self.view.style.minWidth = (self.width = item.width) + "px";
		}
	}, 1);
}
ListView.prototype.remove = function() {
	if (this.lock) return;
	
	const list = [];
	let cursor = this.cursor;
	for (let i = 0; i < this.list.length; i++) {
		if (this.list[i].selected) {
			this.list[i].li.remove();
			if (i == cursor) {
				cursor++;
			}
		} else {
			list.push(this.list[i]);
		}
	}
	if (cursor >= this.list.length) {
		cursor = this.cursor;
		for (let i = this.list.length - 1; i >= 0; i--) {
			if (this.list[i].selected && i == cursor) {
				cursor--;
			}
		}
	}
	if (cursor >= 0) {
		cursor = this.list[cursor];
	}
	this.list = list;
	let width = 0;
	for (let i = 0; i < list.length; i++) {
		const item = list[i];
		item.li.index = i;
		if (item == cursor) {
			cursor = i;
		}
		width = Math.max(width, item.width);
	}
	this.view.style.minWidth = (this.width = width) + "px";
	
	this.setCursor(cursor);
}
ListView.prototype.onClick = function(index, e) {
	this.onSelect(index, e);
}
ListView.prototype.onCursorMove = function(direction, e) {
	if (this.view.children.length == 0) {
		return;
	}
	let index = this.cursor + direction;
	if (index < 0) index = 0;
	if (index >= this.view.children.length) {
		index = this.view.children.length - 1;
	}
	this.onSelect(index, e);
}
ListView.prototype.onSelect = function(index, e) {
	if (e.shiftKey) {
		if (this.shiftFrom < 0) {
			this.shiftFrom = index;
		}
		const from = Math.min(this.shiftFrom, index);
		const to   = Math.max(this.shiftFrom, index);
		
		if (!e.ctrlKey) {
			// 선택 영역만 잡힘
			for (let i = 0; i < from; i++) {
				const item = this.list[i];
				if (item.selected) {
					item.li.classList.remove("selected");
					item.selected = false;
				}
			}
			for (let i = to + 1; i < this.list.length; i++) {
				const item = this.list[i];
				if (item.selected) {
					item.li.classList.remove("selected");
					item.selected = false;
				}
			}
		}
		for (let i = from; i <= to; i++) {
			const item = this.list[i];
			item.li.classList.add("selected");
			item.selected = true;
		}
		
	} else {
		if (e.ctrlKey) {
			if (!e.key) { // Ctrl+클릭
				this.select(index, true);
			}
		} else {
			this.clearSelection();
			this.select(index, false);
		}
	}
	this.setCursor(index);
}
ListView.prototype.select = function(index, toggle) {
	const item = this.list[index];
	if (item.selected) {
		if (toggle) {
			item.li.classList.remove("selected");
			item.selected = false;
		}
	} else {
		item.li.classList.add("selected");
		item.selected = true;
	}
	this.shiftFrom = -1;
}
ListView.prototype.setCursor = function(index) {
	if (this.list.length < 1) {
		this.cursor = -1;
		return;
	}
	if (this.cursor >= 0) {
		this.list[this.cursor].li.classList.remove("cursor");
	}
	this.list[this.cursor = index].li.classList.add("cursor");
}
ListView.prototype.clearSelection = function(withCursor) {
	for (let i = 0; i < this.list.length; i++) {
		const item = this.list[i];
		if (item.selected) {
			item.li.classList.remove("selected");
			item.selected = false;
		}
		item.li.index = i;
	}
	if (withCursor) {
		if (this.cursor >= 0) {
			this.list[this.cursor].li.classList.remove("cursor");
		}
		this.cursor = -1;
	}
	this.shiftFrom = -1;
}