using System;
using System.Collections.Generic;
using UnityEngine;

namespace EchoesOfResonance.EchoSystem
{
    /// <summary>
    /// Runtime singleton that indexes all <see cref="EchoData"/> for lookup by <c>echoId</c>.
    /// </summary>
    /// <remarks>
    /// <para><b>Assigning real art later</b></para>
    /// <para>
    /// <see cref="EchoData"/> stores a <see cref="UnityEngine.Sprite"/> reference on each asset, not a string path.
    /// When you import final chibi sprites (see ART_STYLE_GUIDE: 512–1024 PNG, Sprite mode Single), place them under
    /// e.g. <c>Assets/_Project/Sprites/Echoes/</c>, then open each <c>Fluffling.asset</c> (etc.) in the Inspector and drag
    /// the sprite onto <b>Base Sprite</b> and each evolution branch’s <b>Evolved Sprite</b>. The current placeholders
    /// point at tiny PNGs in that folder as stand-ins for paths like <c>Sprites/Echoes/fluffling_base</c>.
    /// </para>
    /// <para><b>Usage example — create a PlayerEcho from Fluffling</b></para>
    /// <code>
    /// EchoData fluffling = EchoDatabase.Instance.GetEcho("fluffling_01");
    /// if (fluffling != null)
    /// {
    ///     PlayerEcho keeperEcho = PlayerEcho.CreateFromEchoData(fluffling, displayName: "Ember");
    ///     // keeperEcho.EchoDataId == "fluffling_01"; save keeperEcho when persistence is wired.
    /// }
    /// </code>
    /// <para><b>Extending for new monsters</b></para>
    /// <list type="number">
    /// <item>Create <b>Echo Data</b> assets (menu: Echoes of Resonance / Echo Data) with a unique <c>echoId</c>.</item>
    /// <item>Add them to <see cref="echoCatalog"/> on this component, <i>or</i> place them under
    /// <c>Assets/.../Resources/{resourcesFolderPath}/</c> so <see cref="Resources.LoadAll"/> picks them up at startup.</item>
    /// <item>If you add starters later, append their ids to <see cref="StarterEchoIds"/> (or replace with a flag on EchoData).</item>
    /// </list>
    /// </remarks>
    [DefaultExecutionOrder(-100)]
    public sealed class EchoDatabase : MonoBehaviour
    {
        public static EchoDatabase Instance { get; private set; }

        /// <summary>Stable ids for the four launch starters (matches assets in <c>Data/Echoes</c>).</summary>
        public static readonly string[] StarterEchoIds =
        {
            "fluffling_01",
            "droplet_01",
            "sproutling_01",
            "spark_01",
        };

        [Header("Primary catalog")]
        [Tooltip("Drag EchoData assets here (e.g. everything under Assets/_Project/Data/Echoes/). Required for assets outside any Resources folder.")]
        [SerializeField] List<EchoData> echoCatalog = new List<EchoData>();

        [Header("Optional Resources merge")]
        [Tooltip("If set, Awake merges Resources.LoadAll<EchoData>(this path). Create folder Assets/.../Resources/<path>/ for runtime-loaded extras.")]
        [SerializeField] string resourcesFolderPath = "EchoData";

        [Tooltip("Turn on to skip Resources.LoadAll (catalog-only mode).")]
        [SerializeField] bool skipResourcesLoad;

        readonly Dictionary<string, EchoData> _byEchoId = new Dictionary<string, EchoData>(StringComparer.Ordinal);

        void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            DontDestroyOnLoad(gameObject);
            RebuildIndex();
        }

        void OnDestroy()
        {
            if (Instance == this)
                Instance = null;
        }

#if UNITY_EDITOR
        void OnValidate()
        {
            if (Application.isPlaying && Instance == this)
                RebuildIndex();
        }
#endif

        /// <summary>Rebuilds the lookup (call after mutating <see cref="echoCatalog"/> at runtime, if ever).</summary>
        public void RebuildIndex()
        {
            _byEchoId.Clear();

            foreach (EchoData data in echoCatalog)
                Register(data);

            if (!skipResourcesLoad && !string.IsNullOrEmpty(resourcesFolderPath))
            {
                EchoData[] fromResources = Resources.LoadAll<EchoData>(resourcesFolderPath);
                foreach (EchoData data in fromResources)
                    Register(data);
            }
        }

        void Register(EchoData data)
        {
            if (data == null || string.IsNullOrEmpty(data.EchoId))
                return;

            if (_byEchoId.ContainsKey(data.EchoId))
                Debug.LogWarning($"[EchoDatabase] Duplicate echoId '{data.EchoId}' — replacing with '{data.name}'.");

            _byEchoId[data.EchoId] = data;
        }

        /// <summary>Returns the static definition for <paramref name="echoId"/>, or null if unknown.</summary>
        public EchoData GetEcho(string echoId)
        {
            if (string.IsNullOrEmpty(echoId))
                return null;
            _byEchoId.TryGetValue(echoId, out EchoData data);
            return data;
        }

        /// <summary>All registered EchoData (catalog + Resources merge). Order is not guaranteed.</summary>
        public List<EchoData> GetAllEchoes()
        {
            return new List<EchoData>(_byEchoId.Values);
        }

        /// <summary>Launch starters only, in canonical order; skips missing ids.</summary>
        public List<EchoData> GetAllStarters()
        {
            var list = new List<EchoData>(StarterEchoIds.Length);
            foreach (string id in StarterEchoIds)
            {
                if (_byEchoId.TryGetValue(id, out EchoData data))
                    list.Add(data);
            }

            return list;
        }
    }
}
