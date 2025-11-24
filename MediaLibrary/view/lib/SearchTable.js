function onlyNumber(value) {
	if (isFinite(value)) {
		return value;
	}
	let result = "";
	for (let i = 0; i < value.length; i++) {
		const c = value[i];
		if (isFinite(c)) {
			result += c;
		}
	}
	return result;
}
/**
 * 검색 기능 포함 테이블
 * @param $area
 * @returns
 */
function SearchTable($area) {
	this.area = $area;
	this.id = SearchTable.list.length;
	SearchTable.list.push(this);
	
	this.func = $area.data("func");
	this.where = null;
	this.orderBy = null;
	this.direction = null;
	
	const self = this;
	
	$area.find("form").attr("onsubmit", "return SearchTable.list[" + this.id + "].search();").on("click", "tr:eq(0) th", function() {
		const th = $(this);
		const order = th.data("order");
		
		const area = th.parents(".table-with-search");
		area.find("th").removeClass("asc").removeClass("desc");
		
		if (order) {
			if (self.orderBy == order) {
				self.direction = (self.direction == "ASC") ? "DESC" : "ASC";
			} else {
				self.orderBy = order;
				self.direction = "ASC";
			}
		} else {
			self.orderBy = null;
			self.direction = null;
		}
		th.addClass(self.direction.toLowerCase());
		self.search();
	});
}
SearchTable.list = [];
SearchTable.prototype.search = function() {
	let obj = window;
	const keys = this.func.split(".");
	for (let i = 0; i < keys.length - 1; i++) {
		obj = obj[keys[i]];
	}
	let func = keys[keys.length - 1];
	obj[func]({ where: this.getWhere(), order: this.getOrder() });
	return false;
};
SearchTable.prototype.getWhere = function() {
	const where = [];
	const cols = [];
	this.area.find("tr:eq(0) th").each(function(i) {
		cols[i] = $(this).data("order");
	});
	
	this.area.find("input").each(function(i) {
		const input = $(this);
		const value = input.val();
		if (value) {
			const col = cols[i];
			if (col && value) {
				var isNumberOnly = col.split("$").length > 1;
				if (isNumberOnly) {
					where.push(col.split("$").join("") + "=" + onlyNumber(value));
				} else {
					where.push(col + "=" + value);
				}
			}
		}
	});
	
	return where.join("/");
}
SearchTable.prototype.getOrder = function() {
	return this.orderBy ? (this.orderBy.split("$").join("") + (this.direction ? "/" + this.direction : "")) : null;
}
SearchTable.prototype.setWidth = function() {
	this.area.find(".tb-head > table").width(this.area.find(".tb-body > table").width());
}