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
				self.unfocus(false);
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
};

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
						prev = menustrip.view.lastChild;
					}
					prev.focus();
					if (menustrip.opened) {
						// 방향키 이동으로 연 하위 메뉴에 포커스
						menustrip.openMenu(prev, true);
					}
					break;
				}
				case 39: { // →
					let next = menu.nextElementSibling;
					if (!next) {
						next = menustrip.view.firstChild;
					}
					next.focus();
					if (menustrip.opened) {
						// 방향키 이동으로 연 하위 메뉴에 포커스
						menustrip.openMenu(next, true);
					}
					break;
				}
				case 38:   // ↑
				case 40:   // ↓
				case 13: { // Enter
					// 방향키 이동으로 연 하위 메뉴에 포커스
					menustrip.openMenu(menu, true);
					break;
				}
				case 18:   // Alt
					lastKey = null; // 포커스 반환 직후 다시 Alt 메뉴 열리는 것 방지
				case 27: { // Esc
					menustrip.unfocus();
					break;
				}
				case 9: // Tab
				{	// 포커스 이동 방지
					e.preventDefault();
					break;
				}
				default: {
					if (menustrip.opened) {
						// 하위 메뉴 열려있을 때 - 키 조합 실행
						const subMenu = menu.subMenuKeys[e.key];
						if (subMenu) {
							subMenu.click();
						}
					} else {
						// 하위 메뉴 닫혀있을 때 - 키 조합 열기
						const targetMenu = menustrip.menuKeys[e.key];
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
					let prev = li;
					do {
						prev = prev.previousElementSibling;
						if (!prev) {
							prev = li.parentElement.lastChild;
						}
						if (!prev.classList.contains("line") && !prev.classList.contains("disable")) break;
					} while (prev != li);
					prev.focus();
					break;
				}
				case 40: { // ↓
					let next = li;
					do {
						next = next.nextElementSibling;
						if (!next) {
							next = li.parentElement.firstChild;
						}
						if (!next.classList.contains("line") && !next.classList.contains("disable")) break;
					} while (next != li);
					next.focus();
					break;
				}
				case 37: { // ←
					const menu = li.parentElement.owner;
					if (menu) {
						let prev = menu.previousElementSibling;
						if (!prev) {
							prev = menustrip.view.lastChild;
						}
						// 방향키 이동으로 연 하위 메뉴에 포커스
						menustrip.openMenu(prev, true);
					}
					break;
				}
				case 39: { // →
					const menu = li.parentElement.owner;
					if (menu) {
						let next = menu.nextElementSibling;
						if (!next) {
							next = menustrip.view.firstChild;
						}
						// 방향키 이동으로 연 하위 메뉴에 포커스
						menustrip.openMenu(next, true);
					}
					break;
				}
				case 13: { // Enter
					e.preventDefault(); // 포커스 반환 직후 키입력 방지
					li.click();
					break;
				}
				case 18: { // Alt
					lastKey = null; // 포커스 반환 직후 다시 Alt 메뉴 열리는 것 방지
					// 메뉴 닫고 포커스 반환
					focusedMenu.unfocus();
					break;
				}
				case 27: { // Esc
					// 메뉴 닫기만 하고 상위 메뉴에 포커스
					focusedMenu.close();
					break;
				}
				case 9: // Tab
				{	// 포커스 이동 방지
					e.preventDefault();
					break;
				}
				default: {
					// 키 조합 실행
					let subMenu = null;
					if (li.parentElement.owner) {
						subMenu = li.parentElement.owner.subMenuKeys[e.key];
					} else if (focusedMenu && focusedMenu.menuKeys) {
						subMenu = focusedMenu.menuKeys[e.key];
					}
					if (subMenu) {
						e.preventDefault(); // 포커스 반환 직후 키입력 방지
						subMenu.click();
					}
				}
			}
			return;
		}
		
		const contextmenu = e.target.closest(".submenu.contextmenu");
		if (contextmenu) {
			e.stopPropagation();
			switch (e.keyCode) {
				case 38: { // ↑
					// 하위 메뉴 마지막 항목에 포커스
					const lis = contextmenu.childNodes;
					for (let i = lis.length - 1; i >= 0; i--) {
						const li = lis[i];
						if (li.classList.contains("line") || li.classList.contains("disable")) continue;
						li.focus();
						break;
					}
					break;
				}
				case 40: { // ↓
					// 하위 메뉴 첫 항목에 포커스
					const lis = contextmenu.childNodes;
					for (let i = 0; i < lis.length; i++) {
						const li = lis[i];
						if (li.classList.contains("line") || li.classList.contains("disable")) continue;
						li.focus();
						break;
					}
					break;
				}
				case 27: { // Esc
					focusedMenu.unfocus();
					break;
				}
				case 9: // Tab
				{	// 포커스 이동 방지
					e.preventDefault();
					break;
				}
				default: {
					// 하위 메뉴 열려있을 때 - 키 조합 실행
					const subMenu = focusedMenu.menuKeys[e.key];
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
			const menu = menustrip.menuKeys[e.key];
			if (menu) {
				// Alt+키 조합으로 메뉴 열기
				e.stopPropagation();
				e.preventDefault();
				menustrip.rememberFocus();
				menustrip.openMenu(menu, true);
			}
		}
	});
	document.addEventListener("keyup", (e) => {
		if (!menustrip) return;
		e.stopPropagation();
		if (e.keyCode == 18) {
			e.preventDefault(); // 이게 없으면 Alt+Spacebar 메뉴로 포커스됨
			if (lastKey == 18) {
				// 중간에 다른 키 누르지 않고, Alt만 눌렀다 뗀 경우
				if (menustrip.opened) {
					// 메뉴가 포커스 가지고 있었으면 반환
					menustrip.unfocus();
					
				} else {
					// 닫혀있었으면 원래 포커스 기억하고 메뉴에 포커스
					menustrip.rememberFocus();
					menustrip.view.firstChild.focus();
				}
			} else {
				// 크롬에서 keydown 이벤트에서 포커스를 놔주지 않는 경우가 있음
				if (menustrip.opened) {
					const lis = menustrip.opened.submenu.childNodes;
					for (let i = 0; i < lis.length; i++) {
						const li = lis[i];
						if (li.classList.contains("line") || li.classList.contains("disable")) continue;
						li.focus();
						break;
					}
				}
			}
		}
	});
	document.addEventListener("mouseover", (e) => {
		const li = e.target.closest(".submenu.open li");
		if (li) {
			// 비활성 메뉴 무시
			if (li.classList.contains("line") || li.classList.contains("disable")) return;

			// 하위 메뉴에 마우스 올렸을 때
			li.focus();
		}
	});
	document.addEventListener("mouseout", (e) => {
		const submenu = e.target.closest(".submenu.open");
		if (submenu) {
			if (submenu.owner) {
				// 하위 메뉴에서 마우스 벗어나면 상위 메뉴에 포커스
				submenu.owner.focus();
			} else {
				// contextmenu일 경우
				submenu.focus();
			}
		}
	});
	document.addEventListener("click", (e) => {
		const li = e.target.closest(".submenu li");
		if (li) {
			// 비활성 메뉴 무시
			if (li.classList.contains("line") || li.classList.contains("disable")) return;

			// 하위 메뉴 클릭하면 메뉴 닫고 실행
			eval("(() => { " + li.func + "// */\n})()"); // 내용물이 주석으로 끝날 수도 있음
			focusedMenu.unfocus();
			return;
		}
		// 구분선 여백이 눌리는 경우가 있음
		if (e.target.closest(".submenu")) return;

		// 메뉴가 아닌 다른 곳을 클릭하면 포커스 반환
		focusedMenu && focusedMenu.unfocus();
	});
	window.menustrip = null;
	window.focusedMenu = null;
}

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
		
		const text = menuLi.innerText = list[0];
		let index = text.indexOf("&");
		if (index > 0) {
			if (text.length > index + 1) {
				menuKey = text[text.length-2];
				if (('A' <= menuKey && menuKey <= 'Z') || ('0' <= menuKey && menuKey <= '9')) {
					menuLi.innerHTML = (text.substring(0, text.length - 3) + "<u>"+menuKey.toUpperCase()+"</u>)");
					this.menuKeys[menuKey.toLowerCase()] = menuLi;
				}
			}
		}
		
		const submenu = MenuStrip.createSubMenu(list.slice(1));
		self.submenus.push(submenu.view);
		
		menuLi.subMenuKeys = submenu.menuKeys;
		submenu.view.owner = menuLi;
		document.body.append(menuLi.submenu = submenu.view);
		menustrip.view.append(menuLi);
	});
}
// contextmenu 지원 시 공통으로 활용
MenuStrip.createSubMenu = function(menus=[]) {
	const menuKeys = [];
	const ol = document.createElement("ol");
	ol.classList.add("submenu");
	for (let j = 0; j < menus.length; j++) {
		let menu = menus[j];
		if (typeof menu == "string") {
			menu = menu.split("|");
			menu = {
				name: menu[0]
			,	func: menu.slice(1).join("|")
			,	perm: true
			};
		}
		const subLi = document.createElement("li");
		
		if (subLi.innerText = menu.name) {
			subLi.func = menu.func;
			index = menu.name.indexOf("&");
			if (index > 0) {
				if (menu.name.length > index + 1) {
					menuKey = menu.name[index + 1];
					if (('A' <= menuKey && menuKey <= 'Z') || ('0' <= menuKey && menuKey <= '9')) {
						subLi.innerHTML = (menu.name.substring(0, index) + "<u>" + menuKey.toUpperCase() + "</u>" + menu.name.substring(index + 2));
						menuKeys[menuKey.toLowerCase()] = subLi;
					}
				}
			}
			subLi.perm = menu.perm;
		} else {
			subLi.classList.add("line");
		}
		ol.append(subLi);
	}
	
	return { view: ol, menuKeys: menuKeys };
}
MenuStrip.prototype.rememberFocus = function() {
	if (window.focusedMenu && focusedMenu != this) focusedMenu.unfocus(false);
	if (this.focused) return;
	this.focused = document.activeElement;
	focusedMenu = this;
}
MenuStrip.prototype.openMenu = function(menu=null, withFocus=false) {
	if (window.focusedMenu && focusedMenu != this) focusedMenu.unfocus(false);
	window.focusedMenu = this; // 열려있는 메뉴는 한 번에 하나만 존재
	
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
		submenu.childNodes.forEach(async (li) => {
			if (await eval(li.perm)) {
				li.tabIndex = 1;
				li.classList.remove("disable");
			} else {
				li.removeAttribute("tabindex");
				li.classList.add("disable");
			}
		});
	}
	if (withFocus) {
		// 하위 메뉴 첫 항목에 포커스
		const lis = submenu.childNodes;
		for (let i = 0; i < lis.length; i++) {
			const li = lis[i];
			if (li.classList.contains("line")) continue;
			li.focus();
			break;
		}
	} else {
		// 메뉴 자체에 포커스
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
MenuStrip.prototype.unfocus = function(withReturnFocus=true) {
	window.focusedMenu = null;
	if (this.opened) {
		this.opened.submenu.classList.remove("open");
		this.opened.classList.remove("open");
		this.opened = null;
	}
	if (this.focused && withReturnFocus) {
		// 기존 포커스 객체에 포커스 반환
		this.focused.focus();
		this.focused = null;
	}
};

function ContextMenu(menus=[]) {
	const submenu = MenuStrip.createSubMenu(menus);
	this.menuKeys = submenu.menuKeys;
	this.view = submenu.view;
	this.view.classList.add("contextmenu");
	this.view.style.position = "fixed";
	this.view.tabIndex = 1;
	document.body.append(this.view);
}
ContextMenu.prototype.remove = function() {
	this.view.remove();
}
ContextMenu.prototype.open = function(e, owner) {
	if (window.focusedMenu && focusedMenu != this) focusedMenu.unfocus(false);
	window.focusedMenu = this; // 열려있는 메뉴는 한 번에 하나만 존재
	
	this.owner = (owner ? owner : owner = document.body);

	this.view.childNodes.forEach(async (li) => {
		if (await eval(li.perm)) {
			li.tabIndex = 1;
			li.classList.remove("disable");
		} else {
			li.removeAttribute("tabindex");
			li.classList.add("disable");
		}
	});

	this.view.style.top  = 0;
	this.view.style.left = 0;
	this.view.classList.add("open");
	this.view.focus();
	
	let top  = e.clientY;
	let left = e.clientX;
	let right  = left + this.view.offsetWidth ;
	let bottom = top  + this.view.offsetHeight;
	if (right  > document.body.clientWidth ) { left -= this.view.offsetWidth ; }
	if (bottom > document.body.clientHeight) { top  -= this.view.offsetHeight; }
	
	this.view.style.top  = top  + "px";
	this.view.style.left = left + "px";
	
}
ContextMenu.prototype.close = // contextmenu에선 close와 unfocus 동작 구분 없음
ContextMenu.prototype.unfocus = function(withReturnFocus=true) {
	window.focusedMenu = null;
	this.view.classList.remove("open");
	if (withReturnFocus) {
		this.owner.focus();
	}
}
