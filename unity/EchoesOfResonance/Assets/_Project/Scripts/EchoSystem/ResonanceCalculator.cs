using System;
using System.Collections.Generic;
using UnityEngine;

namespace EchoesOfResonance.EchoSystem
{
    /// <summary>
    /// Pure resonance math: minigame payouts, Echo Drift hourly rolls, evolution fit scoring,
    /// dominant axis / aura colors, and personality mapping. No scene state — callers supply data + RNG.
    /// </summary>
    public static class ResonanceCalculator
    {
        #region Design constants

        public const int MinigameSessionPointsMax = 100;
        public const int EchoDriftPointsPerHourMin = 12;
        public const int EchoDriftPointsPerHourMax = 28;
        public const float EchoDriftDominantBias = 1.4f;
        public const float EchoDriftOppositeBias = 0.6f;
        /// <summary>Daily soft cap for passive-style gains (Echo Drift + Quick Care), Stardew-style pacing.</summary>
        public const int PassiveDailyResonanceSoftCap = 250;
        public const float QuickCareCooldownHours = 4f;
        public const int QuickCareTotalPointsMin = 10;
        public const int QuickCareTotalPointsMax = 20;
        /// <summary>Hours away before gentle happiness nudge from neglect.</summary>
        public const float NeglectHappinessGraceHours = 42f;
        /// <summary>Small dip applied once per neglect window resolution (not a death spiral).</summary>
        public const float NeglectHappinessPenalty = 6f;
        /// <summary>Tiny Perfect-tier sprinkle onto secondary axis.</summary>
        public const int PerfectTierSecondaryBonus = 5;
        /// <summary>Max simulated drift hours per catch-up for mobile CPU + anti-exploit.</summary>
        public const int MaxDriftCatchUpHours = 72;
        /// <summary>Rare balanced paths — axes within ~85% even spread metric.</summary>
        public const float PrismBalanceMetricThreshold = 0.85f;

        #endregion

        #region Minigames

        public enum PerformanceTier
        {
            Poor = 0,
            Good = 1,
            Excellent = 2,
            Perfect = 3,
        }

        public enum ActiveMinigameKind
        {
            EchoDance,
            RiftExploration,
            HarmonyGarden,
            DisciplineCircuit,
            BondFeast,
            /// <summary>Stub — hook combat pacing later.</summary>
            EchoSpar,
        }

        /// <summary>Rolled session total before caps (already inside tier band).</summary>
        public static int RollMinigameSessionTotalPoints(PerformanceTier tier, System.Random rng)
        {
            rng ??= new System.Random();
            GetTierPointRange(tier, out int min, out int max);
            return rng.Next(min, max + 1);
        }

        public static void GetTierPointRange(PerformanceTier tier, out int min, out int max)
        {
            switch (tier)
            {
                case PerformanceTier.Poor:
                    min = 30; max = 50; break;
                case PerformanceTier.Good:
                    min = 60; max = 79; break;
                case PerformanceTier.Excellent:
                    min = 80; max = 94; break;
                case PerformanceTier.Perfect:
                    min = 95; max = MinigameSessionPointsMax; break;
                default:
                    min = 30; max = 50; break;
            }
        }

        /// <summary>Returns primary axis, optional secondary, and whether primaries should split evenly (Bond Feast).</summary>
        public static void GetMinigameAxes(
            ActiveMinigameKind kind,
            out ResonanceAxis primary,
            out ResonanceAxis secondary,
            out bool splitPrimaryPairEvenly)
        {
            splitPrimaryPairEvenly = false;
            secondary = ResonanceAxis.Harmony;
            switch (kind)
            {
                case ActiveMinigameKind.EchoDance:
                    primary = ResonanceAxis.Joy;
                    secondary = ResonanceAxis.Harmony;
                    break;
                case ActiveMinigameKind.RiftExploration:
                    primary = ResonanceAxis.Courage;
                    secondary = ResonanceAxis.Joy;
                    break;
                case ActiveMinigameKind.HarmonyGarden:
                    primary = ResonanceAxis.Harmony;
                    secondary = ResonanceAxis.Discipline;
                    break;
                case ActiveMinigameKind.DisciplineCircuit:
                    primary = ResonanceAxis.Discipline;
                    secondary = ResonanceAxis.Courage;
                    break;
                case ActiveMinigameKind.BondFeast:
                    primary = ResonanceAxis.Joy;
                    secondary = ResonanceAxis.Harmony;
                    splitPrimaryPairEvenly = true;
                    break;
                case ActiveMinigameKind.EchoSpar:
                    primary = ResonanceAxis.Courage;
                    secondary = ResonanceAxis.Discipline;
                    break;
                default:
                    primary = ResonanceAxis.Joy;
                    break;
            }
        }

        /// <summary>
        /// Builds integer deltas per axis for one minigame session (already capped per-axis by caller).
        /// Perfect tier adds a small secondary sprinkle when applicable.
        /// </summary>
        public static void BuildMinigameSessionAxisDeltas(
            ActiveMinigameKind kind,
            PerformanceTier tier,
            int sessionTotalPoints,
            System.Random rng,
            out int joy,
            out int discipline,
            out int courage,
            out int harmony)
        {
            rng ??= new System.Random();
            joy = discipline = courage = harmony = 0;

            GetMinigameAxes(kind, out ResonanceAxis p, out ResonanceAxis s, out bool evenSplit);

            int secondaryBonus = tier == PerformanceTier.Perfect ? PerfectTierSecondaryBonus : 0;

            if (evenSplit)
            {
                int half = sessionTotalPoints / 2;
                int rem = sessionTotalPoints - half * 2;
                AddToAxis(ref joy, ref discipline, ref courage, ref harmony, p, half + rem);
                AddToAxis(ref joy, ref discipline, ref courage, ref harmony, s, half);
                if (secondaryBonus > 0)
                    AddToAxis(ref joy, ref discipline, ref courage, ref harmony, s, secondaryBonus);
                return;
            }

            float primaryWeight = 0.65f;
            int primaryPts = Mathf.RoundToInt(sessionTotalPoints * primaryWeight);
            int secondaryPts = sessionTotalPoints - primaryPts;
            AddToAxis(ref joy, ref discipline, ref courage, ref harmony, p, primaryPts);
            AddToAxis(ref joy, ref discipline, ref courage, ref harmony, s, secondaryPts);

            if (secondaryBonus > 0)
                AddToAxis(ref joy, ref discipline, ref courage, ref harmony, s, secondaryBonus);
        }

        static void AddToAxis(ref int joy, ref int discipline, ref int courage, ref int harmony, ResonanceAxis axis, int delta)
        {
            switch (axis)
            {
                case ResonanceAxis.Joy: joy += delta; break;
                case ResonanceAxis.Discipline: discipline += delta; break;
                case ResonanceAxis.Courage: courage += delta; break;
                case ResonanceAxis.Harmony: harmony += delta; break;
            }
        }

        #endregion

        #region Echo Drift & Quick Care

        /// <summary>Opposite pairing: Joy↔Discipline, Courage↔Harmony.</summary>
        public static ResonanceAxis GetOppositeAxis(ResonanceAxis axis)
        {
            switch (axis)
            {
                case ResonanceAxis.Joy: return ResonanceAxis.Discipline;
                case ResonanceAxis.Discipline: return ResonanceAxis.Joy;
                case ResonanceAxis.Courage: return ResonanceAxis.Harmony;
                case ResonanceAxis.Harmony: return ResonanceAxis.Courage;
                default: return ResonanceAxis.Joy;
            }
        }

        public static float HappinessToPassiveGainMultiplier(float happiness01)
        {
            happiness01 = Mathf.Clamp01(happiness01);
            return 0.75f + happiness01 * 0.5f;
        }

        /// <summary>
        /// One hour of Echo Drift: random 12–28 base, happiness multiplier, dominant/opposite bias,
        /// optional focus emphasis (mobile-friendly discrete rolls).
        /// </summary>
        public static void RollEchoDriftHourlyAxisDeltas(
            in ResonanceProfile profile,
            float happiness01,
            DriftFocusMode focus,
            System.Random rng,
            out int joy,
            out int discipline,
            out int courage,
            out int harmony)
        {
            rng ??= new System.Random();
            joy = discipline = courage = harmony = 0;

            int baseGain = rng.Next(EchoDriftPointsPerHourMin, EchoDriftPointsPerHourMax + 1);
            float happinessMul = HappinessToPassiveGainMultiplier(happiness01);
            int total = Mathf.Max(1, Mathf.RoundToInt(baseGain * happinessMul));

            ResonanceAxis dominant = GetDominantAxis(profile);
            ResonanceAxis opposite = GetOppositeAxis(dominant);

            float wJoy = 1f, wDisc = 1f, wCour = 1f, wHarm = 1f;

            ApplyAxisWeight(ref wJoy, ResonanceAxis.Joy, dominant, opposite);
            ApplyAxisWeight(ref wDisc, ResonanceAxis.Discipline, dominant, opposite);
            ApplyAxisWeight(ref wCour, ResonanceAxis.Courage, dominant, opposite);
            ApplyAxisWeight(ref wHarm, ResonanceAxis.Harmony, dominant, opposite);

            ApplyDriftFocusWeights(focus, ref wJoy, ref wDisc, ref wCour, ref wHarm);

            NormalizeWeights(ref wJoy, ref wDisc, ref wCour, ref wHarm);

            float sumW = wJoy + wDisc + wCour + wHarm;
            if (sumW < 0.0001f)
                sumW = 1f;

            float nJoy = wJoy / sumW;
            float nDisc = wDisc / sumW;
            float nCour = wCour / sumW;
            float nHarm = wHarm / sumW;

            joy = discipline = courage = harmony = 0;
            float c0 = nJoy;
            float c1 = c0 + nDisc;
            float c2 = c1 + nCour;
            float c3 = c2 + nHarm;

            for (int i = 0; i < total; i++)
            {
                float pick = (float)rng.NextDouble();
                if (pick < c0) joy++;
                else if (pick < c1) discipline++;
                else if (pick < c2) courage++;
                else harmony++;
            }
        }

        static void ApplyAxisWeight(ref float w, ResonanceAxis axis, ResonanceAxis dominant, ResonanceAxis opposite)
        {
            if (axis == dominant) w *= EchoDriftDominantBias;
            else if (axis == opposite) w *= EchoDriftOppositeBias;
        }

        static void ApplyDriftFocusWeights(DriftFocusMode focus, ref float wJoy, ref float wDisc, ref float wCour, ref float wHarm)
        {
            const float emphasis = 1.35f;
            switch (focus)
            {
                case DriftFocusMode.Balanced:
                    break;
                case DriftFocusMode.EmphasizeJoy:
                    wJoy *= emphasis;
                    break;
                case DriftFocusMode.EmphasizeDiscipline:
                    wDisc *= emphasis;
                    break;
                case DriftFocusMode.EmphasizeCourage:
                    wCour *= emphasis;
                    break;
                case DriftFocusMode.EmphasizeHarmony:
                    wHarm *= emphasis;
                    break;
            }
        }

        static void NormalizeWeights(ref float wJoy, ref float wDisc, ref float wCour, ref float wHarm)
        {
            float min = Mathf.Min(wJoy, wDisc, wCour, wHarm);
            if (min < 0.001f)
            {
                wJoy = Mathf.Max(wJoy, 0.05f);
                wDisc = Mathf.Max(wDisc, 0.05f);
                wCour = Mathf.Max(wCour, 0.05f);
                wHarm = Mathf.Max(wHarm, 0.05f);
            }
        }

        public static void RollQuickCareAxisDeltas(System.Random rng, out int joy, out int discipline, out int courage, out int harmony)
        {
            rng ??= new System.Random();
            joy = discipline = courage = harmony = 0;
            int total = rng.Next(QuickCareTotalPointsMin, QuickCareTotalPointsMax + 1);
            for (int i = 0; i < total; i++)
            {
                var axis = (ResonanceAxis)rng.Next(4);
                AddToAxis(ref joy, ref discipline, ref courage, ref harmony, axis, 1);
            }
        }

        /// <summary>Rolling chance for bonus loot during drift — hook inventory later.</summary>
        public static bool RollDriftBonusMemoryShard(System.Random rng, float chance01 = 0.02f)
        {
            rng ??= new System.Random();
            return rng.NextDouble() < chance01;
        }

        /// <summary>PvP Resonance gains (future): winning online battles grants +30–60 total distributed by battle style.</summary>
        public static void StubPvPResonanceGain_NotImplemented()
        {
            // Intentionally empty — wire when social duels ship.
        }

        #endregion

        #region Happiness & neglect

        /// <summary>Returns happiness delta (typically negative) once per long idle window.</summary>
        public static float ComputeNeglectHappinessDeltaHoursIdle(double hoursIdle)
        {
            if (hoursIdle < NeglectHappinessGraceHours) return 0f;
            float waves = (float)((hoursIdle - NeglectHappinessGraceHours) / 24.0);
            return -NeglectHappinessPenalty * Mathf.Clamp(waves, 1f, 4f);
        }

        #endregion

        #region Dominant axis & visuals

        public static ResonanceAxis GetDominantAxis(in ResonanceProfile profile)
        {
            int max = -1;
            max = Mathf.Max(max, profile.Joy);
            max = Mathf.Max(max, profile.Discipline);
            max = Mathf.Max(max, profile.Courage);
            max = Mathf.Max(max, profile.Harmony);

            bool tieJoy = profile.Joy == max;
            bool tieDisc = profile.Discipline == max;
            bool tieCour = profile.Courage == max;
            bool tieHarm = profile.Harmony == max;
            int tieCount = (tieJoy ? 1 : 0) + (tieDisc ? 1 : 0) + (tieCour ? 1 : 0) + (tieHarm ? 1 : 0);

            if (tieCount != 1)
                return ResonanceAxis.Joy;

            if (tieJoy) return ResonanceAxis.Joy;
            if (tieDisc) return ResonanceAxis.Discipline;
            if (tieCour) return ResonanceAxis.Courage;
            return ResonanceAxis.Harmony;
        }

        /// <summary>Use when multiple axes tie for max — prefers tieBreaker affinity from EchoData.</summary>
        public static ResonanceAxis GetDominantAxis(in ResonanceProfile profile, ResonanceAxis tieBreakerPrimary, ResonanceAxis tieBreakerSecondary)
        {
            int max = Mathf.Max(profile.Joy, profile.Discipline, profile.Courage, profile.Harmony);

            var tops = new List<ResonanceAxis>(4);
            if (profile.Joy == max) tops.Add(ResonanceAxis.Joy);
            if (profile.Discipline == max) tops.Add(ResonanceAxis.Discipline);
            if (profile.Courage == max) tops.Add(ResonanceAxis.Courage);
            if (profile.Harmony == max) tops.Add(ResonanceAxis.Harmony);

            if (tops.Count == 1) return tops[0];
            if (tops.Contains(tieBreakerPrimary)) return tieBreakerPrimary;
            if (tops.Contains(tieBreakerSecondary)) return tieBreakerSecondary;
            return tops[0];
        }

        /// <summary>Ranch aura tint — soft mobile-friendly colors.</summary>
        public static Color GetAuraColor(ResonanceAxis axis)
        {
            switch (axis)
            {
                case ResonanceAxis.Joy:
                    return new Color(1f, 0.72f, 0.35f, 0.85f);
                case ResonanceAxis.Discipline:
                    return new Color(0.45f, 0.62f, 1f, 0.85f);
                case ResonanceAxis.Courage:
                    return new Color(1f, 0.38f, 0.38f, 0.85f);
                case ResonanceAxis.Harmony:
                    return new Color(0.48f, 0.92f, 0.58f, 0.85f);
                default:
                    return new Color(0.85f, 0.85f, 0.95f, 0.6f);
            }
        }

        /// <summary>Muted tint hint for dissonance / neglect feedback.</summary>
        public static Color GetNeglectedAuraTint(ResonanceAxis axis)
        {
            Color c = GetAuraColor(axis);
            return Color.Lerp(c, new Color(0.35f, 0.35f, 0.42f, c.a), 0.55f);
        }

        #endregion

        #region Personality

        public static PersonalityTrait MapDominantAxisToPersonality(ResonanceAxis dominant)
        {
            switch (dominant)
            {
                case ResonanceAxis.Joy: return PersonalityTrait.Playful;
                case ResonanceAxis.Discipline: return PersonalityTrait.Calm;
                case ResonanceAxis.Courage: return PersonalityTrait.Bold;
                case ResonanceAxis.Harmony: return PersonalityTrait.Loyal;
                default: return PersonalityTrait.Unset;
            }
        }

        /// <summary>Light mechanical bias (+/- a few %) — extend per trait when combat/dialogue hooks land.</summary>
        public static float GetPersonalityMinigameMultiplier(PersonalityTrait trait, ActiveMinigameKind kind)
        {
            if (trait == PersonalityTrait.Playful && kind == ActiveMinigameKind.EchoDance)
                return 1.08f;
            if (trait == PersonalityTrait.Calm && kind == ActiveMinigameKind.HarmonyGarden)
                return 1.06f;
            if (trait == PersonalityTrait.Bold && kind == ActiveMinigameKind.RiftExploration)
                return 1.06f;
            if (trait == PersonalityTrait.Loyal && kind == ActiveMinigameKind.BondFeast)
                return 1.06f;
            return 1f;
        }

        #endregion

        #region Evolution (automatic)

        /// <summary>Selects the evolution branch that best fits the profile among qualifying branches.</summary>
        public static bool TrySelectAutomaticEvolutionBranch(PlayerEcho echo, EchoData definition, out EvolutionBranch chosen)
        {
            chosen = null;
            if (echo == null || definition == null || !echo.CanEvolve())
                return false;

            IReadOnlyList<EvolutionBranch> branches = definition.PossibleEvolutions;
            if (branches == null || branches.Count == 0)
                return false;

            float bestScore = float.MinValue;

            for (int i = 0; i < branches.Count; i++)
            {
                EvolutionBranch b = branches[i];
                if (b == null || b.Path == EvolutionPath.None) continue;
                if (echo.CurrentLevel < b.RequiredLevel) continue;

                ResonanceRequirements req = b.ResonanceRequirements.Clamped();
                if (!echo.Resonance.MeetsMinimums(req))
                    continue;

                if (!PassesBalancedPathGate(b.Path, echo.Resonance))
                    continue;

                float score = ScoreEvolutionFit(in echo.Resonance, b.Path, in req);
                if (score > bestScore)
                {
                    bestScore = score;
                    chosen = b;
                }
            }

            return chosen != null;
        }

        static bool PassesBalancedPathGate(EvolutionPath path, in ResonanceProfile resonance)
        {
            if (!IsBalancedEvolutionPath(path))
                return true;

            return resonance.GetBalanceMetric01() >= PrismBalanceMetricThreshold;
        }

        static bool IsBalancedEvolutionPath(EvolutionPath path)
        {
            return path == EvolutionPath.Prismflame;
        }

        /// <summary>Higher score = stronger thematic alignment with how the Echo was raised.</summary>
        public static float ScoreEvolutionFit(in ResonanceProfile resonance, EvolutionPath path, in ResonanceRequirements metRequirements)
        {
            Vector4 affinity = GetPathAffinity(path);
            Vector4 values = new Vector4(
                resonance.Joy / (float)ResonanceProfile.MaxAxisValue,
                resonance.Discipline / (float)ResonanceProfile.MaxAxisValue,
                resonance.Courage / (float)ResonanceProfile.MaxAxisValue,
                resonance.Harmony / (float)ResonanceProfile.MaxAxisValue);

            affinity.Normalize();
            float alignment = Vector4.Dot(values, affinity) * 100f;

            float margin = (resonance.Joy - metRequirements.MinJoy)
                           + (resonance.Discipline - metRequirements.MinDiscipline)
                           + (resonance.Courage - metRequirements.MinCourage)
                           + (resonance.Harmony - metRequirements.MinHarmony);

            float balanceBoost = IsBalancedEvolutionPath(path)
                ? resonance.GetBalanceMetric01() * 40f
                : 0f;

            return alignment + margin * 0.05f + balanceBoost;
        }

        /// <summary>Designer-facing affinity weights per path (extend when lore locks).</summary>
        static Vector4 GetPathAffinity(EvolutionPath path)
        {
            switch (path)
            {
                case EvolutionPath.PranksterInferno:
                    return new Vector4(0.45f, 0.08f, 0.42f, 0.05f);
                case EvolutionPath.BlazingGuardian:
                    return new Vector4(0.15f, 0.18f, 0.62f, 0.05f);
                case EvolutionPath.HearthSpirit:
                    return new Vector4(0.42f, 0.08f, 0.05f, 0.45f);
                case EvolutionPath.Prismflame:
                    return new Vector4(0.25f, 0.25f, 0.25f, 0.25f);

                case EvolutionPath.TidalSerenade:
                    return new Vector4(0.18f, 0.08f, 0.05f, 0.69f);
                case EvolutionPath.AbyssWarden:
                    return new Vector4(0.08f, 0.35f, 0.45f, 0.12f);
                case EvolutionPath.CoralCanticle:
                    return new Vector4(0.35f, 0.08f, 0.08f, 0.49f);
                case EvolutionPath.DepthMonarch:
                    return new Vector4(0.12f, 0.48f, 0.15f, 0.25f);

                case EvolutionPath.GroveScholar:
                    return new Vector4(0.12f, 0.58f, 0.08f, 0.22f);
                case EvolutionPath.VerdantWarden:
                    return new Vector4(0.08f, 0.42f, 0.22f, 0.28f);
                case EvolutionPath.BloomSymphony:
                    return new Vector4(0.28f, 0.28f, 0.08f, 0.36f);
                case EvolutionPath.WorldRoot:
                    return new Vector4(0.22f, 0.52f, 0.08f, 0.18f);

                case EvolutionPath.StormRunner:
                    return new Vector4(0.12f, 0.28f, 0.52f, 0.08f);
                case EvolutionPath.CircuitSaint:
                    return new Vector4(0.08f, 0.48f, 0.18f, 0.26f);
                case EvolutionPath.PlasmaTrickster:
                    return new Vector4(0.38f, 0.22f, 0.35f, 0.05f);
                case EvolutionPath.HeavenBolt:
                    return new Vector4(0.18f, 0.22f, 0.52f, 0.08f);

                default:
                    return new Vector4(0.25f, 0.25f, 0.25f, 0.25f);
            }
        }

        #endregion

        #region Passive daily bucket

        public static bool TryConsumePassiveDailyBudget(PlayerEcho echo, int requestedPoints, DateTime utcNow, out int grantedPoints)
        {
            grantedPoints = 0;
            if (requestedPoints <= 0)
                return true;

            EnsurePassiveBucketForDate(echo, utcNow);

            int room = Mathf.Max(0, PassiveDailyResonanceSoftCap - echo.PassiveResonanceGrantedToday);
            grantedPoints = Mathf.Min(requestedPoints, room);
            echo.PassiveResonanceGrantedToday += grantedPoints;

            return grantedPoints > 0 || requestedPoints == 0;
        }

        public static void EnsurePassiveBucketForDate(PlayerEcho echo, DateTime utcNow)
        {
            string key = utcNow.Date.ToString("yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture);
            if (echo.PassiveResonanceDailyCapUtcDateKey != key)
            {
                echo.PassiveResonanceDailyCapUtcDateKey = key;
                echo.PassiveResonanceGrantedToday = 0;
            }
        }

        /// <summary>Resize discrete axis gains to match an approved passive budget total without rounding drift.</summary>
        public static void ScaleAxisIntsToTargetSum(ref int joy, ref int discipline, ref int courage, ref int harmony, int targetSum)
        {
            int sum = joy + discipline + courage + harmony;
            if (targetSum <= 0)
            {
                joy = discipline = courage = harmony = 0;
                return;
            }

            if (sum <= 0)
            {
                joy = discipline = courage = 0;
                harmony = targetSum;
                return;
            }

            float scale = targetSum / (float)sum;
            joy = Mathf.RoundToInt(joy * scale);
            discipline = Mathf.RoundToInt(discipline * scale);
            courage = Mathf.RoundToInt(courage * scale);
            harmony = Mathf.RoundToInt(harmony * scale);

            int roundedSum = joy + discipline + courage + harmony;
            int diff = targetSum - roundedSum;
            if (diff != 0)
                PushRemainder(ref joy, ref discipline, ref courage, ref harmony, diff);
        }

        static void PushRemainder(ref int joy, ref int discipline, ref int courage, ref int harmony, int diff)
        {
            while (diff != 0)
            {
                if (diff > 0)
                {
                    ResonanceAxis axis = LargestAxis(joy, discipline, courage, harmony);
                    IncAxis(ref joy, ref discipline, ref courage, ref harmony, axis, 1);
                    diff--;
                }
                else
                {
                    ResonanceAxis axis = LargestAxis(joy, discipline, courage, harmony);
                    IncAxis(ref joy, ref discipline, ref courage, ref harmony, axis, -1);
                    diff++;
                }
            }
        }

        static ResonanceAxis LargestAxis(int joy, int discipline, int courage, int harmony)
        {
            int max = Mathf.Max(joy, discipline, courage, harmony);
            if (joy == max) return ResonanceAxis.Joy;
            if (discipline == max) return ResonanceAxis.Discipline;
            if (courage == max) return ResonanceAxis.Courage;
            return ResonanceAxis.Harmony;
        }

        static void IncAxis(ref int joy, ref int discipline, ref int courage, ref int harmony, ResonanceAxis axis, int delta)
        {
            switch (axis)
            {
                case ResonanceAxis.Joy:
                    joy = Mathf.Max(0, joy + delta);
                    break;
                case ResonanceAxis.Discipline:
                    discipline = Mathf.Max(0, discipline + delta);
                    break;
                case ResonanceAxis.Courage:
                    courage = Mathf.Max(0, courage + delta);
                    break;
                case ResonanceAxis.Harmony:
                    harmony = Mathf.Max(0, harmony + delta);
                    break;
            }
        }

        #endregion
    }

    /// <summary>Optional Echo Drift emphasis — keeps passive gains readable on mobile UI.</summary>
    public enum DriftFocusMode
    {
        Balanced = 0,
        EmphasizeJoy = 1,
        EmphasizeDiscipline = 2,
        EmphasizeCourage = 3,
        EmphasizeHarmony = 4,
    }
}
