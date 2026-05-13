using System;
using System.Collections.Generic;
using UnityEngine;
using ActiveMinigameKind = EchoesOfResonance.EchoSystem.ResonanceCalculator.ActiveMinigameKind;
using PerformanceTier = EchoesOfResonance.EchoSystem.ResonanceCalculator.PerformanceTier;

namespace EchoesOfResonance.EchoSystem
{
    /// <summary>
    /// Scene-facing resonance orchestration: minigames, Echo Drift catch-up, Quick Care, happiness nudges,
    /// automatic evolution, and passive daily caps. Minigames / ranch UI call these APIs — no canvas work here.
    /// </summary>
    public sealed class ResonanceSystem : MonoBehaviour
    {
        public static ResonanceSystem Instance { get; private set; }

        [Header("Catalog")]
        [Tooltip("Drag starter EchoData assets here — keyed by EchoId at runtime.")]
        [SerializeField] List<EchoData> echoCatalog = new List<EchoData>();

        [Header("RNG")]
        [SerializeField] bool useDeterministicSeed;
        [SerializeField] int deterministicSeed = 12345;

        readonly Dictionary<string, EchoData> _catalogById = new Dictionary<string, EchoData>(StringComparer.Ordinal);
        System.Random _seededRandom;

        /// <summary>Fired after any resonance totals change (drift, quick care, minigames).</summary>
        public event Action<PlayerEcho> OnResonanceChanged;

        public event Action<PlayerEcho> OnHappinessChanged;

        /// <summary>Emitted after automatic evolution applies stat bonuses + stage advance.</summary>
        public event Action<PlayerEcho, EvolutionPath, EvolutionBranch> OnEvolutionTriggered;

        /// <summary>Fired when passive daily budget trims gains (drift / quick care).</summary>
        public event Action<PlayerEcho> OnPassiveDailySoftCapReached;

        /// <summary>Hook inventory / VFX when drift rolls a bonus shard.</summary>
        public event Action<PlayerEcho> OnDriftBonusMemoryShardRolled;

        void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            RebuildCatalogDictionary();
            _seededRandom = useDeterministicSeed ? new System.Random(deterministicSeed) : new System.Random();
        }

        void OnDestroy()
        {
            if (Instance == this)
                Instance = null;
        }

        /// <summary>Editor / runtime refresh when catalog ScriptableObjects change.</summary>
        public void RebuildCatalogDictionary()
        {
            _catalogById.Clear();
            foreach (EchoData data in echoCatalog)
            {
                if (data == null || string.IsNullOrEmpty(data.EchoId))
                    continue;
                _catalogById[data.EchoId] = data;
            }
        }

        System.Random GetRng(System.Random overrideRng) => overrideRng ?? _seededRandom;

        public EchoData ResolveEchoData(PlayerEcho echo)
        {
            if (echo == null || string.IsNullOrEmpty(echo.EchoDataId))
                return null;
            _catalogById.TryGetValue(echo.EchoDataId, out EchoData data);
            return data;
        }

        /// <summary>Let progression systems ping after XP level-ups — auto evolution uses resonance gates.</summary>
        public void NotifyEchoProgressChanged(PlayerEcho echo, EchoData speciesData)
        {
            if (echo == null)
                return;

            speciesData ??= ResolveEchoData(echo);
            echo.UpdatePersonality(speciesData);
            TryEvolveAfterProgress(echo, speciesData);
        }

        /// <summary>Active minigame payout — ignores passive daily cap; tier obeys max 100 session points (+ tiny Perfect bonus).</summary>
        public void ApplyMinigameSession(PlayerEcho echo, EchoData speciesData, ActiveMinigameKind kind,
            PerformanceTier tier, System.Random rng = null)
        {
            if (echo == null)
                return;

            speciesData ??= ResolveEchoData(echo);
            rng = GetRng(rng);

            int sessionTotal = ResonanceCalculator.RollMinigameSessionTotalPoints(tier, rng);
            float traitMul = ResonanceCalculator.GetPersonalityMinigameMultiplier(echo.PersonalityTrait, kind);
            sessionTotal = Mathf.RoundToInt(sessionTotal * traitMul);
            sessionTotal = Mathf.Clamp(sessionTotal, 0, ResonanceCalculator.MinigameSessionPointsMax);

            ResonanceCalculator.BuildMinigameSessionAxisDeltas(kind, tier, sessionTotal, rng, out int joy,
                out int discipline, out int courage, out int harmony);

            echo.AddResonance(joy, discipline, courage, harmony, out int overflow);
            echo.TouchInteractionUtcNow();

            if (overflow > 0)
            {
                // Design hook: convert overflow resonance into bonus XP or happiness — wire when economy lands.
            }

            echo.UpdatePersonality(speciesData);
            TryEvolveAfterProgress(echo, speciesData);

            OnResonanceChanged?.Invoke(echo);
        }

        /// <summary>
        /// Offline-friendly Echo Drift catch-up: rolls hourly gains with happiness + bias + optional focus,
        /// respects passive soft cap, rolls bonus shards, nudges happiness if neglected.
        /// </summary>
        public void ApplyEchoDriftCatchUp(PlayerEcho echo, EchoData speciesData, DateTime utcNow,
            System.Random rng = null)
        {
            if (echo == null)
                return;

            speciesData ??= ResolveEchoData(echo);
            rng = GetRng(rng);

            if (echo.LastDriftSettlementUtcTicks <= 0)
                echo.LastDriftSettlementUtcTicks =
                    echo.LastInteractionUtcTicks > 0 ? echo.LastInteractionUtcTicks : utcNow.Ticks;

            ApplyNeglectHappinessNudge(echo, utcNow);

            var driftAnchor = new DateTime(echo.LastDriftSettlementUtcTicks, DateTimeKind.Utc);
            double rawHours = (utcNow - driftAnchor).TotalHours;
            if (rawHours <= 0d)
                return;

            int hoursToSim = Mathf.Min(Mathf.FloorToInt((float)rawHours),
                ResonanceCalculator.MaxDriftCatchUpHours);

            bool warnedSoftCap = false;

            for (int h = 0; h < hoursToSim; h++)
            {
                ResonanceCalculator.RollEchoDriftHourlyAxisDeltas(in echo.Resonance, echo.Happiness / PlayerEcho.MaxHappiness,
                    echo.DriftFocus, rng, out int joy, out int discipline, out int courage, out int harmony);

                int requested = joy + discipline + courage + harmony;
                ResonanceCalculator.TryConsumePassiveDailyBudget(echo, requested, utcNow, out int granted);

                if (granted < requested && requested > 0)
                {
                    ResonanceCalculator.ScaleAxisIntsToTargetSum(ref joy, ref discipline, ref courage, ref harmony,
                        granted);
                    if (!warnedSoftCap)
                    {
                        warnedSoftCap = true;
                        OnPassiveDailySoftCapReached?.Invoke(echo);
                    }
                }

                if (granted <= 0 && requested > 0)
                    break;

                echo.AddResonance(joy, discipline, courage, harmony);

                if (ResonanceCalculator.RollDriftBonusMemoryShard(rng))
                    OnDriftBonusMemoryShardRolled?.Invoke(echo);
            }

            echo.LastDriftSettlementUtcTicks = utcNow.Ticks;
            echo.TouchInteractionUtcNow();

            echo.UpdatePersonality(speciesData);
            TryEvolveAfterProgress(echo, speciesData);

            OnResonanceChanged?.Invoke(echo);
        }

        /// <summary>Applies Echo Drift using <see cref="DateTime.UtcNow"/>.</summary>
        public void ApplyEchoDriftCatchUp(PlayerEcho echo, EchoData speciesData = null, System.Random rng = null)
        {
            ApplyEchoDriftCatchUp(echo, speciesData, DateTime.UtcNow, rng);
        }

        /// <summary>Very light tap interaction — cooldown + passive soft cap.</summary>
        public bool TryQuickCare(PlayerEcho echo, EchoData speciesData, DateTime utcNow, System.Random rng = null)
        {
            if (echo == null)
                return false;

            speciesData ??= ResolveEchoData(echo);
            rng = GetRng(rng);

            if (echo.LastQuickCareUtcTicks > 0)
            {
                var last = new DateTime(echo.LastQuickCareUtcTicks, DateTimeKind.Utc);
                if ((utcNow - last).TotalHours < ResonanceCalculator.QuickCareCooldownHours)
                    return false;
            }

            ResonanceCalculator.RollQuickCareAxisDeltas(rng, out int joy, out int discipline, out int courage,
                out int harmony);

            int requested = joy + discipline + courage + harmony;
            ResonanceCalculator.TryConsumePassiveDailyBudget(echo, requested, utcNow, out int granted);

            if (granted < requested && requested > 0)
                ResonanceCalculator.ScaleAxisIntsToTargetSum(ref joy, ref discipline, ref courage, ref harmony, granted);

            if (granted <= 0 && requested > 0)
            {
                OnPassiveDailySoftCapReached?.Invoke(echo);
                return false;
            }

            echo.AddResonance(joy, discipline, courage, harmony);
            echo.LastQuickCareUtcTicks = utcNow.Ticks;
            echo.TouchInteractionUtcNow();

            echo.UpdatePersonality(speciesData);
            TryEvolveAfterProgress(echo, speciesData);

            OnResonanceChanged?.Invoke(echo);
            return true;
        }

        public bool TryQuickCare(PlayerEcho echo, EchoData speciesData = null, System.Random rng = null)
        {
            return TryQuickCare(echo, speciesData, DateTime.UtcNow, rng);
        }

        void ApplyNeglectHappinessNudge(PlayerEcho echo, DateTime utcNow)
        {
            double idleHours =
                (utcNow - echo.GetLastInteractionUtc()).TotalHours;
            if (idleHours < 0d)
                idleHours = 0d;

            float delta = ResonanceCalculator.ComputeNeglectHappinessDeltaHoursIdle(idleHours);
            delta = Mathf.Clamp(delta, -12f, 0f);

            if (Mathf.Approximately(delta, 0f))
                return;

            echo.SetHappiness(echo.Happiness + delta);
            OnHappinessChanged?.Invoke(echo);
        }

        void TryEvolveAfterProgress(PlayerEcho echo, EchoData speciesData)
        {
            if (speciesData == null)
                return;

            if (!echo.CheckForEvolution(speciesData, applyEvolution: true, out EvolutionBranch branch))
                return;

            OnEvolutionTriggered?.Invoke(echo, branch.Path, branch);
            echo.UpdatePersonality(speciesData);
        }

        /// <summary>
        /// PvP resonance gains are intentionally deferred — future duels can call a dedicated API once netcode exists.
        /// See <see cref="ResonanceCalculator.StubPvPResonanceGain_NotImplemented"/>.
        /// </summary>
        public void StubPvPMatches_NotImplementedYet()
        {
            ResonanceCalculator.StubPvPResonanceGain_NotImplemented();
        }
    }
}
