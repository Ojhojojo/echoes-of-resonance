using System;
using UnityEngine;

namespace EchoesOfResonance.EchoSystem
{
    /// <summary>
    /// Minimum resonance per axis required to qualify for an evolution branch.
    /// Each field is clamped to [0, <see cref="ResonanceProfile.MaxAxisValue"/>] when validated.
    /// </summary>
    [Serializable]
    public struct ResonanceRequirements
    {
        [Range(ResonanceProfile.MinAxisValue, ResonanceProfile.MaxAxisValue)]
        public int MinJoy;
        [Range(ResonanceProfile.MinAxisValue, ResonanceProfile.MaxAxisValue)]
        public int MinDiscipline;
        [Range(ResonanceProfile.MinAxisValue, ResonanceProfile.MaxAxisValue)]
        public int MinCourage;
        [Range(ResonanceProfile.MinAxisValue, ResonanceProfile.MaxAxisValue)]
        public int MinHarmony;

        /// <summary>Returns a copy with all mins clamped to valid axis range.</summary>
        public ResonanceRequirements Clamped()
        {
            return new ResonanceRequirements
            {
                MinJoy = Clamp(MinJoy),
                MinDiscipline = Clamp(MinDiscipline),
                MinCourage = Clamp(MinCourage),
                MinHarmony = Clamp(MinHarmony),
            };
        }

        static int Clamp(int v)
        {
            if (v < ResonanceProfile.MinAxisValue) return ResonanceProfile.MinAxisValue;
            if (v > ResonanceProfile.MaxAxisValue) return ResonanceProfile.MaxAxisValue;
            return v;
        }
    }
}
