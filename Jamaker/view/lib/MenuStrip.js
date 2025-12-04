function MenuStrip(ol=null) {
	const self = this;
	if (window.menustrip) return; // 한 윈도우에 하나만 존재하는 쪽으로
	window.menustrip = this;
	
	this.view = (ol ? ol : document.createElement("ol"));
	this.view.classList.add("menustrip");
	this.view.style.position = "absolute";
	this.view.style.top = 0;
	this.view.style.left = 0;
	this.view.style.width = "100%";
	this.view.addEventListener("mousedown", (e) => {
		if (e.target.closest("li")) {
			// 원래 포커스 기억한 다음
			self.rememberFocus();
		}
	});
	this.view.addEventListener("click", (e) => {
		const menu = e.target.closest("li");
		if (menu) {
			// 메뉴 열기
			e.stopPropagation();
			const submenu = menu.submenu;
			if (self.opened && self.opened.submenu == submenu) {
				self.unfocus();
			} else {
				self.openMenu(menu);
			}
		}
	});
	this.view.addEventListener("mouseover", (e) => {
		const menu = e.target.closest("li");
		if (menu) {
			if (self.opened) {
				// 하위 메뉴가 열린 상태에서 다른 메뉴로 마우스 이동할 경우
				self.openMenu(menu);
			}
		}
	});
	this.submenus = [];
	this.opened = null;
	
	{
		let lastKey = null;
		document.addEventListener("keydown", (e) => {
			const menu = e.target.closest(".menustrip li");
			if (menu) {
				e.stopPropagation();
				switch (e.keyCode) {
					case 37: { // ←
						let prev = menu.previousElementSibling;
						if (!prev) {
							prev = self.view.lastChild;
						}
						prev.focus();
						if (self.opened) {
							// 방향키 이동으로 연 하위 메뉴에 포커스
							self.openMenu(prev, true);
						}
						break;
					}
					case 39: { // →
						let next = menu.nextElementSibling;
						if (!next) {
							next = self.view.firstChild;
						}
						next.focus();
						if (self.opened) {
							// 방향키 이동으로 연 하위 메뉴에 포커스
							self.openMenu(next, true);
						}
						break;
					}
					case 38:   // ↑
					case 40:   // ↓
					case 13: { // Enter
						// 방향키 이동으로 연 하위 메뉴에 포커스
						self.openMenu(menu, true);
						break;
					}
					case 18:   // Alt
						lastKey = null; // 포커스 반환 직후 다시 Alt 메뉴 열리는 것 방지
					case 27: { // Esc
						self.unfocus();
						break;
					}
					default: {
						if (self.opened) {
							// 하위 메뉴 열려있을 때 - 키 조합 실행
							const subMenu = menu.subMenuKeys[e.key];
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
				return;
			}
			const li = e.target.closest(".submenu.open li");
			if (li) {
				e.stopPropagation();
				switch (e.keyCode) {
					case 38: { // ↑
						let prev = li.previousElementSibling;
						if (!prev) {
							prev = li.parentElement.lastChild;
						}
						prev.focus();
						break;
					}
					case 40: { // ↓
						let next = li.nextElementSibling;
						if (!next) {
							next = li.parentElement.firstChild;
						}
						next.focus();
						break;
					}
					case 37: { // ←
						const menu = li.parentElement.menu;
						let prev = menu.previousElementSibling;
						if (!prev) {
							prev = self.view.lastChild;
						}
						// 방향키 이동으로 연 하위 메뉴에 포커스
						self.openMenu(prev, true);
						break;
					}
					case 39: { // →
						const menu = li.parentElement.menu;
						let next = menu.nextElementSibling;
						if (!next) {
							next = self.view.firstChild;
						}
						// 방향키 이동으로 연 하위 메뉴에 포커스
						self.openMenu(next, true);
						break;
					}
					case 13: { // Enter
						e.preventDefault(); // 포커스 반환 직후 키입력 방지
						li.click();
						break;
					}
					case 18: { // Alt
						lastKey = null; // 포커스 반환 직후 다시 Alt 메뉴 열리는 것 방지
						self.unfocus(); // 메뉴 닫고 포커스 반환
						break;
					}
					case 27: { // Esc
						self.close(); // 메뉴 닫기만 하고 상위 메뉴에 포커스
						break;
					}
					default: {
						// 키 조합 실행
						const subMenu = li.parentElement.menu.subMenuKeys[e.key];
						if (subMenu) {
							e.preventDefault(); // 포커스 반환 직후 키입력 방지
							subMenu.click();
						}
					}
				}
				return;
			}

			lastKey = e.keyCode;
			
			if (!e.shiftKey && !e.ctrlKey && e.altKey) {
				const menu = self.menuKeys[e.key];
				if (menu) {
					// Alt+키 조합으로 메뉴 열기
					e.stopPropagation();
					self.rememberFocus();
					self.openMenu(menu, true);
				}
			}
		});
		document.addEventListener("keyup", (e) => {
			e.stopPropagation();
			if (e.keyCode == 18) {
				e.preventDefault(); // 이게 없으면 Alt+Spacebar 메뉴로 포커스됨
				if (lastKey == 18) {
					// 중간에 다른 키 누르지 않고, Alt만 눌렀다 뗀 경우
					if (self.opened) {
						// 메뉴가 포커스 가지고 있었으면 반환
						self.unfocus();
						
					} else {
						// 닫혀있었으면 원래 포커스 기억하고 메뉴에 포커스
						self.rememberFocus();
						self.view.firstChild.focus();
					}
				}
			}
		});
		document.addEventListener("mouseover", (e) => {
			const li = e.target.closest(".submenu.open li");
			if (li) {
				// 하위 메뉴에 마우스 올렸을 때
				li.focus();
			}
		});
		document.addEventListener("mouseout", (e) => {
			const submenu = e.target.closest(".submenu.open");
			if (submenu) {
				// 하위 메뉴에서 마우스 벗어나면 상위 메뉴에 포커스
				submenu.menu && submenu.menu.focus();
			}
		});
		document.addEventListener("click", (e) => {
			const li = e.target.closest(".submenu li");
			if (li) {
				// 하위 메뉴 클릭하면 실행
				self.unfocus();
				eval(li.func);
				return;
			}
			// 메뉴가 아닌 다른 곳을 클릭하면 포커스 반환
			menustrip.unfocus();
		});
	}
};
// 메뉴 재생성
// TODO: 원래 C#에 전달하기 위해 억지로 이중 배열 형태로 맞췄는데
//       웹에서 구현할 거면 객체 구조를 재정의하는 게 나을지도?
//       ... 근데 그러면 설정에 저장된 값까지 갈아엎어야 함...
MenuStrip.prototype.setMenus = function(menus) {
	this.submenus.forEach((submenu) => { submenu.remove(); });
	this.submenus = [];
	this.view.innerHTML = "";
	this.menuKeys = {};
	this.opened = null;
	
	const self = this;
	
	menus.forEach((list) => {
		const menuLi = document.createElement("li");
		menuLi.tabIndex = 1;
		let menuKey = null;
		
		let text = list[0];
		if (text.length > 4 && text[text.length-4]=="(" && text[text.length-3]=="&" && text[text.length-1]==")") {
			menuKey = text[text.length-2];
			menuLi.innerHTML = (text.substring(0, text.length - 3) + "<u>"+menuKey.toUpperCase()+"</u>)");
			this.menuKeys[menuKey.toLowerCase()] = menuLi;
		} else {
			menuLi.innerText = text;
		}
		const subMenuKeys = [];
		menuLi.subMenuKeys = subMenuKeys;

		const ol = document.createElement("ol");
		ol.classList.add("submenu");
		ol.menu = menuLi;
		for (let j = 1; j < list.length; j++) {
			const menu = list[j].split("|");
			const subLi = document.createElement("li");
			subLi.tabIndex = 1;
			subLi.func = menu[1];
			
			subLi.innerText = text = menu[0];
			let index = text.indexOf("&");
			if (index > 0) {
				if (text.length > index + 1) {
					menuKey = text[index + 1];
					if ('A' <= menuKey && menuKey <= 'Z') {
						subLi.innerHTML = (text.substring(0, index) + "<u>"+menuKey.toUpperCase()+"</u>" + text.substring(index + 2));
						subMenuKeys[menuKey.toLowerCase()] = subLi;
					}
				}
			}
			
			ol.append(subLi);
		}
		document.body.append(menuLi.submenu = ol);
		menustrip.view.append(menuLi);
	});
}
MenuStrip.prototype.rememberFocus = function() {
	if (this.focused) return;
	this.focused = document.activeElement;
}
MenuStrip.prototype.openMenu = function(menu=null, withFocus=false) {
	menu = menu ? menu : this.view.children[0];
	const submenu = menu.submenu;
	if (menu != this.opened) {
		if (this.opened) {
			this.opened.submenu.classList.remove("open");
			this.opened.classList.remove("open");
			this.opened.blur();
		}
		this.opened = menu;
		menu.classList.add("open")
		submenu.classList.add("open");
		submenu.style.left = menu.offsetLeft + "px";
	}
	if (withFocus) {
		// 하위 메뉴 첫 항목에 포커스
		submenu.firstChild.focus();
	} else {
		menu.focus();
	}
};
MenuStrip.prototype.close = function() {
	if (this.opened) {
		this.opened.submenu.classList.remove("open");
		this.opened.classList.remove("open");
		this.opened.focus();
		this.opened = null;
	}
};
MenuStrip.prototype.unfocus = function() {
	if (this.opened) {
		this.opened.submenu.classList.remove("open");
		this.opened.classList.remove("open");
		this.opened = null;
	}
	if (this.focused) {
		// 기존 포커스 객체에 포커스 반환
		this.focused.focus();
		this.focused = null;
	}
};
