using System;
using UnityEngine;

namespace EchoesOfResonance.EchoSystem
{
    /// <summary>
    /// One possible evolution outcome defined on <see cref="EchoData"/>.
    /// Runtime <see cref="PlayerEcho"/> picks a path and must satisfy level + resonance gates.
    /// </summary>
    [Serializable]
    public class EvolutionBranch
    {
        [Tooltip("Structured branch id for code, VFX, and dialogue.")]
        public EvolutionPath Path = EvolutionPath.None;

        [Min(1)]
        public int RequiredLevel = 1;

        [Tooltip("Minimum resonance per axis (each capped at 1000 in design).")]
        public ResonanceRequirements ResonanceRequirements;

        [Tooltip("Sprite shown after evolving along this branch (placeholder until art pipeline).")]
        public Sprite EvolvedSprite;

        [Tooltip("Flat stat bonuses applied when this branch is taken.")]
        public Stats StatBonuses;
    }
}
