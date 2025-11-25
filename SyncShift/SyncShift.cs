using System;
using System.Collections.Generic;

namespace Jamaker
{
    public class SyncShift
    {
        public static int CHECK_RANGE = 500;
        public static double MAX_POINT = 0.5;
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
            int targetRangeStart = 0;
            List<SyncShift> shifts = new List<SyncShift>();
            foreach (Range range in ranges)
            {
                List<SyncShift> rangeShifts = GetShiftsForRange(origin, target, range, targetRangeStart, progress);
                if (rangeShifts.Count > 0)
                {
                    shifts.AddRange(rangeShifts);
                    targetRangeStart = range.end + rangeShifts[rangeShifts.Count - 1].shift;
                }
            }
            progress.Set(0);
            return shifts;
        }
        private static List<SyncShift> GetShiftsForRange(
            List<double> origin
            , List<double> target
            , Range range
            , int targetRangeStart
            , WebProgress progress)
        {
            progress.Set((double) range.start / origin.Count);

            List<SyncShift> shifts = new List<SyncShift>();
            int start = range.start;
            int shift = range.shift;
            int limitOfOrigin = Math.Min(range.end, origin.Count);

            StDev minPoint = null;
            int minShift = 0;
            bool doPlus = true, doMinus = true;

            if ((limitOfOrigin < start + CHECK_RANGE)
             || (target.Count < targetRangeStart + CHECK_RANGE))
            {
                Console.WriteLine("비교 대상이 너무 짧음");
                doPlus = doMinus = false;
            }

            for (int add = 0; (doPlus || doMinus); add++)
            {
		        if (doPlus) {
		            int tShift = shift + add;
		            if (start + tShift + CHECK_RANGE > target.Count) {
                        Console.WriteLine("탐색 범위 벗어남({0} + {1}): {2} > {3}", shift, add, (start + tShift + CHECK_RANGE), target.Count);
                        doPlus = false;
                        continue;
		            }
			        List<double> ratios = new List<double>();
			        for (int i = 0; i < CHECK_RANGE; i++) {
				        ratios.Add(Math.Log10((origin[start + i] + 0.000001) / (target[start + tShift + i] + 0.000001)));
			        }
                    StDev point = new StDev(ratios);
			        if (minPoint == null || point.value < minPoint.value) {
				        // 오차가 기존값보다 작음
				        Console.WriteLine("오차가 기존값보다 작음({0} + {1})", shift, add);
				        minPoint = point;
				        minShift = tShift;
                        Console.WriteLine(point.value);
				        if (point.value == 0.0) {
					        Console.WriteLine("완전히 일치: 정답 찾음");
					        // 완전히 일치: 정답 찾음
					        break;
				        }
			        }
                    else if (point.value > minPoint.value * 20)
                    {
                        Console.WriteLine("오차가 기존값에 비해 지나치게 큼{0} + {1})", shift, add);
                        // 오차가 기존값에 비해 지나치게 큼: 이미 정답을 찾았다고 간주
                        Console.WriteLine(point.value);
                        doPlus = false;
                    }
                }
                if (doMinus)
                {
                    int tShift = shift - add;
                    int originStart = start;
                    if (start + tShift < targetRangeStart) {
                        // 가중치 이미 확인한 영역까지 침범
                        // origin 앞쪽을 잘라내고 시작
                        originStart = targetRangeStart - tShift;
                        if (limitOfOrigin < originStart + CHECK_RANGE) {
                            Console.WriteLine("탐색 범위 벗어남({0} - {1})", shift, add);
                            doMinus = false;
                            continue;
                        }
                    }
                    List<double> ratios = new List<double>();
                    for (int i = 0; i < CHECK_RANGE; i++)
                    {
                        ratios.Add(Math.Log10((origin[originStart + i] + 0.000001) / (target[originStart + tShift + i] + 0.000001)));
                    }
                    StDev point = new StDev(ratios);
                    if (minPoint == null || point.value < minPoint.value)
                    {
                        // 오차가 기존값보다 작음
                        Console.WriteLine("오차가 기존값보다 작음({0} - {1})", shift, add);
                        minPoint = point;
                        minShift = tShift;
                        Console.WriteLine(point.value);
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
                        Console.WriteLine("오차가 기존값에 비해 지나치게 큼({0} - {1})", shift, add);
                        Console.WriteLine(point.value);
                        doMinus = false;
                    }
                }
            }

            if (minPoint == null || minPoint.value > MAX_POINT)
            {
                Console.WriteLine("찾지 못함");
                return shifts;
            }
            Console.WriteLine("최종값");
            Console.WriteLine(minPoint.value);
            shifts.Add(new SyncShift(start, shift = minShift));

            // 현재 가중치가 어디까지 이어질지 구하기
            double limit = Math.Max(minPoint.value * 12, 0.0001);
            int count = 0;
            int offset = start + 10;
            double v = 0;
            if (shift < 0) offset -= shift;

            while (offset < limitOfOrigin && offset + shift < target.Count)
            {
                v = Math.Abs(Math.Log10((origin[offset] + 0.000001) / (target[offset + shift] + 0.000001)) - minPoint.avg);
                if (v > limit)
                {
                    Console.WriteLine("{0}: {1} / {2}", offset, v, limit);
                    if (++count >= 5) break;
                }
                else if (count > 0)
                {
                    count = 0;
                }
                offset++;

                if (offset % 100 == 0)
                {
                    progress.Set((double)offset / origin.Count);
                }
            }
            Console.WriteLine("{0} > {1}", v, limit);

            // 5초 이상 남았을 때만 나머지 범위 확인
            if (offset + 500 < range.end)
            {
                shifts.AddRange(GetShiftsForRange(origin, target, new Range(offset, range.end), (offset + shift), progress));
            }

            return shifts;
        }
    }
    
    class StDev
    {
        public double avg = 0;
        public double value = 0;

        public StDev(List<double> values)
        {
        	double sum = 0;
        	double pSum = 0;
        	
            foreach (double value in values)
            {
                double pow = value * value;
                sum += value;
                pSum += pow;
            }
            
            avg = sum / values.Count;
            value = Math.Sqrt((pSum / values.Count) - (avg * avg));
        }
    }
}
