function MenuStrip($ol=null) {
	const self = this;
	if (window.menustrip) return; // 한 윈도우에 하나만 존재하는 쪽으로
	window.menustrip = this;
	
	this.view = ($ol ? $ol : $("<ol>")).addClass("menustrip").css({
			position: "absolute"
		,	top: 0
		,	left: 0
		,	width: "100%"
	}).on("mousedown", "li", function(e) {
		self.rememberFocus();
	}).on("click", "li", function(e) {
		e.stopPropagation();
		const menu = $(this);
		const submenu = menu.data("submenu");
		if (submenu.hasClass("open")) {
			self.unfocus();
		} else {
			self.openMenu(menu, submenu);
		}
	}).on("mouseover", "li", function() {
		if ($(".submenu.open").length) {
			self.openMenu($(this));
		}
	});
	{
		let lastIsAlt = false;
		$("body").on("keydown", function(e) {
			lastIsAlt = (e.keyCode == 18);
			
			if (!e.shiftKey && !e.ctrlKey && e.altKey) {
				const menu = self.menuKeys[e.key];
				if (menu) {
					e.preventDefault();
					self.rememberFocus();
					self.openMenu(menu);
				}
			}
			
		}).on("keyup", function(e) {
			if (e.keyCode == 18) {
				if (lastIsAlt) {
					if ($(".menustrip li.open").length) {
						self.unfocus();
					} else {
						self.rememberFocus();
						$(".menustrip li:eq(0)").focus();
					}
				} else {
					// Alt+키 조합으로 메뉴 열었을 때 focus 재설정
					const menu = $(".menustrip li.open");
					if (menu.length) {
						$(".submenu.open li:eq(0)").focus();
					}
				}
			}
		}).on("keydown", ".menustrip li", function(e) {
			const menu = $(this);
			const isOpened = $(".submenu.open").length;
			switch (e.keyCode) {
				case 37: { // ←
					e.stopPropagation();
					let prev = menu.prev();
					if (!prev.length) {
						prev = self.view.find("li:last-child");
					}
					prev.focus();
					if (isOpened) {
						self.openMenu(prev, true);
					}
					break;
				}
				case 39: { // →
					e.stopPropagation();
					let next = menu.next();
					if (!next.length) {	
						next = self.view.find("li:first-child");
					}
					next.focus();
					if (isOpened) {
						self.openMenu(next, true);
					}
					break;
				}
				case 38:   // ↑
				case 40:   // ↓
				case 13: { // Enter
					e.stopPropagation();
					e.preventDefault();
					self.openMenu(menu, true);
					break;
				}
				default: {
					if (isOpened) {
						// 하위 메뉴 열려있을 때
						const subMenu = menu.data("subMenuKeys")[e.key];
						if (subMenu) {
							e.preventDefault();
							subMenu.click();
						}
					} else {
						// 하위 메뉴 닫혀있을 때
						const targetMenu = self.menuKeys[e.key];
						if (targetMenu) {
							e.preventDefault();
							targetMenu.click();
						}
					}
				}
			}
		}).on("keyup", ".menustrip li", function(e) {
			e.stopPropagation();
			switch (e.keyCode) {
				case 18:   // Alt
				case 27: { // Esc
					self.unfocus();
					break;
				}
			}
		}).on("keydown", ".submenu.open li", function(e) {
			e.stopPropagation();
			const li = $(this);
			switch (e.keyCode) {
				case 38: { // ↑
					let prev = li.prev();
					if (!prev.length) {
						prev = li.parent().find("li:last-child");
					}
					prev.focus();
					break;
				}
				case 40: { // ↓
					let next = li.next();
					if (!next.length) {
						next = li.parent().find("li:first-child");
					}
					next.focus();
					break;
				}
				case 37: { // ←
					const menu = li.parent().data("menu");
					let prev = menu.prev();
					if (!prev.length) {
						prev = self.view.find("li:last-child");
					}
					self.openMenu(prev, true);
					break;
				}
				case 39: { // →
					const menu = li.parent().data("menu");
					let next = menu.next();
					if (!next.length) {
						next = self.view.find("li:first-child");
					}
					self.openMenu(next, true);
					break;
				}
				case 13: { // Enter
					li.click();
					break;
				}
				default: {
					const subMenu = li.parent().data("menu").data("subMenuKeys")[e.key];
					if (subMenu) {
						e.preventDefault();
						subMenu.click();
					}
				}
			}
		}).on("keyup", ".submenu.open li", function(e) {
			e.stopPropagation();
			switch (e.keyCode) {
				case 18:   // Alt
				case 27: { // Esc
					self.close();
					break;
				}
			}
		}).on("click", function() {
			menustrip.unfocus();
			
		}).on("mouseover", ".submenu.open li", function() {
			$(this).focus();
			
		}).on("mouseout", ".submenu.open", function() {
			$(this).data("menu").focus();
		});
	}
};
MenuStrip.prototype.setMenus = function(menus) {
	const $body = $("body");
	$body.find(".submenu").remove();
	this.view.empty();
	this.menuKeys = {};
	
	const self = this;
	
	for (let i = 0; i < menus.length; i++) {
		const list = menus[i];
		let menuLi = $("<li tabindex='1'>");
		let menuKey = null;
		
		let text = list[0];
		if (text.length > 4 && text[text.length-4]=="(" && text[text.length-3]=="&" && text[text.length-1]==")") {
			menuKey = text[text.length-2];
			menuLi.html(text.substring(0, text.length - 3) + "<u>"+menuKey.toUpperCase()+"</u>)");
			this.menuKeys[menuKey.toLowerCase()] = menuLi;
		} else {
			menuLi.text(text);
		}
		const subMenuKeys = [];
		menuLi.data({ subMenuKeys: subMenuKeys });
		
		const ol = $("<ol>").addClass("submenu").data("menu", menuLi);
		for (let j = 1; j < list.length; j++) {
			const menu = list[j].split("|");
			let subLi = $("<li tabindex='1'>").data("func", menu[1]);
			
			subLi.text(text = menu[0]);
			let index = text.indexOf("(&");
			if (index > 0) {
				if (text.length > index + 3 && text[index + 3] == ")") {
					menuKey = text[index + 2];
					subLi.html(text.substring(0, index) + "(<u>"+menuKey.toUpperCase()+"</u>)" + text.substring(index + 4));
					subMenuKeys[menuKey.toLowerCase()] = subLi;
				}
			}
			
			subLi.on("click", function() {
				self.unfocus();
				const func = $(this).data("func");
				eval(func);
			});
			
			ol.append(subLi);
		}
		$body.append(ol);
		menuLi.data("submenu", ol);
		menustrip.view.append(menuLi);
	}
}
MenuStrip.prototype.rememberFocus = function() {
	if (this.focused) return;
	this.focused = document.activeElement;
}
MenuStrip.prototype.openMenu = function(menu=null, withFocus=false) {
	menu = menu ? menu : this.view.find("li:eq(0)");
	const submenu = menu.data("submenu");
	
	$(".menustrip li.open").removeClass("open");
	$(".submenu.open").removeClass("open");
	
	menu.addClass("open")
	submenu.addClass("open").css({ left: menu.offset().left });
	if (withFocus) {
		submenu.find("li:eq(0)").focus();
	}
};
MenuStrip.prototype.close = function() {
	$(".submenu.open").removeClass("open");
	$(".menustrip li.open").focus();
};
MenuStrip.prototype.unfocus = function() {
	console.log("unfocus", this.focused);
	$(".submenu.open").removeClass("open");
	$(".menustrip li.open").removeClass("open");
	if (this.focused) {
		$(this.focused).focus();
		this.focused = null;
	}
};
