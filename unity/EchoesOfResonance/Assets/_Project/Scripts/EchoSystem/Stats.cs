using System;
using UnityEngine;

namespace EchoesOfResonance.EchoSystem
{
    /// <summary>
    /// Combat / growth numbers. Base values live on <see cref="EchoData"/>; runtime copy on <see cref="PlayerEcho"/>.
    /// </summary>
    [Serializable]
    public struct Stats
    {
        [Min(1)] public int MaxHp;
        [Min(0)] public int Attack;
        [Min(0)] public int Defense;
        [Min(0)] public int Speed;
        /// <summary>Special / resonance-driven power — aligns with starter docs (e.g. Fluffling).</summary>
        [Min(0)] public int Spirit;

        public static Stats operator +(Stats a, Stats b)
        {
            return new Stats
            {
                MaxHp = a.MaxHp + b.MaxHp,
                Attack = a.Attack + b.Attack,
                Defense = a.Defense + b.Defense,
                Speed = a.Speed + b.Speed,
                Spirit = a.Spirit + b.Spirit,
            };
        }
    }
}
