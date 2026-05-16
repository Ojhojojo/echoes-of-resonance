namespace EchoesOfResonance.API.Domain.Entities;

/// <summary>Runtime Echo state for one player (MVP: single Fluffling per keeper).</summary>
public class PlayerEcho
{
    public Guid Id { get; set; }
    public Guid PlayerId { get; set; }
    public Player Player { get; set; } = null!;

    public string EchoDataId { get; set; } = "fluffling_web";
    public string DisplayName { get; set; } = "Fluffling";

    public int Joy { get; set; }
    public int Discipline { get; set; }
    public int Courage { get; set; }
    public int Harmony { get; set; }

    public int KeeperLevel { get; set; } = 1;
    public int ResonanceShards { get; set; }
    public int PetCount { get; set; }
    public int Happiness { get; set; } = 100;

    public DateTimeOffset LastInteractionUtc { get; set; }
    public int PassivePointsToday { get; set; }
    public string PassiveDayKey { get; set; } = string.Empty;
    public string DriftFocus { get; set; } = "joy";

    public long LastQuickCarePet { get; set; }
    public long LastQuickCareFeed { get; set; }
    public long LastQuickCareEncourage { get; set; }

    /// <summary>JSON array of echo ids, e.g. <c>["fluffling_web"]</c>.</summary>
    public string UnlockedEchoIdsJson { get; set; } = "[\"fluffling_web\"]";

    /// <summary>Times Echo Dance finished successfully (session complete).</summary>
    public int EchoDanceCompletions { get; set; }

    /// <summary>Peak sum of four resonance axes while the active echo was Fluffling (reserved for future progression).</summary>
    public int PeakTotalResonanceAsFluffling { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
