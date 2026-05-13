using System;
using System.Collections.Generic;
using UnityEngine;

namespace EchoesOfResonance.EchoSystem
{
    /// <summary>
    /// Central catalog of <see cref="EchoData"/> ScriptableObjects for fast lookup by <c>echoId</c>.
    /// </summary>
    /// <remarks>
    /// <para><b>How to extend for new monsters</b></para>
    /// <list type="number">
    /// <item>Create a new <see cref="EchoData"/> asset (menu: Echoes of Resonance / Echo Data) under
    /// <c>Assets/_Project/Data/Echoes/</c> (or your chosen content folder).</item>
    /// <item>Assign a unique <c>echoId</c> (e.g. <c>frostling_01</c>) — this is what <see cref="PlayerEcho.EchoDataId"/> stores.</item>
    /// <item>Drag the asset into this database's <see cref="echoes"/> list, or merge via Addressables later.</item>
    /// <item>Call <see cref="RebuildLookup"/> after runtime loads if you mutate the list from code.</item>
    /// </list>
    /// <para>Optional patterns: split databases per chapter; load subsets with Addressables; or replace the list
    /// with a build pipeline that populates from a spreadsheet — keep <c>echoId</c> as the stable key.</para>
    /// </remarks>
    [CreateAssetMenu(fileName = "EchoDatabase", menuName = "Echoes of Resonance/Echo Database", order = 1)]
    public class EchoDatabase : ScriptableObject
    {
        [Tooltip("All EchoData assets known at build time. Starters are pre-linked in EchoDatabase.asset.")]
        [SerializeField] List<EchoData> echoes = new List<EchoData>();

        readonly Dictionary<string, EchoData> _byEchoId = new Dictionary<string, EchoData>(StringComparer.Ordinal);

        public IReadOnlyList<EchoData> All => echoes;

        void OnEnable()
        {
            RebuildLookup();
        }

#if UNITY_EDITOR
        void OnValidate()
        {
            RebuildLookup();
        }
#endif

        /// <summary>Rebuilds the id dictionary after editing the list in the inspector or loading content.</summary>
        public void RebuildLookup()
        {
            _byEchoId.Clear();
            foreach (EchoData data in echoes)
            {
                if (data == null || string.IsNullOrEmpty(data.EchoId))
                    continue;
                if (_byEchoId.ContainsKey(data.EchoId))
                {
                    Debug.LogWarning($"[EchoDatabase] Duplicate echoId '{data.EchoId}' on {data.name}. Later entry wins.");
                }

                _byEchoId[data.EchoId] = data;
            }
        }

        public bool TryGetByEchoId(string echoId, out EchoData data)
        {
            data = null;
            if (string.IsNullOrEmpty(echoId))
                return false;
            return _byEchoId.TryGetValue(echoId, out data);
        }

        /// <summary>Returns null when missing — use <see cref="TryGetByEchoId"/> when failure is expected.</summary>
        public EchoData GetByEchoId(string echoId)
        {
            TryGetByEchoId(echoId, out EchoData data);
            return data;
        }

        public bool TryGetForPlayerEcho(PlayerEcho echo, out EchoData data)
        {
            data = null;
            if (echo == null)
                return false;
            return TryGetByEchoId(echo.EchoDataId, out data);
        }
    }
}
