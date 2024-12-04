using System;
using System.Collections.Generic;

namespace Jamaker
{
    class StDev
    {
        public List<double> values = new List<double>();
        public List<double> pows = new List<double>();
        public double sum = 0;
        public double pSum = 0;
        public double avg = 0;
        public double value = 0;

        public StDev() { }
        public StDev(List<double> values)
        {
            for (int i = 0; i < values.Count; i++)
            {
                Add(values[i]);
            }
        }
        public void Add(double value)
        {
            var pow = value * value;
            sum += value;
            pSum += pow;
            values.Add(value);
            pows.Add(pow);
        }
        public void Replace(int index, double value)
        {
            while (index < 0)
            {
                index += values.Count;
            }
            index %= values.Count;

            var pow = value * value;
            sum += value - values[index];
            pSum += pow - pows[index];
            values[index] = value;
            pows[index] = pow;
        }

        public double GetAvg()
        {
            return sum / values.Count;
        }
        public double GetVar()
        {
            return (pSum / values.Count) - Math.Pow(GetAvg(), 2);
        }
        public StDev Calc()
        {
            avg = sum / values.Count;
            value = Math.Sqrt((pSum / values.Count) - (avg * avg));
            return this;
        }
        public static StDev From(List<double> values)
        {
            return new StDev(values).Calc();
        }
    }
}
