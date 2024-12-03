using System;
using System.Collections.Generic;

namespace Jamaker
{
    public class SyncShift
    {
        public static int CHECK_RANGE = 250;
        public static double MAX_POINT = 0.1;
        public static bool WITH_KEYFRAME = false;
        
        public int start;
        public int shift;
        public SyncShift(int start, int shift)
        {
            this.start = start;
            this.shift = shift;
        }

        public static List<SyncShift> GetShiftsForRanges(
            List<double> origin
            , List<double> target
            , List<Range> ranges
            , WebProgress progress)
        {
            progress.Set(0);
            List<SyncShift> shifts = new List<SyncShift>();
            foreach (Range range in ranges)
            {
                shifts.AddRange(GetShiftsForRange(origin, target, range, progress));
            }
            progress.Set(0);
            return shifts;
        }
        public static List<SyncShift> GetShiftsForRange(
            List<double> origin
            , List<double> target
            , Range range
            , WebProgress progress)
        {
            progress.Set((double) range.start / origin.Count);

            List<SyncShift> shifts = new List<SyncShift>();
            int start = range.start;
            int shift = range.shift;
            int limitOfOrigin = Math.Min(range.end, origin.Count);

            StDev minPoint = null;
            int minAdd = 0;
            bool doPlus = true, doMinus = true;
    
	        for (int add = 0; (doPlus || doMinus)
	               && ((start + shift + add) < (target.Count - CHECK_RANGE))
	               && ((start - shift + add) < (limitOfOrigin - CHECK_RANGE)); add++)
            {
		        if (doPlus) {
			        if (((start + CHECK_RANGE) < limitOfOrigin)
			         && ((start + CHECK_RANGE + shift + add) < (target.Count)))
                    {
				        List<double> ratios = new List<double>();
				        for (int i = 0; i<SyncShift.CHECK_RANGE; i++) {
					        ratios.Add(Math.Log10((origin[start + i] + 0.000001) / (target[start + shift + add + i] + 0.000001)));
				        }
                        StDev point = StDev.From(ratios);
				        if (minPoint == null || point.value < minPoint.value) {
					        // 오차가 기존값보다 작음
					        Console.WriteLine("오차가 기존값보다 작음(+)");
					        minPoint = point;
					        minAdd = add;
                            Console.WriteLine(point);
					        if (point.value == 0.0) {
						        Console.WriteLine("완전히 일치: 정답 찾음");
						        // 완전히 일치: 정답 찾음
						        break;
					        }
				        }
                        else if (point.value > minPoint.value * 20)
                        {
                            Console.WriteLine("오차가 기존값에 비해 지나치게 큼(+)");
                            // 오차가 기존값에 비해 지나치게 큼: 이미 정답을 찾았다고 간주
                            Console.WriteLine(point);
                            doPlus = false;
                        }
				
			        }
                    else
                    {
                        Console.WriteLine("탐색 범위 벗어남(+)");
                        doPlus = false;
                    }
                }
                if (doMinus)
                {
                    if ((start + CHECK_RANGE + shift + add < limitOfOrigin)
                     && (start + CHECK_RANGE + shift < target.Count))
                    {
                        if (start + shift - add < 0)
                        {
                            continue;
                        }
                        List<double> ratios = new List<double>();
                        for (var i = 0; i < CHECK_RANGE; i++)
                        {
                            ratios.Add(Math.Log10((origin[start + shift + i] + 0.000001) / (target[start + shift - add + i] + 0.000001)));
                        }
                        StDev point = StDev.From(ratios);
                        if (minPoint == null || point.value < minPoint.value)
                        {
                            // 오차가 기존값보다 작음
                            Console.WriteLine("오차가 기존값보다 작음(-)");
                            minPoint = point;
                            minAdd = -add;
                            Console.WriteLine(point);
                            if (point.value == 0.0)
                            {
                                // 완전히 일치: 정답 찾음
                                Console.WriteLine("완전히 일치: 정답 찾음");
                                break;
                            }
                        }
                        else if (point.value > minPoint.value * 20)
                        {
                            // 오차가 기존값에 비해 지나치게 큼: 이미 정답을 찾았다고 간주
                            Console.WriteLine("오차가 기존값에 비해 지나치게 큼(-)");
                            Console.WriteLine(point);
                            doMinus = false;
                        }
                    }
                    else
                    {
                        Console.WriteLine("탐색 범위 벗어남(-)");
                        doMinus = false;
                    }
                }
            }

            if (minPoint == null)
            {
                Console.WriteLine("찾지 못함");
                return shifts;
            }
            Console.WriteLine("최종값");
            Console.WriteLine(minPoint);
            shifts.Add(new SyncShift(start, shift = (shift + minAdd)));

            // 현재 가중치가 어디까지 이어질지 구하기
            double limit = Math.Max(minPoint.value * 12, 0.0001);
            int count = 0;
            int index = start + 10;
            double v = 0;
            int oShift, tShift;

            if (shift > 0)
            {
                oShift = 0;
                tShift = shift;
            }
            else
            {
                oShift = -shift;
                tShift = 0;
            }

            while (index + oShift < limitOfOrigin && index + tShift < target.Count)
            {
                v = Math.Abs(Math.Log10((origin[index + oShift] + 0.000001) / (target[index + tShift] + 0.000001)) - minPoint.avg);
                if (v > limit)
                {
                    Console.WriteLine(index + ": " + v + " / " + limit);
                    if (++count >= 5) break;
                }
                else if (count > 0)
                    count = 0;
                index++;

                if (index % 100 == 0)
                {
                    progress.Set((double)index / origin.Count);
                }
            }
            Console.WriteLine(v + " > " + limit);

            // 5초 이상 남았을 때만 나머지 범위 확인
            if (index + 500 < range.end)
            {
                shifts.AddRange(GetShiftsForRange(origin, target, new Range(index, range.end), progress));
            }

            return shifts;
        }

        // 구버전
        /*
        public static List<SyncShift> GetShifts(
        		List<double> origin
        	,	List<double> target
        	,	WebProgress progress
        	,	List<SyncShift> result
        	,	Range[] ranges
        	,	int startShift
        	)
        {
            progress.Set(0);
            foreach (Range range in ranges)
            {
                int index = result.Count;
                GetShifts(origin, target, progress, result
                    , range.start < 100 ? 100 : range.start
                    , startShift, range.end < origin.Count ? range.end : origin.Count);
                // 해당 범위의 첫 번째 가중치 시작 싱크 조절
                if (result.Count > index)
                    result[index].start = range.start * 10;
            }
            progress.Set(0);
            return result;
        }
        */
        /*
        public static void GetShifts(
        		List<double> origin
        	,	List<double> target
        	,   WebProgress progress
        	,	List<SyncShift> result
        	,	int startPos
        	,	int startShift
        	,	int limitOfOrigin
        	)
        {
            Console.WriteLine("GetShifts: {0}, {1}", startPos, startShift);

            int pos = startPos;
            int shift = startShift;

            progress.Set((double)pos / origin.Count);

            if (shift > 0
                ? ((pos + 500 < limitOfOrigin) && (pos + shift + 500 < target.Count))
                : ((pos + 500 < target.Count) && (pos - shift + 500 < limitOfOrigin))
                )
            {
                Console.WriteLine("pos: " + pos);

                double minAvg = 0;
                double minPoint = MAX_POINT;
                int minAdd = 0;
                bool doPlus = true, doMinus = true;

                // 맨 앞 100개 표준편차 제일 적은 값 구하기
                for (int add = 0;
                    //add < 5000;
                    //(add + shift < 30000) &&
                    //(add - shift < 30000) &&
                    (pos + shift + add < target.Count - 500) &&
                    (pos - shift + add < limitOfOrigin - 500);
                    add++)
                {
                    List<double> ratios = new List<double>();
                    double avg, point;

                    // + 방향
                    if (doPlus)
                    {
                        ratios = new List<double>();
                        //*
                        for (int i = 0; i < CHECK_RANGE
                            && pos + add + i < limitOfOrigin
                            && pos + shift + i >= 0
                            && pos + shift + i < target.Count; i++)
                        /* /
                        for (int i = 0; i < CHECK_RANGE &&
                            pos + i < limitOfOrigin &&
                            (
                                (doMinus = (doMinus && (pos + shift + add + i >= 0)))
                             || (doPlus = (doPlus && (pos + shift + add + i < target.Count)))
                            ); i++)
                        //* /
                        {
                            ratios.Add(Math.Log10((origin[pos + i] + 0.000001) / (target[pos + shift + add + i] + 0.000001)));
                        }
                        avg = MathFunc.Avg(ratios.ToArray());
                        point = MathFunc.StDev(ratios.ToArray(), avg);
                        //Console.WriteLine(shift + "+" + add + ": " + point);
                        if (point < minPoint)
                        {
                            minAvg = avg;
                            minPoint = point;
                            minAdd = add;
                            if (point == 0.0)
                            {
                                break;
                            }
                        }
                        else if (point > minPoint * 20)
                        {
                            doPlus = false;
                            if (!doMinus)
                            {
                                break;
                            }
                        }
                    }

                    // - 방향
                    if (doMinus && add > 0)
                    {
                        ratios = new List<double>();
                        for (int i = 0; i < CHECK_RANGE
                            && pos + add + i < limitOfOrigin
                            && pos + shift + i >= 0
                            && pos + shift + i < target.Count; i++)
                        {
                            ratios.Add(Math.Log10((origin[pos + add + i] + 0.000001) / (target[pos + shift + i] + 0.000001)));
                        }
                        avg = MathFunc.Avg(ratios.ToArray());
                        point = MathFunc.StDev(ratios.ToArray(), avg);
                        //Console.WriteLine(shift + "-" + add + ": " + point);
                        if (point < minPoint)
                        {
                            minAvg = avg;
                            minPoint = point;
                            minAdd = -add;
                            if (point == 0.0)
                            {
                                break;
                            }
                        }
                        else if (point > minPoint * 20)
                        {
                            doMinus = false;
                            if (!doPlus)
                            {
                                break;
                            }
                        }
                    }
                }

                Console.WriteLine(pos + ": " + minAdd + ": " + minAvg + ": " + minPoint);

                if (minPoint == MAX_POINT)
                {
                    Console.WriteLine(pos + " + " + (CHECK_RANGE - 50));
                    pos += CHECK_RANGE - 50;
                }
                else
                {
                    shift += minAdd;
                    if (result.Count == 0)
                    {
                        // 최초 1회는 무조건
                        result.Add(new SyncShift(shift > 0 ? 0 : -shift * 10, shift * 10));
                    }
                    else
                    {
                        SyncShift lastShift = result[result.Count - 1];
                        if (minAdd > 0)
                        {
                            if (result.Count == 0 || shift * 10 < lastShift.shift - 20 || shift * 10 > lastShift.shift + 20)
                                if (pos * 10 < lastShift.start + 5000)
                                {
                                    lastShift.shift = shift * 10;
                                    if (result.Count == 1)
                                        lastShift.start = 0;
                                }
                                else
                                {
                                    result.Add(new SyncShift(pos * 10, shift * 10));
                                }
                        }
                        else if (minAdd < 0)
                        {
                            if (result.Count == 0 || shift * 10 < lastShift.shift - 20 || shift * 10 > lastShift.shift + 20)
                                if (pos * 10 < lastShift.start + 5000)
                                {
                                    lastShift.shift = shift * 10;
                                }
                                else
                                {
                                    pos -= minAdd / 2;
                                    result.Add(new SyncShift(pos * 10, shift * 10));
                                }
                        }
                    }

                    // 현재 가중치가 어디까지 이어질지 구하기
                    double limit = Math.Max(minPoint * 12, 0.0001);
                    //double limit = Math.Max(minPoint * 10, 0.0001); // 6시그마(???
                    //double limit = MAX_POINT * 1;
                    //double limit = 0.4;
                    int count = 0, countStart = 0;
                    int i = pos + 10;
                    double v = 0;
                    int oShift, tShift;

                    if (shift > 0)
                    {
                        oShift = 0;
                        tShift = shift;
                    }
                    else
                    {
                        oShift = -shift;
                        tShift = 0;
                    }

                    while (i + oShift < limitOfOrigin && i + tShift < target.Count)
                    {
                        v = Math.Abs(Math.Log10((origin[i + oShift] + 0.000001) / (target[i + tShift] + 0.000001)) - minAvg);
                        if (v > limit)
                        {
                            Console.WriteLine(i + ": " + v + " / " + limit);
                            if (count == 0) countStart = i;
                            if (++count >= 5) break;
                        }
                        else if (count > 0)
                            count = 0;
                        i++;

                        if (i % 100 == 0)
                        {
                            progress.Set((double)i / origin.Count);
                        }
                    }
                    Console.WriteLine(v + " > " + limit);
                    pos = i;
                }

                GetShifts(origin, target, progress, result, pos, shift, limitOfOrigin);
            }
        }
        */

        // 원래 키프레임도 보려고 했는데...
        // 생각보다 키프레임이 화면전환에 안 맞는 경우가 많음
        /*
        public static List<SyncShift> GetFrameShifts(
        		List<double> oKfs
        	,	List<double> tKfs
        	,	List<SyncShift> sShifts
        	)
        {
            List<double> shiftOkfs = new List<double>();
            int index = 0;
            for (int i = 0; i < sShifts.Count; i++)
            {
                int shift = sShifts[i].shift;
                int limit = (i + 1 < sShifts.Count) ? sShifts[i + 1].start : int.MaxValue;

                for (; index < oKfs.Count && oKfs[index] < limit; index++)
                {
                    double v = oKfs[index] + shift;
                    while (shiftOkfs.Count > 0 && shiftOkfs[shiftOkfs.Count - 1] > v)
                        shiftOkfs.RemoveAt(shiftOkfs.Count - 1);
                    shiftOkfs.Add(v);
                }
            }
            oKfs = shiftOkfs;

            List<SyncShift> fShifts = new List<SyncShift>();
            index = 0;
            double LIMIT = 0.1;
            foreach (double kf in oKfs)
            {
                Console.WriteLine(kf);

                double maxMinus = -LIMIT;
                double minPlus = LIMIT;
                double t = 0;

                for (; index < tKfs.Count && (t = tKfs[index] - kf) < 0; index++)
                    maxMinus = t;

                if (index < tKfs.Count)
                    minPlus = tKfs[index] - kf;

                if (maxMinus > -LIMIT)
                {
                    if (minPlus < LIMIT && minPlus < -maxMinus)
                    {
                        fShifts.Add(new SyncShift((int)(1000 * kf), (int)(1000 * minPlus)));
                    }
                    else
                    {
                        fShifts.Add(new SyncShift((int)(1000 * kf), (int)(1000 * maxMinus)));
                    }
                }
                else
                {
                    if (minPlus < LIMIT)
                    {
                        fShifts.Add(new SyncShift((int)(1000 * kf), (int)(1000 * minPlus)));
                    }
                }
            }
            SyncShift[] result = fShifts.ToArray();
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
                    max = Math.Max(max, shift);
                    min = Math.Min(min, shift);
                }
                fShifts.Add(new SyncShift(result[i + 2].start, ((sum - min - max) / 3)));
            }
            if (fShifts.Count == 0)
                fShifts.Add(new SyncShift(0, 0));

            return fShifts;
        }
        */
    }
}
