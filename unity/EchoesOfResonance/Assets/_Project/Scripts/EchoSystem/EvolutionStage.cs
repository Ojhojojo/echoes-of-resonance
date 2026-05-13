namespace EchoesOfResonance.EchoSystem
{
    /// <summary>
    /// How far along the morph chain this Echo is. Drives which evolution branches are valid.
    /// </summary>
    public enum EvolutionStage
    {
        /// <summary>Hatchling / first form after egg.</summary>
        Base = 0,
        Stage1 = 1,
        Stage2 = 2,
        /// <summary>No further evolutions from static data.</summary>
        Final = 3,
    }
}
