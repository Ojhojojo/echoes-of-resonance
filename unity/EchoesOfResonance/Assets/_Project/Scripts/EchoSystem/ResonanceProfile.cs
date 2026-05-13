using System;
using UnityEngine;

namespace EchoesOfResonance.EchoSystem
{
    /// <summary>
    /// Which resonance axis is being read or modified. Matches the four training pillars.
    /// </summary>
    public enum ResonanceAxis
    {
        Joy = 0,
        Discipline = 1,
        Courage = 2,
        Harmony = 3,
    }

    /// <summary>
    /// Four-axis bond state. Each axis is clamped to <see cref="MaxAxisValue"/> (1000).
    /// Serializable for inspector, save data, and networking.
    /// </summary>
    [Serializable]
    public struct ResonanceProfile
    {
        public const int MinAxisValue = 0;
        public const int MaxAxisValue = 1000;

        [Range(MinAxisValue, MaxAxisValue)] public int Joy;
        [Range(MinAxisValue, MaxAxisValue)] public int Discipline;
        [Range(MinAxisValue, MaxAxisValue)] public int Courage;
        [Range(MinAxisValue, MaxAxisValue)] public int Harmony;

        /// <summary>Returns a copy with all axes clamped to [0, 1000].</summary>
        public ResonanceProfile Clamped()
        {
            return new ResonanceProfile
            {
                Joy = ClampAxis(Joy),
                Discipline = ClampAxis(Discipline),
                Courage = ClampAxis(Courage),
                Harmony = ClampAxis(Harmony),
            };
        }

        /// <summary>Adds delta to one axis, clamps the axis, returns overflow (amount that could not fit).</summary>
        public ResonanceProfile AddToAxis(ResonanceAxis axis, int delta, out int overflow)
        {
            int current = GetAxis(axis);
            long sum = (long)current + delta;
            int clamped = ClampAxis((int)sum);
            overflow = delta >= 0
                ? Math.Max(0, (int)sum - MaxAxisValue)
                : Math.Max(0, MinAxisValue - (int)sum);

            var copy = this;
            copy.SetAxis(axis, clamped);
            return copy;
        }

        /// <summary>0–1 fill level for a single axis.</summary>
        public float GetAxisPercentage(ResonanceAxis axis)
        {
            return GetAxis(axis) / (float)MaxAxisValue;
        }

        /// <summary>Mean of the four axis percentages (0–1).</summary>
        public float GetOverallPercentage()
        {
            return (GetAxisPercentage(ResonanceAxis.Joy)
                    + GetAxisPercentage(ResonanceAxis.Discipline)
                    + GetAxisPercentage(ResonanceAxis.Courage)
                    + GetAxisPercentage(ResonanceAxis.Harmony)) * 0.25f;
        }

        /// <summary>Sum of all axes (design max 4000).</summary>
        public int GetTotalSum()
        {
            return Joy + Discipline + Courage + Harmony;
        }

        /// <summary>Returns 1 when all axes are equal, lower when spread increases (for balanced evolution paths).</summary>
        public float GetBalanceMetric01()
        {
            int max = Mathf.Max(Joy, Discipline, Courage, Harmony);
            int min = Mathf.Min(Joy, Discipline, Courage, Harmony);
            return 1f - (max - min) / (float)MaxAxisValue;
        }

        /// <summary>True if every axis meets or exceeds the requirement minimums.</summary>
        public bool MeetsMinimums(in ResonanceRequirements requirements)
        {
            return Joy >= requirements.MinJoy
                   && Discipline >= requirements.MinDiscipline
                   && Courage >= requirements.MinCourage
                   && Harmony >= requirements.MinHarmony;
        }

        public int GetAxis(ResonanceAxis axis)
        {
            switch (axis)
            {
                case ResonanceAxis.Joy: return Joy;
                case ResonanceAxis.Discipline: return Discipline;
                case ResonanceAxis.Courage: return Courage;
                case ResonanceAxis.Harmony: return Harmony;
                default: return Joy;
            }
        }

        public void SetAxis(ResonanceAxis axis, int value)
        {
            value = ClampAxis(value);
            switch (axis)
            {
                case ResonanceAxis.Joy: Joy = value; break;
                case ResonanceAxis.Discipline: Discipline = value; break;
                case ResonanceAxis.Courage: Courage = value; break;
                case ResonanceAxis.Harmony: Harmony = value; break;
            }
        }

        static int ClampAxis(int value)
        {
            if (value < MinAxisValue) return MinAxisValue;
            if (value > MaxAxisValue) return MaxAxisValue;
            return value;
        }
    }
}
