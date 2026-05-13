namespace EchoesOfResonance.EchoSystem
{
    /// <summary>
    /// Type-safe evolution branch id. Values are grouped by starter lineage for readability.
    /// Add new paths here as designs lock — avoids stringly-typed evolution logic.
    /// </summary>
    public enum EvolutionPath
    {
        None = 0,

        // --- Fluffling (Fire / Joy) lineage ---
        PranksterInferno = 10,
        BlazingGuardian = 11,
        HearthSpirit = 12,
        Prismflame = 13,

        // --- Droplet (Water / Harmony) lineage ---
        TidalSerenade = 20,
        AbyssWarden = 21,
        CoralCanticle = 22,
        DepthMonarch = 23,

        // --- Sproutling (Nature / Discipline) lineage ---
        GroveScholar = 30,
        VerdantWarden = 31,
        BloomSymphony = 32,
        WorldRoot = 33,

        // --- Spark (Electric / Courage) lineage ---
        StormRunner = 40,
        CircuitSaint = 41,
        PlasmaTrickster = 42,
        HeavenBolt = 43,
    }
}
