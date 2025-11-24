class MediaLibraryDAO extends DAO {}

MediaLibraryDAO.prototype.getList = function(param={}) {
	const list = [];
	
	let sql = 
			'SELECT _, origin, title, path, status'
		+	'     , subtitle, "check", tag, begin, end'
		+	'  FROM anime'
		+	' WHERE 1=1';
	sql += DAO.makeSearchQuery(param);
	
	const ps = this.DB.prepare(sql);
	ps.bind(param);
	while (ps.step()) {
		const item = ps.getAsObject();
		list.push(item);
	}
	
	return list;
}

MediaLibraryDAO.prototype.isExistPath = function(path) {
	const ps = this.DB.prepare('SELECT _ FROM anime WHERE path LIKE $path$ OR path LIKE $subpath$');
	ps.bind({ $path$: path, $subpath$: path + "/%" });
	return ps.step();
}

MediaLibraryDAO.prototype.getSubtitleList = function(param={}) {
	const list = [];
	
	let sql = 
			'SELECT s._, s.anime, s.title, a.title anime_title, a.tag, s.begin, s.end, s.complete, s.updated'
		+	'     , s.url url, s.len, s.ep, s.etc1, s.etc2, s.etc3, s.etc4, s.etc5, s.etc6, s.etc7, s.etc8, s.etc9'
        +	"     , ( (CASE WHEN s.etc1='' THEN 0 WHEN IFNULL(s.etc1, 0) > 0 THEN 1 ELSE 0 END)"
        +	"       + (CASE WHEN s.etc2='' THEN 0 WHEN IFNULL(s.etc2, 0) > 0 THEN 1 ELSE 0 END)"
        +	"       + (CASE WHEN s.etc3='' THEN 0 WHEN IFNULL(s.etc3, 0) > 0 THEN 1 ELSE 0 END)"
        +	"       + (CASE WHEN s.etc4='' THEN 0 WHEN IFNULL(s.etc4, 0) > 0 THEN 1 ELSE 0 END)"
        +	"       + (CASE WHEN s.etc5='' THEN 0 WHEN IFNULL(s.etc5, 0) > 0 THEN 1 ELSE 0 END)"
        +	"       + (CASE WHEN s.etc6='' THEN 0 WHEN IFNULL(s.etc6, 0) > 0 THEN 1 ELSE 0 END)"
        +	"       + (CASE WHEN s.etc7='' THEN 0 WHEN IFNULL(s.etc7, 0) > 0 THEN 1 ELSE 0 END)"
        +	"       + (CASE WHEN s.etc8='' THEN 0 WHEN IFNULL(s.etc8, 0) > 0 THEN 1 ELSE 0 END)"
        +	"       + (CASE WHEN s.etc9='' THEN 0 WHEN IFNULL(s.etc9, 0) > 0 THEN 1 ELSE 0 END)"
        +	'       ) etcs'
        +	'     , ((s.len * s.ep) + s.etc1 + s.etc2 + s.etc3 + s.etc4 + s.etc5 + s.etc6 + s.etc7 + s.etc8 + s.etc9) total'
        +	'  FROM subtitle s'
        +	'  LEFT JOIN anime a'
        +	'    ON a._ = s.anime'
        +	' WHERE 1=1';
	sql += DAO.makeSearchQuery(param);
	
	const ps = this.DB.prepare(sql);
	ps.bind(param);
	while (ps.step()) {
		const item = ps.getAsObject();
		list.push(item);
	}
	
	return list;
}
