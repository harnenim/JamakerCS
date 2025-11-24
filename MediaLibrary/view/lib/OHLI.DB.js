function Column(name, type, isIndex=false, required=false) {
	this.name = name;
	this.type = type;
	this.isIndex = isIndex;
	this.required = required;
}

function Table(name, columns, pk) {
	this.name = name;
	this.columns = columns;
	this.pk = pk;
}
Table.prototype.creations = function() {
	const sqls = [];
	sqls.push('');
	
	const cols = [];
	if (!this.pk) {
		cols.push('"_" INTEGER');
	}
	for (let i = 0; i < this.columns.length; i++) {
		const column = this.columns[i];
		cols.push('"' + column.name + '" ' + column.type);
		if (column.isIndex) {
			sqls.push('CREATE INDEX "index_{name}_{col}" ON "{name}" ("{col}")'.split('{name}').join(this.name).split('{col}').join(column.name));
		}
	}
	if (this.pk) {
		cols.push('PRIMARY KEY("' + this.pk + '")');
	} else {
		cols.push('PRIMARY KEY("_" AUTOINCREMENT)');
	}
	sqls[0] = 'CREATE TABLE IF NOT EXISTS "' + this.name + '"\n( ' + cols.join('\n, ') + '\n)';
	
	return sqls;
}
Table.prototype.preparedSelect = function(converter={}, additionals=[]) {
	const cols = this.pk ? [] : [`_`]
	for (let i = 0; i < this.columns.length; i++) {
		const column = this.columns[i];
		if (converter[column.name]) {
			// TODO: 추가 작업 있을 경우
		} else {
			cols.push('`' + column.name + '`');
		}
	}
	//cols = cols.concat(additional);
	for (let i = 0; i < additionals.length; i++) {
		const additional = additionals[i];
		cols.push(additional);
	}

	const pk = (this.pk ? this.pk : '_');
	return 'SELECT ' + cols.join(', ') + 'FROM ' + this.name;
}
Table.prototype.preparedSelectItem = function(converter={}, additionals=[]) {
	const pk = (this.pk ? this.pk : '_');
	return this.preparedSelect(converter, additionals) + ' WHERE `'+pk+'`=$'+pk;
}
Table.prototype.preparedInsert = function() {
	const cols = [];
	for (let i = 0; i < this.columns.length; i++) {
		const column = this.columns[i];
		cols.push(column.name);
	}
	return 'INSERT INTO "' + this.name + '" ("' + cols.join('", "') + '") VALUES ($' + cols.join(', $') + ')';
}
Table.prototype.preparedUpdate = function() {
	const cols = [];
	for (let i = 0; i < this.columns.length; i++) {
		const column = this.columns[i];
		cols.push('"' + column.name + '"=$' + column.name);
	}
	const pk = (this.pk ? this.pk : '_');
	return 'UPDATE "' + this.name + '" SET ' + cols.join(', ') + ' WHERE `'+pk+'`=$'+pk;
}
Table.prototype.preparedDelete = function() {
	const pk = (this.pk ? this.pk : '_');
	return 'DELETE FROM "' + this.name + '" WHERE `'+pk+'`=$'+pk;
}

function getShift(key) {
	return fibonacci(key.length);
}
function getXors(key) {
	const bytes = new TextEncoder().encode(key);
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] =                      // 75361420
				( ((bytes[i] << (7-0)) & 0b10000000)
				| ((bytes[i] << (5-1)) & 0b01000000)
				| ((bytes[i] << (3-2)) & 0b00100000)
				| ((bytes[i] << (6-3)) & 0b00010000)
				| ((bytes[i] << (1-4)) & 0b00001000)
				| ((bytes[i] << (4-5)) & 0b00000100)
				| ((bytes[i] << (2-6)) & 0b00000010)
				| ((bytes[i] << (0-7)) & 0b00000001)
				);
	}
	return bytes;
}
function fibonacci(no) {
	return subFibonacci(0, 1, no - 1);
}
function subFibonacci(before, current, left) {
	if (left < 0) {
		return before;
	} else if (left == 0) {
		return current;
	} else {
		return subFibonacci(current, before + current, left - 1);
	}
}

function DAO(file, key=null, afterLoadDB=null, onerror=null) {
	if (!onerror) {
		onerror = afterLoadDB;
		afterLoadDB = key;
		key = null;
	}
	const self = this;
	if (typeof file == "string") {
		const req = new XMLHttpRequest();
		req.open('GET', file);
		req.responseType = 'arraybuffer';
		req.onload = function(e) {
			self.afterGetFile(req.response, key, afterLoadDB);
		}
		req.onerror = onerror;
		req.send();
	} else {
		if (file instanceof Uint8Array) {
			self.afterGetFile(file, key, afterLoadDB);
		} else {
			file.arrayBuffer().then(function(buffer) {
				self.afterGetFile(buffer, key, afterLoadDB);
			});
		}
	}
}
DAO.prototype.afterGetFile = function(buffer, key, afterLoadDB) {
	this.afterGetBytes(new Uint8Array(buffer), key, afterLoadDB);
}
DAO.prototype.afterGetBytes = function(bytes, key, afterLoadDB) {
	const self = this;
	initSqlJs({
		locateFile: (filename) => "lib/" + filename
	}).then(function(SQL) {
		self.DB = new SQL.Database(DAO.decrypt(bytes, key));
		if (afterLoadDB) {
			afterLoadDB(self);
		}
	});
}
DAO.encrypt = function(decrypted, key) {
	if (!key) {
		return decrypted;
	}
	const length = decrypted.length;
	const shift = getShift(key);
	const xors = getXors(key);
	const encrypted = new Uint8Array(length);
	for (let i = 0; i < length; i++) {
		const j = (i + shift) % length;
		encrypted[j] = decrypted[i] ^ xors[j % xors.length];
	}
	return encrypted;
}
DAO.decrypt = function(encrypted, key) {
	if (!key) {
		return encrypted;
	}
	const length = encrypted.length;
	const shift = getShift(key);
	const xors = getXors(key);
	const decrypted = new Uint8Array(length);
	for (let i = 0; i < length; i++) {
		const j = (i + shift) % length;
		decrypted[i] = encrypted[j] ^ xors[j % xors.length];
	}
	return decrypted;
}

DAO.makeSearchQuery = function(param) {
	let query = "";
	if (param.where) {
		const wheres = param.where.split('/');
		for (let i = 0; i < wheres.length; i++) {
			const key = '$w' + i;
			const item = wheres[i].split('=');
			const col = item[0].split(',').join("`, '')||' '||IFNULL(`");
			param[key] = ("%" + item[1].split(" ").join("%") + "%");
			query += " AND IFNULL(`" + col + "`, '') LIKE " + key;
		}
	}
	if (param.order) {
		const orders = param.order.split('/');
		const cols = orders[0].split(',');
		const direction = orders.length == 1 ? 'ASC' : orders[1];

		for (let i = 0; i < cols.length; i++) {
			const col = cols[i].split(".");
			if (col.length == 1) {
				cols[i] = ('`' + col[0] + '` ' + direction);
			} else {
				cols[i] = (col[0] + '.`' + col[1] + '` ' + direction);
			}
		}
		query += ' ORDER BY ' + cols.join(", ");
	}
	return query;
}

DAO.prototype.insertOrUpdate = function(table, item) {
	const result = {};
	
	// 필수값 체크
	for (let i = 0; i < table.columns.length; i++) {
		const column = table.columns[i];
		if (column.required) {
			if (!item[column.name]) {
				result.error = 1;
				(result.cols ? result.cols : (result.cols = [])).push(column.name);
			}
		}
	}
	
	if (!result.error) {
		let ps = this.DB.prepare(table.preparedSelectItem());
		const param = {};
		const pk = table.pk ? table.pk : '_';
		param['$'+pk] = item[pk];
		
		ps.bind(param);
		const isUpdate = ps.step();
		
		ps = this.DB.prepare(table[isUpdate ? "preparedUpdate" : "preparedInsert"]());
		for (let i = 0; i < table.columns.length; i++) {
			const col = table.columns[i].name;
			if (col == pk && !isUpdate) {
				delete param['$'+col];
				continue;
			}
			const value = item[col];
			if (value !== undefined) {
				param['$'+col] = value;
			}
		}
		ps.bind(param);
		if (ps.run()) {
			result.success = true;
		} else {
			result.error = 2;
		}
	}
	
	return result;
}
DAO.prototype.delete = function(table, key) {
	const result = {};
	
	const ps = this.DB.prepare(table.preparedDelete());
	const param = {};
	param['$'+(table.pk ? table.pk : '_')] = key;
	ps.bind(param);
	if (ps.run()) {
		result.success = true;
	} else {
		result.error = 2
	}
	
	return result;
}

DAO.Stat = function(DB, groups) {
	this.DB = DB;
	this.groups = groups;
	this.years = [];
	this.yMap = [];
	this.mMap = [];
}
DAO.Stat.prototype.addYear = function(table, item) {
	this.years.push(item.Y);
	this.yMap[item.Y] = {};
	this.setValues(table, item, 'total');
}
DAO.Stat.prototype.setValues = function(table, item, name, where="") {
	this.yMap[item.Y][name] = item.CNT;
	
	const ps = this.DB.prepare(
				'SELECT M, COUNT(*) CNT    '
			+	'  FROM (SELECT SUBSTR(date, 1, 6) AS M '
			+	'          FROM {TABLE}    '.split('{TABLE}').join(table)
			+	'         WHERE date > $d1 '
			+	'           AND date < $d2 '
			+   '        {WHERE}           '.split('{WHERE}').join(where)
			+	'       )                  '
			+	' GROUP BY M               '
			+	' ORDER BY M DESC          '
	);
	ps.bind({
			$d1: item.Y + "0000"
		,	$d2: item.Y + "9999"
	});
	while (ps.step()) {
		const item = ps.getAsObject();
		let mItem = this.mMap[item.M];
		if (mItem == null) {
			this.mMap[item.M] = mItem = {};
		}
		mItem[name] = item.CNT;
	}
}
DAO.Stat.QUERY
	=	'SELECT Y, COUNT(*) CNT '
	+	'  FROM (SELECT SUBSTR(date, 1, 4) AS Y '
	+	'          FROM {TABLE} '
	+	'         WHERE 1=1     '
	+	'        {WHERE}        '
	+	'       )               '
	+	' GROUP BY Y            '
	+	' ORDER BY Y DESC       ';
DAO.prototype.getStat = function(table, col, groups) {
	const stat = new DAO.Stat(this.DB, groups);
	
	const query = DAO.Stat.QUERY.split('{TABLE}').join(table);
	
	{	const ps = this.DB.prepare(query.split('{WHERE}').join(''));
		while (ps.step()) {
			stat.addYear(table, ps.getAsObject());
		}
	}
	
	let without = '';
	for (let i = 0; i < groups.length; i++) {
		const group = groups[i];
		const where = (' AND `{COL}` LIKE "{GROUP}"').split('{COL}').join(col).split('{GROUP}').join(group);
		const ps = this.DB.prepare(query.split('{WHERE}').join(where));
		while (ps.step()) {
			stat.setValues(table, ps.getAsObject(), group, where);
		}
		without += ' AND `{COL}` NOT LIKE "{GROUP}"'.split('{COL}').join(col).split('{GROUP}').join(group);
	}
	
	{ const ps = this.DB.prepare(query.split('{WHERE}').join(without));
		while (ps.step()) {
			stat.setValues(table, ps.getAsObject(), 'other', without);
		}
	}
	
	return stat;
}

async function bytesToBase64(bytes) {
	const url = await new Promise((then) => {
		const reader = new FileReader();
		reader.onload = () => { then(reader.result); }
		reader.readAsDataURL(new Blob([bytes]));
	});
	return url.slice(url.indexOf(',') + 1);
}
DAO.prototype.commit = async function() {
	const bytes = this.DB.export();
	const base64 = bytes.toBase64 ? bytes.toBase64() : await bytesToBase64(bytes);
	
	if (!window.binder) return false;
	return await binder.commit(base64);
}
DAO.prototype.saveToFile = async function(fileBuffer) {
	if (!fileBuffer) {
		fileBuffer = await window.showSaveFilePicker({
			types: [
				{ description: "sqlite DB", accept:{ "application/x-sqlite3": [".db"] } }
			]
		});
	}
	if (!fileBuffer) {
		return null;
	}
	const stream = await fileBuffer.createWritable();
	await stream.write(this.DB.export());
	await stream.close();
	return fileBuffer;
}
DAO.prototype.getBinary = function(key) {
	return DAO.encrypt(this.DB.export(), key);
}
