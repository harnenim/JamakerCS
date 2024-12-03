function StDev(values=[]) {
	this.values = [];
	this.pows = [];
	this.sum = 0;
	this.pSum = 0;
	for (var i= 0; i < values.length; i++) {
		this.add(values[i]);
	}
}
StDev.prototype.add = function(value) {
	var pow = value * value;
	this.sum += value;
	this.pSum += pow;
	this.values.push(value);
	this.pows.push(pow);
}
StDev.prototype.replace = function(index, value) {
	while (index < 0) {
		index += this.values.length;
	}
	index %= this.values.length;

	var pow = value * value;
	this.sum += value - this.values[index];
	this.pSum += pow - this.pows[index];
	this.values[index] = value;
	this.pows[index] = pow;
}
StDev.prototype.calc = function () {
	this.avg = this.sum / this.values.length;
	this.value = Math.sqrt((this.pSum / this.values.length) - (this.avg * this.avg));
	return this;
}
StDev.from = function(values) {
	return new StDev(values).calc();
}

MathFunc = {};
MathFunc.StDev = function(data, avg=null) {
	var ret = 0;
	var Max = 0;
	
	if (avg == null) {
		try {
			Max = data.Length;
			if (Max == 0) { return ret; }
			ret = MathFunc.StDev(data, MathFunc.Avg(data));
		} catch (e) {
			console.log(e);
		}
		return ret;
		
	} else {
		var TotalVariance = 0;
		
		try {
			Max = data.Length;
			if (Max == 0) { return ret; }
			for (var i = 0; i < Max; i++) {
				TotalVariance += Math.pow(data[i] - avg, 2);
			}
			ret = Math.sqrt(MathFunc.SafeDivide(TotalVariance, Max));
		} catch (e) {
			console.log(e);
		}
	}
	
	return ret;
}
MathFunc.Avg = function(data) {
	var ret = 0;
	var DataTotal = 0;

	try {
		for (var i = 0; i < data.Length; i++) {
			DataTotal += data[i];
		}
		ret = MathFunc.SafeDivide(DataTotal, data.Length);
	} catch (e) {
		console.log(e);
	}
	return ret;
}
MathFunc.SafeDivide = function(value1, value2) {
	var ret = 0;
	try {
		if ((value1 == 0) || (value2 == 0)) { return ret; }
		ret = value1 / value2;
	} catch (e) {
		console.log(e);
	}
	return ret;
}
