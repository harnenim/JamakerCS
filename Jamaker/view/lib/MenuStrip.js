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
		// 원래 포커스 기억한 다음
		self.rememberFocus();
		
	}).on("click", "li", function(e) {
		// 메뉴 열기
		e.stopPropagation();
		const menu = $(this);
		const submenu = menu.data("submenu");
		if (submenu.hasClass("open")) {
			self.unfocus();
		} else {
			self.openMenu(menu);
		}
	}).on("mouseover", "li", function() {
		if ($(".submenu.open").length) {
			// 하위 메뉴가 열린 상태에서 다른 메뉴로 마우스 이동할 경우
			self.openMenu($(this));
		}
	});
	{
		let lastKey = null;
		$("body").on("keydown", function(e) {
			lastKey = e.keyCode;
			
			if (!e.shiftKey && !e.ctrlKey && e.altKey) {
				const menu = self.menuKeys[e.key];
				if (menu) {
					// Alt+키 조합으로 메뉴 열기
					e.stopPropagation();
					self.rememberFocus();
					self.openMenu(menu);
				}
			}
			
		}).on("keyup", function(e) {
			e.stopPropagation();
			if (e.keyCode == 18) {
				if (lastKey == 18) {
					// Alt+키 조합이 아닌, Alt만 눌렀다 뗌
					if ($(".menustrip li.open").length) {
						// 메뉴가 포커스 가지고 있었으면 반환
						self.unfocus();
						
					} else {
						// 닫혀있었으면 원래 포커스 기억하고 메뉴에 포커스
						self.rememberFocus();
						$(".menustrip li:eq(0)").focus();
					}
				} else {
					// Alt+키 조합으로 메뉴 열었을 때 첫 항목 선택
					// 원래 MenuStrip은 keydown에서 동작하지만, 웹에선 keyup 이전에 포커스를 놔주지 않음
					const menu = $(".menustrip li.open");
					if (menu.length) {
						$(".submenu.open li:eq(0)").focus();
					}
				}
			}
		}).on("keydown", ".menustrip li", function(e) {
			e.stopPropagation();
			const menu = $(this);
			const isOpened = $(".submenu.open").length;
			switch (e.keyCode) {
				case 37: { // ←
					let prev = menu.prev();
					if (!prev.length) {
						prev = self.view.find("li:last-child");
					}
					prev.focus();
					if (isOpened) {
						self.openMenu(prev, true); // 방향키 이동으로 연 하위 메뉴에 포커스
					}
					break;
				}
				case 39: { // →
					let next = menu.next();
					if (!next.length) {	
						next = self.view.find("li:first-child");
					}
					next.focus();
					if (isOpened) {
						self.openMenu(next, true); // 방향키 이동으로 연 하위 메뉴에 포커스
					}
					break;
				}
				case 38:   // ↑
				case 40:   // ↓
				case 13: { // Enter
					self.openMenu(menu, true); // 방향키 이동으로 연 하위 메뉴에 포커스
					break;
				}
				default: {
					if (isOpened) {
						// 하위 메뉴 열려있을 때 - 키 조합 실행
						const subMenu = menu.data("subMenuKeys")[e.key];
						if (subMenu) {
							subMenu.click();
						}
					} else {
						// 하위 메뉴 닫혀있을 때 - 키 조합 열기
						const targetMenu = self.menuKeys[e.key];
						if (targetMenu) {
							targetMenu.click();
						}
					}
				}
			}
		}).on("keydown", ".menustrip li", function(e) {
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
					self.openMenu(prev, true); // 방향키 이동으로 연 하위 메뉴에 포커스
					break;
				}
				case 39: { // →
					const menu = li.parent().data("menu");
					let next = menu.next();
					if (!next.length) {
						next = self.view.find("li:first-child");
					}
					self.openMenu(next, true); // 방향키 이동으로 연 하위 메뉴에 포커스
					break;
				}
				case 13: { // Enter
					li.click();
					break;
				}
				case 18:   // Alt
				case 27: { // Esc
					self.close();
					break;
				}
				default: {
					// 키 조합 실행
					const subMenu = li.parent().data("menu").data("subMenuKeys")[e.key];
					if (subMenu) {
						e.preventDefault(); // 포커스 반환 직후 키입력 방지
						subMenu.click();
					}
				}
			}
		}).on("mouseover", ".submenu.open li", function() {
			// 하위 메뉴에 마우스 올렸을 때
			$(this).focus();
			
		}).on("mouseout", ".submenu.open", function() {
			// 하위 메뉴에서 마우스 벗어나면 상위 메뉴에 포커스
			$(this).data("menu").focus();
			
		}).on("click", ".submenu li", function(e) {
			// 하위 메뉴 클릭하면 실행
			self.unfocus();
			eval($(this).data("func"));
			
		}).on("click", function() {
			// 메뉴가 아닌 다른 곳을 클릭하면 포커스 반환
			menustrip.unfocus();
		});
	}
};
// 메뉴 재생성
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
			let index = text.indexOf("&");
			if (index > 0) {
				if (text.length > index + 1) {
					menuKey = text[index + 1];
					if ('A' <= menuKey && menuKey <= 'Z') {
						subLi.html(text.substring(0, index) + "<u>"+menuKey.toUpperCase()+"</u>" + text.substring(index + 2));
						subMenuKeys[menuKey.toLowerCase()] = subLi;
					}
				}
			}
			
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
	
	$(".menustrip li.open").removeClass("open").blur();
	$(".submenu.open").removeClass("open");
	
	menu.addClass("open")
	submenu.addClass("open").css({ left: menu.offset().left });
	if (withFocus) {
		// 하위 메뉴 첫 항목에 포커스
		submenu.find("li:eq(0)").focus();
	}
};
MenuStrip.prototype.close = function() {
	$(".submenu.open").removeClass("open");
	$(".menustrip li.open").focus();
};
MenuStrip.prototype.unfocus = function() {
	$(".submenu.open").removeClass("open");
	$(".menustrip li.open").removeClass("open");
	if (this.focused) {
		// 기존 포커스 객체에 포커스 반환
		$(this.focused).focus();
		this.focused = null;
	}
};
