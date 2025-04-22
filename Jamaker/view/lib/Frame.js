window.Frame = function(url, name, options, onload) {
	const frame = this.frame = Frame.preset.clone().data("obj", this);
	$("body").append(frame);
	
	this.resizable = true;
	this.iframe = this.frame.find("iframe")[0];
	this.setTitle = function(title) {
		frame.find("h3").text(title);
	}
	this.resizeTo = function(w, h) {
		frame.css({ width: w, height: h });
	}
	this.moveTo = function(x, y) {
		frame.css({ top: y, left: x });
	}
	this.getOffset = function(offset) {
		offset.top    = Number(frame.css("top"   ).split("px")[0]);
		offset.left   = Number(frame.css("left"  ).split("px")[0]);
		offset.right  = Number(frame.css("width" ).split("px")[0]) + offset.left;
		offset.bottom = Number(frame.css("height").split("px")[0]) + offset.top ;
	}
	this.focus = function() {
		this.iframe.focus();
	}
	
	this.go(url ? url : "about:blank");
	if (options) {
		this.set(options);
	}
	
	const self = this;
	this.iframe.onload = function() {
		self.iframe.contentWindow.opener = window;
		self.iframe.contentWindow.close = function() {
			self.close();
		};
		self.setTitle($(self.iframe.contentDocument).find("title").text());
		if (self.iframe.contentWindow.setTitle) {
			self.iframe.contentWindow.setTitle = function(title) {
				self.setTitle(title);
			}
		}
		self.iframe.contentWindow._open_ = self.iframe.contentWindow.open;
		self.iframe.contentWindow.open = function(url, name, options, opener) {
			return Frame.open(url, name, options, opener ? opener : self.iframe.contentWindow);
		};
		$(self.iframe.contentDocument).on("mousedown", function() {
			Frame.refreshOrder(self);
		});
		$(self.iframe.contentDocument).find("iframe").each((_, el) => {
			subIframe = el;
			/*
			subIframe.contentWindow.onload = function() {
				console.log("이게 안 잡히나...?");
				$(subIframe.contentDocument).on("mousedown", function() {
					Frame.refreshOrder(self);
				});
			}
			*/
			setTimeout(() => {
				$(subIframe.contentDocument).on("mousedown", function() {
					Frame.refreshOrder(self);
				});
			}, 100);
		})
		if (onload) {
			onload();
		}
	};
	Frame.add(this, name);
}
Frame.prototype.go = function(url) {
	this.iframe.src = url;
}
Frame.prototype.set = function(options) {
	options = options.split(",");
	for (let i = 0; i < options.length; i++) {
		const option = options[i].trim().split("=");
		switch (option[0]) {
			case "resizable": {
				if (this.resizable = option[1] != "no") {
					this.frame.addClass("resizable");
				} else {
					this.frame.removeClass("resizable");
				}
				break;
			}
		}
	}
}
Frame.prototype.close = function() {
	this.frame.remove();
	delete Frame.names[this.name];
	this.name = null;
}
Frame.names = {};
Frame.order = [];
Frame.add = function (frame, name) {
	frame.name = name;
	Frame.names[name] = frame;
	Frame.order.push(frame);
	Frame.refreshOrder();
}
Frame.refreshOrder = (frame) => {
	if (frame) {
		const index = Frame.order.indexOf(frame);
		if (index >= 0) {
			Frame.order.splice(index, 1);
		}
		Frame.order.push(frame);
	}
	for (let i = 0; i < Frame.order.length; i++) {
		Frame.order[i].frame.css({ zIndex: i + 1 });
	}
	$("#cover").css({ zIndex: Frame.order.length });
}
Frame.open = (url, name, options, opener) => {
	let popup = Frame.names[name];
	if (popup) {
		popup.go(url);
		popup.set(options);
		Frame.refreshOrder(popup);
	} else {
		popup = new Frame(url, name, options, () => {
			popup.iframe.contentWindow.opener = opener;
		});
	}
	return popup;
};

$(() => {
	Frame.preset = $("<div class='window-frame resizable'>");
	{
		const fr = $("<div class='fr'>");
		const fhead = $("<div class='fhead'>");
		fr.append(fhead.append($("<h3>")).append($("<button type='button'>")))
		  .append($("<iframe>"))
		  .append($("<div class='cover'>"))
		  .append($("<div class='border t '>"))
		  .append($("<div class='border tr'>"))
		  .append($("<div class='border  r'>"))
		  .append($("<div class='border br'>"))
		  .append($("<div class='border b '>"))
		  .append($("<div class='border bl'>"))
		  .append($("<div class='border  l'>"))
		  .append($("<div class='border tl'>"));
		Frame.preset.append(fr);
	}
	
	const dragging = {
			frame: null
		,	type: null
		,	top: 0
		,	left: 0
		,	width: 0
		,	height: 0
		,	x: 0
		,	y: 0
	}
	$(document).on("mousedown", ".fhead h3, .border", function(e) {
		const obj = $(this);
		const frame = obj.parents(".frame");
		if (obj.hasClass("border")) {
			const frameObj = frame.data("obj");
			if (frameObj && frameObj.resizable) {
				switch (obj.attr("class").substring(7).trim()) {
					case "t" : dragging.type = 0b1000; break;
					case "tr": dragging.type = 0b1001; break;
					case  "r": dragging.type = 0b0001; break;
					case "br": dragging.type = 0b0101; break;
					case "b" : dragging.type = 0b0100; break;
					case "bl": dragging.type = 0b0110; break;
					case  "l": dragging.type = 0b0010; break;
					case "tl": dragging.type = 0b1010; break;
				}
			} else {
				return;
			}
		} else {
			dragging.type = 0;
		}
		frame.find(".cover").show();
		dragging.frame = frame;
		dragging.top    = Number(frame.css("top"   ).split("px")[0]);
		dragging.left   = Number(frame.css("left"  ).split("px")[0]);
		dragging.width  = Number(frame.css("width" ).split("px")[0]);
		dragging.height = Number(frame.css("height").split("px")[0]);
		dragging.x = e.clientX;
		dragging.y = e.clientY;
		$("#cover").show();
		
	}).on("mousemove", function(e) {
		if (dragging.frame == null) {
			return;
		}
		const x = e.clientX - dragging.x;
		const y = e.clientY - dragging.y;
		
		const css = {};
		if (dragging.type == 0) {
			css.top  = Math.max(dragging.top  + y, -20);
			css.left = Math.max(dragging.left + x, 50 - dragging.width);
		} else {
			if (dragging.type & 0b1000) {
				css.top = Math.max(dragging.top + y, -20);
				css.height = dragging.height - y;
			} else if (dragging.type & 0b0100) {
				css.height = dragging.height + y;
			}
			if (dragging.type & 0b0010) {
				css.left = Math.max(dragging.left + x, 50);
				css.width = dragging.width - x;
			} else if (dragging.type & 0b0001) {
				css.width = dragging.width + x;
			}
		}
		dragging.frame.css(css);
		
	}).on("mouseup", function() {
		if (dragging.frame) {
			dragging.frame.find(".cover").hide();
			dragging.frame.data("obj").iframe.focus();
			dragging.frame = null;
			$("#cover").hide();
		}
	}).on("keydown", function(e) {
		if (dragging.frame && e.keyCode == 27) { // 드래그 중 Esc
			dragging.frame.css({ // 위치 원상복구
					top   : dragging.top
				,	left  : dragging.left
				,	width : dragging.width
				,	height: dragging.height
			});
			dragging.frame.find(".cover").hide();
			dragging.frame.data("obj").iframe.focus();
			dragging.frame = null;
			$("#cover").hide();
		}
	}).on("mousedown", ".frame", function() {
		Frame.refreshOrder($(this).data("obj"));
	}).on("click", ".fhead button", function() {
		$(this).parents(".frame").data("obj").close();
	});
});