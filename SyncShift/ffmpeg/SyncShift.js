window.SyncShift = function(start, shift) {
	this.start = start;
	this.shift = shift;
}

SyncShift.CHECK_RANGE = 500;
SyncShift.MAX_POINT = 0.5;
SyncShift.WITH_KEYFRAME = false;

SyncShift.GetShiftsForRanges = function(origin, target, ranges, progress) {
    progress.Set(0);
    let targetRangeStart = 0;
	let shifts = [];
    for (let i = 0; i < ranges.length; i++) {
    	const range = ranges[i];
    	const rangeShifts = SyncShift.GetShiftsForRange(origin, target, range, targetRangeStart, progress);
    	if (rangeShifts.length) {
    		shifts = shifts.concat(rangeShifts);
    		targetRangeStart = range.end + rangeShifts[rangeShifts.length - 1].shift;
    	}
    }
    progress.Set(0);
    return shifts;
}
SyncShift.GetShiftsForRange = function(origin, target, range, targetRangeStart, progress) {
	progress.Set(range.start / origin.length);
	
	const shifts = [];
	const start = range.start;
	let   shift = range.shift;
	const limitOfOrigin = Math.min(range.end, origin.length);
	
    let minPoint = null;
    let minShift = shift;
    let doPlus = true, doMinus = true;
    
    if ((limitOfOrigin < start + SyncShift.CHECK_RANGE)
     || (target.length < targetRangeStart + SyncShift.CHECK_RANGE)) {
		console.log("비교 대상이 너무 짧음");
		doPlus = doMinus = false;
    }
    
	for (let add = 0; (doPlus || doMinus); add++) {
		if (doPlus) {
			const tShift = shift + add;
			if (start + tShift + SyncShift.CHECK_RANGE > target.length) {
				console.log("탐색 범위 벗어남({0} + {1}): {2} > {3}".split("{0}").join(shift).split("{1}").join(add).split("{2}").join(start + tShift + SyncShift.CHECK_RANGE).split("{3}").join(target.length));
				doPlus = false;
				continue;
			}
			const ratios = [];
			for (let i = 0; i < SyncShift.CHECK_RANGE; i++) {
				ratios.push(Math.log10((origin[start + i] + 0.000001) / (target[start + tShift + i] + 0.000001)));
			}
			const point = new StDev(ratios);
			if (minPoint == null || point.value < minPoint.value) {
				// 오차가 기존값보다 작음
				console.log("오차가 기존값보다 작음({0} + {1})".split("{0}").join(shift).split("{1}").join(add));
				minPoint = point;
				minShift = tShift;
                console.log(point.value);
				if (point.value == 0.0) {
					console.log("완전히 일치: 정답 찾음");
					// 완전히 일치: 정답 찾음
					break;
				}
			} else if (point.value > minPoint.value * 20) {
				console.log("오차가 기존값에 비해 지나치게 큼{0} + {1})".split("{0}").join(shift).split("{1}").join(add));
				// 오차가 기존값에 비해 지나치게 큼: 이미 정답을 찾았다고 간주
                console.log(point.value);
				doPlus = false;
			}
		}
		if (doMinus) {
			const tShift = shift - add;
			let originStart = start;
            if (start + tShift < targetRangeStart) {
				// 가중치 이미 확인한 영역까지 침범
				// origin 앞쪽을 잘라내고 시작
				originStart = targetRangeStart - tShift;
			    if (limitOfOrigin < originStart + SyncShift.CHECK_RANGE) {
					console.log("탐색 범위 벗어남({0} - {1})".split("{0}").join(shift).split("{1}").join(add));
					doMinus = false;
					continue;
			    }
			}
			const ratios = [];
			for (let i = 0; i < SyncShift.CHECK_RANGE; i++) {
				let ratio = Math.log10((origin[originStart + i] + 0.000001) / (target[originStart + tShift + i] + 0.000001));
				ratios.push(ratio);
			}
			const point = new StDev(ratios);
			if (minPoint == null || point.value < minPoint.value) {
				// 오차가 기존값보다 작음
				console.log("오차가 기존값보다 작음({0} - {1})".split("{0}").join(shift).split("{1}").join(add));
				minPoint = point;
				minShift = tShift;
                console.log(point.value);
				if (point.value == 0.0) {
					// 완전히 일치: 정답 찾음
					console.log("완전히 일치: 정답 찾음");
					break;
				}
			} else if (point.value > minPoint.value * 20) {
				// 오차가 기존값에 비해 지나치게 큼: 이미 정답을 찾았다고 간주
				console.log("오차가 기존값에 비해 지나치게 큼({0} - {1})".split("{0}").join(shift).split("{1}").join(add));
				console.log(point);
				doMinus = false;
			}
		}
	}
	
	if (minPoint == null || minPoint.value > SyncShift.MAX_POINT) {
		console.log("찾지 못함");
		return shifts;
	}
	console.log("최종값");
	console.log(minPoint.value);
	shifts.push(new SyncShift(start, shift = minShift));
	
    // 현재 가중치가 어디까지 이어질지 구하기
    const limit = Math.max(minPoint.value * 12, 0.0001);
    let count = 0;
    let offset = start + 10;
    let v = 0;
    if (shift < 0) {
    	offset -= shift;
    }
    
    while (offset < limitOfOrigin && offset + shift < target.length) {
        v = Math.abs(Math.log10((origin[offset] + 0.000001) / (target[offset + shift] + 0.000001)) - minPoint.avg);
        if (v > limit) {
            console.log(offset + ": " + v + " / " + limit);
            if (++count >= 5) break;
        } else if (count > 0) {
        	count = 0;
        }
        offset++;
        
        if (offset % 100 == 0) {
            progress.Set(offset / origin.length);
        }
    }
    console.log(v + " > " + limit);
    
    // 5초 이상 남았을 때만 나머지 범위 확인
    if (offset + 500 < range.end) {
    	shifts.push(...SyncShift.GetShiftsForRange(origin, target, new Range(offset, range.end), (offset + shift), progress));
    }
    
	return shifts;
}

function StDev(values=[]) {
	let sum = 0;
	let pSum = 0;
	
	for (let i = 0; i < values.length; i++) {
		const value = values[i];
		const pow = value * value;
		sum += value;
		pSum += pow;
	}
	
	this.avg = sum / values.length;
	this.value = Math.sqrt((pSum / values.length) - (this.avg * this.avg));
}