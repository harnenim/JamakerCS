// from Johap.cs

window.Johap = {
	cho_ : "ᄀᄁᄂᄃᄄᄅᄆᄇᄈᄉᄊᄋᄌᄍᄎᄏᄐᄑᄒ"
,	jung : "ᅡᅢᅣᅤᅥᅦᅧᅨᅩᅪᅫᅬᅭᅮᅯᅰᅱᅲᅳᅴᅵ"
,	jong : "　ᆨᆩᆪᆫᆬᆭᆮᆯᆰᆱᆲᆳᆴᆵᆶᆷᆸᆹᆺᆻᆼᆽᆾᆿᇀᇁᇂ"
	
,	toJohap: function(origin) {
		const result = [];
		
		for (let i = 0; i < origin.length; i++) {
			const c = origin[i];

			if (c >= '가' && c <= '힣')
			{
				const cCho_ = Math.floor((c.charCodeAt() - 44032) / 588);
				const cJung = Math.floor((c.charCodeAt() - 44032) / 28) % 21;
				const cJong = ((c.charCodeAt() - 44032) % 28);

				if (cJong > 0) {
					result.push(Johap.cho_[cCho_]);
					result.push(Johap.jung[cJung]);
					result.push(Johap.jong[cJong]);
				} else {
					result.push(Johap.cho_[cCho_]);
					result.push(Johap.jung[cJung]);
				}
			} else {
				result.push(c);
			}
		}
		
		return result;
	}
}

setTimeout(() => { // 생성자 선언보다 나중에 돌아야 함
	Typing.Mode =
	{	character: 0
	,	typewriter: 1
	,	keyboard: 2
	,	toString: ["character", "typewriter", "keyboard"]
	}
	Typing.Cursor =
	{	invisible: 0
	,	visible: 1
	,	hangeul: 2
	,	toString: ["invisible", "visible", "hangeul"]
	}
	Typing.toType = (origin, mode, cursor) => {
		return Typing.toTypeWithCursor(origin, mode, cursor);
	}
	Typing.toTypeCharacter = (johap) => {
		const result = [];
		let mode = null; // TODO: 여기에 &, < 구분이 필요하던가...?
		let cs = "";
		for (let i = 0; i < johap.length; i++) {
			const c = johap[i];
			switch (mode) {
				case ' ': {
					if (c == ' ' || c == '\t' || c == '\n' || c == '​' || c == '　') {
						cs += c;
					} else if (c == '&') {
						cs += c;
						mode = '&';
					} else if (c == '<') {
						cs += c;
						mode = '<';
					} else {
						// 공백문자는 프레임 차지하지 않는 방향으로
						/*
						result.push(cs);
						cs = "";
						mode = null;
						result.push(c);
						*/
						result.push(cs + c);
						cs = "";
					}
					break;
				}
				case '&' : {
					if (c == ' ' || c == '\t' || c == '\n' || c == '​' || c == '　') {
						cs += c;
						mode = ' ';
					} else if (c == '&') {
						result.push(cs);
						cs = c;
						mode = '&';
					} else if (c == '<') {
						result.push(cs);
						cs = c;
						mode = '<';
					} else if (c == ';') {
						cs += c;
						// 공백문자는 프레임 차지하지 않는 방향으로
						if (cs != "&nbsp;") {
							result.push(cs);
							cs = "";
						}
						mode = null;
					} else {
						cs += c;
					}
					break;
				}
				case '<' : {
					if (c == '>') {
						result.push(cs);
						cs = "";
						mode = null;
					} else {
						cs += c;
					}
					break;
				}
				default: {
					if (c == ' ' || c == '\t' || c == '\n' || c == '​' || c == '　') {
						cs = c;
						mode = ' ';
					} else if (c == '&') {
						cs = c;
						mode = '&';
					} else if (c == '<') {
						cs = c;
						mode = '<';
					} else {
						result.push(c);
					}
				}
			}
		}
		return result;
	}
	Typing.toTypeTypewriter = (johap) => {
		const result = [];
		for (let i = 0; i < johap.length; i++) {
			const c = johap[i];
			switch (c) {
				case 'ᅪ': result.push('ᅩ'); result.push('ᅡ'); break;
				case 'ᅫ': result.push('ᅩ'); result.push('ᅢ'); break;
				case 'ᅬ': result.push('ᅩ'); result.push('ᅵ'); break;
				case 'ᅯ': result.push('ᅮ'); result.push('ᅥ'); break;
				case 'ᅰ': result.push('ᅮ'); result.push('ᅦ'); break;
				case 'ᅱ': result.push('ᅮ'); result.push('ᅵ'); break;
				case 'ᅴ': result.push('ᅳ'); result.push('ᅵ'); break;
				default: result.push(c); break;
			}
		}
		return result;
	}
	Typing.toTypeKeyboard = (johap) => {
		const result = [];
		for (let i = 0; i < johap.length; i++) {
			const c = johap[i];
			switch (c) {
				case 'ᄀ': result.push('ㄱ'); break;
				case 'ᄁ': result.push('ㄲ'); break;
				case 'ᄂ': result.push('ㄴ'); break;
				case 'ᄃ': result.push('ㄷ'); break;
				case 'ᄄ': result.push('ㄸ'); break;
				case 'ᄅ': result.push('ㄹ'); break;
				case 'ᄆ': result.push('ㅁ'); break;
				case 'ᄇ': result.push('ㅂ'); break;
				case 'ᄈ': result.push('ㅃ'); break;
				case 'ᄉ': result.push('ㅅ'); break;
				case 'ᄊ': result.push('ㅆ'); break;
				case 'ᄋ': result.push('ㅇ'); break;
				case 'ᄌ': result.push('ㅈ'); break;
				case 'ᄍ': result.push('ㅉ'); break;
				case 'ᄎ': result.push('ㅊ'); break;
				case 'ᄏ': result.push('ㅋ'); break;
				case 'ᄐ': result.push('ㅌ'); break;
				case 'ᄑ': result.push('ㅍ'); break;
				case 'ᄒ': result.push('ㅎ'); break;
				case 'ᅡ': result.push('ㅏ'); break;
				case 'ᅢ': result.push('ㅐ'); break;
				case 'ᅣ': result.push('ㅑ'); break;
				case 'ᅤ': result.push('ㅒ'); break;
				case 'ᅥ': result.push('ㅓ'); break;
				case 'ᅦ': result.push('ㅔ'); break;
				case 'ᅧ': result.push('ㅕ'); break;
				case 'ᅨ': result.push('ㅖ'); break;
				case 'ᅩ': result.push('ㅗ'); break;
				case 'ᅪ': result.push('ㅗ'); result.push('ㅏ'); break;
				case 'ᅫ': result.push('ㅗ'); result.push('ㅐ'); break;
				case 'ᅬ': result.push('ㅗ'); result.push('ㅣ'); break;
				case 'ᅭ': result.push('ㅛ'); break;
				case 'ᅮ': result.push('ㅜ'); break;
				case 'ᅯ': result.push('ㅜ'); result.push('ㅓ'); break;
				case 'ᅰ': result.push('ㅜ'); result.push('ㅔ'); break;
				case 'ᅱ': result.push('ㅜ'); result.push('ㅣ'); break;
				case 'ᅲ': result.push('ㅠ'); break;
				case 'ᅳ': result.push('ㅡ'); break;
				case 'ᅴ': result.push('ㅡ'); result.push('ㅣ'); break;
				case 'ᅵ': result.push('ㅣ'); break;
				case 'ᆨ': result.push('ㄱ'); break;
				case 'ᆩ': result.push('ㄲ'); break;
				case 'ᆪ': result.push('ㄱ'); result.push('ㅅ'); break;
				case 'ᆫ': result.push('ㄴ'); break;
				case 'ᆬ': result.push('ㄴ'); result.push('ㅈ'); break;
				case 'ᆭ': result.push('ㄴ'); result.push('ㅎ'); break;
				case 'ᆮ': result.push('ㄷ'); break;
				case 'ᆯ': result.push('ㄹ'); break;
				case 'ᆰ': result.push('ㄹ'); result.push('ㄱ'); break;
				case 'ᆱ': result.push('ㄹ'); result.push('ㅁ'); break;
				case 'ᆲ': result.push('ㄹ'); result.push('ㅂ'); break;
				case 'ᆳ': result.push('ㄹ'); result.push('ㅅ'); break;
				case 'ᆴ': result.push('ㄹ'); result.push('ㅌ'); break;
				case 'ᆵ': result.push('ㄹ'); result.push('ㅍ'); break;
				case 'ᆶ': result.push('ㄹ'); result.push('ㅎ'); break;
				case 'ᆷ': result.push('ㅁ'); break;
				case 'ᆸ': result.push('ㅂ'); break;
				case 'ᆹ': result.push('ㅂ'); result.push('ㅅ'); break;
				case 'ᆺ': result.push('ㅅ'); break;
				case 'ᆻ': result.push('ㅆ'); break;
				case 'ᆼ': result.push('ㅇ'); break;
				case 'ᆽ': result.push('ㅈ'); break;
				case 'ᆾ': result.push('ㅊ'); break;
				case 'ᆿ': result.push('ㅋ'); break;
				case 'ᇀ': result.push('ㅌ'); break;
				case 'ᇁ': result.push('ㅍ'); break;
				case 'ᇂ': result.push('ㅎ'); break;
				case 'ㄳ': result.push('ㄱ'); result.push('ㅅ'); break;
				case 'ㄵ': result.push('ㄴ'); result.push('ㅈ'); break;
				case 'ㄶ': result.push('ㄴ'); result.push('ㅎ'); break;
				case 'ㄺ': result.push('ㄹ'); result.push('ㄱ'); break;
				case 'ㄻ': result.push('ㄹ'); result.push('ㅁ'); break;
				case 'ㄼ': result.push('ㄹ'); result.push('ㅂ'); break;
				case 'ㄽ': result.push('ㄹ'); result.push('ㅅ'); break;
				case 'ㄿ': result.push('ㄹ'); result.push('ㅍ'); break;
				case 'ㄾ': result.push('ㄹ'); result.push('ㅌ'); break;
				case 'ㅀ': result.push('ㄹ'); result.push('ㅎ'); break;
				case 'ㅄ': result.push('ㅂ'); result.push('ㅅ'); break;
				default: result.push(c); break;
			}
		}
		return result;
	}
	
	Typing.toTypeWithCursor = (origin, mode, cursor) => {
		const result = [];
		let type = origin;
		switch (mode) {
			case Typing.Mode.character: {
				type = Typing.toTypeCharacter(origin);
				break;
			}
			case Typing.Mode.typewriter: {
				type = Johap.toJohap(origin);
				break;
			}
			case Typing.Mode.keyboard: {
				type = Typing.toTypeKeyboard(Johap.toJohap(origin));
				break;
			}
		}
		
		const typing = new Typing(mode, cursor);
		if ((cursor != Typing.Cursor.invisible) || (mode == Typing.Mode.keyboard)) {
			result.push(typing.out());
		}
		for (let i = 0; i < type.length; i++) {
			typing.type(type[i]);
			result.push(typing.out());
		}
		return result;
	}
	
	Typing.cho = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
	Typing.nCho = (c) => {
		switch (c) {
			case 'ㄱ': return 0;
			case 'ㄲ': return 1;
			case 'ㄴ': return 2;
			case 'ㄷ': return 3;
			case 'ㄸ': return 4;
			case 'ㄹ': return 5;
			case 'ㅁ': return 6;
			case 'ㅂ': return 7;
			case 'ㅃ': return 8;
			case 'ㅅ': return 9;
			case 'ㅆ': return 10;
			case 'ㅇ': return 11;
			case 'ㅈ': return 12;
			case 'ㅉ': return 13;
			case 'ㅊ': return 14;
			case 'ㅋ': return 15;
			case 'ㅌ': return 16;
			case 'ㅍ': return 17;
			case 'ㅎ': return 18;
		}
		return 0;
	}
	Typing.nJong = (c) => {
		switch (c) {
//			case '　' : return 0;
			case 'ㄱ': return 1;
			case 'ㄲ': return 2;
			case 'ㄳ': return 3;
			case 'ㄴ': return 4;
			case 'ㄵ': return 5;
			case 'ㄶ': return 6;
			case 'ㄷ': return 7;
			case 'ㄹ': return 8;
			case 'ㄺ': return 9;
			case 'ㄻ': return 10;
			case 'ㄼ': return 11;
			case 'ㄽ': return 12;
			case 'ㄾ': return 13;
			case 'ㄿ': return 14;
			case 'ㅀ': return 15;
			case 'ㅁ': return 16;
			case 'ㅂ': return 17;
			case 'ㅄ': return 18;
			case 'ㅅ': return 19;
			case 'ㅆ': return 20;
			case 'ㅇ': return 21;
			case 'ㅈ': return 22;
			case 'ㅊ': return 23;
			case 'ㅋ': return 24;
			case 'ㅌ': return 25;
			case 'ㅍ': return 26;
			case 'ㅎ': return 27;
		}
		return 0;
	}
});

window.Typing = function(mode, cursor) {
	this.typed = "";
	this.typing = " ";
	this.type = null;
	this.out = null;
	switch (mode) {
		case Typing.Mode.character:
			this.type = this.typeCharacter;
			break;
		case Typing.Mode.typewriter:
			this.type = this.typeTypewriter;
			break;
		case Typing.Mode.keyboard:
			this.type = this.typeKeyboard;
			break;
	}
	switch (cursor) {
		case Typing.Cursor.invisible:
			this.out = this.outputWithNoCursor;
			break;
		case Typing.Cursor.visible:
			this.out = this.outputWithCursor;
			break;
		case Typing.Cursor.hangeul:
			this.out = this.outputWithCursorOnlyHangeul;
			break;
	}
}
Typing.prototype.typeFunc = () => {}; // delegate
Typing.prototype.typeCharacter = function(c) {
	this.typed += c;
}
Typing.prototype.typeTypewriter = function(c) {
	if (c >= 'ᄀ' && c <= 'ᄒ') {
		// 초성
		if (this.typing != ' ') this.typed += this.typing;
		this.typing = c;
	} else if (c >= 'ᅡ' && c <= 'ᅵ') {
		// 중성
		if (this.typing >= 'ᄀ' && this.typing <= 'ᄒ') {
			this.typing = String.fromCharCode(44032/*'가'*/ + ((this.typing.charCodeAt() - 4352/*'ᄀ'*/) * 588) + ((c.charCodeAt() - 4449/*'ᅡ'*/) * 28));
			return;
		}

		// 이중중성
		if (this.typing >= '고' && this.typing <= '흐') {
			switch (((this.typing.charCodeAt() - '가'.charCodeAt()) / 28) % 21) {
				case 8: // ('고' - '가') / 28:
					if (c == 'ᅡ') { this.typing = String.fromCharCode(this.typing.charCodeAt() + 28 * 1); return; }
					if (c == 'ᅢ') { this.typing = String.fromCharCode(this.typing.charCodeAt() + 28 * 2); return; }
					if (c == 'ᅵ') { this.typing = String.fromCharCode(this.typing.charCodeAt() + 28 * 3); return; }
					break;
				case 13: // ('구' - '가') / 28:
					if (c == 'ᅥ') { this.typing = String.fromCharCode(this.typing.charCodeAt() + 28 * 1); return; }
					if (c == 'ᅦ') { this.typing = String.fromCharCode(this.typing.charCodeAt() + 28 * 2); return; }
					if (c == 'ᅵ') { this.typing = String.fromCharCode(this.typing.charCodeAt() + 28 * 3); return; }
					break;
				case 18: // ('그' - '가') / 28:
					if (c == 'ᅵ') { this.typing = String.fromCharCode(this.typing.charCodeAt() + 28 * 1); return; }
					break;
			}
		}

		// 이중모음
		switch (this.typing) {
			case 'ᅩ':
				if (c == 'ᅡ') { this.typing = 'ᅪ'; return; }
				if (c == 'ᅢ') { this.typing = 'ᅫ'; return; }
				if (c == 'ㅣ') { this.typing = 'ᅬ'; return; }
				break;
			case 'ᅮ':
				if (c == 'ᅥ') { this.typing = 'ᅯ'; return; }
				if (c == 'ᅦ') { this.typing = 'ᅰ'; return; }
				if (c == 'ᅵ') { this.typing = 'ᅱ'; return; }
				break;
			case 'ᅳ':
				if (c == 'ᅵ') { this.typing = 'ᅴ'; return; }
				break;
		}

		if (this.typing != ' ') {
			this.typed += this.typing;
		}
		this.typing = c;
	
	} else if (c >= 'ᆨ' && c <= 'ᇂ') {
		// 종성
		if (this.typing >= '가' && this.typing <= '히' && (this.typing.charCodeAt() % 28 == 16/*'가' % 28*/)) {
			this.typing = String.fromCharCode(this.typing.charCodeAt() + (c.charCodeAt() - 4520/*'ᆨ'*/ + 1));
		} else {
			this.typed += this.typing;
			this.typed += c;
			this.typing = ' ';
		}
	} else {
		if (this.typing != ' ') {
			this.typed += this.typing;
		}
		this.typed += c;
		this.typing = ' ';
	}
}
Typing.prototype.typeKeyboard = function(c) {
	if (c >= 'ㄱ' && c <= 'ㅎ') {
		if (this.typing >= '가' && this.typing <= '히') {
			if (this.typing.charCodeAt() % 28 == 16/*'가' % 28*/) {
				// 종성
				switch (c) {
					case 'ㄱ': this.typing = String.fromCharCode(this.typing.charCodeAt() +  1/*'각' - '가'*/); return;
					case 'ㄲ': this.typing = String.fromCharCode(this.typing.charCodeAt() +  2/*'갂' - '가'*/); return;
					case 'ㄴ': this.typing = String.fromCharCode(this.typing.charCodeAt() +  4/*'간' - '가'*/); return;
					case 'ㄷ': this.typing = String.fromCharCode(this.typing.charCodeAt() +  7/*'갇' - '가'*/); return;
					case 'ㄹ': this.typing = String.fromCharCode(this.typing.charCodeAt() +  8/*'갈' - '가'*/); return;
					case 'ㅁ': this.typing = String.fromCharCode(this.typing.charCodeAt() + 16/*'감' - '가'*/); return;
					case 'ㅂ': this.typing = String.fromCharCode(this.typing.charCodeAt() + 17/*'갑' - '가'*/); return;
					case 'ㅅ': this.typing = String.fromCharCode(this.typing.charCodeAt() + 19/*'갓' - '가'*/); return;
					case 'ㅆ': this.typing = String.fromCharCode(this.typing.charCodeAt() + 20/*'갔' - '가'*/); return;
					case 'ㅇ': this.typing = String.fromCharCode(this.typing.charCodeAt() + 21/*'강' - '가'*/); return;
					case 'ㅈ': this.typing = String.fromCharCode(this.typing.charCodeAt() + 22/*'갖' - '가'*/); return;
					case 'ㅊ': this.typing = String.fromCharCode(this.typing.charCodeAt() + 23/*'갗' - '가'*/); return;
					case 'ㅋ': this.typing = String.fromCharCode(this.typing.charCodeAt() + 24/*'갘' - '가'*/); return;
					case 'ㅌ': this.typing = String.fromCharCode(this.typing.charCodeAt() + 25/*'같' - '가'*/); return;
					case 'ㅍ': this.typing = String.fromCharCode(this.typing.charCodeAt() + 26/*'갚' - '가'*/); return;
					case 'ㅎ': this.typing = String.fromCharCode(this.typing.charCodeAt() + 27/*'갛' - '가'*/); return;
				}
			} else {
				// 이중종성
				switch ((this.typing.charCodeAt() - 44032/*'가'*/) % 28) {
					case 1: // '각' - '가':
						if (c == 'ㅅ') { this.typing = String.fromCharCode(this.typing.charCodeAt() + 2); return; } // ㄳ
						break;
					case 4: // '간' - '가':
						if (c == 'ㅈ') { this.typing = String.fromCharCode(this.typing.charCodeAt() + 1); return; } // ㄵ
						if (c == 'ㅎ') { this.typing = String.fromCharCode(this.typing.charCodeAt() + 2); return; } // ㄶ
						break;
					case 8: // '갈' - '가':
						if (c == 'ㄱ') { this.typing = String.fromCharCode(this.typing.charCodeAt() + 1); return; } // ㄺ
						if (c == 'ㅁ') { this.typing = String.fromCharCode(this.typing.charCodeAt() + 2); return; } // ㄻ
						if (c == 'ㅂ') { this.typing = String.fromCharCode(this.typing.charCodeAt() + 3); return; } // ㄼ
						if (c == 'ㅅ') { this.typing = String.fromCharCode(this.typing.charCodeAt() + 4); return; } // ㄽ
						if (c == 'ㅌ') { this.typing = String.fromCharCode(this.typing.charCodeAt() + 5); return; } // ㄾ
						if (c == 'ㅍ') { this.typing = String.fromCharCode(this.typing.charCodeAt() + 6); return; } // ㄿ
						if (c == 'ㅎ') { this.typing = String.fromCharCode(this.typing.charCodeAt() + 7); return; } // ㅀ
						break;
					case 17: // '갑' - '가':
						if (c == 'ㅅ') { this.typing = String.fromCharCode(this.typing.charCodeAt() + 1); return; } // ㅄ
						break;
				}
			}
		}

		// 이중자음
		switch (this.typing) {
			case 'ㄱ':
				if (c == 'ㅅ') { this.typing = 'ㄳ'; return; }
				break;
			case 'ㄴ':
				if (c == 'ㅈ') { this.typing = 'ㄵ'; return; }
				if (c == 'ㅎ') { this.typing = 'ㄶ'; return; }
				break;
			case 'ㄹ':
				if (c == 'ㄱ') { this.typing = 'ㄺ'; return; }
				if (c == 'ㅁ') { this.typing = 'ㄻ'; return; }
				if (c == 'ㅂ') { this.typing = 'ㄼ'; return; }
				if (c == 'ㅅ') { this.typing = 'ㄽ'; return; }
				if (c == 'ㅌ') { this.typing = 'ㄾ'; return; }
				if (c == 'ㅍ') { this.typing = 'ㄿ'; return; }
				if (c == 'ㅎ') { this.typing = 'ㅀ'; return; }
				break;
		}

		// 자음
		if (this.typing != ' ') {
			this.typed += this.typing;
		}
		this.typing = c;
		
	} else if (c >= 'ㅏ' && c <= 'ㅣ') {
		// 중성
		if (this.typing >= 'ㄱ' && this.typing <= 'ㅎ') {
			this.typing = String.fromCharCode(44032/*'가'*/ + (Typing.nCho(this.typing) * 588) + ((c.charCodeAt() - 12623/*'ㅏ'*/) * 28));
			return;
		}

		if (this.typing >= '가' && this.typing <= '힣') {
			// 이중중성
			switch (((this.typing.charCodeAt() - 44032/*'가'*/) / 28) % 21) {
				case 8: // ('고' - '가') / 28:
					if (c == 'ㅏ') { this.typing = String.fromCharCode(this.typing.charCodeAt() + 28 * 1); return; } // ㅘ
					if (c == 'ㅐ') { this.typing = String.fromCharCode(this.typing.charCodeAt() + 28 * 2); return; } // ㅙ
					if (c == 'ㅣ') { this.typing = String.fromCharCode(this.typing.charCodeAt() + 28 * 3); return; } // ㅚ
					break;
				case 13: // ('구' - '가') / 28:
					if (c == 'ㅓ') { this.typing = String.fromCharCode(this.typing.charCodeAt() + 28 * 1); return; } // ㅝ
					if (c == 'ㅔ') { this.typing = String.fromCharCode(this.typing.charCodeAt() + 28 * 2); return; } // ㅞ
					if (c == 'ㅣ') { this.typing = String.fromCharCode(this.typing.charCodeAt() + 28 * 3); return; } // ㅟ
					break;
				case 18: // ('그' - '가') / 28:
					if (c == 'ㅣ') { this.typing = String.fromCharCode(this.typing.charCodeAt() + 28 * 1); return; } // ㅢ
					break;
			}

			// 앞 글자 종성을 초성으로 가져오기
			switch ((this.typing.charCodeAt() - 44032/*'가'*/) % 28) {
				case 00/*가-가*/: break;
				case 01/*각-가*/: this.typed += String.fromCharCode(this.typing.charCodeAt() - 01); this.typing = String.fromCharCode(44032 + Typing.nCho('ㄱ') * 588 + (c.charCodeAt() - 12623) * 28); return;
				case 02/*갂-가*/: this.typed += String.fromCharCode(this.typing.charCodeAt() - 02); this.typing = String.fromCharCode(44032 + Typing.nCho('ㄲ') * 588 + (c.charCodeAt() - 12623) * 28); return;
				case 03/*갃-가*/: this.typed += String.fromCharCode(this.typing.charCodeAt() - 02); this.typing = String.fromCharCode(44032 + Typing.nCho('ㅅ') * 588 + (c.charCodeAt() - 12623) * 28); return;
				case 04/*간-가*/: this.typed += String.fromCharCode(this.typing.charCodeAt() - 04); this.typing = String.fromCharCode(44032 + Typing.nCho('ㄴ') * 588 + (c.charCodeAt() - 12623) * 28); return;
				case 05/*갅-가*/: this.typed += String.fromCharCode(this.typing.charCodeAt() - 01); this.typing = String.fromCharCode(44032 + Typing.nCho('ㅈ') * 588 + (c.charCodeAt() - 12623) * 28); return;
				case 06/*갆-가*/: this.typed += String.fromCharCode(this.typing.charCodeAt() - 02); this.typing = String.fromCharCode(44032 + Typing.nCho('ㅎ') * 588 + (c.charCodeAt() - 12623) * 28); return;
				case 07/*갇-가*/: this.typed += String.fromCharCode(this.typing.charCodeAt() - 07); this.typing = String.fromCharCode(44032 + Typing.nCho('ㄷ') * 588 + (c.charCodeAt() - 12623) * 28); return;
				case 08/*갈-가*/: this.typed += String.fromCharCode(this.typing.charCodeAt() - 08); this.typing = String.fromCharCode(44032 + Typing.nCho('ㄹ') * 588 + (c.charCodeAt() - 12623) * 28); return;
				case 09/*갉-가*/: this.typed += String.fromCharCode(this.typing.charCodeAt() - 01); this.typing = String.fromCharCode(44032 + Typing.nCho('ㄱ') * 588 + (c.charCodeAt() - 12623) * 28); return;
				case 10/*갊-가*/: this.typed += String.fromCharCode(this.typing.charCodeAt() - 02); this.typing = String.fromCharCode(44032 + Typing.nCho('ㅁ') * 588 + (c.charCodeAt() - 12623) * 28); return;
				case 11/*갋-가*/: this.typed += String.fromCharCode(this.typing.charCodeAt() - 03); this.typing = String.fromCharCode(44032 + Typing.nCho('ㅂ') * 588 + (c.charCodeAt() - 12623) * 28); return;
				case 12/*갌-가*/: this.typed += String.fromCharCode(this.typing.charCodeAt() - 04); this.typing = String.fromCharCode(44032 + Typing.nCho('ㅅ') * 588 + (c.charCodeAt() - 12623) * 28); return;
				case 13/*갍-가*/: this.typed += String.fromCharCode(this.typing.charCodeAt() - 05); this.typing = String.fromCharCode(44032 + Typing.nCho('ㅌ') * 588 + (c.charCodeAt() - 12623) * 28); return;
				case 14/*갎-가*/: this.typed += String.fromCharCode(this.typing.charCodeAt() - 06); this.typing = String.fromCharCode(44032 + Typing.nCho('ㅍ') * 588 + (c.charCodeAt() - 12623) * 28); return;
				case 15/*갏-가*/: this.typed += String.fromCharCode(this.typing.charCodeAt() - 07); this.typing = String.fromCharCode(44032 + Typing.nCho('ㅎ') * 588 + (c.charCodeAt() - 12623) * 28); return;
				case 16/*감-가*/: this.typed += String.fromCharCode(this.typing.charCodeAt() - 16); this.typing = String.fromCharCode(44032 + Typing.nCho('ㅁ') * 588 + (c.charCodeAt() - 12623) * 28); return;
				case 17/*갑-가*/: this.typed += String.fromCharCode(this.typing.charCodeAt() - 17); this.typing = String.fromCharCode(44032 + Typing.nCho('ㅂ') * 588 + (c.charCodeAt() - 12623) * 28); return;
				case 18/*값-가*/: this.typed += String.fromCharCode(this.typing.charCodeAt() - 01); this.typing = String.fromCharCode(44032 + Typing.nCho('ㅅ') * 588 + (c.charCodeAt() - 12623) * 28); return;
				case 19/*갓-가*/: this.typed += String.fromCharCode(this.typing.charCodeAt() - 19); this.typing = String.fromCharCode(44032 + Typing.nCho('ㅅ') * 588 + (c.charCodeAt() - 12623) * 28); return;
				case 20/*갔-가*/: this.typed += String.fromCharCode(this.typing.charCodeAt() - 20); this.typing = String.fromCharCode(44032 + Typing.nCho('ㅆ') * 588 + (c.charCodeAt() - 12623) * 28); return;
				case 21/*강-가*/: this.typed += String.fromCharCode(this.typing.charCodeAt() - 21); this.typing = String.fromCharCode(44032 + Typing.nCho('ㅇ') * 588 + (c.charCodeAt() - 12623) * 28); return;
				case 22/*갖-가*/: this.typed += String.fromCharCode(this.typing.charCodeAt() - 22); this.typing = String.fromCharCode(44032 + Typing.nCho('ㅈ') * 588 + (c.charCodeAt() - 12623) * 28); return;
				case 23/*갗-가*/: this.typed += String.fromCharCode(this.typing.charCodeAt() - 23); this.typing = String.fromCharCode(44032 + Typing.nCho('ㅊ') * 588 + (c.charCodeAt() - 12623) * 28); return;
				case 24/*갘-가*/: this.typed += String.fromCharCode(this.typing.charCodeAt() - 24); this.typing = String.fromCharCode(44032 + Typing.nCho('ㅋ') * 588 + (c.charCodeAt() - 12623) * 28); return;
				case 25/*같-가*/: this.typed += String.fromCharCode(this.typing.charCodeAt() - 25); this.typing = String.fromCharCode(44032 + Typing.nCho('ㅌ') * 588 + (c.charCodeAt() - 12623) * 28); return;
				case 26/*갚-가*/: this.typed += String.fromCharCode(this.typing.charCodeAt() - 26); this.typing = String.fromCharCode(44032 + Typing.nCho('ㅍ') * 588 + (c.charCodeAt() - 12623) * 28); return;
				case 27/*갛-가*/: this.typed += String.fromCharCode(this.typing.charCodeAt() - 27); this.typing = String.fromCharCode(44032 + Typing.nCho('ㅎ') * 588 + (c.charCodeAt() - 12623) * 28); return;
			}
		}

		// 이중모음
		switch (this.typing) {
			case 'ㅗ':
				if (c == 'ㅏ') { this.typing = 'ㅘ'; return; }
				if (c == 'ㅐ') { this.typing = 'ㅙ'; return; }
				if (c == 'ㅣ') { this.typing = 'ㅚ'; return; }
				break;
			case 'ㅜ':
				if (c == 'ㅓ') { this.typing = 'ㅝ'; return; }
				if (c == 'ㅔ') { this.typing = 'ㅞ'; return; }
				if (c == 'ㅣ') { this.typing = 'ㅟ'; return; }
				break;
			case 'ㅡ':
				if (c == 'ㅣ') { this.typing = 'ㅢ'; return; }
				break;
		}

		// 모음
		if (this.typing != ' ') {
			this.typed += this.typing;
		}
		this.typing = c;
		
	} else {
		if (this.typing != ' ') this.typed += this.typing;
		this.typed += c;
		this.typing = ' ';
	}
}

Typing.prototype.out = function() {}; // delegate
Typing.prototype.outputWithNoCursor = function() {
	if (this.typing == ' ') {
		return this.typed;
	}
	return this.typed + this.typing;
}
Typing.prototype.outputWithCursor = function() {
	return this.typed + "<U>" + this.typing + "</U>";
}
Typing.prototype.outputWithCursorOnlyHangeul = function() {
	if ((this.typing >= 'ㄱ' && this.typing <= 'ㅎ')
	 || (this.typing >= 'ㅏ' && this.typing <= 'ㅣ')
	 || (this.typing >= '가' && this.typing <= '힣')
	 || (this.typing >= 'ᄀ' && this.typing <= 'ᄒ')
	 || (this.typing >= 'ᅡ' && this.typing <= 'ᅵ')
	 || (this.typing >= 'ᆨ' && this.typing <= 'ᇂ')) {
		return this.outputWithCursor();
	} else {
		return this.outputWithNoCursor();
	}
}










// from SubtitleObject.cs


window.Subtitle = {
	SyncType:
	{	comment: -1
	,	normal: 0
	,	frame: 1
	,	inner: 2
	,	split: 3
	}
,	$tmp: $("<a>")
};
window.SyncType = Subtitle.SyncType;
Subtitle.video = {
		path: null
	,	FR: 23976 // 기본값 23.976fps
	,	FL: 1000000 / 23976
	,	fs: []
	,	kfs: []
}
Subtitle.findSync = (sync, fs=null, findNear=true, from=0, to=-1) => {
	if (fs == null) fs = Subtitle.video.fs;
	if (fs.length == 0) return null;
	if (to < 0) {
		// 최초 파라미터 없이 탐색 시작일 때
		to = fs.length;
		if (sync > fs[to - 1]) {
			// 마지막 프레임보다 뒤쪽 싱크일 때
			return findNear ? fs[to - 1] : null;
		}
	}
	if (from + 1 == to) {
		const dist0 = sync - fs[from];
		const dist1 = fs[to] - sync;
		if (dist0 <= dist1) {
			return (findNear || (dist0 == 0)) ? fs[from] : null;
		} else {
			return (findNear || (dist1 == 0)) ? fs[to] : null;
		}
	}
	const mid = from + Math.floor((to - from) / 2);
	if (fs[mid] < sync) {
		return Subtitle.findSync(sync, fs, findNear, mid, to);
	} else {
		return Subtitle.findSync(sync, fs, findNear, from, mid);
	}
}
Subtitle.findSyncIndex = (sync, fs=null, from=0, to=-1) => {
	if (fs == null) fs = Subtitle.video.fs;
	if (fs.length == 0) return null;
	if (to < 0) to = fs.length;
	if (from + 1 == to) {
		const dist0 = sync - fs[from];
		const dist1 = fs[to] - sync;
		if (dist0 <= dist1) {
			return from;
		} else {
			return to;
		}
	}
	const mid = from + Math.floor((to - from) / 2);
	if (fs[mid] < sync) {
		return Subtitle.findSyncIndex(sync, fs, mid, to);
	} else {
		return Subtitle.findSyncIndex(sync, fs, from, mid);
	}
}

const styleForSmi = Subtitle.styleForSmi = ["Fontname","PrimaryColour","Italic","Underline","StrikeOut"];
const styleForAss = Subtitle.styleForAss = ["Fontsize","SecondaryColour","OutlineColour","BackColour","PrimaryOpacity","SecondaryOpacity","OutlineOpacity","BackOpacity","Bold","ScaleX","ScaleY","Spacing","Angle","BorderStyle","Outline","Shadow","Alignment","MarginL","MarginR","MarginV"];

window.SyncAttr = Subtitle.SyncAttr = function(start, end, startType, endType, text, origin=null) {
	this.start = start ? start : 0;
	this.end   = end   ? end   : 35999999;
	this.startType = startType ? startType : SyncType.normal;
	this.endType   = endType   ? endType   : SyncType.normal;
	this.text = text ? text : null; // 이것도 옛날에 왜 text라고 했지... attrs 같은 걸로 할걸...
	this.origin = origin;
}
SyncAttr.prototype.getTextOnly = function () {
	if (!this.text) return "";

	let text = "";
	for (let i = 0; i < this.text.length; i++) {
		text += this.text[i].text;
	}
	return text;
}
Subtitle.Width =
{	DEFAULT_FONT: { fontFamily: "맑은 고딕", fontSize: 72 }
/*
	public static Font DEFAULT_FONT = new Font("맑은 고딕", 72.0F);
	public static Image FAKE_IMAGE = new Bitmap(1, 1);
*/
,	getWidth: function(input, font) {
		if (typeof input == "string") {
			if (!font) font = this.DEFAULT_FONT;
			if (!this.div) {
				$("body").append(this.div = $("<div>").css({
						position: "absolute"
					,	top: -100
					,	height: 100
					,	whiteSpace: "pre"
				}));
			}
			this.div.css(font).text(input);
			return this.div.width();
		} else {
			let width = 0;
			for (let i = 0; i < input.length; i++) {
				width += input[i].getWidth();
			}
			return width;
		}
	}
,	getWidths: function(lines) {
		const widths = [];
		for (let i = 0; i < lines.length; i++) {
			widths.push(this.getWidth(line));
		}
		return widths;
	}
,	getAppend: function(targetWidth, isBoth, font) {
		if (!font) font = this.DEFAULT_FONT;
	
		if (isBoth) targetWidth /= 2;
		
		let whiteSpace = "";
		let lastWidth = 0;
		let thisWidth = 0;
		if (thisWidth >= targetWidth) {
			return whiteSpace;
		}
		
		while (thisWidth < targetWidth) {
			lastWidth = thisWidth;
			whiteSpace += "　";
			thisWidth = Subtitle.Width.getWidth(whiteSpace);
		}
		
		thisWidth = lastWidth;
		whiteSpace = whiteSpace.substring(0, whiteSpace.length - 1);
		
		while (thisWidth < targetWidth) {
			lastWidth = thisWidth;
			whiteSpace += " ";
			thisWidth = Subtitle.Width.getWidth(whiteSpace);
		}
		
		if (thisWidth - targetWidth > targetWidth - lastWidth) {
			whiteSpace = whiteSpace.substring(0, whiteSpace.length - 1);
		}
		
		return isBoth ? whiteSpace : Subtitle.Width.appendToRight(whiteSpace);
	}
,	getAppendToTarget: function(width, targetWidth) {
		return this.getAppend(targetWidth - width, false, this.DEFAULT_FONT);
	}
,	appendToRight: function(append) {
		const index = append.indexOf(' ');
		if (index > 0) {
			return append.substring(index) + append.substring(0, index);
		}
		return append;
	}
}

// 객체 복사용이 아닌, 기존 속성에 이어지는 새 객체를 만드는 쪽으로 만들었던 부분이라 text는 비운 채로 생성함
// SMI 복원용 태그는 기본적으론 복사 안 함
window.Attr = Subtitle.Attr = function(old, text="", withTagString=false) {
	if (old) {
		this.text = text;
		this.b    = old.b;
		this.i    = old.i;
		this.u    = old.u;
		this.s    = old.s;
		this.fs   = old.fs;
		this.fn   = old.fn;
		this.fc   = old.fc;
		this.ass  = old.ass;
		this.fade = old.fade;
		this.shake = old.shake;
		this.typing = old.typing;
		this.furigana = old.furigana;
		this.tagString = withTagString ? old.tagString : null;
	} else {
		this.text = text;
		this.b    = false; // Bold
		this.i    = false; // Italic
		this.u    = false; // Underline
		this.s    = false; // Strike
		this.fs   = 0;	// FontSize
		this.fn   = ""; // FontName
		this.fc   = ""; // Fontcolor
		this.ass  = null;
		this.fade = 0; // 형식> in: 1 / out: -1 / #ABCDEF / #ABCDEF~#FEDCBA
		this.shake = null;
		this.typing = null;
		this.tagString = null;
	}
}
Attr.TypingAttr = function(mode, start, end) {
	this.cursor = (mode == Typing.Mode.keyboard) ? Typing.Cursor.visible : Typing.Cursor.invisible;
	this.mode   = mode;
	this.start  = start ? start : 0;
	this.end	= end   ? end   : 0;
}

Attr.prototype.clone = function(withText=true) {
	return new Attr(this, withText ? this.text : "");
}

// ASS 그대로 쓸 속성만 넣음
Attr.junkAss = function(ass) {
	const attr = new Attr();
	attr.ass = ass;
	return attr;
}

Attr.prototype.getWidth = function() {
	const css = Subtitle.Width.DEFAULT_FONT;
	if (this.fs) css.fontSize   = this.fs;
	if (this.fn) css.fontFamily = this.fn;
	return Subtitle.Width.getWidth(this.text, css);
}
Attr.getWidths = (attrs) => {
	const widths = [];
	let width = 0;
	let index = 0;
	for (let i = 0; i < attrs.length; i++) {
		const attr = attrs[i];
		if ((index = attr.text.indexOf('\n')) >= 0) {
			const sAttr = new Attr(attr);
			
			sAttr.text = attr.text.substring(0, index);
			width += sAttr.getWidth();
			widths.push(width);
			
			sAttr.text = attr.text.substring(index + 1);
			width += sAttr.getWidth();
			
		} else {
			width += attr.getWidth();
		}
	}
	widths.push(width);
	return widths;
}

Attr.fromSubtitle = (subtitle) => {
	return subtitle.toAttrs();
}
Attr.linesFromSubtitle = (subtitle) => {
	const attrs = Attr.fromSubtitle(subtitle);
	
	let line = [];
	const lines = [line];
	let index = 0;
	for (let i = 0; i < attrs.length; i++) {
		const attr = attrs[i];
		
		if ((index = attr.text.indexOf('\n')) >= 0) {
			// 줄바꿈 전후 분리
			{	const sAttr = new Attr(attr);
				sAttr.text = attr.text.substring(0, index);
				line.push(sAttr);
			}
			lines.push(line = []);
			{	const sAttr = new Attr(attr);
				sAttr.text = attr.text.substring(index + 1);
				line.push(sAttr);
			}
			
		} else {
			line.push(attr);
		}
	}
	return lines;
}
Attr.toSubtitle = (attrs, subtitle) => {
	subtitle.fromAttrs(attrs);
}

Attr.prototype.toHtml = function() {
	if (this.text == null || this.text.length == 0) {
		return "";
	}
	
	let css = "";
	if (this.b) css += "font-weight: bold;";
	if (this.i) css += "font-style: italic;";
	if ( this.u && !this.s) css += "text-decoration: underline;";
	if (!this.u &&  this.s) css += "text-decoration: line-through;";
	if ( this.u &&  this.s) css += "text-decoration: line-through underline;";
	if (this.fs > 0) css += "font-size: " + fs + "px; line-height: " + (11 + 4 * this.fs) + "px;";
	if (this.fn != null && this.fn.length > 0) css += "font-family: '" + this.fn + "';";
	if (this.fc != null && this.fc.length > 0) css += "color: #" + this.fc + ";";
	return "<span" + (css.length > 0 ? " style=\"" + css + "\"" : "") + ">"
		+ Subtitle.$tmp.text(text).html().split(" ").join("&nbsp;").split("\n").join("​<br>​")
		+ "</span>";
}
Attr.toHtml = (attrs) => {
	let result = "";
	for (let i = 0; i < attrs.length; i++) {
		result += attrs[i].toHtml();
	}
	return result;
}

Attr.toText = (attrs) => {
	let result = "";
	for (let i = 0; i < attrs.length; i++) {
		result += attrs[i].text;
	}
	return result;
}

window.Color = Subtitle.Color = function(target, color, index=0) {
	this.index = index; // 페이드 index가 아니라, 속성의 index를 변칙적으로 사용 중...
	
	if (color.length == 7 && color[0] == "#") {
		color = color.substring(1);
	}
	// 16진수 맞는지 확인
	if (isFinite("0x" + color)) {
		this.r = this.tr = Color.v(color.substring(0, 2));
		this.g = this.tg = Color.v(color.substring(2, 4));
		this.b = this.tb = Color.v(color.substring(4, 6));
	} else {
		this.r = this.tr = 255;
		this.g = this.tg = 255;
		this.b = this.tb = 255;
	}
	
	if (target == 1) {
		this.r = this.g = this.b = 0;
	} else if (target == -1) {
		this.tr = this.tg = this.tb = 0;
	} else {
		if (target.length == 7 && target[0] == "#") {
			target = target.substring(1);
		}
		// 16진수 맞는지 확인
		if (isFinite("0x" + target)) {
			this.tr = Color.v(target.substring(0, 2));
			this.tg = Color.v(target.substring(2, 4));
			this.tb = Color.v(target.substring(4, 6));
		}
	}
}
Color.v = (c) => {
	if (c.length == 1) {
		if (c >= '0' && c <= '9')
			return c.charCodeAt() - 48
		if (c >= 'a' && c <= 'z')
			return c.charCodeAt() - 87;
		if (c >= 'A' && c <= 'Z')
			return c.charCodeAt() - 55;
		return 0;
		
	} else {
		let v = 0;
		for (let i = 0; i < c.length; i++) {
			v = v * 16 + Color.v(c[i]);
		}
		return v;
	}
}
Color.c = (v) => {
	return v < 10 ? String.fromCharCode(v + 48) : String.fromCharCode(v + 55);
}
Color.hex = (v) => {
	return "" + Color.c(v / 16) + Color.c(v % 16);
}
Color.prototype.getColor = function(value, total) {
	return [
		(Math.ceil(((this.r * (total - value)) + (this.tr * value)) / total))
	,	(Math.ceil(((this.g * (total - value)) + (this.tg * value)) / total))
    ,	(Math.ceil(((this.b * (total - value)) + (this.tb * value)) / total))
    ];
}
Color.prototype.get = function(value, total) {
	const color = this.getColor(value, total);
	return Color.hex(color[0]) + Color.hex(color[1]) + Color.hex(color[2]);
}
Color.prototype.smi = function(value, total) {
	return "#" + this.get(value, total);
}
Color.prototype.ass = function(value, total) {
	const color = this.getColor(value, total);
	return "&H" + Color.hex(color[2]) + Color.hex(color[1]) + Color.hex(color[0]) + "&";
}





// SubtitleObjectAss.cs

// TODO: 첫 단추를 얘만 1ms가 아닌 10ms 단위로 잡아서 더 복잡해진 것 같은데... 엎을까...

Subtitle.Ass = function(start, end, style, text) {
	this.start = start;
	this.end   = end;
	this.style = style;
	this.text  = text;
}
Subtitle.Ass.cols = [ "Layer", "Start", "End", "Style", "Name", "MarginL", "MarginR", "MarginV", "Effect", "Text" ];

Subtitle.Ass.int2Time = (time) => {
	time = Math.round(time);
	const h = Math.floor(time / 360000);
	const m = Math.floor(time / 6000) % 60;
	const s = Math.floor(time / 100) % 60;
	const ds= Math.floor(time % 100);
	return h + ":" + intPadding(m) + ":" + intPadding(s) + "." + intPadding(ds);
}
function intPadding(value, length = 2) {
	value = "" + value;
	while (value.length < length) {
		value = "0" + value;
	}
	return value;
}
Subtitle.Ass.time2Int = (time) => {
	const vs = time.split(':');
	return (Number(vs[0]) * 360000) + (Number(vs[1]) * 6000) + (Number(vs[2].split(".").join("")));
}

Subtitle.Ass.prototype.toTxt = // 처음에 함수명 잘못 지은 걸 레거시 호환으로 일단 유지함
Subtitle.Ass.prototype.toText = function() {
	return "Dialogue: 0," + Subtitle.Ass.int2Time(this.start) + "," + Subtitle.Ass.int2Time(this.end) + "," + this.style + ",,0,0,0,," + this.text;
}
Subtitle.Ass.ss2txt = (asss) => {
	let result = "";
	for (let i = 0; i < asss.length; i++) {
		result += asss[i].toText() + "\r\n";
	}
	return result;
}

Subtitle.Ass.sColorFromAttr = (soColor) => {
	return soColor.length == 6 ? "&H" + soColor.substring(4, 6) + soColor.substring(2, 4) + soColor.substring(0, 2) + "&" : soColor;
}
Subtitle.Ass.colorToAttr = (soColor) => {
	return "" + soColor.substring(6, 8) + soColor.substring(4, 6) + soColor.substring(2, 4);
}
Subtitle.Ass.colorFromAttr = (attrColor) => {
	return Subtitle.Ass.sColorFromAttr(attrColor);
}

Subtitle.Ass.prototype.toAttr = // 처음에 함수명 잘못 지은 걸 레거시 호환으로 일단 유지함
Subtitle.Ass.prototype.toAttrs = function() {
	const result = [];

	let index = 0;
	let pos = 0;
	let last = new Attr();
	result.push(last);

	while ((pos = this.text.indexOf('{', index)) >= 0) {
		last.text += this.text.substring(index, pos).split("\\N").join("\n");
		
		const endPos = text.indexOf('}', pos);
		const attrString = this.text.substring(pos + 1, endPos);
		
		let mode = -1;
		let tagStart = 0, tagEnd = 0;
		let tag = null;
		for (pos = 0; pos < attrString.length; pos++) {
			switch (mode) {
				case -1: { // 태그 시작 전
					while (pos < attrString.length && attrString[pos] != '\\') pos++;
					mode = 0;
					tagStart = pos + 1;
					pos--;
					break;
				}

				case 0: { // 태그
					for (tagEnd = tagStart; tagEnd < attrString.length; tagEnd++) {
						if (attrString[tagEnd] == '\\') {
							break;
						} else if (attrString[tagEnd] == '(') {
							mode++;
							pos = tagEnd + 1;
							break;
						}
					}
					if (mode > 0) break;
					if (tagStart == tagEnd) break;

					tag = attrString.substring(tagStart, tagEnd);

					if (tag[0] == "c" || tag.substring(0,2) == "1c") {
						if (last.ass || last.text.length > 0) {
							result.push((last = new Attr(last)));
						}
						if (tag[0] == "c") {
							tag = "1" + tag;
						}
						if (tag.length >= 11 && tag[2] == '&' && tag[3] == 'H' && tag[10] == '&') {
							last.fc = Subtitle.Ass.colorToAttr(tag.substring(2, 11));
						} else {
							last.fc = "";
						}
					} else if (tag.substring(0,2) == "fn") {
						if (last.ass || last.text.length > 0) {
							result.push((last = new Attr(last)));
						}
						last.fn = (tag.length > 2) ? tag.substring(2) : "";
						
					} else if (tag[0] == "b") {
						if (last.ass || last.text.length > 0) {
							result.push((last = new Attr(last)));
						}
						last.b = (tag.length >= 2 && tag[1] == '1');
						
					} else if (tag[0] == "u") {
						if (last.ass || last.text.length > 0) {
							result.push((last = new Attr(last)));
						}
						last.u = (tag.length >= 2 && tag[1] == '1');
						
					} else if (tag[0] == "i") {
						if (last.ass || last.text.length > 0) {
							result.push((last = new Attr(last)));
						}
						last.i = (tag.length >= 2 && tag[1] == '1');
					}

					mode = 0;
					pos = tagEnd;
					tagStart = tagEnd + 1;
					break;
				}

				default: { // 괄호
					for (; pos < attrString.length; pos++) {
						if (attrString[pos] == ')') {
							mode--;
							break;
						}
					}
					break;
				}
			}
		}

		index = endPos + 1;
	}
	last.text += text.substring(index).split("\n").join("\\n");

	return result;
}
Subtitle.Ass.prototype.fromAttr = // 처음에 함수명 잘못 지은 걸 레거시 호환으로 일단 유지함
Subtitle.Ass.prototype.fromAttrs = function(attrs) {
	this.text = (this.texts = Subtitle.Ass.fromAttrs(attrs))[0];
	return this;
}
Subtitle.Ass.fromAttr = // 처음에 함수명 잘못 지은 걸 레거시 호환으로 일단 유지함
Subtitle.Ass.fromAttrs = function(attrs) {
	let text = "";
	
	let last = new Attr();
	for (let i = 0; i < attrs.length; i++) {
		const attr = attrs[i];
		
		if (!last.b && attr.b) text += "{\\b1}";
		else if (last.b && !attr.b) text += "{\\b}";
		
		if (!last.i && attr.i) text += "{\\i1}";
		else if (last.i && !attr.i) text += "{\\i}";
		
		if (!last.u && attr.u) text += "{\\u1}";
		else if (last.u && !attr.u) text += "{\\u}";
		
		if (!last.s && attr.s) text += "{\\s1}";
		else if (last.s && !attr.s) text += "{\\s}";
		
		if (last.fn != attr.fn) text += "{\\fn" + attr.fn + "}";
		
		if (attr.fc.length == 15 && attr.fc[0] == '#' && attr.fc[7] == '~' && attr.fc[8] == '#') {
			// 그라데이션 분할
			const cFrom = attr.fc.substring(0,  7);
			const cTo   = attr.fc.substring(8, 15);
			const color = new Color(cTo, cFrom);
			
			let attrText = "";
			for (let k = 0; k < attr.text.length; k++) {
				attrText += "{\\c" + color.ass(k, attr.text.length - 1) + "}" + attr.text[k];
			}

			if (attr.furigana) {
				let furigana = "";
				for (let k = 0; k < attr.furigana.text.length; k++) {
					furigana += "{\\c" + color.ass(k, attr.furigana.text.length - 1) + "}" + attr.furigana.text[k];
				}
				text += "[" + attrText + "|" + furigana.split("]").join("\\]") + "]";
				
			} else {
				text += attrText;
			}
			
		} else {
			if (last.fc != attr.fc) {
				text += "{\\c" + Subtitle.Ass.colorFromAttr(attr.fc) + "}";
			}
			
			if (attr.furigana) {
				text += "[" + attr.text + "|" + attr.furigana.text.split("]").join("\\]") + "]";
			} else {
				text += attr.text;
			}
		}
		last = attr;
	}
	
	const lines = text.split("\n");
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const rubyList = [];

		let pos = 0;
		let rStart = 0;
		do {
			rStart = line.indexOf("[", pos);
			if (rStart < 0) {
				break;
			}
			const fStart = line.indexOf("|", rStart);
			if (fStart < 0) {
				pos = rStart + 1;
				continue;
			}
			let rEnd = fStart;
			do {
				rEnd = line.indexOf("]", rEnd);
				if (rEnd < 0) {
					break;
				}
				if (line[rEnd - 1] != "\\") {
					break;
				}
				rEnd++;
			} while (rEnd > 0);
			if (rEnd < 0) {
				pos = fStart + 1;
				continue;
			}
			pos = rEnd + 1;
			rubyList.push([rStart, fStart, rEnd]);
		} while (true);
		
		if (rubyList.length) {
			let newLine = "";
			for (let j = 0; j < rubyList.length; j++) {
				newLine += "{\\fscy50\\bord0\\1a&HFF&}";
				let pos = 0;
				for (let k = 0; k < j; k++) {
					newLine += line.substring(pos, rubyList[k][0]);
					newLine += line.substring(rubyList[k][0] + 1, rubyList[k][1]);
					pos = rubyList[k][2] + 1;
				}
				newLine += line.substring(pos, rubyList[j][0]);
				newLine += "{\\1a\\bord\\fscx50}" + line.substring(rubyList[j][1] + 1, rubyList[j][2]).split("\\]").join("]") + "{\\fscx\\bord0\\1a&HFF&}";
				pos = rubyList[j][2] + 1;
				for (let k = j + 1; k < rubyList.length; k++) {
					newLine += line.substring(pos, rubyList[k][0]);
					newLine += line.substring(rubyList[k][0] + 1, rubyList[k][1]);
					pos = rubyList[k][2] + 1;
				}
				newLine += line.substring(pos);
				newLine += "{\\1a\\bord\\fscy}\\N";
			}
			{
				let pos = 0;
				for (let k = 0; k < rubyList.length; k++) {
					newLine += line.substring(pos, rubyList[k][0]);
					newLine += line.substring(rubyList[k][0] + 1, rubyList[k][1]);
					pos = rubyList[k][2] + 1;
				}
				newLine += line.substring(pos);
			}
			lines[i] = newLine;
		}
	}
	
	return [lines.join("\\N").split("}{").join("")];
}

Subtitle.Ass.prototype.toSync = function() {
	return new SyncAttr(
			start * 10
		,	end * 10
		,	(this.style.StartsWith("［") ? SyncType.frame : SyncType.normal)
		,	(this.style.EndsWith  ("］") ? SyncType.frame : SyncType.normal)
		,	this.toAttrs()
	);
}
Subtitle.Ass.prototype.fromSync = function(sync, checkFrame=true) {
	this.start = sync.start / 10;
	this.end   = sync.end   / 10;
	this.style = 
		( (!checkFrame || (sync.startType == SyncType.normal && sync.endType == SyncType.normal))
			? sync.style ? sync.style : "Default"
			: ( (sync.startType == SyncType.frame ? "［" : "（")
			  + (sync.endType   == SyncType.frame ? "］" : "）")
			)
		);
	this.fromAttrs(sync.text);
	return this;
}

// TODO: 옛날에 처음 개발할 때 너무 간이로 스크립트 파싱만 보고 개발했음...
// AssFile2 객체 정리되면 이쪽은 제거하고 대체하는 방향으로
Subtitle.AssFile = function(text) {
	this.header = "";
	this.body = [];
	if (text) {
		this.fromText(text);
	}
}
Subtitle.AssFile.prototype.toTxt = // 처음에 함수명 잘못 지은 걸 레거시 호환으로 일단 유지함
Subtitle.AssFile.prototype.toText = function() {
	let result = this.header.split("\r\n").join("\n");
	for (let i = 0; i < this.body.length; i++) {
		result += this.body[i].toText() + "\n";
	}
	return result;
}
Subtitle.AssFile.prototype.fromTxt = // 처음에 함수명 잘못 지은 걸 레거시 호환으로 일단 유지함
Subtitle.AssFile.prototype.fromText = function(text) {
	this.header = "";
	this.body = [];
	
	const lines = text.split("\r\n").join("\n").split('\n');
	
	const header = [];
	let canBeHeader = true;
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		
		if (line.substring(0,9) == ("Dialogue:")) {
			canBeHeader = false;
			const cols = line.substring(9).trim().split(',');
			const ass = new Subtitle.Ass(
				Subtitle.Ass.time2Int(cols[1])
			,	Subtitle.Ass.time2Int(cols[2])
			,	cols[3]
			,	cols[9]
			);
			for (let j = 10; j < cols.length; j++) {
				ass.text += "," + cols[j];
			}
			this.body.push(ass);
			
		} else if (canBeHeader) {
			if (line.substring(0,7) == ("Format:")) {
				//canBeHeader = false;
				const cols = line.substring(7).trim().split(',');
				Subtitle.Ass.cols = [];
				for (let j = 0; j < cols.length; j++) {
					Subtitle.Ass.cols.push(cols[j].trim());
				}
				
			}
			header.push(line);
		}
	}
	this.header = header.join("\n") + "\n";

	return this;
}
Subtitle.AssFile.prototype.toSync = // 처음에 함수명 잘못 지은 걸 레거시 호환으로 일단 유지함
Subtitle.AssFile.prototype.toSyncs = function() {
	const result = [];
	for (let i = 0; i < this.body.length; i++) {
		result.push(this.body[i].toSync());
	}
	return result;
}


Subtitle.AssFile.prototype.fromSync = // 처음에 함수명 잘못 지은 걸 레거시 호환으로 일단 유지함
Subtitle.AssFile.prototype.fromSyncs = function(syncs, checkFrame=true) {
	this.body = [];
	for (let i = 0; i < syncs.length; i++) {
		const sync = new Subtitle.Ass().fromSync(syncs[i], checkFrame);
		this.body.push(sync);
		
		if (sync.texts) {
			for (let j = 1; j < sync.texts.length; j++) {
				this.body.push(new Subtitle.Ass(sync.start, sync.end, sync.style, sync.texts[j]));
			}
		}
	}
	return this;
}




//TODO: 첫 단추를 얘만 1ms가 아닌 10ms 단위로 잡아서 더 복잡해진 것 같은데... 엎을까...
window.AssEvent = Subtitle.AssEvent = function(start, end, style, text, layer=0) {
	this.key = "Dialogue";
	this.Layer = layer;
	this.Start = AssEvent.toAssTime(this.start = start);
	this.End   = AssEvent.toAssTime(this.end   = end  );
	this.Style = style;
	this.Name = "";
	this.MarginL = 0;
	this.MarginR = 0;
	this.MarginV = 0;
	this.Effect = "";
	this.Text = text;
}
AssEvent.toAssTime = (time=0, fromFrameSync=false) => {
	if (fromFrameSync) time -= 15;
	if (time < 0) time = 0;
	const h = Math.floor( time / 3600000);
	const m = Math.floor( time /   60000) % 60;
	const s = Math.floor( time /    1000) % 60;
	const ds= Math.floor((time % 1000) / 10);
	const result = h + ":" + intPadding(m) + ":" + intPadding(s) + "." + intPadding(ds);
	return result;
}
AssEvent.fromAssTime = (assTime, toFrameSync=false) => {
	const vs = assTime.split(':');
	let time = ((Number(vs[0]) * 360000) + (Number(vs[1]) * 6000) + (Number(vs[2].split(".").join("")))) * 10;
	if (toFrameSync) {
		time = Subtitle.findSync(time + 15);
	}
	return time;
}
function intPadding(value, length = 2) {
	value = "" + value;
	while (value.length < length) {
		value = "0" + value;
	}
	return value;
}

//팟플레이어에서 실제 의도한 프레임에 출력되도록 시간값 재계산
AssEvent.optimizeSync = function(sync) {
	const fs = Subtitle.video.fs;
	let aegisubSyncs = Subtitle.video.aegisubSyncs;
	if (!aegisubSyncs) {
		// Aegisub에서 싱크 찍을 때 찍히는 싱크 -> 버림을 하면서 빨리 나오는 경우가 발생함
		aegisubSyncs = [0];
		for (let i = 1; i < fs.length; i++) {
			let bfr = fs[i - 1];
			let now = fs[i];
			aegisubSyncs.push(Math.floor((bfr + now) / 20) * 10);
		}
		Subtitle.video.aegisubSyncs = aegisubSyncs;
	}
	let i = 0;
	for (; i < aegisubSyncs.length; i++) {
		if (sync < aegisubSyncs[i]) {
			// 싱크 위치 찾음
			return fs[i - 1];
		}
	}
	// 마지막 싱크로 맞춰줌
	return Subtitle.video.fs[i - 1];
}
AssEvent.prototype.optimizeSync = function() {
	this.Start = AssEvent.toAssTime((this.start = AssEvent.optimizeSync(this.start)) - 15);
	this.End   = AssEvent.toAssTime((this.end   = AssEvent.optimizeSync(this.end  )) - 15);
}

AssEvent.prototype.fromSync = function(sync, style) {
	this.Start = AssEvent.toAssTime(this.start = sync.start);
	this.End   = AssEvent.toAssTime(this.end   = sync.end  );
	this.Style = sync.style ? sync.style : "Default";
	this.Text = (this.texts = Subtitle.Ass.fromAttrs(sync.text))[0];
	return this;
}
AssEvent.fromAttrs = (attrs, checkFurigana=true, checkFade=true, checkAss=true) => {
	if (checkFurigana) {
		let hasFurigana = false;
		for (let i = 0; i < attrs.length; i++) {
			if (attrs[i].furigana) {
				hasFurigana = true;
				break;
			}
		}
		if (hasFurigana) {
			let line = { attrs: [] };
			const lines = [line];
			for (let i = 0; i < attrs.length; i++) {
				const attr = attrs[i];
				if (attr.text.indexOf("\n") < 0) {
					line.attrs.push(attr);
					
				} else {
					const text = attr.text.split("\n");
					let newAttr = attr.clone();
					newAttr.text = text[0];
					line.attrs.push(newAttr);
					
					for (let j = 1; j < text.length; j++) {
						newAttr = attr.clone();
						newAttr.text = text[j];
						lines.push(line = { attrs: [newAttr] });
					}
				}
			}
			
			let count = 0;
			for (let i = 0; i < lines.length; i++) {
				line = lines[i];
				line.furigana = [];
				for (let j = 0; j < line.attrs.length; j++) {
					if (line.attrs[j].furigana) {
						const furigana = [];
						if (j > 0) {
							furigana.push(Attr.junkAss("{\\fscy50\\bord0\\1a&HFF&}"));
							furigana.push(...line.attrs.slice(0, j));
							furigana.push(Attr.junkAss("{\\1a\\bord\\fscx50}"));
						} else {
							furigana.push(Attr.junkAss("{\\fscy50\\fscx50}"));
						}
						
						furigana.push(line.attrs[j].furigana);
						
						if (j < line.attrs.length - 1) {
							furigana.push(Attr.junkAss("{\\fscx\\bord0\\1a&HFF&}"));
							furigana.push(...line.attrs.slice(j + 1));
							furigana.push(Attr.junkAss("{\\1a\\bord\\fscy}\\N"));
						} else {
							furigana.push(Attr.junkAss("{\\fscx\\fscy}\\N"));
						}
						line.furigana.push(furigana);
					}
				}
				count = Math.max(count, line.furigana.length);
			}
			
			const texts = [];
			for (let c = 0; c < count; c++) {
				const combined = [];
				for (let i = 0; i < lines.length; i++) {
					if (i > 0) {
						combined.push(Attr.junkAss("\\N"));
					}
					line = lines[i];
					if (line.furigana.length) {
						if (c < line.furigana.length) {
							combined.push(...line.furigana[c]);
						} else {
							combined.push(Attr.junkAss("{\\fscy50\\fscx50}　{\\fscx\\fscy}\\N"));
						}
					}
					if (c == 0) {
						combined.push(...line.attrs);
					} else {
						combined.push(Attr.junkAss("{\\bord0\\1a&HFF&}"));
						combined.push(...line.attrs);
						combined.push(Attr.junkAss("{\\1a\\bord}"));
					}
				}
				texts.push(Subtitle.Ass.fromAttrs(combined, false)[0]);
			}
			return texts;
		}
	}
	
	// 페이드 효과 있을 경우
	// 일부 페이드 인/아웃 - 겹치는 객체 만들어서 처리해야 함
	// 색상to색상인 경우 - 겹치는 객체 만들어서 처리해야 함
	if (checkFade) {
		let count = 0;
		const baseAttrs = [];
		for (let i = 0; i < attrs.length; i++) {
			const attr = new Attr(attrs[i], attrs[i].text);
			if (attr.fade != 0) count++;
			attr.fade = 0;
			baseAttrs.push(attr);
		}
		
		if (count) {
			const texts = [];

			{	// 페이드 인
				count = 0;
				const fadeAttrs = [Attr.junkAss("{\\fade([FADE_LENGTH],0)}")];
				let wasFade = false;
				for (let i = 0; i < attrs.length; i++) {
					const attr = new Attr(attrs[i], attrs[i].text);
					const base = baseAttrs[i];
					if (attr.fade == 1) {
						count++;
						if (!wasFade) {
							// 페이드 대상 원본 투명화
							base.hide = true;
							// 페이드 대상 활성화
							if (i > 0) {
								fadeAttrs.push(Attr.junkAss("{\\1a\\bord}"));
							}
							wasFade = true;
						}

					} else {
						if (wasFade || i == 0) {
							// 페이드 비대상 비활성화
							fadeAttrs.push(Attr.junkAss("{\\bord0\\1a&HFF&}"));
							wasFade = false;
						}
					}
					attr.fade = 0;
					fadeAttrs.push(attr);
				}
				if (count) {
					texts.push(...Subtitle.Ass.fromAttrs(fadeAttrs, false, false));
				}
			}

			{	// 페이드 아웃
				count = 0;
				const fadeAttrs = [Attr.junkAss("{\\fade(0,[FADE_LENGTH])}")];
				let wasFade = false;
				for (let i = 0; i < attrs.length; i++) {
					const attr = new Attr(attrs[i], attrs[i].text);
					const base = baseAttrs[i];
					if (attr.fade == -1) {
						count++;
						if (!wasFade) {
							// 페이드 대상 원본 투명화
							base.hide = true;
							// 페이드 대상 활성화
							if (i > 0) {
								fadeAttrs.push(Attr.junkAss("{\\1a\\bord}"));
							}
							wasFade = true;
						}

					} else {
						if (wasFade || i == 0) {
							// 페이드 비대상 비활성화
							fadeAttrs.push(Attr.junkAss("{\\bord0\\1a&HFF&}"));
							wasFade = false;
						}
					}
					attr.fade = 0;
					fadeAttrs.push(attr);
				}
				if (count) {
					texts.push(...Subtitle.Ass.fromAttrs(fadeAttrs, false, false));
				}
			}

			{	// 페이드와 무관하게 보이는 내용물
				let wasHide = false;
				for (let i = 0; i < baseAttrs.length; i++) {
					const attr = baseAttrs[i];
					if (!wasHide && attr.hide) {
						attr.text = "{\\bord0\\1a&HFF&}" + attr.text;
						wasHide = true;
					} else if (wasHide && !attr.hide) {
						attr.text = "{\\1a\\bord}" + attr.text;
						wasHide = false;
					}
				}

				texts.push(...Subtitle.Ass.fromAttrs(baseAttrs, false, false));
			}

			{	// 색상 페이드는 위를 덮어야 해서 더 나중에 추가함
				count = 0;
				const fadeAttrs = [Attr.junkAss("{\\fade([FADE_LENGTH],0)\\bord0}")];
				let wasFade = false;
				for (let i = 0; i < attrs.length; i++) {
					const attr = new Attr(attrs[i], attrs[i].text);
					let isFade = false;
					if (typeof attr.fade == "string" && attr.fade[0] == "#") {
						if (attr.fade.length == 7) {
							// 색상 페이드
							isFade = true;
							attr.fc = attr.fade.substring(1);

						} else if (attr.fade.length == 15 && attr.fade[7] == "~" && attr.fade[8] == "#") {
							// 그라데이션 페이드
							isFade = true;
							attr.fc = attr.fade;
						}
					}
					if (isFade) {
						count++;
						if (!wasFade) {
							// 페이드 대상 활성화
							if (i > 0) {
								fadeAttrs.push(Attr.junkAss("{\\1a}"));
							}
							wasFade = true;
						}

					} else {
						if (wasFade || i == 0) {
							// 페이드 비대상 비활성화
							fadeAttrs.push(Attr.junkAss("{\\1a&HFF&}"));
							wasFade = false;
						}
					}
					attr.fade = 0;
					fadeAttrs.push(attr);
				}
				if (count) {
					texts.push(...Subtitle.Ass.fromAttrs(fadeAttrs, false, false));
				}
			}

			return texts;
		}
	}
	
	let text = "";
	
	// ASS 변환용 속성 먼저 처리
	let assEnd = 0;
	if (checkAss) {
		for (let i = 0; i < attrs.length; i++) {
			const attr = attrs[i];
			
			if (typeof attr.ass == "string") {
				// ASS 속성 이전 부분 처리
				text += Subtitle.Ass.fromAttrs(attrs.slice(assEnd, i), false, false, false);
				
				// ASS 속성 처리
				for (; i < attrs.length; i++) {
					if (attr.ass != attrs[i].ass) {
						assEnd = i;
						i--; // 다음 루프에 ++ 됨
						break;
					}
				}
				if (i == attrs.length) {
					// ASS 속성 이후 내용물 없음
					// 속성 채워주는 것도 무의미
					assEnd = i;
				} else {
					// 의도적으로 구분함, 최종 단계에서 제거
					text += "{\\ass1}" + attr.ass + "{\\ass0}";
				}
			}
		}
	}
	
	// ASS 변환용 속성 없는 부분
	let last = new Attr();
	for (let i = assEnd; i < attrs.length; i++) {
		const attr = attrs[i];
		
		if (attr.fade ==  1) text += "{\\fade([FADE_LENGTH],0)}";
		if (attr.fade == -1) text += "{\\fade(0,[FADE_LENGTH])}";
		
		if      (!last.b &&  attr.b) text += "{\\b1}";
		else if ( last.b && !attr.b) text += "{\\b0}";
		
		if      (!last.i &&  attr.i) text += "{\\i1}";
		else if ( last.i && !attr.i) text += "{\\i0}";
		
		if      (!last.u &&  attr.u) text += "{\\u1}";
		else if ( last.u && !attr.u) text += "{\\u0}";
		
		if      (!last.s &&  attr.s) text += "{\\s1}";
		else if ( last.s && !attr.s) text += "{\\s0}";
		
		if (last.fn != attr.fn) text += "{\\fn" + (attr.fn ? attr.fn : "") + "}";
		
		if (last.fs != attr.fs) text += "{\\fs" + (attr.fs ? (Math.round(attr.fs / 18 * 800) / 10) : "") + "}";
		
		if (attr.fc.length == 15 && attr.fc[0] == '#' && attr.fc[7] == '~' && attr.fc[8] == '#') {
			// 그라데이션 분할
			const cFrom = attr.fc.substring(0,  7);
			const cTo   = attr.fc.substring(8, 15);
			const color = new Color(cTo, cFrom);
			
			let attrText = "";
			for (let k = 0; k < attr.text.length; k++) {
				attrText += "{\\c" + color.ass(k, attr.text.length - 1) + "}" + attr.text[k];
			}
			attr.text = attrText;
			
		} else {
			if (last.fc != attr.fc) {
				text += "{\\c" + Subtitle.Ass.colorFromAttr(attr.fc) + "}";
			}
		}
		
		text += attr.text;
		
		last = attr;
	}
	
	return [text.split("\n").join("\\N").trim()];
}
Subtitle.Ass.fromAttrs = AssEvent.fromAttrs;

// 뒤쪽에 붙은 군더더기 종료태그 삭제
AssEvent.prototype.clearEnds = function() {
	let text = this.Text;
	while (text.endsWith("}")) {
		if (text.endsWith("{}")) {
			// 의도적으로 넣은 것
			break;
		}
		let end = text.lastIndexOf("{");
		if (end > 0) {
			text = text.substring(0, end);
		} else {
			// {로 시작 - 의도적으로 넣은 것
			break;
		}
	}
	// 공백문자로 끝날 경우 잡아줘야 함
	if (text.endsWith(" ") || text.endsWith("　")) {
		text += "{}";
	}
	return this.Text = text;
}

AssEvent.fromSync = function(sync, style=null) {
	const events = sync.events = [];
	const start = sync.start;
	const end   = sync.end;
	let minLayer = 0;
	
	let attrs = sync.text;
	if (attrs[0].comment) {
		// 주석에서 추가 내용 확인
		const comment = attrs[0].comment;
		if (comment.startsWith("<!-- ASS\n")) {
			const lines = comment.substring(9, comment.length - 3).trim().split("\n");
			for (let i = 0; i < lines.length; i++) {
				const line = lines[i].trim();
				if (line == "END") {
					// 남은 내용물은 활용하지 않음
					return events;
				}
				let span = 1;
				let cols = line.split(",");
				if (cols.length == 1) {
					// 임의로 텍스트만 쓴 경우
					cols = [0, "", "", (style ? style.Name : "?"), "", 0, 0, 0, "", line];
				} else if (cols[1]) { // 풀사이즈면 싱크값이 비어있어야 함
					// 축약 표현
					cols = [cols[0], "", "", cols[1], "", 0, 0, 0, "", cols.slice(2).join(",")];
				} else {
					cols[9] = cols.slice(9).join(",");
					cols.length = 10;
					if (cols[2] && isFinite(cols[2])) {
						span = Number(cols[2]);
					}
				}
				const ass = new AssEvent(start, end, cols[3], cols[9], cols[0]);
				for (let j = 3; j < 9; j++) {
					ass[Subtitle.Ass.cols[j]] = cols[j];
				}
				ass.origin = sync;
				ass.span = span;
				events.push(ass);
				minLayer = Math.max(minLayer, cols[0]);
			}
		}
	}
	
	const texts = AssEvent.fromAttrs(attrs);
	for (let i = 0; i < texts.length; i++) {
		let text = texts[i];
		if (text.indexOf("[FADE_LENGTH]") > 0) {
			text = text.split("[FADE_LENGTH]").join(end - start);
		}
		
		// ASS에선 필요 없는 공백문자 군더더기 제거
		if (style && style.pos) {
			let x = style.pos[0];
			let y = style.pos[1];
			
			// RUBY 태그 등을 레이어 둘 이상으로 나눴으면 pos 같게 고정 필요
			let moved = (texts.length > 1);
			
			// 메인홀드 내용 중 다른 홀드랑 겹쳐서 기본적으로 올려야 하는 내용물
			if (sync.bottom) {
				y -= sync.bottom * style.Fontsize * 1.1;
				moved = true;
			}
			
			// 아래쪽에 공백줄 쌓아서 위로 올린 경우
			while (text.endsWith("\\N{\\b1}　{\\b0}") || text.endsWith("\\N{\\i1}　{\\i0}")) {
				if (style.Name == "Default") {
					// 메인 홀드만 자동으로 pos 태그 반영
					y -= style.Fontsize * 1.1;
				}
				moved = true;
				text = text.substring(0, text.length - 13);
			}
			// 위쪽에 공백줄 쌓아서 결합 맞춘 경우
			{
				let prev = "";
				// 앞쪽에 ASS 변환 전용 태그가 붙은 경우 건너뛰어야 함
				while (text.startsWith("{\\ass1}")) {
					const endIndex = text.indexOf("{\\ass0}");
					if (endIndex > 0) {
						prev += text.substring(0, endIndex + 7);
						text = text.substring(endIndex + 7);
					} else {
						// 원래 없으면 안 됨
						prev += text.substring(0, 7);
						text = text.substring(7);
					}
				}
				while (text.startsWith("{\\b1}　{\\b0}\\N") || text.startsWith("{\\i1}　{\\i0}\\N")) {
					text = text.substring(13);
				}
				if (prev) {
					text = prev + text;
				}
			}
			
			// 정렬용 좌우 여백 제거
			{	const lines = text.split("\\N");
				
				let minLeft = 99;
				let minRight = 99;
				
				for (let j = 0; j < lines.length; j++) {
					let line = lines[j];
					let prev = "";
					let next = "";
					while (line.startsWith("{")) {
						const tagEnd = line.indexOf("}") + 1;
						if (tagEnd) {
							const tag = line.substring(0, tagEnd);
							if (tag == "{\\ass1}") {
								// ASS 전용 태그 강제 지정한 부분
								const endIndex = line.indexOf("{\\ass0}");
								if (endIndex > 0) {
									prev += line.substring(7, endIndex);
									line = line.substring(endIndex + 7);
								} else {
									// 없으면 안 됨
									line = line.substring(tagEnd);
									break;
								}
							} else {
								prev += tag;
								line = line.substring(tagEnd);
							}
						} else {
							break;
						}
					}
					while (line.endsWith("}")) {
						const tagBegin = line.lastIndexOf("{");
						if (tagBegin > 0) {
							if (line.endsWith("{}")) {
								// 의도적으로 넣은 것
								break;
							}
							const tag = line.substring(tagBegin);
							if (tag == "{\\ass0}") {
								// ASS 전용 태그 강제 지정한 부분
								const beginIndex = line.lastIndexOf("{\\ass1}");
								if (beginIndex >= 0) {
									next = line.substring(beginIndex) + next;
									line = line.substring(0, beginIndex);
								} else {
									// 없으면 안 됨
									line = line.substring(0, tagBegin);
									break;
								}
							} else {
								next = tag + next;
								line = line.substring(0, tagBegin);
							}
						} else {
							break;
						}
					}
					
					line = line.split("​").join("");
					if (line.split("　").join("").trim().length == 0) {
						// 비어있는 줄이면 무시
						continue;
					}
					
					let left = 0;
					for (let k = 0; k < line.length; k++) {
						if (line[k] == "　") {
							left += 3;
						} else if (line[k] == " ") {
							left += 1;
						} else {
							line = line.substring(k);
							break;
						}
					}
					minLeft = Math.min(left);
					
					let right = 0;
					for (let k = line.length - 1; k >= 0; k--) {
						if (line[k] == "　") {
							right += 3;
						} else if (line[k] == " ") {
							right += 1;
						} else {
							line = line.substring(0, k + 1);
							break;
						}
					}
					minRight = Math.min(right);
					
					lines[j] = prev + line + next;
				}
				// 군더더기 제거
				text = lines.join("\\N").split("{\\ass1}").join("").split("{\\ass0}").join("").split("}{").join("");
				
				const shift = minLeft - minRight;
				if (shift) {
					// 모든 줄에 공통으로 한쪽에 여백이 있을 경우 좌우 이동
					x += style.Fontsize * shift / 8;
					if (style.Alignment % 3 == 2) {
						// 가운데 정렬일 때만 실제 태그에 반영
						moved = true;
					}
				}
			}
			
			if (moved) {
				if (text.indexOf("\\pos(") > 0 || text.indexOf("\\move(") > 0) {
					// 강제로 pos 태그 잡혀있으면 추가 적용하지 않음
				} else {
					text = "{\\pos(" + x + "," + y + ")}" + text;
				}
			}
		}
		if (text = text.split("}{").join("")) {
			const ass = new AssEvent(start, end, sync.style, text, minLayer + i);
			ass.origin = sync;
			events.push(ass);
		}
	}
	return events;
}

window.AssPart = Subtitle.AssPart = function(name, format=null, body=[]) {
	this.name = name;
	this.format = format;
	this.body = body;
}
AssPart.prototype.get = function(key) {
	if (this.format) return null;
	for (let i = 0; i < this.body.length; i++) {
		if (this.body[i].key == key) {
			return this.body[i].value;
		}
	}
	return null;
}
AssPart.prototype.set = function(key, value) {
	if (this.format) return;
	for (let i = 0; i < this.body.length; i++) {
		if (this.body[i].key == key) {
			this.body[i].value = value;
			return;
		}
	}
	this.body.push({ key: key, value: value });
}
AssPart.prototype.toTxt = // 처음에 함수명 잘못 지은 걸 레거시 호환으로 일단 유지함
AssPart.prototype.toText = function(withHeader=true) {
	const result = [];
	if (withHeader) {
		result.push('[' + this.name + ']');
		if (this.format) {
			result.push("Format: " + this.format.join(", "));
		}
	}
	for (let i = 0; i < this.body.length; i++) {
		const item = this.body[i];
		if (typeof item == "string") {
			// 주석
			result.push(item);
			continue;
		}
		if (this.format) {
			const value = [];
			for (let j = 0; j < this.format.length; j++) {
				const key = this.format[j];
				if (!item[key]) {
					switch (key) {
						case "Start": item.Start = AssEvent.fromAssTime(item.start); break;
						case "End"  : item.End   = AssEvent.fromAssTime(item.end  ); break;
					}
				}
				value.push(item[key]);
			}
			result.push(item.key + ": " + value.join(","));
		} else {
			result.push(item.key + ": " + item.value);
		}
	}
	return result.join("\n");
}
AssPart.StylesFormat = ["Name", "Fontname", "Fontsize", "PrimaryColour", "SecondaryColour", "OutlineColour", "BackColour", "Bold", "Italic", "Underline", "StrikeOut", "ScaleX", "ScaleY", "Spacing", "Angle", "BorderStyle", "Outline", "Shadow", "Alignment", "MarginL", "MarginR", "MarginV", "Encoding"];
AssPart.EventsFormat = ["Layer", "Start", "End", "Style", "Name", "MarginL", "MarginR", "MarginV", "Effect", "Text"];

AssEvent.prototype.toText = function(format=AssPart.EventsFormat) {
	const value = [];
	for (let j = 0; j < format.length; j++) {
		const key = format[j];
		if (key) {
			value.push(this[key]);
		} else {
			value.push("");
		}
	}
	return value.join(",");
}

window.AssFile = Subtitle.AssFile2 = function(text, width=1920, height=1080) {
	this.parts = [];
	if (text) {
		this.fromText(text);
	} else {
		const scriptInfo = new AssPart("Script Info");
		scriptInfo.body.push("; Script generated by Jamaker");
		scriptInfo.body.push("; https://github.com/harnenim/Jamaker");
		scriptInfo.body.push({ key: "ScriptType", value: "v4.00+" });
		scriptInfo.body.push({ key: "PlayResX", value: width });
		scriptInfo.body.push({ key: "PlayResY", value: height });
		scriptInfo.body.push({ key: "Timer", value: "100.0000" });
		scriptInfo.body.push({ key: "YCbCr Matrix", value: "TV.601" });
		scriptInfo.body.push({ key: "ScaledBorderAndShadow", value: "yes" });
		this.parts.push(scriptInfo);
		
		this.parts.push(new AssPart("V4+ Styles", AssPart.StylesFormat));
		this.parts.push(new AssPart("Events"    , AssPart.EventsFormat));
	}
}
AssFile.prototype.toTxt = // 처음에 함수명 잘못 지은 걸 레거시 호환으로 일단 유지함
AssFile.prototype.toText = function() {
	const result = [];
	for (let i = 0; i < this.parts.length; i++) {
		result.push(this.parts[i].toText());
	}
	return result.join("\n\n");
}
AssFile.prototype.fromTxt = // 처음에 함수명 잘못 지은 걸 레거시 호환으로 일단 유지함
AssFile.prototype.fromText = function(text) {
	const lines = text.split("\n");
	
	let part = null;
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!line) continue;
		
		if (line.startsWith('[') && line.endsWith(']')) {
			// 파트 시작
			this.parts.push(part = new AssPart(line.substring(1, line.length - 1)));
			
		} else if (part) {
			// 파트 내용물
			if (line.startsWith(";")) {
				// 주석
				part.body.push(line);
				continue;
			}
			
			const colon = line.indexOf(":");
			if (colon < 0) continue;
			
			const key = line.substring(0, colon).trim();
			let value = line.substring(colon + 1).trim();
			
			if (part.format) {
				// 포맷 지정된 경우
				value = value.split(",");
				if (value.length > part.format.length) {
					// 마지막 Text에 쉼표 들어가서 분리됐으면 다시 합쳐줌
					value[part.format.length - 1] = value.slice(part.format.length - 1).join(",");
					value.length = part.format.length;
				}
				if (part.name == "Events") {
					// 형 변환 필요?
				}
				const isStyle = part.name == "V4+ Styles";
				const isEvent = part.name == "Events";
				
				const item = isEvent ? new AssEvent() : {};
				item.key = key;
				
				for (let j = 0; j < part.format.length; j++) {
					const key = part.format[j];
					let v = value[j];
					if (isStyle && isFinite(v)) {
						v = Number(v);
					}
					item[key] = v;
					
					if (isEvent) {
						if (isFinite(v)) {
							switch (key) {
								case "Layer":
								case "start":
								case "end":
								case "MarginL":
								case "MarginR":
								case "MarginV":
									item[key] = Number(v);
									break;
							}
						} else {
							switch (key) {
								case "Start": item.start = AssEvent.fromAssTime(v, true); break;
								case "End"  : item.end   = AssEvent.fromAssTime(v, true); break;
							}
						}
					}
				}
				part.body.push(item);
				
			} else {
				// 포맷 지정 안 된 경우
				if (line.startsWith("Format:")) {
					// 포맷 설정인 경우
					part.format = line.substring(7).trim().split(",");
					for (let j = 0; j < part.format.length; j++) {
						part.format[j] = part.format[j].trim();
					}
				} else {
					// 키-값 파트인 경우
					part.body.push({ key: key, value: value });
				}
			}
		}
	}
	return this;
}
AssFile.prototype.addFromSync = // 처음에 함수명 잘못 지은 걸 레거시 호환으로 일단 유지함
AssFile.prototype.addFromSyncs = function(syncs, styleName) {
	let playResX = 1920;
	let playResY = 1080;
	const infoPart = this.getInfo();
	for (let i = 0; i < infoPart.body.length; i++) {
		const info = infoPart.body[i];
		switch (info.key) {
			case "PlayResX": playResX = Number(info.value); break;
			case "PlayResY": playResY = Number(info.value); break;
		}
	}

	const style = (typeof styleName == "string") ? this.getStyle(styleName) : styleName;
	if (style) {
		let x = 0;
		let y = 0;
		switch (style.Alignment % 3) {
			case 0: x = style.MarginL; break;
			case 1: x = playResX - style.MarginR; break;
			case 2: x = (playResX + style.MarginL - style.MarginR) / 2; break;
		}
		switch (Math.floor((style.Alignment - 1) / 3)) {
			case 0: y = playResY - style.MarginV; break;
			case 1: y = playResY / 2; break;
			case 2: y = style.MarginV; break;
		}
		// 후리가나 등 겹치는 항목을 생성할 경우 위치 고정
		style.pos = [x, y];
	}
	
	
	const part = this.getEvents();
	for (let i = 0; i < syncs.length; i++) {
		const sync = syncs[i];
		sync.style = styleName;
		const events = AssEvent.fromSync(sync, style);
		for (let j = 0; j < events.length; j++) {
			const event = events[j];
			if (event.span > 1) {
				const spanEnd = Math.min(i + event.span - 1, syncs.length - 1);
				event.End = AssEvent.toAssTime(event.end = syncs[spanEnd].end);
			}
		}
		part.body.push(...events);
	}
}
AssFile.prototype.toSync = // 처음에 함수명 잘못 지은 걸 레거시 호환으로 일단 유지함
AssFile.prototype.toSyncs = function() {
	let part = null;
	for (let i = 0; i < this.parts.length; i++) {
		if (this.parts[i].name == "Events") {
			part = this.parts[i];
			break;
		}
	}
	
	const result = [];
	if (part) {
		for (let i = 0; i < part.body.length; i++) {
			result.push(part.body[i][1]);
		}
	}
	return result;
}
AssFile.prototype.getPart = function(name) {
	for (let i = 0; i < this.parts.length; i++) {
		if (this.parts[i].name == name) {
			return this.parts[i];
		}
	}
	return null;
}
AssFile.prototype.getInfo = function() {
	return this.getPart("Script Info");
}
AssFile.prototype.getStyles = function() {
	let part = this.getPart("V4+ Styles");
	if (part == null) {
		part = new AssPart(name, AssPart.StylesFormat);
		this.parts.push(part);
	}
	return part;
}
AssFile.prototype.getEvents = function() {
	let part = this.getPart("Events");
	if (part == null) {
		part = new AssPart(name, AssPart.EventsFormat);
		this.parts.push(part);
	}
	return part;
}
AssFile.prototype.getStyle = function(name) {
	const stylesPart = this.getStyles();
	for (let i = 0; i < stylesPart.body.length; i++) {
		const style = stylesPart.body[i];
		if (style.Name == name) {
			return style;
		}
	}
	return null;
}
AssFile.prototype.addStyle = function(name, style, origin=null) {
	style = JSON.parse(JSON.stringify(style));
	style.key = "Style";
	style.Name = name;
	style.Encoding = 1;
	style.origin = origin;
	
	if (!style.Fontname) style.Fontname = "맑은 고딕";
	style.Bold        = style.Bold        ? -1 : 0;
	style.Italic      = style.Italic      ? -1 : 0;
	style.Underline   = style.Underline   ? -1 : 0;
	style.StrikeOut   = style.StrikeOut   ? -1 : 0;
	style.BorderStyle = style.BorderStyle ?  3 : 1;
	
	{ let fc = (style.PrimaryColour   + (511 - style.PrimaryOpacity  ).toString(16).substring(1)).toUpperCase(); style.PrimaryColour   = ("&H"+fc[7]+fc[8]+fc[5]+fc[6]+fc[3]+fc[4]+fc[1]+fc[2]); }
	{ let fc = (style.SecondaryColour + (511 - style.SecondaryOpacity).toString(16).substring(1)).toUpperCase(); style.SecondaryColour = ("&H"+fc[7]+fc[8]+fc[5]+fc[6]+fc[3]+fc[4]+fc[1]+fc[2]); }
	{ let fc = (style.OutlineColour   + (511 - style.OutlineOpacity  ).toString(16).substring(1)).toUpperCase(); style.OutlineColour   = ("&H"+fc[7]+fc[8]+fc[5]+fc[6]+fc[3]+fc[4]+fc[1]+fc[2]); }
	{ let fc = (style.BackColour      + (511 - style.BackOpacity     ).toString(16).substring(1)).toUpperCase(); style.BackColour      = ("&H"+fc[7]+fc[8]+fc[5]+fc[6]+fc[3]+fc[4]+fc[1]+fc[2]); }
	
	this.getStyles().body.push(style);
}

AssFile.prototype.fromSync =
AssFile.prototype.fromSyncs = function(syncs, style) {
	let part = null;
	for (let i = 0; i < this.parts.length; i++) {
		if (this.parts[i].name == "Events") {
			part = this.parts[i];
			break;
		}
	}
	if (!part) {
		part = new AssPart("Events", AssPart.EventsFormat);
	}
	
	part.body = [];
	for (let i = 0; i < syncs.length; i++) {
		syncs[i].style = style;
		part.body.push(new AssEvent().fromSync(syncs[i], false));
	}
	return this;
}





// SubtitleObjectSmi.cs

window.Smi = Subtitle.Smi = function(start, syncType, text) {
	this.start = start ? Math.round(start) : 0;
	this.syncType = syncType ? syncType : SyncType.normal;
	this.text = text ? text : "";
}
window.TypeParser = Smi.TypeParser = {};
TypeParser[SyncType.normal] = "";
TypeParser[SyncType.frame] = " ";
TypeParser[SyncType.inner] = "\t";
TypeParser[SyncType.split] = "  ";

Smi.prototype.toTxt = // 처음에 함수명 잘못 지은 걸 레거시 호환으로 일단 유지함
Smi.prototype.toText = function() {
	if (this.syncType == SyncType.comment) { // Normalize 시에만 존재
		return "<!--" + this.text + "-->";
	}
	return "<Sync Start=" + this.start + "><P Class=KRCC" + TypeParser[this.syncType] + ">\n" + this.text;
}
Smi.smi2txt = (smis) => {
	let result = "";
	for (let i = 0; i < smis.length; i++) {
		result += smis[i].toText() + "\n";
	}
	return result;
}
Smi.prototype.isEmpty = function() {
	return (this.text.split("&nbsp;").join("").trim().length == 0);
}

function sToAttrColor(soColor) {
	if (typeof soColor != 'string') {
		return "FFFFFF";
	}
	if (soColor[0] == '#' && soColor.length == 7) {
		return soColor.substring(1);
	}
	switch (soColor) {
		case "red"                 : return "FF0000";
		case "crimson"             : return "DC143C";
		case "firebrick"           : return "B22222";
		case "maroon"              : return "800000";
		case "darkred"             : return "8B0000";
		case "brown"               : return "A52A2A";
		case "sienna"              : return "A0522D";
		case "saddlebrown"         : return "8B4513";
		case "indianred"           : return "CD5C5C";
		case "rosybrown"           : return "BC8F8F";
		case "lightcoral"          : return "F08080";
		case "salmon"              : return "FA8072";
		case "darksalmon"          : return "E9967A";
		case "coral"               : return "FF7F50";
		case "tomato"              : return "FF6347";
		case "sandybrown"          : return "F4A460";
		case "lightsalmon"         : return "FFA07A";
		case "peru"                : return "CD853F";
		case "chocolate"           : return "D2691E";
		case "orangered"           : return "FF4500";
		case "orange"              : return "FFA500";
		case "darkorange"          : return "FF8C00";
		case "tan"                 : return "D2B48C";
		case "peachpuff"           : return "FFDAB9";
		case "bisque"              : return "FFE4C4";
		case "moccasin"            : return "FFE4B5";
		case "navajowhite"         : return "FFDEAD";
		case "wheat"               : return "F5DEB3";
		case "burlywood"           : return "DEB887";
		case "darkgoldenrod"       : return "B8860B";
		case "goldenrod"           : return "DAA520";
		case "gold"                : return "FFD700";
		case "yellow"              : return "FFFF00";
		case "lightgoldenrodyellow": return "FAFAD2";
		case "palegoldenrod"       : return "EEE8AA";
		case "khaki"               : return "F0E68C";
		case "darkkhaki"           : return "BDB76B";
		case "lawngreen"           : return "7CFC00";
		case "greenyellow"         : return "ADFF2F";
		case "chartreuse"          : return "7FFF00";
		case "lime"                : return "00FF00";
		case "limegreen"           : return "32CD32";
		case "yellowgreen"         : return "9ACD32";
		case "olive"               : return "808000";
		case "olivedrab"           : return "6B8E23";
		case "darkolivegreen"      : return "556B2F";
		case "forestgreen"         : return "228B22";
		case "darkgreen"           : return "006400";
		case "green"               : return "008000";
		case "seagreen"            : return "2E8B57";
		case "mediumseagreen"      : return "3CB371";
		case "darkseagreen"        : return "8FBC8F";
		case "lightgreen"          : return "90EE90";
		case "palegreen"           : return "98FB98";
		case "springgreen"         : return "00FF7F";
		case "mediumspringgreen"   : return "00FA9A";
		case "teal"                : return "008080";
		case "darkcyan"            : return "008B8B";
		case "lightseagreen"       : return "20B2AA";
		case "mediumaquamarine"    : return "66CDAA";
		case "cadetblue"           : return "5F9EA0";
		case "steelblue"           : return "4682B4";
		case "aquamarine"          : return "7FFFD4";
		case "powderblue"          : return "B0E0E6";
		case "paleturquoise"       : return "AFEEEE";
		case "lightblue"           : return "ADD8E6";
		case "lightsteelblue"      : return "B0C4DE";
		case "skyblue"             : return "87CEEB";
		case "lightskyblue"        : return "87CEFA";
		case "mediumturquoise"     : return "48D1CC";
		case "turquoise"           : return "40E0D0";
		case "darkturquoise"       : return "00CED1";
		case "aqua"                : return "00FFFF";
		case "cyan"                : return "00FFFF";
		case "deepskyblue"         : return "00BFFF";
		case "dodgerblue"          : return "1E90FF";
		case "cornflowerblue"      : return "6495ED";
		case "royalblue"           : return "4169E1";
		case "blue"                : return "0000FF";
		case "mediumblue"          : return "0000CD";
		case "navy"                : return "000080";
		case "darkblue"            : return "00008B";
		case "midnightblue"        : return "191970";
		case "darkslateblue"       : return "483D8B";
		case "slateblue"           : return "6A5ACD";
		case "mediumslateblue"     : return "7B68EE";
		case "mediumpurple"        : return "9370DB";
		case "darkorchid"          : return "9932CC";
		case "darkviolet"          : return "9400D3";
		case "blueviolet"          : return "8A2BE2";
		case "mediumorchid"        : return "BA55D3";
		case "plum"                : return "DDA0DD";
		case "lavender"            : return "E6E6FA";
		case "thistle"             : return "D8BFD8";
		case "orchid"              : return "DA70D6";
		case "violet"              : return "EE82EE";
		case "indigo"              : return "4B0082";
		case "darkmagenta"         : return "8B008B";
		case "purple"              : return "800080";
		case "mediumvioletred"     : return "C71585";
		case "deeppink"            : return "FF1493";
		case "fuchsia"             : return "FF00FF";
		case "magenta"             : return "FF00FF";
		case "hotpink"             : return "FF69B4";
		case "palevioletred"       : return "DB7093";
		case "lightpink"           : return "FFB6C1";
		case "pink"                : return "FFC0CB";
		case "mistyrose"           : return "FFE4E1";
		case "blanchedalmond"      : return "FFEBCD";
		case "lightyellow"         : return "FFFFE0";
		case "cornsilk"            : return "FFF8DC";
		case "antiquewhite"        : return "FAEBD7";
		case "papayawhip"          : return "FFEFD5";
		case "lemonchiffon"        : return "FFFACD";
		case "beige"               : return "F5F5DC";
		case "linen"               : return "FAF0E6";
		case "oldlace"             : return "FDF5E6";
		case "lightcyan"           : return "E0FFFF";
		case "aliceblue"           : return "F0F8FF";
		case "whitesmoke"          : return "F5F5F5";
		case "lavenderblush"       : return "FFF0F5";
		case "floralwhite"         : return "FFFAF0";
		case "mintcream"           : return "F5FFFA";
		case "ghostwhite"          : return "F8F8FF";
		case "honeydew"            : return "F0FFF0";
		case "seashell"            : return "FFF5EE";
		case "ivory"               : return "FFFFF0";
		case "azure"               : return "F0FFFF";
		case "snow"                : return "FFFAFA";
		case "white"               : return "FFFFFF";
		case "gainsboro"           : return "DCDCDC";
		case "lightgrey"           : return "D3D3D3";
		case "silver"              : return "C0C0C0";
		case "darkgray"            : return "A9A9A9";
		case "lightslategray"      : return "778899";
		case "slategray"           : return "708090";
		case "gray"                : return "808080";
		case "dimgray"             : return "696969";
		case "darkslategray"       : return "2F4F4F";
		case "black"               : return "000000";
	}
	return soColor;
}
Smi.colorToAttr = (soColor) => {
	return sToAttrColor(soColor);
}
Smi.colorFromAttr = (attrColor) => {
	return ((attrColor.length == 6) ? "#" : "") + attrColor;
}

Smi.Status = function() {
	this.b = 0;
	this.i = 0;
	this.u = 0;
	this.s = 0;
	this.fs = [];
	this.fn = [];
	this.fc = [];
	this.ass = []; // ASS 변환 시에만 쓰이는 속성
	this.fade = [];
	this.shake = [];
	this.typing = [];
	this.fontAttrs = [];
}
Smi.Status.prototype.setB = function(isOpen) {
	if (isOpen) this.b++;
	else if (this.b > 0) this.b--;
	return this;
}
Smi.Status.prototype.setI = function(isOpen) {
	if (isOpen) this.i++;
	else if (this.i > 0) this.i--;
	return this;
}
Smi.Status.prototype.setU = function(isOpen) {
	if (isOpen) this.u++;
	else if (this.u > 0) this.u--;
	return this;
}
Smi.Status.prototype.setS = function(isOpen) {
	if (isOpen) this.s++;
	else if (this.s > 0) this.s--;
	return this;
}
Smi.Status.prototype.setFont = function(attrs) {
	if (attrs != null) {
		const thisAttrs = [];
		for (let i = 0; i < attrs.length; i++) {
			thisAttrs[i] = attrs[i][0];
			switch (attrs[i][0]) {
				case "size":
					if (isFinite(attrs[i][1])) {
						this.fs.push(Number(attrs[i][1]));
					}
					break;
					
				case "face":
					this.fn.push(attrs[i][1]);
					break;
					
				case "color":
					this.fc.push(sToAttrColor(attrs[i][1]));
					break;
					
				case "ass":
					this.ass.push(attrs[i][1]);
					break;
					
				case "fade":
					let fade = attrs[i][1];
					if (fade == "in") {
						fade = 1;
					} else if (fade == "out") {
						fade = -1;
					} else {
						if (typeof fade == "string" && fade[0] == "#") {
							if (fade.length == 7) {
								// 16진수 맞는지 확인
								if (!isFinite("0x" + fade.substring(1))) {
									fade = 0;
								}
							} else if (fade.length == 15 && fade[7] == "~" && fade[8] == "#") {
								// 16진수 맞는지 확인
								if (!isFinite("0x" + fade.substring(1, 7))
								 || !isFinite("0x" + fade.substring(9))
								) {
									fade = 0;
								}
							} else {
								fade = 0;
							}
						} else {
							fade = 0;
						}
					}
					this.fade.push(fade);
					break;
					
				case "shake": {
					const shake = { ms: 125, size: 2 };
					if (attrs[i][1]) {
						const attr = attrs[i][1].split(",");
						if (isFinite(attr[0])) shake.ms   = Number(attr[0]);
						if (isFinite(attr[1])) shake.size = Number(attr[1]);
						if (shake.ms   < 1) shake.ms   = 1;
						if (shake.size < 1) shake.size = 1;
					}
					this.shake.push(shake);
					break;
				}
					
				case "typing": {
					const attr = attrs[i][1].split(' ');
					const mode = attr[0];
					let match = null;
					let tAttr = null;

					if (mode.startsWith("character")) {
						if (mode == "character") {
							tAttr = new Attr.TypingAttr(Typing.Mode.character);

						} else if (mode.length == 11) {
							const s = ((mode[ 9] == '(') ? 1 : ((mode[ 9] == '[') ? 0 : -1));
							const e = ((mode[10] == ')') ? 1 : ((mode[10] == ']') ? 0 : -1));
							if (s > -1 && e > -1) {
								tAttr = new Attr.TypingAttr(Typing.Mode.character, s, e);
							}
							
						} else if (match = /keyboard\(([0-9]+),([0-9]+)\)/.exec(mode)) {
							tAttr = new Attr.TypingAttr(Typing.Mode.character, Number(match[1]), Number(match[2]));
						}
						
					} else if (mode == "typewriter") {
						tAttr = new Attr.TypingAttr(Typing.Mode.typewriter);
						
					} else if (match = /typewriter\(([0-9]+),([0-9]+)\)/.exec(mode)) {
						tAttr = new Attr.TypingAttr(Typing.Mode.typewriter, Number(match[1]), Number(match[2]));
						
					} else if (mode.startsWith("keyboard")) {
						if (mode == "keyboard") {
							tAttr = new Attr.TypingAttr(Typing.Mode.keyboard);
							
						} else if (mode.length == 10) {
							const s = ((mode[8] == '(') ? 1 : ((mode[8] == '[') ? 0 : -1));
							const e = ((mode[9] == ')') ? 1 : ((mode[9] == ']') ? 0 : -1));
							if (s > -1 && e > -1) {
								tAttr = new Attr.TypingAttr(Typing.Mode.keyboard, s, e);
							}
							
						} else if (match = /keyboard\(([0-9]+),([0-9]+)\)/.exec(mode)) {
							tAttr = new Attr.TypingAttr(Typing.Mode.keyboard, Number(match[1]), Number(match[2]));
						}
					}
					
					if (tAttr == null) {
						thisAttrs[i] = "";
					} else {
						if (attr.length > 1) {
							switch (attr[1]) {
								case "invisible":
									tAttr.cursor = Typing.Cursor.invisible;
									break;
								case "visible":
									tAttr.cursor = Typing.Cursor.visible;
									break;
								case "hangeul":
									tAttr.cursor = Typing.Cursor.hangeul;
									break;
							}
						}
						this.typing.push(tAttr);
					}
					break;
				}
			}
		}
		this.fontAttrs.push(thisAttrs);
		
	} else if (this.fontAttrs != null && this.fontAttrs.length) {
		const lastAttrs = this.fontAttrs[this.fontAttrs.length - 1];
		for (let i = 0; i < lastAttrs.length; i++) {
			switch (lastAttrs[i]) {
				case "size":
					this.fs.pop();
					break;
				case "face":
					this.fn.pop();
					this.break;
				case "color":
					this.fc.pop();
					break;
				case "ass":
					this.ass.pop();
					break;
				case "fade":
					this.fade.pop();
					break;
				case "shake":
					this.shake.pop();
					break;
				case "typing":
					this.typing.pop();
					break;
			}
		}
		this.fontAttrs.pop();
	}
	return this;
}
Smi.setStyle = (attr, status) => {
	attr.b = status.b > 0;
	attr.i = status.i > 0;
	attr.u = status.u > 0;
	attr.s = status.s > 0;
	attr.fs = (status.fs.length > 0) ? status.fs[status.fs.length - 1] : 0;
	attr.fn = (status.fn.length > 0) ? status.fn[status.fn.length - 1] : "";
	attr.fc = (status.fc.length > 0) ? status.fc[status.fc.length - 1] : "";
	attr.ass = (status.ass.length > 0) ? status.ass[status.ass.length - 1] : null;
	attr.fade = (status.fade.length > 0) ? status.fade[status.fade.length - 1] : 0;
	attr.shake = (status.shake.length > 0) ? status.shake[status.shake.length - 1] : null;
	attr.typing = (status.typing.length > 0) ? status.typing[status.typing.length - 1] : null;
}
Smi.setFurigana = (attr, furigana) => {
	attr.furigana = furigana ? furigana : null;
}
Smi.toAttr = // 처음에 함수명 잘못 지은 걸 레거시 호환으로 일단 유지함
Smi.toAttrs = (text, keepTags=true) => {
	const status = new Smi.Status();
	let last = new Attr();
	last.tagString = "";
	const result = [last];
	let ruby = null;
	let furigana = null;
	
	let state = null;

	let tagString = null;
	let tag = null;
	let attr = null;
	let value = null;
	
	function openTag() {
		switch (tag.name.toUpperCase()) {
			case "B":
				// 원래 텍스트 비었으면 군더더기 없이 하려고 했는데
				// 태그 여닫은 순서는 기억하는 게 좋을 것 같음
				// ... 아닌가?
				if (last.ass || last.text.length > 0) {
					result.push(last = new Attr());
					if (keepTags) last.tagString = tagString;
				} else {
					if (keepTags) last.tagString += tagString;
				}
				Smi.setStyle(last, status.setB(true));
				break;
			case "I":
				if (last.ass || last.text.length > 0) {
					result.push(last = new Attr());
					if (keepTags) last.tagString = tagString;
				} else {
					if (keepTags) last.tagString += tagString;
				}
				Smi.setStyle(last, status.setI(true));
				break;
			case "U":
				if (last.ass || last.text.length > 0) {
					result.push(last = new Attr());
					if (keepTags) last.tagString = tagString;
				} else {
					if (keepTags) last.tagString += tagString;
				}
				Smi.setStyle(last, status.setU(true));
				break;
			case "S":
				if (last.ass || last.text.length > 0) {
					result.push(last = new Attr());
					if (keepTags) last.tagString = tagString;
				} else {
					if (keepTags) last.tagString += tagString;
				}
				Smi.setStyle(last, status.setS(true));
				break;
			case "FONT":
				if (last.ass || last.text.length > 0) {
					result.push(last = new Attr());
					if (keepTags) last.tagString = tagString;
				} else {
					if (keepTags) last.tagString += tagString;
				}
				{
					const attrs = [];
					for (let name in tag.attrs) {
						attrs.push([name, tag.attrs[name]]);
					}
					Smi.setStyle(last, status.setFont(attrs));
				}
				break;
			case "RUBY":
				if (last.ass || last.text.length > 0) {
					result.push(last = new Attr());
					if (keepTags) last.tagString = tagString;
				} else {
					if (keepTags) last.tagString += tagString;
				}
				Smi.setStyle(last, status);
				ruby = last;
				break;
			case "RT":
				if (last.ass || last.text.length > 0) {
					last = new Attr(); // 후리가나는 상위 리스트에 넣지 않음
					if (keepTags) last.tagString = tagString;
				} else {
					if (keepTags) last.tagString += tagString;
				}
				Smi.setStyle(last, status);
				furigana = last;
				break;
			case "RP":
				last = new Attr(); // 후리가나는 상위 리스트에 넣지 않음
				Smi.setStyle(last, status);
				break;
			case "BR":
				last.text += "\n";
				break;
		}
		tag = null;
		tagString = null;
	}
	function closeTag(tagName) {
		switch (tagName.toUpperCase()) {
			case "B":
				if (last.ass || last.text.length > 0) {
					result.push(last = new Attr());
					if (keepTags) last.tagString = tagString;
				} else {
					if (keepTags) last.tagString += tagString;
				}
				Smi.setStyle(last, status.setB(false));
				break;
			case "I":
				if (last.ass || last.text.length > 0) {
					result.push(last = new Attr());
					if (keepTags) last.tagString = tagString;
				} else {
					if (keepTags) last.tagString += tagString;
				}
				Smi.setStyle(last, status.setI(false));
				break;
			case "U":
				if (last.ass || last.text.length > 0) {
					result.push(last = new Attr());
					if (keepTags) last.tagString = tagString;
				} else {
					if (keepTags) last.tagString += tagString;
				}
				Smi.setStyle(last, status.setU(false));
				break;
			case "S":
				if (last.ass || last.text.length > 0) {
					result.push(last = new Attr());
					if (keepTags) last.tagString = tagString;
				} else {
					if (keepTags) last.tagString += tagString;
				}
				Smi.setStyle(last, status.setS(false));
				break;
			case "FONT":
				if (last.ass || last.text.length > 0) {
					result.push(last = new Attr());
					if (keepTags) last.tagString = tagString;
				} else {
					if (keepTags) last.tagString += tagString;
				}
				Smi.setStyle(last, status.setFont(null));
				break;
			case "RUBY":
				if (last.ass || last.text.length > 0) {
					result.push(last = new Attr());
					if (keepTags) last.tagString = tagString;
				} else {
					if (keepTags) last.tagString += tagString;
				}
				Smi.setStyle(last, status);
				break;
			case "RT":
				if (ruby) {
					Smi.setFurigana(ruby, furigana);
					furigana = null;
					last = ruby;
				}
				break;
			case "RP":
				if (furigana) last = furigana;
				break;
			default:
				break;
		}
		tagString = null;
	}
	
	let commentStart = 0;
	for (let pos = 0; pos < text.length; pos++) {
		const c = text[pos];
		if (tagString) tagString += c;
		
		switch (state) {
			case '/': { // 태그?!
				state = '<';
				if (c == '/') { // 종료 태그 시작일 경우
					const end = text.indexOf('>', pos);
					if (end < 0) {
						// 태그 끝이 없음
						pos = text.length;
						break;
					}
					tagString += text.substring(pos + 1, end + 1);
					closeTag(text.substring(pos + 1, end));
					pos = end;
					state = null;
					break;
				}
				// 종료 태그 아닐 경우 아래로 이어서 진행
				tag = { name: "", attrs: {} };
			}
			case '<': { // 태그명
				switch (c) {
					case '>': { // 태그 종료
						openTag();
						state = null;
						break;
					}
					case ' ':
					case '\t': { // 태그명 끝
						state = '>';
						break;
					}
					default: {
						tag.name += c;
						break;
					}
				}
				break;
			}
			case '>': { // 태그 내
				switch (c) {
					case '>': { // 태그 종료
						openTag();
						state = null;
						break;
					}
					case ' ': 
					case '\t':
					case '<':
					case '&': {
						break;
					}
					default: { // 속성명 시작
						attr = c;
						state = 'a';
						break;
					}
				}
				break;
			}
			case 'a': { // 속성명
				switch (c) {
					case '>': { // 태그 종료
						tag.attrs[attr] = attr;
						openTag();
						state = null;
						break;
					}
					case '=': { // 속성값 시작
						state = '=';
						break;
					}
					case ' ':
					case '\t': { // 일단은 속성이 끝나지 않을 걸로 간주
						state = '`';
						break;
					}
					default: {
						attr += c;
					}
				}
				break;
			}
			case '`': { // 속성명+공백문자
				switch (c) {
					case '>': { // 태그 종료
						tag.attrs[attr] = attr;
						openTag();
						state = null;
						break;
					}
					case '=': { // 속성값 시작
						state = '=';
						break;
					}
					case ' ':
					case '\t': { // 일단은 속성이 끝나지 않을 걸로 간주
						break;
					}
					default: { // 속성값 없는 속성으로 확정, 새 속성 시작
						tag.attrs[attr] = attr;
						attr = c;
						state = 'a';
					}
				}
				break;
			}
			case '=': { // 속성값 시작 전
				switch (c) {
					case '>': { // 태그 종료
						tag.attrs[attr] = "";
						openTag();
						state = null;
						break;
					}
					case '"': { // 속성값 따옴표 시작
						value = "";
						state = '"';
						break;
					}
					case "'": { // 속성값 따옴표 시작
						value = "";
						state = "'";
						break;
					}
					case ' ': { // 일단은 속성이 끝나지 않을 걸로 간주
						break;
					}
					case '\t': {
						break;
					}
					default: {
						value = c;
						state = '~';
					}
				}
				break;
			}
			case '~': { // 따옴표 없는 속성값
				switch (c) {
					case '>': { // 태그 종료
						tag.attrs[attr] = value;
						openTag();
						state = null;
						break;
					}
					case ' ':
					case '\t': { // 속성 종료
						tag.attrs[attr] = value;
						state = '>';
						break;
					}
					default: {
						value += c;
					}
				}
				break;
			}
			case '"': {
				switch (c) {
					case '"': { // 속성 종료
						tag.attrs[attr] = value;
						state = '>';
						break;
					}
					default: {
						value += c;
					}
				}
				break;
			}
			case "'": {
				switch (c) {
					case "'": { // 속성 종료
						tag.attrs[attr] = value;
						state = '>';
						break;
					}
					default: {
						value += c;
					}
				}
				break;
			}
			case '!': { // 주석
				if ((pos + 3 <= text.length) && (text.substring(pos, pos+3) == "-->")) {
					if (commentStart == 0) {
						// 주석은 첫 항목이어야 함
						last.comment = text.substring(0, pos + 3);
						result.push(last = new Attr());
						last.tagString = "";
					}
					state = null;
					pos += 2;
				}
				break;
			}
			default: { // 텍스트
				switch (c) {
					case '<': {
						if ((pos + 4 <= text.length) && (text.substring(pos, pos+4) == "<!--")) {
							// 주석 시작
							commentStart = pos;
							state = '!';
							pos += 3;
						} else {
							// 태그 시작
							state = '/';
							tagString = c;
						}
						break;
					}
					case '\n': { // 줄바꿈 무자 무시
						break;
					}
					default: {
						last.text += c;
					}
				}
			}
		}
	}
	const a = Subtitle.$tmp;
	for (let i = 0; i < result.length; i++) {
		// &amp; 같은 문자 처리
		result[i].text = a.html(result[i].text).text();
	}
	
	return result;
}
Smi.prototype.toAttr = // 처음에 함수명 잘못 지은 걸 레거시 호환으로 일단 유지함
Smi.prototype.toAttrs = function(keepTags=true) {
	return Smi.toAttrs(this.text, keepTags);
}
Smi.prototype.fromAttr = // 처음에 함수명 잘못 지은 걸 레거시 호환으로 일단 유지함
Smi.prototype.fromAttrs = function(attrs, forConvert=false) {
	let text = "";
	// 주석 살려야 되는지 확인
	if (forConvert) {
		// 주석에 줄바꿈 있을 수 있어서 따로 처리해줘야 함
		for (let i = 0; i < attrs.length; i++) {
			if (attrs[i].comment) {
				text += attrs[i].comment;
			} else {
				break;
			}
		}
	}
	text += Smi.fromAttrs(attrs, 0, true, true, forConvert).split("\n").join("<br>");
	this.text = text;
	return this;
}
Smi.fromAttr = // 처음에 함수명 잘못 지은 걸 레거시 호환으로 일단 유지함
// TODO: fromAttrs 재개발해서 여기 안 탐. 추후 삭제 조치
Smi.fromAttrs = (attrs, fontSize=0) => { // fontSize를 넣으면 html로 % 크기 출력
	let text = "";
	
	const a = Subtitle.$tmp;
	let last = new Attr();
	for (let i = 0; i < attrs.length; i++) {
		const attr = attrs[i];
		
		//* // 그냥 없앨까...?
		if (attr.tagString && attr.fade == 0 && attr.shake == null && attr.typing == null) {
			// 원래 태그가 뭔지 알고 있을 경우 원본 복원
			text += attr.tagString + attr.text;
			
		} else
		//*/
		if (attr.furigana) {
			// <RUBY> 태그 적용 시 무조건 태그 닫고 열기
			
			if (last.s) text += "</S>";
			if (last.u) text += "</U>";
			if (last.i) text += "</I>";
			if (last.b) text += "</B>";
			
			// 기존에 속성이 있었을 때 닫는 태그
			if (last.fs > 0 || !last.fn == ("") || !last.fc == ("") || last.fade != 0 || last.shake != null || last.typing != null) {
				text += "</FONT>";
			}
			let prev = "<RUBY>";
			let next = "";
			
			if (attr.b) { prev += "<B>"; };
			if (attr.i) { prev += "<I>"; };
			if (attr.u) { prev += "<U>"; };
			if (attr.s) { prev += "<S>"; next = "</S>" + next; };
			if (attr.u) { next = "</U>" + next; };
			if (attr.i) { next = "</I>" + next; };
			if (attr.b) { next = "</B>" + next; };
			
			// 속성이 있을 때 여는 태그
			let fontStart = "";
			let fontEnd = "";
			if (attr.fs > 0 || !attr.fn == ("") || !attr.fc == ("") || attr.fade != 0 || attr.shake != null || attr.typing != null) {
				fontStart = "<FONT";
				if (attr.fs > 0) {
					if (fontSize)    fontStart += " style=\"font-size: " + (attr.fs / fontSize * 100) + "%;\"";
					else             fontStart += " size=\"" + attr.fs + "\"";
				}
				if (attr.fn   != "") fontStart += " face=\"" + attr.fn + "\"";
				if (attr.fc   != "") fontStart += " color=\""+ Smi.colorFromAttr(attr.fc) + "\"";
				if (attr.fade != 0 ) fontStart += " fade=\"" + (attr.fade == 1 ? "in" : (attr.fade == -1 ? "out" : attr.fade)) + "\"";
				if (attr.shake != null) fontStart += " shake=\"" + attr.shake.ms + "," + attr.shake.size + "\"";
				if (attr.typing != null) fontStart += " typing=\"" + Typing.Mode.toString[attr.typing.mode] + "(" + attr.typing.start + "," + attr.typing.end + ") " + Typing.Cursor.toString[attr.typing.cursor] + "\"";
				fontStart += ">";
				fontEnd = "</FONT>";
			}
			next += "<RT><RP>(</RP>" + Smi.fromAttrs([attr.furigana, new Attr()]) + "<RP>)</RP></RT></RUBY>";
			
			text += fontStart + prev + attr.text + next + fontEnd;
			
		} else if (last.furigana) {
			// 앞쪽에 <RUBY> 태그 있었을 때
			
			// 속성이 있을 때 여는 태그
			if (attr.fs > 0 || !attr.fn == ("") || !attr.fc == ("") || attr.fade != 0 || attr.shake != null || attr.typing != null) {
				text += "<FONT";
				if (attr.fs > 0) {
					if (fontSize)    text += " style=\"font-size: " + (attr.fs / fontSize * 100) + "%;\"";
					else             text += " size=\"" + attr.fs + "\"";
				}
				if (attr.fn   != "") text += " face=\"" + attr.fn + "\"";
				if (attr.fc   != "") text += " color=\""+ Smi.colorFromAttr(attr.fc) + "\"";
				if (attr.fade != 0 ) text += " fade=\"" + (attr.fade == 1 ? "in" : (attr.fade == -1 ? "out" : attr.fade)) + "\"";
				if (attr.shake != null) text += " shake=\"" + attr.shake.ms + "," + attr.shake.size + "\"";
				if (attr.typing != null) text += " typing=\"" + Typing.Mode.toString[attr.typing.mode] + "(" + attr.typing.start + "," + attr.typing.end + ") " + Typing.Cursor.toString[attr.typing.cursor] + "\"";
				text += ">";
			}
			
			if (attr.b) text += "<B>";
			if (attr.i) text += "<I>";
			if (attr.u) text += "<U>";
			if (attr.s) text += "<S>";
			
			text += attr.text;
			
		} else {
			if (last.s && !attr.s) text += "</S>";
			if (last.u && !attr.u) text += "</U>";
			if (last.i && !attr.i) text += "</I>";
			if (last.b && !attr.b) text += "</B>";
			
			if ( last.fs   != attr.fs
			 ||  last.fn   != attr.fn
			 ||  last.fc   != attr.fc
			 ||  last.fade != attr.fade
			 || (last.shake  == null && attr.shake  != null)
			 || (last.shake  != null && attr.shake  == null)
			 || (last.typing == null && attr.typing != null)
			 || (last.typing != null && attr.typing == null)
			) {
				// 기존에 속성이 있었을 때만 닫는 태그
				if (last.fs > 0 || !last.fn == ("") || !last.fc == ("") || last.fade != 0 || last.shake != null || last.typing != null)
					text += "</FONT>";
				
				// 신규 속성이 있을 때만 여는 태그
				if (attr.fs > 0 || !attr.fn == ("") || !attr.fc == ("") || attr.fade != 0 || attr.shake != null || attr.typing != null) {
					text += "<FONT";
					if (attr.fs > 0) {
						if (fontSize)    text += " style=\"font-size: " + (attr.fs / fontSize * 100) + "%;\"";
						else             text += " size=\"" + attr.fs + "\"";
					}
					if (attr.fn   != "") text += " face=\"" + attr.fn + "\"";
					if (attr.fc   != "") text += " color=\""+ Smi.colorFromAttr(attr.fc) + "\"";
					if (attr.fade != 0 ) text += " fade=\"" + (attr.fade == 1 ? "in" : (attr.fade == -1 ? "out" : attr.fade)) + "\"";
					if (attr.shake != null) text += " shake=\"" + attr.shake.ms + "," + attr.shake.size + "\"";
					if (attr.typing != null) text += " typing=\"" + Typing.Mode.toString[attr.typing.mode] + "(" + attr.typing.start + "," + attr.typing.end + ") " + Typing.Cursor.toString[attr.typing.cursor] + "\"";
					text += ">";
				}
			}
			
			// 특수태그 정규화 시 해당 태그는 안쪽에 들어간다고 가정하여 나중에 추가
			if (!last.b && attr.b) text += "<B>";
			if (!last.i && attr.i) text += "<I>";
			if (!last.u && attr.u) text += "<U>";
			if (!last.s && attr.s) text += "<S>";
			
			text += (attr.text == "\n") ? "<br>" : a.text(attr.text).html();
		}
		last = attr;
	}
	
	return text;
}
Smi.fromAttrs = (attrs, fontSize=0, checkRuby=true, checkFont=true, forConvert=false) => { // fontSize를 넣으면 html로 % 크기 출력
	let text = "";
	
	// 후리가나 먼저 처리
	let rubyEnd = 0;
	if (checkRuby) {
		for (let i = 0; i < attrs.length; i++) {
			const attr = attrs[i];
			
			if (attr.furigana) {
				// 후리가나 달리기 이전 부분 처리
				text += Smi.fromAttrs(attrs.slice(rubyEnd, i), 0, true, true, forConvert);
				
				// 후리가나 처리
				const subAttrs = [attr.clone()];
				for (; i < attrs.length; i++) {
					if (attr.furigana == attrs[i].furigana) {
						const subAttr = attrs[i].clone();
						subAttr.furigana = null;
						subAttrs.push(subAttr);
					} else {
						rubyEnd = i;
						i--; // 다음 루프에 ++ 됨
						break;
					}
				}
				text += "<RUBY>" + Smi.fromAttrs(subAttrs, fontSize, false, true, forConvert) + "<RT><RP>(</RP>" + Smi.fromAttrs([attr.furigana], fontSize, false, true, forConvert) + "<RP>)</RP></RT></RUBY>";
			}
		}
	}
	
	// 후리가나 이후 나머지 (일반적으로 여기만 돌아감)
	// <FONT> 태그 바깥 쪽 정크 덜 생기도록 잡아주기
	// ...이게 아닌가? 필요 없나? 아래에 잘못 짠 게 문제였나?
	if (checkFont && false) {
		{
			let fc = null;
			let fAttrs = [];
			let fLength = 0;
			for (let i = rubyEnd; i < attrs.length; i++) {
				const attr = attrs[i];
				if (attr.fc != fc) {
					if (fLength == 0) {
						for (let j = 0; j < fAttrs.length; j++) {
							fAttrs.fc = null;
						}
					}
					fc = attr.fc;
					fAttrs = [];
					fLength = 0;
				}
				fAttrs.push(attr);
				fLength += attr.text.length;
			}
		}
	}
	for (let i = rubyEnd; i < attrs.length; i++) {
		const attr = attrs[i];
		
		// 가장 바깥에서 감쌀 수 있는 태그 찾기
		let bLen      = 0; if (attr.b     ) for (bLen      = 1; i + bLen      < attrs.length; bLen++     ) { if (!attrs[i + bLen     ].b) break; }
		let iLen      = 0; if (attr.i     ) for (iLen      = 1; i + iLen      < attrs.length; iLen++     ) { if (!attrs[i + iLen     ].i) break; }
		let uLen      = 0; if (attr.u     ) for (uLen      = 1; i + uLen      < attrs.length; uLen++     ) { if (!attrs[i + uLen     ].u) break; }
		let sLen      = 0; if (attr.s     ) for (sLen      = 1; i + sLen      < attrs.length; sLen++     ) { if (!attrs[i + sLen     ].s) break; }
		let fsLen = 0;
		if (attr.fs) {
			fsLen = 1;
			let tLen = 0;
			for (let j = 0; i + j < attrs.length; j++) {
				const sAttr = attrs[i + j];
				if (!sAttr.fs) {
					// 속성이 사라지면 끊기
					if (tLen == 0) {
						// 실제 쓰인 게 없으면 무시
						fsLen = 0;
					}
					break;
				}
				if (sAttr.fs == attr.fs) {
					// 속성이 같은 게 있으면 감싸지는 걸로 처리
					fsLen = j + 1;
				}
				// 실제로 해당 속성이 쓰인 문자열 길이 확인
				tLen += sAttr.text.length;
			}
		}
		let fnLen = 0;
		if (attr.fn) {
			fnLen = 1;
			let tLen = 0;
			for (let j = 0; i + j < attrs.length; j++) {
				const sAttr = attrs[i + j];
				if (!sAttr.fn) {
					if (tLen == 0) fnLen = 0;
					break;
				}
				if (sAttr.fn == attr.fn) fnLen = j + 1;
				tLen += sAttr.text.length;
			}
		}
		let fcLen = 0;
		if (attr.fc) {
			fcLen = 1;
			let tLen = 0;
			for (let j = 0; i + j < attrs.length; j++) {
				const sAttr = attrs[i + j];
				if (!sAttr.fc) {
					if (tLen == 0) fcLen = 0;
					break;
				}
				if (sAttr.fc == attr.fc) fcLen = j + 1;
				tLen += sAttr.text.length;
			}
		}
		let useAss = false;
		let assLen = 0;
		if (forConvert && attr.ass) {
			useAss = true;
			assLen = 1;
			let tLen = 0;
			for (let j = 0; i + j < attrs.length; j++) {
				const sAttr = attrs[i + j];
				if (!sAttr.ass) {
					break;
				}
				if (sAttr.ass == attr.ass) assLen = j + 1;
				tLen += sAttr.text.length;
			}
		}
		/*
		let fsLen     = 0; if (attr.fs    ) for (fsLen     = 1; i + fsLen     < attrs.length; fsLen++    ) { if (!attrs[i + fsLen    ].fs) break; }
		let fnLen     = 0; if (attr.fn    ) for (fnLen     = 1; i + fnLen     < attrs.length; fnLen++    ) { if (!attrs[i + fnLen    ].fn) break; }
		let fcLen     = 0; if (attr.fc    ) for (fcLen     = 1; i + fcLen     < attrs.length; fcLen++    ) { if (!attrs[i + fcLen    ].fc) break; }
		*/
		let fadeLen   = 0; if (attr.fade  ) for (fadeLen   = 1; i + fadeLen   < attrs.length; fadeLen++  ) { if (!attrs[i + fadeLen  ].fade) break; }
		let shakeLen  = 0; if (attr.shake ) for (shakeLen  = 1; i + shakeLen  < attrs.length; shakeLen++ ) { if (!attrs[i + shakeLen ].shake) break; }
		let typingLen = 0; if (attr.typing) for (typingLen = 1; i + typingLen < attrs.length; typingLen++) { if (!attrs[i + typingLen].typing) break; }
		
		let len = 0;
		let limit = 1;
		let tag = null;
		let font = [];
		if (sLen      >= limit) { limit = len = sLen     ; tag = "S"; }
		if (uLen      >= limit) { limit = len = uLen     ; tag = "U"; }
		if (iLen      >= limit) { limit = len = iLen     ; tag = "I"; }
		if (bLen      >= limit) { limit = len = bLen     ; tag = "B"; }
		if (fsLen     >= limit) { limit = len = fsLen    ; tag = "FONT"; font.push("fs") }
		if (fnLen     >= limit) { tag = "FONT"; (fnLen     > len) ? (font = ["fn"    ]) : font.push("fn"    ); limit = len = fnLen    ; }
		if (fcLen     >= limit) { tag = "FONT"; (fcLen     > len) ? (font = ["fc"    ]) : font.push("fc"    ); limit = len = fcLen    ; }
		if (fadeLen   >= limit) { tag = "FONT"; (fadeLen   > len) ? (font = ["fade"  ]) : font.push("fade"  ); limit = len = fadeLen  ; }
		if (shakeLen  >= limit) { tag = "FONT"; (shakeLen  > len) ? (font = ["shake" ]) : font.push("shake" ); limit = len = shakeLen ; }
		if (typingLen >= limit) { tag = "FONT"; (typingLen > len) ? (font = ["typing"]) : font.push("typing"); limit = len = typingLen; }
		if (len == 0) {
			if (useAss) {
				limit = len = assLen;
				tag = "FONT";
				(assLen > len) ? (font = ["ass"]) : font.push("ass");
			} else {
				len = 1;
			}
		}
		
		const subAttrs = [];
		for (let j = 0; j < len; j++) {
			subAttrs.push(attrs[i + j].clone());
		}
		
		if (tag) {
			let opener = "<" + tag + ">";
			let closer = "</" + tag + ">";
			
			switch (tag) {
				case "S": {
					for (let j = 0; j < len; j++) { subAttrs[j].s = false; }
					break;
				}
				case "U": {
					for (let j = 0; j < len; j++) { subAttrs[j].u = false; }
					break;
				}
				case "I": {
					for (let j = 0; j < len; j++) { subAttrs[j].i = false; }
					break;
				}
				case "B": {
					for (let j = 0; j < len; j++) { subAttrs[j].b = false; }
					break;
				}
				case "FONT": {
					opener = "<FONT";

					// TODO: 정말 <FONT> 태그를 생성해야 하는 유의미한 값인지 내용물 재확인 필요?

					for (let k = 0; k < font.length; k++) {
						const key = font[k];
						switch (key) {
							case "fs"    : {
								if (fontSize) {
									opener += " style=\"font-size: " + (attr.fs / fontSize * 100) + "%;\"";
								} else {
									opener += " size=\"" + attr.fs + "\"";
								}
								break;
							}
							case "fn"    : { opener += " face=\""   + attr.fn + "\""; break; }
							case "fc"    : { opener += " color=\""  + Smi.colorFromAttr(attr.fc) + "\""; break; }
							case "fade"  : { opener += " fade=\""   + (attr.fade == 1 ? "in" : (attr.fade == -1 ? "out" : attr.fade)) + "\""; break; }
							case "shake" : { opener += " shake=\""  + attr.shake.ms + "," + attr.shake.size + "\""; break; }
							case "typing": { opener += " typing=\"" + Typing.Mode.toString[attr.typing.mode] + "(" + attr.typing.start + "," + attr.typing.end + ") " + Typing.Cursor.toString[attr.typing.cursor] + "\""; break; }
							case "ass"   : { opener += " ass=\""    + attr.ass + "\""; break; }
						}
					}
					opener += ">";
					
					for (let j = 0; j < len; j++) {
						for (let k = 0; k < font.length; k++) {
							if (attr[font[k]] == subAttrs[j][font[k]]) {
								subAttrs[j][font[k]] = null;
							}
						}
					}
					break;
				}
			}
			
			text += opener + Smi.fromAttrs(subAttrs, fontSize, false, false, forConvert) + closer;
			
		} else {
			// 태그 모두 상위에서 처리하고 텍스트만 남음
			text += attr.text;
		}
		
		i = i + len - 1;
	}
	
	return text;
}

Smi.prototype.toSync = function() {
	return new SyncAttr(this.start, null, this.syncType, null, this.toAttrs(), this);
}
Smi.prototype.fromSync = function(sync) {
	this.start = sync.start;
	this.syncType = sync.startType;
	this.fromAttrs(sync.text);
	return this;
}

Smi.getLineWidth = (text) => {
	return Subtitle.Width.getWidth(Smi.toAttrs(text));
}

Smi.Color = Subtitle.Color;

// 여기선 forConvert를 앞으로 가져옴
Smi.prototype.normalize = function(end, forConvert=false, withComment=false, fps=null) {
	if (fps == null) {
		fps = Subtitle.video.FR / 1000;
	}
	
	const smi = this;
	const smiText = this.text;
	const attrs = this.toAttrs();
	
	// 그라데이션 먼저 글자 단위 분해
	let hasGradation = false;
	for (let j = 0; j < attrs.length; j++) {
		const attr = attrs[j];
		
		const gc = (attr.fc.length == 15)
			&& (attr.fc[0] == '#')
			&& (attr.fc[7] == '~')
			&& (attr.fc[8] == '#');
		const gf = (attr.fade.length == 15)
			&& (attr.fade[0] == '#')
			&& (attr.fade[7] == '~')
			&& (attr.fade[8] == '#');
		
		if (gc || gf) {
			hasGradation = true;
			
			const cFrom = gc ? attr.fc.substring(0,  7) : (attr.fc ? attr.fc : "#ffffff");
			const cTo   = gc ? attr.fc.substring(8, 15) : (attr.fc ? attr.fc : "#ffffff");
			const color = new Color(cTo, cFrom);
			
			const newAttrs = [];
			for (let k = 0; k < attr.text.length; k++) {
				const newAttr = new Attr(attr);
				newAttr.fc = color.get(k, attr.text.length - 1);
				newAttr.text = attr.text[k];
				newAttrs.push(newAttr);
			}
			if (gf) {
				const fFrom = attr.fade.substring(0,  7);
				const fTo   = attr.fade.substring(8, 15);
				const fColor = new Color(fTo, fFrom);
				for (let k = 0; k < newAttrs.length; k++) {
					newAttrs[k].fade = fColor.smi(k, newAttrs.length - 1);
				}
			}
			const after = attrs.slice(j + 1);
			
			attrs.length = j;
			attrs.push(...newAttrs);
			attrs.push(...after);
			j += newAttrs.length - 1;
			smi.fromAttrs(attrs, forConvert);
		}
	}
	
	let hasFade = false;
	let hasTyping = false;
	let shakeRange = null;
	for (let j = 0; j < attrs.length; j++) {
		const attr = attrs[j];
		if (attr.fade != 0) {
			hasFade = true;
		}
		if (attr.typing) {
			hasTyping = true;
		}
		if (attr.shake) {
			// 흔들기는 연속된 그룹으로 처리
			if (!shakeRange) {
				shakeRange = [j, j+1];
			} else if (shakeRange[1] == j) {
				shakeRange[1]++;
			}
		}
	}

	const smis = [];
	if (shakeRange) {
		// 흔들기는 한 싱크에 하나만 가능
		const shake = attrs[shakeRange[0]].shake;
		for (let j = shakeRange[0]; j < shakeRange[1]; j++) {
			attrs[j].shake = null;
			if (attrs[j].furigana) {
				attrs[j].furigana.shake = null;
			}
		}
		attrs[shakeRange[0]  ].text = "{SL}" + attrs[shakeRange[0]].text;
		attrs[shakeRange[1]-1].text = attrs[shakeRange[1]-1].text + "{SR}";
		for (let j = shakeRange[0]; j < shakeRange[1]; j++) {
			if (attrs[j].text.indexOf("\n") >= 0) {
				attrs[j].text = attrs[j].text.split("\n").join("{SR}\n{\SL}");
			}
		}
		
		const start = smi.start;
		const count = Math.floor(((end - start) / shake.ms) + 0.5);
		
		let j = shakeRange[0] - 1;
		for (; j >= 0; j--) {
			const text = attrs[j].text;
			const brIndex = text.lastIndexOf("\n");
			if (brIndex >= 0) {
				attrs[j].text = text.substring(0, brIndex + 1) + "{ST}" + text.substring(brIndex + 1);
				break;
			}
		}
		if (j < 0) {
			attrs[0].text = "{ST}" + attrs[0].text;
		}
		for (j = shakeRange[1]; j < attrs.length; j++) {
			const text = attrs[j].text;
			const brIndex = text.indexOf("\n");
			if (brIndex >= 0) {
				attrs[j].text = text.substring(0, brIndex) + "{SB}" + text.substring(brIndex);
				break;
			}
		}
		if (j >= attrs.length) {
			attrs[attrs.length - 1].text = attrs[attrs.length - 1].text + "{SB}";
		}
		
		// 페이드 효과 추가 처리
		const fadeColors = [];
		if (hasFade) {
			for (let j = 0; j < attrs.length; j++) {
				const attr = attrs[j];
				attr.tagString = null;
				if (attr.fade != 0) {
					fadeColors.push(new Color(attr.fade, ((attr.fc.length == 6) ? attr.fc : "ffffff"), j));
					attr.fade = 0;
				}
				if (attr.furigana) {
					const furi = attr.furigana;
					if (furi.fade != 0) {
						fadeColors.push(new Color(furi.fade, ((furi.fc.length == 6) ? furi.fc : "ffffff"), -1-j));
						furi.fade = 0;
					}
				}
			}
			if (fadeColors.length == 0) {
				return [smi];
			}
		} else {
			// 페이드 없어도 tagString은 빼줘야 함
			for (let j = 0; j < attrs.length; j++) {
				attrs[j].tagString = null;
			}
		}
		
		// 좌우로 흔들기
		// 플레이어에서 사이즈 미지원해도 좌우로는 흔들리도록
		const LRmin = "<font size=\"" + (3 * shake.size) + "\"></font>";
		const LRmid = "<font size=\"" + (3 * shake.size) + "\"> </font>";
		const LRmax = "<font size=\"" + (3 * shake.size) + "\">  </font>";
		
		// 상하로 흔들기
		// 플레이어에서 사이즈 미지원하면 상하로 흔들리지 않음
		// size 0은 리스크가 있으므로 +1
		const TBmin = "<font size=\"" + (0 * shake.size + 1) + "\">　</font>";
		const TBmid = "<font size=\"" + (1 * shake.size + 1) + "\">　</font>";
		const TBmax = "<font size=\"" + (2 * shake.size + 1) + "\">　</font>";
		
		for (let j = 0; j < count; j++) {
			/*
			 * ５０３
			 * ２※６
			 * ７４１
			 */
			const step = j % 8;
			
			// 페이드 효과 추가 처리
			for (let k = 0; k < fadeColors.length; k++) {
				const color = fadeColors[k];
				((color.index < 0) ? attrs[-1 - color.index].furigana : attrs[color.index]).fc = color.get(1 + 2 * j, 2 * count);
			}
			let text = Smi.fromAttrs(attrs).split("\n").join("<br>");
			
			// 좌우로 흔들기
			switch (step) {
				case 2:
				case 5:
				case 7:
					text = text.split("{SL}").join(LRmin).split("{SR}").join(LRmax);
					break;
				case 0:
				case 4:
					text = text.split("{SL}").join(LRmid).split("{SR}").join(LRmid);
					break;
				default:
					text = text.split("{SL}").join(LRmax).split("{SR}").join(LRmin);
			}
			
			// 상하로 흔들기
			switch (step) {
				case 0:
				case 3:
				case 5:
					text = text.split("{ST}").join(TBmin + "<br>").split("{SB}").join("<br>" + TBmax);
					break;
				case 2:
				case 6:
					text = text.split("{ST}").join(TBmid + "<br>").split("{SB}").join("<br>" + TBmid);
					break;
				default:
					text = text.split("{ST}").join(TBmax + "<br>").split("{SB}").join("<br>" + TBmin);
			}
			
			smis.push(new Smi((start * (count - j) + end * (j)) / count, (j == 0 ? smi.syncType : SyncType.inner), text));
		}
		if (withComment) {
			smis[0].text = "<!-- End=" + end + "\n" + smiText.split("<").join("<​").split(">").join("​>") + "\n-->\n" + smis[0].text;
		}

	} else if (hasTyping) {
		// 타이핑은 한 싱크에 하나만 가능
		let attrIndex = -1;
		let attr = null;
		let isLastAttr = false;
		for (let j = 0; j < attrs.length; j++) {
			if (!attr) {
				// 타이핑 찾기 전
				if (attrs[j].typing != null) {
					attr = attrs[(attrIndex = j)];
					let remains = "";
					for (let k = j + 1; k < attrs.length; k++) {
						remains += attrs[k].text;
					}
					isLastAttr = (remains.length == 0) || (remains[0] == "\n");
					if (!isLastAttr) {
						let length = 0;
						for (let k = j + 1; k < attrs.length; k++) {
							length += attrs[k].text.length;
						}
						isLastAttr = (length == 0);
					}
				}
			} else {
				// 타이핑 찾은 후 나머지에 대해 타이핑 제거
				attrs[j].typing = null;
			}
			// 태그 원본도 신뢰할 수 없음
			attrs[j].tagString = null;
		}
		if (attr == null) {
			return [smi];
		}
		
		const types = Typing.toType(attr.text, attr.typing.mode, attr.typing.cursor);
		const widths = [];
		{	const attrTexts = attr.text.split("\n");
			for (let j = 0; j < attrTexts.length; j++) {
				widths.push(Smi.getLineWidth(attrTexts[j]));
			}
		}

		const start = smi.start;
		const count = types.length - attr.typing.end - attr.typing.start;
		
		if (count < 1) {
			return [smi];
		}

		const typingStart = attr.typing.start;
		attr.typing = null;

		// 페이드 효과 추가 처리
		const fadeColors = [];
		if (hasFade) {
			for (let j = 0; j < attrs.length; j++) {
				const attr = attrs[j];
				if (attr.fade != 0) {
					fadeColors.push(new Color(attr.fade, ((attr.fc.length == 6) ? attr.fc : "ffffff"), j));
					attr.fade = 0;
				}
				if (attr.furigana) {
					const furi = attr.furigana;
					if (furi.fade != 0) {
						fadeColors.push(new Color( furi.fade, ((furi.fc.length == 6) ? furi.fc : "ffffff"), -1-j));
						furi.fade = 0;
					}
				}
			}
			if (fadeColors.length == 0) {
				return [smi];
			}
		}
		
		// 10ms 미만 간격이면 팟플레이어에서 겹쳐서 나오므로 적절히 건너뛰기
		// TODO: ... 현재는 holdsToText 거칠 경우 뭉치는 것 교정해줄 듯?
		const countLimit = Math.min(count, Math.floor((end - start) / 10));
		let realJ = 0;
		
		for (let j = 0; j < count; j++) {
			const sync = (start * (count - j) + end * (j)) / count;
			const limitSync = (countLimit < count) ? ((start * (countLimit - realJ) + end * (realJ)) / countLimit) : sync;
			if (sync < limitSync) {
				continue;
			}
			
			const textLines = types[j + typingStart].split("\n");
			const text = textLines.join("<br>");
			{
				const attrTextLines = [];
				for (let k = 0; k < widths.length; k++) {
					if (k < textLines.length - 1) {
						// 건너뛰기
					} else if (k == textLines.length - 1) {
						attrTextLines.push(Subtitle.Width.getAppendToTarget(Smi.getLineWidth(textLines[k]), widths[k]));
					} else {
						attrTextLines.push(Subtitle.Width.getAppendToTarget(0, widths[k]));
					}
				}
				attr.text = attrTextLines.join("​\n​");
				if (isLastAttr) {
					attr.text += "​";
				}
			}
			const newAttrs = new Smi(null, null, text).toAttrs(false);
			for (let k = 0; k < newAttrs.length; k++) {
				newAttrs[k].b = attr.b;
				newAttrs[k].i = attr.i;
				newAttrs[k].s = attr.s;
				newAttrs[k].fc = attr.fc;
				newAttrs[k].fn = attr.fn;
				newAttrs[k].fs = attr.fs;
			}
			
			// 페이드 효과 추가 처리
			for (let k = 0; k < fadeColors.length; k++) {
				const color = fadeColors[k];
				((color.index < 0) ? attrs[-1 - color.index].furigana : attrs[color.index]).fc = color.get(1 + 2 * j, 2 * count);
			}
			
			const tAttrs = attrs.slice(0, attrIndex);
			tAttrs.push(...newAttrs);
			tAttrs.push(attr);
			tAttrs.push(...attrs.slice(attrIndex + 1));
			
			smis.push(new Smi(limitSync, (j == 0 ? smi.syncType : SyncType.inner)).fromAttrs(tAttrs, forConvert));
			realJ++;
		}
		if (withComment) {
			smis[0].text = "<!-- End=" + end + "\n" + smiText.split("<").join("<​").split(">").join("​>") + "\n-->\n" + smis[0].text;
		}
		
	} else if (!forConvert && hasFade) {
		const start = smi.start;
		const count = Math.round((end - start) * fps / 1000);
		
		const fadeColors = [];
		for (let j = 0; j < attrs.length; j++) {
			const attr = attrs[j];
			attr.tagString = null;
			if (attr.fade != 0) {
				fadeColors.push(new Color(attr.fade, ((attr.fc.length == 6) ? attr.fc : "ffffff"), j));
				attr.fade = 0;
			}
			if (attr.furigana) {
				const furi = attr.furigana;
				if (furi.fade != 0) {
					fadeColors.push(new Color(furi.fade, ((furi.fc.length == 6) ? furi.fc : "ffffff"), -1-j));
					furi.fade = 0;
				}
			}
		}
		if (fadeColors.length == 0) {
			return [smi];
		}
		
		for (let j = 0; j < fadeColors.length; j++) {
			const color = fadeColors[j];
			((color.index < 0) ? attrs[-1 - color.index].furigana : attrs[color.index]).fc = color.get(1, 2 * count);
		}
		smis.push(new Smi(start).fromAttrs(attrs));
		
		for (let j = 1; j < count; j++) {
			for (let k = 0; k < fadeColors.length; k++) {
				const color = fadeColors[k];
				((color.index < 0) ? attrs[-1 - color.index].furigana : attrs[color.index]).fc = color.get(1 + 2 * j, 2 * count);
			}
			smis.push(new Smi((start * (count - j) + end * j) / count, SyncType.inner).fromAttrs(attrs));
		}
		if (withComment) {
			smis[0].text = "<!-- End=" + end + "\n" + smiText.split("<").join("<​").split(">").join("​>") + "\n-->\n" + smis[0].text;
		}
		
	} else {
		if (hasGradation) {
			// 주석 추가
			if (withComment) {
				this.text = "<!-- End=" + end + "\n" + smiText.split("<").join("<​").split(">").join("​>") + "\n-->\n" + this.text;
			}
		}
		smis.push(this);
	}
	
	return smis;
}
// 여기선 forConvert를 뒤로 뺌
Smi.normalize = (smis, withComment=false, fps=null, forConvert=false) => {
	if (fps == null) {
		fps = Subtitle.video.FR / 1000;
	}
	const origin = new SmiFile();
	origin.body = smis;
	origin.fromText(origin.toText());
	const result = {
			origin: origin.body
		,	result: smis
		,	logs: []
	};
	let added = 0;
	
	// 중간 싱크 재계산
	let startIndex = -1;
	for (let i = 1; i < smis.length; i++) {
		if (smis[i].syncType == SyncType.inner) {
			if (startIndex < 0) {
				startIndex = i - 1;
			}
		} else {
			if (startIndex >= 0) {
				const endIndex = i;
				const startSync = smis[startIndex].start;
				const endSync   = smis[endIndex  ].start;
				const count = endIndex - startIndex;

				for (let j = 1; j < count; j++) {
					smis[startIndex + j].start = Math.round(((count - j) * startSync + j * endSync) / count);
				}
				startIndex = -1;
			}
		}
	}
	
	for (let i = 0; i < smis.length - 1; i++) {
		const start = smis[i].start;
		const end = smis[i + 1].start;
		const nSmis = smis[i].normalize(end, forConvert, withComment, fps);
		
		if (nSmis.length > 1) {
			const nextSmis = smis.slice(i + 1);
			smis.length = i;
			smis.push(...nSmis);
			smis.push(...nextSmis);
			
			// TODO: 다시 보니 combine 작업 있으면 logs 날리나...?
			// 이거 없어도 주석 처리는 해버리는 것 같은데...?
			result.logs.push({
				from: [i - added, i - added + 1]
			,	to  : [i, i + nSmis.length]
			,	start: start
			,	end: end
			});
			const add = nSmis.length - 1;
			i += add;
			added += add;
			
		} else {
			smis[i] = nSmis[0];
		}
	}
	
	return result;
}
Smi.fillEmptySync = (smis) => {
	for (let i = 0; i < smis.length - 1; i++) {
		const smi = smis[i];
		
		const lines = smi.text.split("\r\n").join("\n").split('\n');
		if (lines.length < 2) {
			// 한 줄이면 필요 없음
			continue;
		}
		
		const start = smi.start;
		const end = smis[i + 1].start;
		const length = lines.length;
		
		smi.text = lines[0];
		for (let j = 1; j < length; j++) {
			smis.splice(i + j, 0, new Smi((start * (length - j) + end * j) / length, SyncType.inner, lines[j]));
		}
	}
}
window.SmiFile = Subtitle.SmiFile = function(text) {
	this.header = ""; // 세부적으로 나누려다가 주석도 있고 해서 일단 패스
	this.footer = "";
	this.body = [];
	if (text) {
		this.fromText(this.text = text);
	}
}
SmiFile.prototype.toTxt = // 처음에 함수명 잘못 지은 걸 레거시 호환으로 일단 유지함
SmiFile.prototype.toText = function() {
	return this.text
	   = ( this.header.split("\r\n").join("\n")
	     + Smi.smi2txt(this.body)
	     + this.footer.split("\r\n").join("\n")
	     ).trim();
}
Smi.getSyncType = function(syncLine) {
	switch (syncLine[syncLine.length - 2]) {
		case ' ':
			if (syncLine[syncLine.length - 3] == ' ') {
				return SyncType.split;
			} else {
				return SyncType.frame;
			}
			break;
		case '\t':
			return SyncType.inner;
			break;
	}
	return SyncType.normal;
}
SmiFile.prototype.fromTxt = // 처음에 함수명 잘못 지은 걸 레거시 호환으로 일단 유지함
SmiFile.prototype.fromText = function(text) {
	text = (this.text = text).split("\r\n").join("\n");
	this.header = "";
	this.footer = "";
	this.body = [];
	
	let index = 0;
	let pos = 0;
	let last = null;
	
	while ((pos = text.indexOf('<', index)) >= 0) {
		if (text.length > pos + 6 && text.substring(pos, pos + 6).toUpperCase() == ("<SYNC ")) {
			if (last == null) {
				this.header = text.substring(0, pos);
			} else {
				last.text += text.substring(index, pos);
			}

			let start = 0;
			index = text.indexOf('>', pos + 6) + 1;
			if (index == 0) {
				index = text.length;
				break;
			}
			const attrs = text.substring(pos + 6, index - 1).toLowerCase().split(' ');
			for (let i = 0; i < attrs.length; i++) {
				const attr = attrs[i];
				if (attr.substring(0, 6) == ("start=")) {
					start = Number(attr.substring(6));
					break;
				}
			}

			this.body.push(last = new Smi(start));
			
		} else if (text.length > pos + 4 && text.substring(pos, pos + 3).toUpperCase() == ("<P ")) {
			const endOfP = text.indexOf('>', pos + 3) + 1;
			if (last == null) {
				this.header = text.substring(0, pos);
			} else {
				// last.text가 있음 -> <P> 태그가 <SYNC> 태그 바로 뒤에 붙은 게 아님 - 별도 텍스트로 삽입
				last.text += text.substring(index, last.text ? endOfP : pos);
			}
			index = endOfP;
			if (index == 0) {
				index = text.length;
				break;
			}
			last.syncType = Smi.getSyncType(text.substring(pos, index));
			
		} else if (text.length > pos + 6 && text.substring(pos, pos + 7).toUpperCase() == ("</BODY>")) {
			if (last == null) {
				this.header = text.substring(0, pos);
				last = { text: "" }; // 아래에서 헤더에 중복으로 추가되지 않도록 함
			} else {
				last.text += text.substring(index, pos);
			}
			this.footer = text.substring(pos);
			index = text.length;
			break;
			
		} else {
			pos++;
			if (last == null) {
				this.header = text.substring(0, pos);
			} else {
				last.text += text.substring(index, pos);
			}
			index = pos;
		}
	}

	if (last == null) {
		this.header = text.substring(0);
	} else {
		last.text += text.substring(index);
	}
	
	for (let i = 0; i < this.body.length; i++) {
		const smi = this.body[i];
		if (smi.text.length > 0) {
			if (smi.text[0] == '\n') {
				smi.text = smi.text.substring(1);
			}
			if (smi.text.length > 1 && smi.text[smi.text.length - 1] == '\n') {
				smi.text = smi.text.substring(0, smi.text.length - 1);
			}
		}
	}
	
	return this;
}

SmiFile.prototype.toSync = // 처음에 함수명 잘못 지은 걸 레거시 호환으로 일단 유지함
SmiFile.prototype.toSyncs = function() {
	const result = [];

	if (this.body.length > 0) {
		// TODO: normalize 작업 필요??
		// 단순 페이드는 예외 처리
		// origin은 어떻게?
		
		let i = 0;
		let last = null;
		for (; i + 1 < this.body.length; i++) {
			if (this.body[i].text.split("&nbsp;").join("").length == 0) {
				continue;
			}
			
			const item = this.body[i];
			const next = this.body[i + 1];
			const end = (next.start) > 0 ? next.start : 0;
			const normalized = item.normalize(end, true);
			for (let j = 0; j < normalized.length - 1; j++) {
				const sync = normalized[j].toSync();
				sync.end = normalized[j + 1].start;
				sync.endType = normalized[j + 1].syncType;
				sync.origin = this.body[i];
				result.push(sync);
			}
			last = normalized[normalized.length - 1].toSync();
			last.end = end;
			last.endType = next.syncType;
			result.push(last);
			/*
			last = this.body[i].toSync();
			last.end = (this.body[i + 1].start > 0 ? this.body[i + 1].start : 0);
			last.endType = this.body[i + 1].syncType;
			result.push(last);
			*/
		}
		if (this.body[i].text.split("&nbsp;").join("").length > 0) {
			result.push(last = this.body[i].toSync());
		}
	}

	return result;
}
SmiFile.prototype.fromSync = // 처음에 함수명 잘못 지은 걸 레거시 호환으로 일단 유지함
SmiFile.prototype.fromSyncs = function(syncs) {
	const smis = [];

	if (syncs.length > 0) {
		let i = 0;
		let last = null;
		smis.push(new Smi().fromSync(syncs[i]));
		smis.push(last = new Smi(syncs[i].end, syncs[i].endType, "&nbsp;"));
		
		for (i = 1; i < syncs.length; i++) {
			if (last.start == syncs[i].start) {
				last.fromAttrs(syncs[i].text);
			} else {
				smis.push(new Smi().fromSync(syncs[i]));
			}

			smis.push(last = new Smi(syncs[i].end, syncs[i].endType, "&nbsp;"));
		}
	}

	this.body = smis;
	return this;
}

const DefaultStyle = Subtitle.DefaultStyle = {
		Fontname: ""
	,	Fontsize: 80
	,	PrimaryColour  : "#FFFFFF"
	,	SecondaryColour: "#FF0000"
	,	OutlineColour  : "#000000"
	,	BackColour     : "#000000"
	,	PrimaryOpacity  : 255
	,	SecondaryOpacity: 255
	,	OutlineOpacity  : 255
	,	BackOpacity     : 255
	,	Bold     : true
	,	Italic   : false
	,	Underline: false
	,	StrikeOut: false
	,	ScaleX: 100
	,	ScaleY: 100
	,	Spacing: 0
	,	Angle: 0
	,	BorderStyle: false
	,	Outline: 4
	,	Shadow: 0
	,	Alignment: 2
	,	MarginL: 64
	,	MarginR: 64
	,	MarginV: 40
	,	output: 3 // 0b01: SMI / 0b10: ASS / 0b11: SMI+ASS
};
SmiFile.toSaveStyle = function(style) {
	if (!style) return "";
	
	let forSmi = false;
	for (let i = 0; i < styleForSmi.length; i++) {
		const name = styleForSmi[i];
		if (style[name] != DefaultStyle[name]) {
			forSmi = true;
			break;
		}
	}
	let forAss = false;
	for (let i = 0; i < styleForAss.length; i++) {
		const name = styleForAss[i];
		if (style[name] != DefaultStyle[name]) {
			if (name == "Fontsize" && style.Fontsize == 0) {
				// 글씨크기 0은 ASS 출력 제외를 위한 속성
				continue;
			}
			forAss = true;
			break;
		}
	}
	
	const result = [];
	if (forAss) {
		result.push(style.Fontname);
		result.push(style.Fontsize);
		{ let fc = style.PrimaryColour   + (511 - style.PrimaryOpacity  ).toString(16).substring(1).toUpperCase(); result.push("&H"+fc[7]+fc[8]+fc[5]+fc[6]+fc[3]+fc[4]+fc[1]+fc[2]); }
		{ let fc = style.SecondaryColour + (511 - style.SecondaryOpacity).toString(16).substring(1).toUpperCase(); result.push("&H"+fc[7]+fc[8]+fc[5]+fc[6]+fc[3]+fc[4]+fc[1]+fc[2]); }
		{ let fc = style.OutlineColour   + (511 - style.OutlineOpacity  ).toString(16).substring(1).toUpperCase(); result.push("&H"+fc[7]+fc[8]+fc[5]+fc[6]+fc[3]+fc[4]+fc[1]+fc[2]); }
		{ let fc = style.BackColour      + (511 - style.BackOpacity     ).toString(16).substring(1).toUpperCase(); result.push("&H"+fc[7]+fc[8]+fc[5]+fc[6]+fc[3]+fc[4]+fc[1]+fc[2]); }
		result.push(style.Bold      ? -1 : 0);
		result.push(style.Italic    ? -1 : 0);
		result.push(style.Underline ? -1 : 0);
		result.push(style.StrikeOut ? -1 : 0);
		result.push(style.ScaleX     );
		result.push(style.ScaleY     );
		result.push(style.Spacing    );
		result.push(style.Angle      );
		result.push(style.BorderStyle ? 3 : 1);
		result.push(style.Outline    );
		result.push(style.Shadow     );
		result.push(style.Alignment  );
		result.push(style.MarginL    );
		result.push(style.MarginR    );
		result.push(style.MarginV    );
		
	} else if (forSmi) {
		// 기본 스타일
		result.push(style.Fontname);
		result.push(style.PrimaryColour);
		result.push(style.Italic    ? 1 : 0);
		result.push(style.Underline ? 1 : 0);
		result.push(style.StrikeOut ? 1 : 0);
	}
	
	return result.join(",");
}
SmiFile.parseStyle = function(comment) {
	const style = JSON.parse(JSON.stringify(DefaultStyle));
	if (comment.startsWith("<")) {
		// 홀드 스타일 초기 문법
		const attr = Smi.toAttrs(comment)[0];
		if (attr.fn) style.Fontname = attr.fn;
		if (attr.fc) style.PrimaryColour = "#" + attr.fc;
		if (attr.i) style.Italic = true;
		if (attr.u) style.Underline = true;
		if (attr.s) style.StrikeOut = true;
	} else {
		// 홀드 스타일 현행 문법
		const infoStyle = comment.split(",");
		if (infoStyle.length == 5) {
			// 기본 스타일
			style.Fontname      = infoStyle[0];
			style.PrimaryColour = infoStyle[1];
			style.Italic    = (infoStyle[2] == 1);
			style.Underline = (infoStyle[3] == 1);
			style.StrikeOut = (infoStyle[4] == 1);
			
		} else {
			// ASS 변환용 스타일 포함
			style.Fontname = infoStyle[0];
			style.Fontsize = infoStyle[1];
			{ let fc = infoStyle[2]; style.PrimaryColour   = '#'+fc[8]+fc[9]+fc[6]+fc[7]+fc[4]+fc[5]; style.PrimaryOpacity   = 255 - Number('0x'+fc[2]+fc[3]); }
			{ let fc = infoStyle[3]; style.SecondaryColour = '#'+fc[8]+fc[9]+fc[6]+fc[7]+fc[4]+fc[5]; style.SecondaryOpacity = 255 - Number('0x'+fc[2]+fc[3]); }
			{ let fc = infoStyle[4]; style.OutlineColour   = '#'+fc[8]+fc[9]+fc[6]+fc[7]+fc[4]+fc[5]; style.OutlineOpacity   = 255 - Number('0x'+fc[2]+fc[3]); }
			{ let fc = infoStyle[5]; style.BackColour      = '#'+fc[8]+fc[9]+fc[6]+fc[7]+fc[4]+fc[5]; style.BackOpacity      = 255 - Number('0x'+fc[2]+fc[3]); }
			style.Bold      = (infoStyle[6] != 0);
			style.Italic    = (infoStyle[7] != 0);
			style.Underline = (infoStyle[8] != 0);
			style.StrikeOut = (infoStyle[9] != 0);
			style.ScaleX    = Number(infoStyle[10]);
			style.ScaleY    = Number(infoStyle[11]);
			style.Spacing   = Number(infoStyle[12]);
			style.Angle     = Number(infoStyle[13]);
			style.BorderStyle = ((Number(infoStyle[14]) & 2) != 0);
			style.Outline   = Number(infoStyle[15]);
			style.Shadow    = Number(infoStyle[16]);
			style.Alignment = Number(infoStyle[17]);
			style.MarginL   = Number(infoStyle[18]);
			style.MarginR   = Number(infoStyle[19]);
			style.MarginV   = Number(infoStyle[20]);
		}
	}
	return style;
}
SmiFile.styleToSmi = function(style) {
	let opener = "";
	let closer = "";
	
	if (style) {
		const font = [];
		if (style.Fontname) {
			font.push("face=\"" + style.Fontname + "\"");
		}
		if (style.PrimaryColour != DefaultStyle.PrimaryColour) {
			font.push("color=\"" + style.PrimaryColour + "\"");
		}
		if (font.length) {
			opener = "<font " + font.join(" ") + ">";
			closer = "</font>";
		}
	}
	if (style.Italic   ) { opener = opener + "<i>"; closer = "</i>" + closer; }
	if (style.Underline) { opener = opener + "<u>"; closer = "</u>" + closer; }
	if (style.StrikeOut) { opener = opener + "<s>"; closer = "</s>" + closer; }
	
	return [opener, closer];
}
SmiFile.prototype.normalize = function(withComment=false, fps=null) {
	const smis = [];
	smis.push(...this.body);

	let preset = null;
	{
		const lines = this.header.split("\n");
		if (lines.length >= 3
		 && (lines[0] == "<!-- Style" || lines[0] == "<!-- Preset") // 처음 개발할 때 혼용함...
		 && lines[2] == "-->") {
			preset = SmiFile.styleToSmi(SmiFile.parseStyle(lines[1].trim()));
		}
	}
	
	if (preset) {
		for (let i = 0; i < smis.length; i++) {
			const smi = smis[i];
			const text = smi.text.split("&nbsp;").join("").trim();
			if (text.length) {
				let hasText = false;
				const tags = text.split("<");
				if (tags[0]) {
					hasText = true;
				} else {
					for (let j = 1; j < tags.length; j++) {
						const tag = tags[j];
						if (tag.indexOf(">") > 0) {
							if (tag.substring(tag.indexOf(">") + 1)) {
								hasText = true;
								break;
							}
						}
					}
				}
				if (hasText) {
					smi.text = preset.join(smi.text);
					// 태그 재구성
					smi.fromAttrs(smi.toAttrs(false));
				}
			}
		}
	}
	
	const result = Smi.normalize(smis, withComment, (fps ? fps : Subtitle.video.FR / 1000));
	this.body = result.result;
	return result;
}
SmiFile.prototype.antiNormalize = function() {
	const result = [this];
	
	// 역정규화
	for (let i = 0; i < this.body.length; i++) {
		const smi = this.body[i];
		
		// 주석 시작점 찾기
		if (!smi.text.startsWith("<!-- End=")) {
			continue;
		}
		
		// 주석 끝 찾기
		const commentEnd = smi.text.indexOf("-->");
		if (commentEnd < 0) {
			continue;
		}
		
		// 주석이 여기에서 온전히 끝났을 경우
		let comment = smi.text.substring(9, commentEnd).trim();
		const afterComment = smi.text.substring(commentEnd + 3).trim();
		
		comment = comment.split("<​").join("<").split("​>").join(">");
		try {
			const index = comment.indexOf("\n");
			const syncEnd = Number(index < 0 ? comment : comment.substring(0, index));
			
			// 자동 생성 내용물 삭제하고 주석 내용물 복원
			if (index > 0) {
				comment = comment.substring(index + 1);
			}
			// 내포 홀드 분리는 원본 복원 끝나고 해야 함
			if (comment.startsWith("Hold=")) {
				continue;
			}
			
			let removeStart = i + (index < 0 ? 0 : 1);
			let removeEnd = removeStart;
			for(; removeEnd < this.body.length; removeEnd++) {
				if (this.body[removeEnd].start >= syncEnd) {
					break;
				}
			}
			if (comment.length > 6 && comment.substring(0, 6).toUpperCase() == "<SYNC ") {
				let newBody = new SmiFile(comment).body;
				if (i > 0) {
					if (!newBody  [0    ].text.split("&nbsp;").join("").trim()
					 && !this.body[i - 1].text.split("&nbsp;").join("").trim()) {
						// 메인홀드 앞쪽이 공백싱크면서 주석 내용물도 공백싱크로 시작할 경우 중복 제거
						newBody = newBody.slice(1);
					}
					newBody = this.body.slice(0, i).concat(newBody);
				}
				if (removeEnd < this.body.length
						&& !this.body[removeEnd         ].text.split("&nbsp;").join("").trim()
						&& !newBody  [newBody.length - 1].text.split("&nbsp;").join("").trim()) {
					this.body = newBody.concat(this.body.slice(removeEnd + 1));
				} else {
					this.body = newBody.concat(this.body.slice(removeEnd));
				}
				// 이중변환 재해석 필요할 수 있음
				i--;
				
			} else {
				this.body[i].text = comment;
				this.body.splice(removeStart, removeEnd - removeStart);
				i--;
			}
			
		} catch (e) {
			console.log(e);
		}
	}
	
	// 내포 홀드 분리
	for (let i = 0; i < this.body.length; i++) {
		const smi = this.body[i];
		
		// 주석 시작점 찾기
		if (!smi.text.startsWith("<!-- End=")) {
			continue;
		}
		
		// 주석 끝 찾기
		const commentEnd = smi.text.indexOf("-->");
		if (commentEnd < 0) {
			continue;
		}
		
		// 주석이 여기에서 온전히 끝났을 경우
		let comment = smi.text.substring(9, commentEnd).trim();
		const afterComment = smi.text.substring(commentEnd + 3).trim();
		
		comment = comment.split("<​").join("<").split("​>").join(">");
		try {
			const index = comment.indexOf("\n");
			const syncEnd = Number(index < 0 ? comment : comment.substring(0, index));
			
			// 자동 생성 내용물 삭제하고 주석 내용물 복원
			if (index > 0) {
				comment = comment.substring(index + 1);
			}
			// 여기선 내포 홀드만 처리함
			if (!comment.startsWith("Hold=")) {
				continue;
			}
			
			let removeEnd = i + (index < 0 ? 0 : 1);
			for(; removeEnd < this.body.length; removeEnd++) {
				if (this.body[removeEnd].start >= syncEnd) {
					break;
				}
			}
			
			let removeStart = i;
			if (removeEnd < this.body.length
					&& !this.body[removeEnd].text.split("&nbsp;").join("").trim()) {
				// 바로 다음이 공백 싱크면 내포 홀드에 포함
				removeEnd++;
			}
			const hold = new SmiFile();
			hold.body = this.body.splice(removeStart, removeEnd - removeStart);
			hold.body[0].text = afterComment;
			hold.antiNormalize();
			hold.next = this.body[removeStart];
			
			hold.name = comment = comment.substring(5);
			hold.pos = 1;
			const nameIndex = comment.indexOf("|");
			if (nameIndex) {
				try {
					hold.pos = Number(comment.substring(0, nameIndex));
				} catch (e) {
					console.log(e);
				}
				hold.name = comment.substring(nameIndex + 1);
			}
			result.push(hold);
			
			if (removeStart > 0
					&& !!this.body[removeStart - 1].text.split("&nbsp;").join("").trim()) {
				// 내포 홀드 분리 후 메인 홀드에 종료싱크 넣어줘야 하는 경우
				const newBody = this.body.slice(0, removeStart);
				newBody.push(new Smi(hold.body[0].start, hold.body[0].syncType, "&nbsp;"));
				newBody.push(...this.body.slice(removeStart));
				this.body = newBody;
			}
			i--;
			
		} catch (e) {
			console.log(e);
		}
	}
	
	return result;
}



// TODO: SRT

window.Srt = Subtitle.Srt = function(start, end, text) {
	this.start = start ? Math.round(start) : 0;
	this.end   = end   ? Math.round(end  ) : 0;
	this.text = text ? text : "";
}

Srt.prototype.toTxt = // 처음에 함수명 잘못 지은 걸 레거시 호환으로 일단 유지함
Srt.prototype.toText = function() {
	return Srt.int2Time(this.start) + "-->" + Srt.int2Time(this.end) + "\n" + this.text + "\n";
}
Srt.srt2txt = // 처음에 함수명 잘못 지은 걸 레거시 호환으로 일단 유지함
Srt.srt2text = (srts) => {
	let result = "";
	for (let i = 0; i < srts.length; i++) {
		result += srts[i].toText() + "\n";
	}
	return result;
}
// 팟플레이어에서 SRT 자막에서 태그 읽힌다고 SMI 태그 쓰는 경우가 있음
Srt.colorToAttr   = Smi.colorToAttr;
Srt.colorFromAttr = Smi.colorFromAttr
Srt.prototype.toAttr = // 처음에 함수명 잘못 지은 걸 레거시 호환으로 일단 유지함
Srt.prototype.toAttrs = function() { return Smi.toAttrs(this.text.split("\n").join("<br>")); };
Srt.prototype.fromAttr = // 처음에 함수명 잘못 지은 걸 레거시 호환으로 일단 유지함
Srt.prototype.fromAttrs = Smi.prototype.fromAttrs;

Srt.prototype.toSync = function() {
	return new SyncAttr(this.start, this.end, null, null, this.toAttrs());
}
Srt.prototype.fromSync = function(sync) {
	this.start = sync.start;
	this.end = sync.end;
	this.fromAttrs(sync.text);
	return this;
}

Srt.int2Time = (time) => {
	const h = Math.floor(time / 3600000);
	const m = Math.floor(time / 60000) % 60;
	const s = Math.floor(time / 1000) % 60;
	const ms= Math.floor(time % 1000);
	return intPadding(h) + ":" + intPadding(m) + ":" + intPadding(s) + "," + intPadding(ms, 3);
}

window.SrtFile = Subtitle.SrtFile = function(text) {
	this.body = [];
	if (text) {
		this.fromText(text);
	}
}
SrtFile.prototype.toTxt = // 처음에 함수명 잘못 지은 걸 레거시 호환으로 일단 유지함
SrtFile.prototype.toText = function() {
	const items = [];
	for (let i = 0; i < this.body.length; i++) {
		items.push((i + 1) + "\n" + this.body[i].toText());
	}
	return items.join("\n");
}
SrtFile.REG_SRT_SYNC = /^([0-9]{2}:){1,2}[0-9]{2}[,.][0-9]{2,3}( )*-->( )*([0-9]{2}:){1,2}[0-9]{2}[,.][0-9]{2,3}( )*$/;
SrtFile.prototype.fromTxt = // 처음에 함수명 잘못 지은 걸 레거시 호환으로 일단 유지함
SrtFile.prototype.fromText = function(text) {
	const lines = text.split("\r\n").join("\n").split("\n");
	const items = [];
	let last = { start: 0, end: 0, lines: [], length: 0 };
	let lastLength = 0;
	
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (line) {
			if (isFinite(line)) {
				// 숫자뿐인 대사줄 or 싱크 시작 불분명
				last.lines.push(line);
				last.length = Math.max(last.length, lastLength); // 기존 숫자뿐인 줄은 대사줄로 편입
				lastLength = last.lines.length;
				
			} else {
				if (SrtFile.REG_SRT_SYNC.test(line)) {
					// 새 싱크 시작
					last.lines.length = last.length;
					items.push(last = { start: 0, end: 0, lines: [], length: 0 });
					const syncs = line.split("-->");
					{	// 시작 싱크
						const times = syncs[0].trim().split(",").join(".").split(":");
						let start = Number(times[0]) * 60 + Number(times[1]);
						if (times.length > 2) {
							start = start * 60 + Number(times[2]);
						}
						last.start = Math.round(start * 1000);
					}
					{	// 종료 싱크
						const times = syncs[1].trim().split(",").join(".").split(":");
						let end = Number(times[0]) * 60 + Number(times[1]);
						if (times.length > 2) {
							end = end * 60 + Number(times[2]);
						}
						last.end = Math.round(end * 1000);
					}
					lastLength = 0;
					
				} else {
					// 대사줄 추가
					last.lines.push(line);
					last.length = last.lines.length;
				}
			}
		} else {
			// 공백줄 or 싱크 종료 불분명
			last.lines.push(line);
		}
	}
	last.lines.length = last.length;
	
	this.body = [];
	for (let i = 0; i < items.length; i++) {
		const item = items[i];
		this.body.push(new Srt(item.start, item.end, item.lines.join("\n")));
	}
	
	return this;
}

SrtFile.prototype.toSync = // 처음에 함수명 잘못 지은 걸 레거시 호환으로 일단 유지함
SrtFile.prototype.toSyncs = function() {
	const result = [];
	for (let i = 0; i < this.body.length; i++) {
		result.push(this.body[i].toSync());
	}
	return result;
}

SrtFile.prototype.fromSync = // 처음에 함수명 잘못 지은 걸 레거시 호환으로 일단 유지함
SrtFile.prototype.fromSyncs = function(syncs) {
	this.body = [];
	for (let i = 0; i < syncs.length; i++) {
		this.body.push(new Srt().fromSync(syncs[i]));
	}
	return this;
}
