var SyncShift = function(start, shift) {
	this.start = start;
	this.shift = shift;
}

SyncShift.CHECK_RANGE = 500;
SyncShift.MAX_POINT = 0.1;
SyncShift.WITH_KEYFRAME = false;

SyncShift.GetShiftsForRanges = function(origin, target, ranges, progress) {
    progress.Set(0);
	var shifts = [];
    for (var i = 0; i < ranges.length; i++) {
    	var range = ranges[i];
    	shifts = shifts.concat(SyncShift.GetShiftsForRange(origin, target, range, progress));
    }
    progress.Set(0);
    return shifts;
}
SyncShift.GetShiftsForRange = function(origin, target, range, progress) {
	progress.Set(range.start / origin.length);
	
	var shifts = [];
	var start = range.start;
	var shift = range.shift;
	var limitOfOrigin = Math.min(range.end, origin.length);

    var minPoint = { value: SyncShift.MAX_POINT, initial: true };
    var doPlus = true, doMinus = true;
    
	for (var add = 0; (doPlus || doMinus)
	               && (start + shift + add < target.length - SyncShift.CHECK_RANGE)
	               && (start - shift + add < limitOfOrigin - SyncShift.CHECK_RANGE); add++) {
		if (doPlus) {
			if ((start + SyncShift.CHECK_RANGE < limitOfOrigin)
			 && (start + SyncShift.CHECK_RANGE + shift + add < target.length)) {
				var ratios = [];
				for (var i = 0; i < SyncShift.CHECK_RANGE; i++) {
					ratios.push(Math.log10((origin[start + i] + 0.000001) / (target[start + shift + add + i] + 0.000001)));
				}
				var point = StDev.from(ratios);
				if (point.value < minPoint.value) {
					// 오차가 기존값보다 작음
					console.log("오차가 기존값보다 작음(+)");
					point.add = add;
					minPoint = point;
					if (point.value == 0.0) {
						console.log("완전히 일치: 정답 찾음");
						// 완전히 일치: 정답 찾음
						break;
					}
				} else if (point.value > minPoint.value * 20) {
					console.log("오차가 기존값에 비해 지나치게 큼(+)");
					// 오차가 기존값에 비해 지나치게 큼: 이미 정답을 찾았다고 간주
					doPlus = false;
				}
				
			} else {
				console.log("탐색 범위 벗어남(+)");
				doPlus = false;
			}
		}
		if (doMinus) {
			if ((start + SyncShift.CHECK_RANGE + shift + add < limitOfOrigin)
			 && (start + SyncShift.CHECK_RANGE + shift < target.length)) {
				if (start + shift - add < 0) {
					continue;
				}
				var ratios = [];
	            for (var i = 0; i < SyncShift.CHECK_RANGE; i++) {
	            	var ratio = Math.log10((origin[start + shift + i] + 0.000001) / (target[start + shift - add + i] + 0.000001));
            		ratios.push(ratio);
	            }
				var point = StDev.from(ratios);
				if (point.value < minPoint.value) {
					// 오차가 기존값보다 작음
					console.log("오차가 기존값보다 작음(-)");
					point.add = -add;
					minPoint = point;
					if (point.value == 0.0) {
						// 완전히 일치: 정답 찾음
						console.log("완전히 일치: 정답 찾음");
						break;
					}
				} else if (point.value > minPoint.value * 20) {
					// 오차가 기존값에 비해 지나치게 큼: 이미 정답을 찾았다고 간주
					console.log("오차가 기존값에 비해 지나치게 큼(-)");
					doMinus = false;
				}
			} else {
				console.log("탐색 범위 벗어남(-)");
				doMinus = false;
			}
		}
	}
	
	if (minPoint.initial) {
		console.log("찾지 못함");
		return shifts;
	}
	console.log("최종값");
	console.log(minPoint);
	shifts.push(new Range(start, range.end, shift + minPoint.add));
	
    // 현재 가중치가 어디까지 이어질지 구하기
	
	
	
	return shifts;
}
SyncShift.GetShiftsFromPos = function(
		origin
	,	target
	,   progress
	,	result
	,	startPos
	,	startShift
	,	limitOfOrigin
	)
{
    console.log("GetShiftsFromPos: {0}, {1}".split("{0}").join(startPos).split("{1}").join(startShift));
    
	try {
	    var pos = startPos;
	    var shift = startShift;
	
	    progress.Set(pos / origin.length);
	
	    if (shift > 0
	        ? ((pos + 500 < limitOfOrigin) && (pos + shift + 500 < target.length))
	        : ((pos + 500 < target.length) && (pos - shift + 500 < limitOfOrigin))
	        )
	    {
	        console.log("pos: " + pos);
	
	        var minAvg = 0;
	        var minPoint = SyncShift.MAX_POINT;
	        var minAdd = 0;
	        var doPlus = true, doMinus = true;
	
	        // 맨 앞 100개 표준편차 제일 적은 값 구하기
	        for (var add = 0;
	            //add < 5000;
	            //(add + shift < 30000) &&
	            //(add - shift < 30000) &&
	            (pos + shift + add < target.length - 500) &&
	            (pos - shift + add < limitOfOrigin - 500);
	            add++)
	        {
	            var ratios = [];
	            var avg, point;
	
	            // + 방향
	            if (doPlus) {
	                ratios = [];
	                //*
	                for (var i = 0; i < SyncShift.CHECK_RANGE
	                    && pos + add + i < limitOfOrigin
	                    && pos + shift + i >= 0
	                    && pos + shift + i < target.length; i++)
	                {
	                    ratios.push(Math.log10((origin[pos + i] + 0.000001) / (target[pos + shift + add + i] + 0.000001)));
	                }
	                avg = MathFunc.Avg(ratios);
	                point = MathFunc.StDev(ratios, avg);
	                //console.log(shift + "+" + add + ": " + point);
	                if (point < minPoint) {
	                    minAvg = avg;
	                    minPoint = point;
	                    minAdd = add;
	                    if (point == 0.0) {
	                        break;
	                    }
	                } else if (point > minPoint * 20) {
	                    doPlus = false;
	                    if (!doMinus) {
	                        break;
	                    }
	                }
	            }
	
	            // - 방향
	            if (doMinus && add > 0) {
	                ratios = [];
	                for (var i = 0; i < SyncShift.CHECK_RANGE
	                    && pos + add + i < limitOfOrigin
	                    && pos + shift + i >= 0
	                    && pos + shift + i < target.length; i++)
	                {
	                    ratios.push(Math.log10((origin[pos + add + i] + 0.000001) / (target[pos + shift + i] + 0.000001)));
	                }
	                avg = MathFunc.Avg(ratios);
	                point = MathFunc.StDev(ratios, avg);
	                //console.log(shift + "-" + add + ": " + point);
	                if (point < minPoint) {
	                    minAvg = avg;
	                    minPoint = point;
	                    minAdd = -add;
	                    if (point == 0.0) {
	                        break;
	                    }
	                } else if (point > minPoint * 20) {
	                    doMinus = false;
	                    if (!doPlus) {
	                        break;
	                    }
	                }
	            }
	        }
	
	        console.log(pos + ": " + minAdd + ": " + minAvg + ": " + minPoint);
	
	        if (minPoint == SyncShift.MAX_POINT) {
	            console.log(pos + " + " + (SyncShift.CHECK_RANGE - 50));
	            pos += SyncShift.CHECK_RANGE - 50;
	        } else {
	            shift += minAdd;
	            if (result.length == 0) {
	                // 최초 1회는 무조건
	                result.push(new SyncShift(shift > 0 ? 0 : -shift * 10, shift * 10));
	            } else {
	                var lastShift = result[result.length - 1];
	                if (minAdd > 0) {
	                    if (result.length == 0 || shift * 10 < lastShift.shift - 20 || shift * 10 > lastShift.shift + 20) {
	                        if (pos * 10 < lastShift.start + 5000) {
	                            lastShift.shift = shift * 10;
	                            if (result.length == 1) {
	                                lastShift.start = 0;
	                            }
	                        } else {
	                            result.push(new SyncShift(pos * 10, shift * 10));
	                        }
	                    }
	                } else if (minAdd < 0) {
	                    if (result.length == 0 || shift * 10 < lastShift.shift - 20 || shift * 10 > lastShift.shift + 20) {
	                        if (pos * 10 < lastShift.start + 5000) {
	                            lastShift.shift = shift * 10;
	                        } else {
	                            pos -= minAdd / 2;
	                            result.push(new SyncShift(pos * 10, shift * 10));
	                        }
	                    }
	                }
	            }
	
	            // 현재 가중치가 어디까지 이어질지 구하기
	            var limit = Math.max(minPoint * 12, 0.0001);
	            //double limit = Math.max(minPoint * 10, 0.0001); // 6시그마(???
	            //double limit = MAX_POINT * 1;
	            //double limit = 0.4;
	            var count = 0, countStart = 0;
	            var i = pos + 10;
	            var v = 0;
	            var oShift, tShift;
	
	            if (shift > 0) {
	                oShift = 0;
	                tShift = shift;
	            } else {
	                oShift = -shift;
	                tShift = 0;
	            }
	
	            while (i + oShift < limitOfOrigin && i + tShift < target.length) {
	                v = Math.abs(Math.log10((origin[i + oShift] + 0.000001) / (target[i + tShift] + 0.000001)) - minAvg);
	                if (v > limit) {
	                    console.log(i + ": " + v + " / " + limit);
	                    if (count == 0) countStart = i;
	                    if (++count >= 5) break;
	                } else if (count > 0) {
	                	count = 0;
	                }
	                i++;
	
	                if (i % 100 == 0) {
	                    progress.Set(i / origin.length);
	                }
	            }
	            console.log(v + " > " + limit);
	            pos = i;
	        }
	
	        SyncShift.GetShiftsFromPos(origin, target, progress, result, pos, shift, limitOfOrigin);
	    }
	} catch (e) {
		console.log(e);
	}
}

/*
SyncShift.GetFrameShifts = function(
		oKfs
	,	tKfs
	,	sShifts
	)
{
    List<double> shiftOkfs = new List<double>();
    int index = 0;
    for (int i = 0; i < sShifts.length; i++)
    {
        int shift = sShifts[i].shift;
        int limit = (i + 1 < sShifts.length) ? sShifts[i + 1].start : int.MaxValue;

        for (; index < oKfs.length && oKfs[index] < limit; index++)
        {
            double v = oKfs[index] + shift;
            while (shiftOkfs.length > 0 && shiftOkfs[shiftOkfs.length - 1] > v)
                shiftOkfs.RemoveAt(shiftOkfs.length - 1);
            shiftOkfs.push(v);
        }
    }
    oKfs = shiftOkfs;

    List<SyncShift> fShifts = new List<SyncShift>();
    index = 0;
    double LIMIT = 0.1;
    foreach (double kf in oKfs)
    {
        console.log(kf);

        double maxMinus = -LIMIT;
        double minPlus = LIMIT;
        double t = 0;

        for (; index < tKfs.length && (t = tKfs[index] - kf) < 0; index++)
            maxMinus = t;

        if (index < tKfs.length)
            minPlus = tKfs[index] - kf;

        if (maxMinus > -LIMIT)
        {
            if (minPlus < LIMIT && minPlus < -maxMinus)
            {
                fShifts.push(new SyncShift((int)(1000 * kf), (int)(1000 * minPlus)));
            }
            else
            {
                fShifts.push(new SyncShift((int)(1000 * kf), (int)(1000 * maxMinus)));
            }
        }
        else
        {
            if (minPlus < LIMIT)
            {
                fShifts.push(new SyncShift((int)(1000 * kf), (int)(1000 * minPlus)));
            }
        }
    }
    SyncShift[] result = fShifts;
    fShifts = new List<SyncShift>();

    for (int i = 0; i < result.Length - 5; i++)
    {
        int max = (int)(1000 * LIMIT),
            min = (int)(-1000 * LIMIT),
            sum = 0;
        for (int j = 0; j < 5; j++)
        {
            int shift = result[j].shift;
            sum += shift;
            max = Math.max(max, shift);
            min = Math.min(min, shift);
        }
        fShifts.push(new SyncShift(result[i + 2].start, ((sum - min - max) / 3)));
    }
    if (fShifts.length == 0)
        fShifts.push(new SyncShift(0, 0));

    return fShifts;
}
*/