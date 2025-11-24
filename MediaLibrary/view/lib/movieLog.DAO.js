class MovieLogDAO extends DAO {}

MovieLogDAO.prototype.getPlaceLists = function(groups=[]) {
	const ps = this.DB.prepare(
			'SELECT place, COUNT(*) cnt '
		+	'  FROM watch               '
		+	' WHERE `group` = $group    '
		+	' GROUP BY place            '
		+	' ORDER BY cnt DESC         '
		+	'        , place ASC        '
	);
	const result = {};
	for (let i = 0; i < groups.length; i++) {
		const group = groups[i];
		const list = [];
		
		ps.bind({ $group: group });
		while (ps.step()) {
			list.push(ps.getAsObject().place);
		}
		result[group] = list;
	}
	return result;
}
MovieLogDAO.prototype.getScreenLists = function(groups=[]) {
	const ps = this.DB.prepare(
			'SELECT screen, COUNT(*) cnt '
		+	'  FROM watch                '
		+	' WHERE `group` = $group     '
		+	' GROUP BY screen            '
		+	' ORDER BY cnt DESC          '
		+	'        , screen ASC        '
	);
	const result = {};
	for (let i = 0; i < groups.length; i++) {
		const group = groups[i];
		const list = [];
		
		ps.bind({ $group: group });
		while (ps.step()) {
			list.push(ps.getAsObject().screen);
		}
		result[group] = list;
	}
	return result;
}
MovieLogDAO.prototype.getWatchList = function(param={}) {
	if (!param.order) param.order = 'date,time/DESC';
	
	const list = [];
	
	let sql = TABLE_WATCH.preparedSelect() + ' WHERE 1=1';
	if (param.year) {
		sql += ' AND date > $by AND date < $ey';
		param.$by = (param.year + '0000');
		param.$ey = (param.year + '9999');
	}
	if (param.month) {
		sql += ' AND date > $bm AND date < $em';
		param.$bm = (param.month + '00');
		param.$em = (param.month + '99');
	}
	if (param.group) {
		if (param.group == 'other') {
			sql += ' AND `group` NOT IN ("CGV", "메가박스", "롯데시네마")';
		} else {
			sql += ' AND `group` = $group';
			param.$group = param.group;
		}
	}
	sql += DAO.makeSearchQuery(param);
	
	const ps = this.DB.prepare(sql);
	ps.bind(param);
	while (ps.step()) {
		const item = ps.getAsObject();
		const date = '' + item.date;
		const time = ('' + (item.time + 10000)).substring(1);
		item.date = date.substring(0, 4) + '.' + date.substring(4, 6) + '.' + date.substring(6) + '.';
		item.time = time.substring(0, 2) + ':' + time.substring(2);
		list.push(item);
	}
	
	return list;
}

MovieLogDAO.prototype.getCalendar = function() {
	let begin = null;
	let last = null;
	let item = null;
	const dateMap = {};
	
	const ps = this.DB.prepare(TABLE_WATCH.preparedSelect() + ' ORDER BY date, time ');
	while (ps.step()) {
		item = ps.getAsObject();
		let date = "" + item.date;
		if (begin == null) {
			begin = new Date();
			begin.setDate(1);
			begin.setFullYear(    date.substring(0,4));
			begin.setMonth(Number(date.substring(4,6)) - 1);
			begin.setDate (Number(date.substring(6,8)));
			begin.setTime(begin.getTime() - (((begin.getDay() + 6) % 7) * 86400000));
		}
		const time = pad(item.time, 4);
		item.date = date = date.substring(0, 4) + '.' + date.substring(4, 6) + '.' + date.substring(6) + '.';
		item.time = time.substring(0, 2) + ':' + time.substring(2);
		item.month = ("" + item.date).substring(0, 6);

		let list = dateMap[date];
		if (list == null) {
			dateMap[date] = list = [];
		}
		list.push(item);
	}
	if (item) {
		let date = "" + item.date;
		last = new Date();
		last.setDate(1);
		last.setFullYear(    date.substring(0,4));
		last.setMonth(Number(date.substring(4,6)) - 1);
		last.setDate (Number(date.substring(6,8)));
		last.setTime(last.getTime() + ((6 - ((last.getDay() + 6) % 7)) * 86400000));
	}
	
	return {
			begin: (begin == null ? 9 : begin.getTime())
		,	last : (last  == null ? 9 : last .getTime())
		,	dateMap: dateMap
	};
}

MovieLogDAO.prototype.getMovieList = function(param={}) {
	if (!param.order) param.order = "movieNm";
	
	const list = [];
	const ps = this.DB.prepare(TABLE_MOVIE.preparedSelect() + ' WHERE 1=1 ' + DAO.makeSearchQuery(param));
	ps.bind(param);
	while (ps.step()) {
		list.push(ps.getAsObject());
	}
	
	return list;
}

function pad(value, length) {
	let result = "" + value;
	while (result.length < length) {
		result = "0" + result;
	}
	return result;
}