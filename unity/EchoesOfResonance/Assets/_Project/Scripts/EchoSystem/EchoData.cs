using System.Collections.Generic;
using UnityEngine;

namespace EchoesOfResonance.EchoSystem
{
    /// <summary>
    /// Static definition for one Echo species / form family. Author one asset per starter (Fluffling, Droplet, etc.).
    /// Runtime state lives in <see cref="PlayerEcho"/> and references <see cref="EchoId"/>.
    /// </summary>
    [CreateAssetMenu(fileName = "EchoData", menuName = "Echoes of Resonance/Echo Data", order = 0)]
    public class EchoData : ScriptableObject
    {
        [Tooltip("Stable key for saves and lookups, e.g. fluffling_01")]
        [SerializeField] string echoId;

        [SerializeField] string displayName;

        [SerializeField] Sprite baseSprite;

        [SerializeField] ElementType element = ElementType.None;

        [SerializeField] RarityType rarity = RarityType.Common;

        [Tooltip("Natural lean from design docs (e.g. Fluffling → Joy).")]
        [SerializeField] ResonanceAxis primaryAffinity = ResonanceAxis.Joy;

        [SerializeField] ResonanceAxis secondaryAffinity = ResonanceAxis.Harmony;

        [SerializeField] Stats baseStats;

        [Tooltip("Food item ids this lineage prefers (Bond Feast / Quick Care).")]
        [SerializeField] List<string> favoriteFoods = new List<string>();

        [Tooltip("Branches available from this form. Filled per species in the editor.")]
        [SerializeField] List<EvolutionBranch> possibleEvolutions = new List<EvolutionBranch>();

        public string EchoId => echoId;
        public string DisplayName => displayName;
        public Sprite BaseSprite => baseSprite;
        public ElementType Element => element;
        public RarityType Rarity => rarity;
        public ResonanceAxis PrimaryAffinity => primaryAffinity;
        public ResonanceAxis SecondaryAffinity => secondaryAffinity;
        public Stats BaseStats => baseStats;
        public IReadOnlyList<string> FavoriteFoods => favoriteFoods;
        public IReadOnlyList<EvolutionBranch> PossibleEvolutions => possibleEvolutions;
    }
}
