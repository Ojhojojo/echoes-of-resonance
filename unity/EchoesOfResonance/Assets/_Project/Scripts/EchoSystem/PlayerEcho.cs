using System;
using System.Collections.Generic;
using UnityEngine;

namespace EchoesOfResonance.EchoSystem
{
    /// <summary>
    /// Per-player Echo instance: levels, bond axes, evolution state, and care metadata.
    /// Marked <see cref="Serializable"/> for Unity inspector and JsonUtility; future JSON saves can mirror the same fields.
    /// </summary>
    [Serializable]
    public class PlayerEcho
    {
        public const float MinHappiness = 0f;
        public const float MaxHappiness = 100f;

        [Tooltip("Unique save id (GUID string recommended).")]
        public string UniqueId;

        [Tooltip("Matches EchoData.EchoId")]
        public string EchoDataId;

        [Tooltip("Keeper-chosen nickname.")]
        public string CurrentName;

        [Min(1)] public int CurrentLevel = 1;
        [Min(0)] public int CurrentExperience;

        public ResonanceProfile Resonance;

        public EvolutionStage CurrentStage = EvolutionStage.Base;

        /// <summary>Set automatically when evolution resolves — reflects the active morph branch.</summary>
        public EvolutionPath CurrentEvolutionPath = EvolutionPath.None;

        public Stats CurrentStats;

        /// <summary>Food id for bonus feeds (Bond Feast / Quick Care). Not required to appear in EchoData favorites.</summary>
        public string FavoriteFood = string.Empty;

        public PersonalityTrait PersonalityTrait = PersonalityTrait.Unset;

        [Range(MinHappiness, MaxHappiness)]
        public float Happiness = MaxHappiness;

        /// <summary>UTC ticks for Echo Drift / neglect checks. Serializable across serializers.</summary>
        public long LastInteractionUtcTicks;

        /// <summary>Last time passive Echo Drift grants were simulated (offline catch-up anchor).</summary>
        public long LastDriftSettlementUtcTicks;

        /// <summary>Cooldown anchor for Quick Care (UTC ticks).</summary>
        public long LastQuickCareUtcTicks;

        /// <summary>Optional drift emphasis — surfaced on ranch UI later.</summary>
        public DriftFocusMode DriftFocus = DriftFocusMode.Balanced;

        /// <summary>UTC calendar key (<c>yyyy-MM-dd</c>) aligned with <see cref="PassiveResonanceGrantedToday"/>.</summary>
        public string PassiveResonanceDailyCapUtcDateKey = string.Empty;

        /// <summary>Passive resonance points granted today (Echo Drift + Quick Care) toward the soft cap.</summary>
        public int PassiveResonanceGrantedToday;

        public List<string> UnlockedMemoryShards = new List<string>();

        /// <summary>True if this Echo is not already at a terminal stage.</summary>
        public bool CanEvolve() => CurrentStage != EvolutionStage.Final;

        /// <summary>True when an automatic evolution branch is eligible (level + resonance gates + fit scoring).</summary>
        public bool CanEvolve(EchoData definition, out EvolutionBranch matchedBranch)
        {
            return ResonanceCalculator.TrySelectAutomaticEvolutionBranch(this, definition, out matchedBranch);
        }

        public bool CanEvolve(EchoData definition) => CanEvolve(definition, out _);

        /// <summary>Evaluates automatic evolution. When <paramref name="applyEvolution"/> is true, applies stats + stage advance.</summary>
        public bool CheckForEvolution(EchoData definition, bool applyEvolution, out EvolutionBranch branch)
        {
            branch = null;
            if (definition == null || !CanEvolve())
                return false;

            if (!ResonanceCalculator.TrySelectAutomaticEvolutionBranch(this, definition, out EvolutionBranch chosen))
                return false;

            branch = chosen;
            return !applyEvolution || ApplyEvolution(branch);
        }

        /// <summary>Commits evolution bonuses after automatic branch selection.</summary>
        public bool ApplyEvolution(EvolutionBranch branch)
        {
            if (branch == null || !CanEvolve())
                return false;

            CurrentEvolutionPath = branch.Path;
            CurrentStats = CurrentStats + branch.StatBonuses;
            AdvanceEvolutionStage();
            return true;
        }

        /// <summary>Derives <see cref="PersonalityTrait"/> from dominant resonance (ties broken by species affinity).</summary>
        public void UpdatePersonality(EchoData speciesDefinition)
        {
            ResonanceAxis dominant = speciesDefinition != null
                ? ResonanceCalculator.GetDominantAxis(Resonance, speciesDefinition.PrimaryAffinity,
                    speciesDefinition.SecondaryAffinity)
                : ResonanceCalculator.GetDominantAxis(Resonance);

            PersonalityTrait = ResonanceCalculator.MapDominantAxisToPersonality(dominant);
        }

        /// <summary>Ranch aura tint driven by dominant axis.</summary>
        public Color GetAuraColor(EchoData speciesDefinition)
        {
            var dominant = speciesDefinition != null
                ? GetDominantAxis(speciesDefinition)
                : ResonanceCalculator.GetDominantAxis(Resonance);
            return ResonanceCalculator.GetAuraColor(dominant);
        }

        /// <summary>Muted aura when neglected / dissonance messaging.</summary>
        public Color GetNeglectedAuraTint(EchoData speciesDefinition)
        {
            var dominant = speciesDefinition != null
                ? GetDominantAxis(speciesDefinition)
                : ResonanceCalculator.GetDominantAxis(Resonance);
            return ResonanceCalculator.GetNeglectedAuraTint(dominant);
        }

        public ResonanceAxis GetDominantAxis(EchoData speciesDefinition)
        {
            if (speciesDefinition != null)
                return ResonanceCalculator.GetDominantAxis(Resonance, speciesDefinition.PrimaryAffinity,
                    speciesDefinition.SecondaryAffinity);
            return ResonanceCalculator.GetDominantAxis(Resonance);
        }

        void AdvanceEvolutionStage()
        {
            switch (CurrentStage)
            {
                case EvolutionStage.Base:
                    CurrentStage = EvolutionStage.Stage1;
                    break;
                case EvolutionStage.Stage1:
                    CurrentStage = EvolutionStage.Stage2;
                    break;
                case EvolutionStage.Stage2:
                    CurrentStage = EvolutionStage.Final;
                    break;
            }
        }

        /// <summary>Adds resonance to one axis, clamping to design cap. <paramref name="overflow"/> can feed bonus XP / happiness later.</summary>
        public void AddResonance(ResonanceAxis axis, int delta, out int overflow)
        {
            Resonance = Resonance.AddToAxis(axis, delta, out overflow);
        }

        public void AddResonance(ResonanceAxis axis, int delta)
        {
            AddResonance(axis, delta, out _);
        }

        /// <summary>Batch apply with per-axis clamping — convenience for drift/minigame payloads.</summary>
        public void AddResonance(int joyDelta, int disciplineDelta, int courageDelta, int harmonyDelta,
            out int totalOverflow)
        {
            totalOverflow = 0;
            AddResonance(ResonanceAxis.Joy, joyDelta, out int o0);
            totalOverflow += o0;
            AddResonance(ResonanceAxis.Discipline, disciplineDelta, out int o1);
            totalOverflow += o1;
            AddResonance(ResonanceAxis.Courage, courageDelta, out int o2);
            totalOverflow += o2;
            AddResonance(ResonanceAxis.Harmony, harmonyDelta, out int o3);
            totalOverflow += o3;
        }

        public void AddResonance(int joyDelta, int disciplineDelta, int courageDelta, int harmonyDelta)
        {
            AddResonance(joyDelta, disciplineDelta, courageDelta, harmonyDelta, out _);
        }

        public float GetResonanceAxisPercentage(ResonanceAxis axis) => Resonance.GetAxisPercentage(axis);

        public float GetResonanceOverallPercentage() => Resonance.GetOverallPercentage();

        public DateTime GetLastInteractionUtc()
        {
            return new DateTime(LastInteractionUtcTicks, DateTimeKind.Utc);
        }

        public void SetLastInteractionUtc(DateTime utc)
        {
            LastInteractionUtcTicks = utc.ToUniversalTime().Ticks;
        }

        public void TouchInteractionUtcNow() => SetLastInteractionUtc(DateTime.UtcNow);

        public void SetHappiness(float value)
        {
            Happiness = Mathf.Clamp(value, MinHappiness, MaxHappiness);
        }

        /// <summary>Creates a new instance with ids, baseline stats, and resonance clamped from template.</summary>
        public static PlayerEcho CreateFromEchoData(EchoData data, string displayName, string uniqueId = null)
        {
            if (data == null) throw new ArgumentNullException(nameof(data));

            string id = string.IsNullOrEmpty(uniqueId) ? Guid.NewGuid().ToString("N") : uniqueId;

            return new PlayerEcho
            {
                UniqueId = id,
                EchoDataId = data.EchoId,
                CurrentName = string.IsNullOrEmpty(displayName) ? data.DisplayName : displayName,
                CurrentLevel = 1,
                CurrentExperience = 0,
                Resonance = new ResonanceProfile().Clamped(),
                CurrentStage = EvolutionStage.Base,
                CurrentEvolutionPath = EvolutionPath.None,
                CurrentStats = data.BaseStats,
                FavoriteFood = string.Empty,
                PersonalityTrait = PersonalityTrait.Unset,
                Happiness = MaxHappiness,
                LastInteractionUtcTicks = DateTime.UtcNow.Ticks,
                LastDriftSettlementUtcTicks = DateTime.UtcNow.Ticks,
                LastQuickCareUtcTicks = 0,
                DriftFocus = DriftFocusMode.Balanced,
                PassiveResonanceDailyCapUtcDateKey = string.Empty,
                PassiveResonanceGrantedToday = 0,
                UnlockedMemoryShards = new List<string>(),
            };
        }
    }
}
