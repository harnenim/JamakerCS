window.ML = { dao: null };

ML.init = function() {
	const self = this;
	
	this.$form = $("#form");
	
	this.$datalists = $("#datalists");
	this.$groupList = this.$datalists.find("#groupList");
	
	this.$tabs = {}
	$(".tab-body > div").each(function() {
		const $tab = $(this);
		const id = $tab.attr("id");
		if (id && (id.indexOf("_") > 0)) {
			self.$tabs[id.substring(id.indexOf("_") + 1)] = $tab;
		}
	});
	
	this.$inputs = {};
	this.$form.find("input").each(function() {
		const $input = $(this);
		const name = $input.attr("name");
		if (name) {
			self.$inputs[name] = $input;
		}
	});
	
	this.$popupSearchMovie = $("#popupSearchMovie");
	
	this.$inputs.group.on("input change propertychange", function() {
		const group = $(this).val();
		self.$inputs.place .attr({ list: "place"  + group });
		self.$inputs.screen.attr({ list: "screen" + ($("#screen" + group).length ? group : "기타") });
	});
	new OHLI.AutoComplete(this.$inputs.movie).afterSelect = function() {
		self.$form.find("input[name=movieCd]").val(self.$inputs.movie.data("key"));
	}
	this.$inputs.movieCd.on("click", function() {
		self.$popupSearchMovie.show().find("input").val(self.$inputs.movie.val()).focus();
	});
	this.$popupSearchMovie.find("tbody").on("click", "tr", function() {
		const item = $(this).data();
		self.$inputs.movieCd.val(item.movieCd);
		self.$inputs.movie  .val(item.movieNm);
		self.$popupSearchMovie.hide();
		self.saveMovieInfo(item);
	});
	this.$form.find("#btnSave").on("click", function() {
		self.save();
	});
	this.$form.find("#btnExport").on("click", function() {
		self.saveToFile();
	});
	
	this.$tabs.watch.find(".tb-list").on("click", "tr button", function(e) {
		e.stopPropagation();
		const key = $(this).parents("tr").data("_");
		if (confirm("삭제하시겠습니까?")) {
			self.deleteWatch(key);
		};
	}).on("click", "tbody tr", function() {
		const data = $(this).addClass("on").data();
		self.clearEdit(false);
		self.setEditForm(data);
	});
	this.$tabs.calendar.find("#tbCalendar").on("click", "span", function() {
		self.setEditForm($(this).data());
	});
	
	(function() {
		const st = self.$tabs.watch.data("st");
		$(".tab-header > div:eq(0)").on("click", function() {
			st.search();
		});
	})();
	{
		$(".tab-header > div:eq(1)").on("click", function() {
			self.refreshStat();
		});
		$(".tab-header > div:eq(2)").on("click", function() {
			self.loadCalendar();
		});
	}
	(function() {
		const st = self.$tabs.movie.data("st");
		$(".tab-header > div:eq(3)").on("click", function() {
			st.search();
		});
	})();
	
	$(".tb-body").on("scroll", function() {
		const $body = $(this);
		$body.prev().scrollLeft($body.scrollLeft());
	});
	
	this.clearEdit();
}

ML.initDatalist = function(groups=[]) {
	if (!this.dao) return;
	this.$groupList.empty();
	
	const placeLists  = this.dao.getPlaceLists (groups);
	const screenLists = this.dao.getScreenLists(groups);
	
	for (let i = 0; i < groups.length; i++) {
		const group = groups[i];
		this.$groupList.append($("<option>").val(group));
		
		{	const list = placeLists[group];
			let $datalist = this.$datalists.find("#place" + group);
			if ($datalist.length) {
				$datalist.empty();
			} else {
				this.$datalists.append($datalist = $("<datalist>").attr({ id: "place" + group }));
			}
			for (let j = 0; j < list.length; j++) {
				$datalist.append($("<option>").val(list[j]));
			}
		}
		
		{	const list = screenLists[group];
			let $datalist = this.$datalists.find("#screen" + group);
			if ($datalist.length) {
				$datalist.empty();
			} else {
				this.$datalists.append($datalist = $("<datalist>").attr({ id: "screen" + group }));
			}
			for (let j = 0; j < list.length; j++) {
				$datalist.append($("<option>").val(list[j]));
			}
		}
	}
}

ML.refreshList = function(param={}) {
	if (!this.dao) return;
	const list = this.dao.getWatchList(param);
	
	const key = this.editing ? this.editing.key : 0;
	
	const $tab = this.$tabs.watch;
	const st = $tab.data("st");
	
	const $tbody = $tab.find(".tb-list > tbody").empty();
	let last = null;
	for (let i = 0; i < list.length; i++) {
		const item = list[i];
		const $tr = $("<tr>").data(item);
		if (item._ == key) {
			$tr.addClass("on");
		}
		if (last) {
			if (last.month != item.month) {
				$tr.addClass("month");
			} else if (last.date == item.date) {
				$tr.addClass("multi")
			}
		}
		last = item;
		
		$tr.append($("<td>").text(item.date + " " + item.time));
		$tr.append($("<td>").text((item.group == "other" ? "" : item.group) + " " + item.place));
		$tr.append($("<td>").text(item.screen));
		$tr.append($("<td>").text(item.movie));
		$tr.append($("<td>").text(item.movieCd));
		$tr.append($("<td>").append($("<button type='button'>").text("×")));
		$tbody.append($tr);
	}
}

ML.refreshStat = function() {
	if (!this.dao) return;
	function getValue(item, key) {
		if (!item) return "";
		const  value = item[key];
		return value ? value : "";
	}
	
	const stat = this.dao.getStat("watch", "group", GROUPS);
	
	const $table = this.$tabs.stat.find("#tbStat");
	const $tbHead = $table.find(".tb-head > table").empty();
	const $tbBody = $table.find(".tb-body > table").empty();
	
	{	const $colgroup = $("<colgroup>");
		$colgroup.append($("<col>").css("width", "60px"));
		$colgroup.append($("<col>").css("width", "50px"));
		$colgroup.append($("<col>"));
		for (let i = 0; i < stat.groups.length; i++) {
			$colgroup.append($("<col>"));
		}
		$colgroup.append($("<col>"));
		$tbHead.append($colgroup);
		$tbBody.append($colgroup.clone());
	}
	
	{	const $thead = $("<thead>");
		const $tr = $("<tr>");
		$tr.append($("<th>"));
		$tr.append($("<th>").text("월"));
		$tr.append($("<th>").text("전체"));
		for(let i = 0; i < stat.groups.length; i++) {
			$tr.append($("<th>").text(stat.groups[i]));
		}
		$tr.append($("<th>").text("기타"));
		$thead.append($tr);
		$tbHead.append($thead);
	}
	
	const $tbody = $("<tbody>");
	for(let i = 0; i < stat.years.length; i++) {
		const year = stat.years[i];
		const yItem = stat.yMap[year];
		$tbody.append($tr = $("<tr>").addClass("ny"));
		$tr.append($("<td>").text(year).attr("rowspan", 13));
		$tr.append($("<td>").text("연간"));
		$tr.append($("<td>").append(    $("<a>").text(getValue(yItem,"total")).attr("href", "javascript:ML.showStatDetail(" + year + ")")));
		for(let j = 0; j < stat.groups.length; j++) {
			const group = stat.groups[j];
			$tr.append($("<td>").append($("<a>").text(getValue(yItem, group )).attr("href", "javascript:ML.showStatDetail(" + year + ", '" + group + "')")));
		}
		$tr.append(    $("<td>").append($("<a>").text(getValue(yItem,"other")).attr("href", "javascript:ML.showStatDetail(" + year + ", 'other')")));
		
		for(let month = 12; month > 0; month--) {
			const ym = year * 100 + month;
			const mItem = stat.mMap[ym];
			$tbody.append($tr = $("<tr>"));
			$tr.append($("<td>").text(month + "월"));
			$tr.append($("<td>").append(    $("<a>").text(getValue(mItem,"total")).attr("href", "javascript:ML.showStatDetail(" + ym + ")")));
			for(let j = 0; j < stat.groups.length; j++) {
				const group = stat.groups[j];
				$tr.append($("<td>").append($("<a>").text(getValue(mItem, group )).attr("href", "javascript:ML.showStatDetail(" + ym + ", '" + group + "')")));
			}
			$tr.append(    $("<td>").append($("<a>").text(getValue(mItem,"other")).attr("href", "javascript:ML.showStatDetail(" + ym + ", 'other')")));
		}
	}
	$tbBody.append($tbody);
}
ML.showStatDetail = function(ym, group) {
	if (!this.dao) return;
	const param = { group: group };
	if (ym < 10000) {
		param.year = ym;
	} else {
		param.month = ym;
	}
	const list = this.dao.getWatchList(param);
	
	const $popup = this.$tabs.stat.find("#tbPopup");
	const $tbody = $popup.find(".tb-list tbody").empty();
	if (list) {
		let last = null;
		for(let i = 0; i < list.length; i++) {
			const item = list[i];
			const $tr = $("<tr>");
			if (last) {
				if (last.month != item.month) {
					$tr.addClass("month");
				} else if (last.date == item.date) {
					$tr.addClass("multi")
				}
			}
			last = item;
			
			$tr.append($("<td>").text(item.date + " " + item.time));
			$tr.append($("<td>").text((item.group == "other" ? "" : item.group) + " " + item.place));
			$tr.append($("<td>").text(item.screen));
			$tr.append($("<td>").text(item.movie));
			$tbody.append($tr);
		}
	}
	$popup.show();
	$popup.find(".tb-body").scrollTop(0).scrollLeft(0);
}

ML.loadCalendar = function() {
	if (!this.dao) return;
	const calendar = this.dao.getCalendar();
	
	const $tbody = this.$tabs.calendar.find("tbody").empty();
	if (calendar.begin == 0) {
		return;
	}
	const date = new Date(calendar.begin);
	let $tr = $("<tr>");
	while (date.getTime() < calendar.last) {
		if (date.getDay() == 1) {
			$tbody.append($tr = $("<tr>"));
		}
		let strDate = "" + (date.getFullYear() * 10000 + ((date.getMonth() + 1) * 100) + date.getDate());
		strDate = strDate.substring(0, 4) + '.' + strDate.substring(4, 6) + '.' + strDate.substring(6) + '.';
		const $td = $("<td>").text(strDate);
		
		const list = calendar.dateMap[strDate];
		if (list) {
			for(let i = 0; i < list.length; i++) {
				const item = list[i];
				$td.append($("<span>").data(item).text([item.time, item.movie].join(" ")));
			}
		}
		$tr.append($td);
		
		date.setTime(date.getTime() + 86400000);
	}
}
ML.setEditForm = function(item) {
	this.editing = item;
	this.$form.find("button[type=submit]").text("수정");
	this.$form.find("input[name=_]"      ).val(item._);
	this.$form.find("input[name=date]"   ).val(item.date.substring(0, 10).split(".").join("-"));
	this.$form.find("input[name=time]"   ).val(item.time   );
	this.$form.find("input[name=group]"  ).val(item.group  ).change();
	this.$form.find("input[name=place]"  ).val(item.place  );
	this.$form.find("input[name=screen]" ).val(item.screen );
	this.$form.find("input[name=movie]"  ).val(item.movie  );
	this.$form.find("input[name=movieCd]").val(item.movieCd);
}
ML.edit = function() {
	if (!this.dao) return;
	const item = {};
	item._       = this.$form.find("input[name=_]"      ).val();
	item.date    = this.$form.find("input[name=date]"   ).val().split("-").join("");
	item.time    = this.$form.find("input[name=time]"   ).val().split(":").join("");
	item.group   = this.$form.find("input[name=group]"  ).val();
	item.place   = this.$form.find("input[name=place]"  ).val();
	item.screen  = this.$form.find("input[name=screen]" ).val();
	item.movie   = this.$form.find("input[name=movie]"  ).val();
	item.movieCd = this.$form.find("input[name=movieCd]").val();
	if (item.date.length != 8) {
		alert("잘못된 날짜입니다");
		return false;
	}
	if (item.time.length == 4 && isFinite(item.time) && item.time < 10000) {
		const time = 10000 + Number(item.time) + "";
		this.$form.find("input[name=time]").val(time.substring(1,3) + ":" + time.substring(3,5));
	} else {
		alert("잘못된 시간입니다");
		return false;
	}
	
	const result = this.dao.insertOrUpdate(TABLE_WATCH, item);
	if (result.success) {
		if (item._) {
			alert("수정했습니다.");
		} else {
			alert("등록했습니다.");
			this.clearEdit();
		}
		this.$form.addClass("need-to-save");
		this.refreshTab();
	} else {
		switch (result.error) {
			case 1: {
				alert("필수값 누락: " + result.cols.join(", "));
				break;
			}
			default: {
				alert((item._ ? "수정" : "등록") + " 실패");
			}
		}
	}
	
	return false;
}
ML.clearEdit = function(withTime=true) {
	this.editing = null;
	this.$form.find("button[type=submit]").text("등록");
	this.$tabs.watch.find(".tb-list").find(".on").removeClass("on");

	this.$form.find("input").val("");
	this.$form.find("input[name=group]").change();
	if (withTime) {
		const now = new Date();
		const y  = now.getFullYear();
		const m  = now.getMonth() + 1;
		const d  = now.getDate();
		const hh = now.getHours();
		const mm = now.getMinutes();
		const date = y + "-" + (m > 9 ? "" : "0") + m + "-" + (d > 9 ? "" : "0") + d;
		const time = (hh > 9 ? "" : "0") + hh + ":" + (mm > 9 ? "" : "0") + mm;
		this.$form.find("input[name=date]").val(date);
		this.$form.find("input[name=time]").val(time);
	}
	return false;
}
ML.deleteWatch = function(key) {
	const result = this.dao.delete(TABLE_WATCH, key);
	if (result.success) {
		alert("삭제했습니다.");
		if (this.editing && (this.editing._ == key)) {
			this.clearEdit();
		}
		this.$form.addClass("need-to-save");
		this.refreshTab();
	} else {
		alert("삭제 실패");
	}
}
ML.searchMovieLocal = function(query) {
	if (!this.dao) return;
	const list = this.dao.getMovieList({ where: "movieNm=" + query });
	this.$inputs.movie.data("obj").afterSearch(query, list);
}
ML.searchMovie = function() {
	const query = $("#popupSearchMovie input").val();
	
	$.ajax({url: "/movieLog/searchMovie"
		,	data:{ query: query }
		,	success: function(result) {
				ML.afterSearchMovie(query, result.movieListResult.movieList);
			}
	})
	return false;
}
ML.afterSearchMovie = function(query, list) {
	if (!this.dao) return;
	const $tbody = this.$popupSearchMovie.find("tbody").empty();
	for(let i = 0; i < list.length; i++) {
		const item = list[i];
		{	const directors = [];
			for (let j = 0; j < item.directors.length; j++) {
				directors.push(item.directors[j].peopleNm);
			}
			item.directors = directors.join("/");
		}
		{	const companys = [];
			for (let j = 0; j < item.companys.length; j++) {
				companys.push(item.companys[j].companyNm);
			}
			item.companys = companys.join("/");
		}
		$tbody.append(
			$("<tr>").data(item)
				.append($("<td>").attr({ title: item.movieCd   }).text(item.movieCd  ))
				.append($("<td>").attr({ title: item.movieNm   }).text(item.movieNm  ))
				.append($("<td>").attr({ title: item.directors }).text(item.directors))
		);
	}
}
ML.saveMovieInfo = function(item) {
	this.dao.insertOrUpdate(TABLE_MOVIE, item);
	this.$form.addClass("need-to-save");
}
ML.refreshMovieList = function(param={}) {
	if (!this.dao) return;
	const list = this.dao.getMovieList(param);
	
	const $tab = this.$tabs.movie;

	const cols = [];
	$tab.find("tr:eq(0) th").each(function(i) {
		cols[i] = $(this).data("order");
	});
	
	const $tbody = $tab.find(".tb-list > tbody").empty();
	for(let i = 0; i < list.length; i++) {
		const item = list[i];
		const $tr = $("<tr>").data(item);
		for(let j = 0; j < cols.length; j++) {
			const col = cols[j];
			const value = col ? item[col] : "";
			$tr.append($("<td>").attr("title", value).text(value));
		}
		$tbody.append($tr);
	}
}
ML.save = async function() {
	if (!this.dao || !this.$form.hasClass("need-to-save")) {
		return;
	}
	if (OHLI.session) {
		const data = new FormData();
		const file = new Blob([this.dao.getBinary()], { type: "application/x-sqlite3" });
		data.append("file", file);
		
		const self = this;
		$.ajax({url: "/movieLog/saveDB"
			,	type: "post"
			,	data: data
			,	cache: false
			,	contentType: false
			,	processData: false
			,	success: function(result) {
					self.$form.removeClass("need-to-save");
				}
			,	error: function(e) {
					console.log(e);
					alert("저장하지 못했습니다.");
				}
		});
	} else {
		if (this.fileBuffer = this.dao.saveToFile(this.fileBuffer)) {
			this.$form.removeClass("need-to-save");
		}
	}
}
ML.saveToFile = async function() {
	this.dao.saveToFile();
}

ML.refreshTab = function() {
	$(".tab-header > div.on").click();	
}

$(function() {
	initCss(COLORS);
	
	$(".tab-area").each(function() {
		const $area = $(this);
		const $header = $area.find(".tab-header");
		const $bodies = $area.find(".tab-body").children();
		$header.children().each(function(i) {
			$(this).data("index", i);
		});
		$header.on("click", "div", function() {
			$header.children().removeClass("on");
			$bodies.removeClass("on");
			$($bodies[$(this).addClass("on").data("index")]).addClass("on");
		});
	});
	
	$(".table-with-search").each(function() {
		const $form = $(this);
		$form.data("st", new SearchTable($form));
	});
	
	$("#inputDB").on("change", loadLocal);
	
	ML.init();
});

function initCss(colors) {
	$.ajax({url: "/css/view/movieLog.color.css"
		,	dataType: "text"
		,	success: function(css) {
				for (let key in colors) {
					css = css.split('${'+key+'}').join(colors[key]);
				}
				$("#styleColor").html(css);
			}
	});
}

function login() {
	$loginForm = $("#loginForm");
	let id = $loginForm.find("input[name=id]").val();
	let pw = $loginForm.find("input[name=pw]").val();
	
	$.ajax({url: "server/login.jsp"
		,	data: {
					id: id
				,	pw: pw
			}
		,	success: function(info) {
				ML.loginInfo = info;
				//ML.$form.find("#btnExport").show();
				afterLogin("/movieLog/loadDB/" + info.userKey + "?" + new Date().getTime());
			}
		,	error: function() {
				alert("로그인 실패");
			}
	});
	
	return false;
}
function loadLocal() {
	const files = $("#inputDB")[0].files;
	if (files.length) {
		//ML.$form.find("#btnExport").hide();
		afterLogin(files[0]);
	}
}
function afterLogin(db, key=null) {
	$("#loginForm").hide();
	new MovieLogDAO(db, key, function(dao) {
		ML.dao = dao;
		ML.initDatalist(GROUPS);
		$(".tab-header > div:eq(0)").click();
	}, function(e) {
		alert('DB를 불러오지 못했습니다.');
	});
}

window.addEventListener("beforeunload", function(e) {
	alert(1);
	return false;
});
