namespace EchoesOfResonance.API.Models.Dtos;

/// <summary>API contract aligned with frontend <c>PlayerSnapshot</c>.</summary>
public class PlayerEchoDto
{
    public int Version { get; set; } = 1;
    public CurrentEchoDto? CurrentEcho { get; set; }
    public int Joy { get; set; }
    public int Discipline { get; set; }
    public int Courage { get; set; }
    public int Harmony { get; set; }
    public int KeeperLevel { get; set; } = 1;
    public int ResonanceShards { get; set; }
    public int PetCount { get; set; }
    public int Happiness { get; set; } = 100;
    public long LastInteractionAt { get; set; }
    public int PassivePointsToday { get; set; }
    public string PassiveDayKey { get; set; } = string.Empty;
    public string DriftFocus { get; set; } = "joy";
    public LastQuickCareDto LastQuickCareAt { get; set; } = new();

    /// <summary>Echo ids unlocked for keeper (Phase 6).</summary>
    public List<string> UnlockedEchoIds { get; set; } = ["fluffling_web"];

    public int EchoDanceCompletions { get; set; }

    public int PeakTotalResonanceAsFluffling { get; set; }
}
