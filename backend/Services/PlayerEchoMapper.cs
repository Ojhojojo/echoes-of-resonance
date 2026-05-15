using System.Text.Json;
using EchoesOfResonance.API.Domain.Entities;
using EchoesOfResonance.API.Models.Dtos;

namespace EchoesOfResonance.API.Services;

public static class PlayerEchoMapper
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public const string DefaultUnlockEchoIdsJson = """["fluffling_web"]""";

    public static PlayerEchoDto ToDto(PlayerEcho entity)
    {
        return new PlayerEchoDto
        {
            Version = 1,
            CurrentEcho = new CurrentEchoDto
            {
                EchoId = entity.EchoDataId,
                DisplayName = entity.DisplayName,
            },
            Joy = entity.Joy,
            Discipline = entity.Discipline,
            Courage = entity.Courage,
            Harmony = entity.Harmony,
            KeeperLevel = entity.KeeperLevel,
            ResonanceShards = entity.ResonanceShards,
            PetCount = entity.PetCount,
            Happiness = entity.Happiness,
            LastInteractionAt = entity.LastInteractionUtc.ToUnixTimeMilliseconds(),
            PassivePointsToday = entity.PassivePointsToday,
            PassiveDayKey = entity.PassiveDayKey,
            DriftFocus = entity.DriftFocus,
            LastQuickCareAt = new LastQuickCareDto
            {
                Pet = entity.LastQuickCarePet,
                Feed = entity.LastQuickCareFeed,
                Encourage = entity.LastQuickCareEncourage,
            },
            UnlockedEchoIds = DeserializeUnlockIds(entity.UnlockedEchoIdsJson),
            EchoDanceCompletions = Math.Max(0, entity.EchoDanceCompletions),
            PeakTotalResonanceAsFluffling = Math.Max(0, entity.PeakTotalResonanceAsFluffling),
        };
    }

    public static PlayerEcho ToEntity(PlayerEchoDto dto, Player player, PlayerEcho? existing = null)
    {
        var entity = existing ?? new PlayerEcho
        {
            Id = Guid.NewGuid(),
            PlayerId = player.Id,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        entity.PlayerId = player.Id;
        entity.EchoDataId = dto.CurrentEcho?.EchoId ?? "fluffling_web";
        entity.DisplayName = dto.CurrentEcho?.DisplayName ?? "Fluffling";
        entity.Joy = ResonanceService.ClampAxis(dto.Joy);
        entity.Discipline = ResonanceService.ClampAxis(dto.Discipline);
        entity.Courage = ResonanceService.ClampAxis(dto.Courage);
        entity.Harmony = ResonanceService.ClampAxis(dto.Harmony);
        entity.KeeperLevel = Math.Max(1, dto.KeeperLevel);
        entity.ResonanceShards = Math.Max(0, dto.ResonanceShards);
        entity.PetCount = Math.Max(0, dto.PetCount);
        entity.Happiness = ResonanceService.ClampHappiness(dto.Happiness);
        entity.LastInteractionUtc = DateTimeOffset.FromUnixTimeMilliseconds(dto.LastInteractionAt);
        entity.PassivePointsToday = Math.Max(0, dto.PassivePointsToday);
        entity.PassiveDayKey = string.IsNullOrWhiteSpace(dto.PassiveDayKey)
            ? DateTimeOffset.UtcNow.UtcDateTime.ToString("yyyy-MM-dd")
            : dto.PassiveDayKey;
        entity.DriftFocus = string.IsNullOrWhiteSpace(dto.DriftFocus) ? "joy" : dto.DriftFocus;
        entity.LastQuickCarePet = dto.LastQuickCareAt?.Pet ?? 0;
        entity.LastQuickCareFeed = dto.LastQuickCareAt?.Feed ?? 0;
        entity.LastQuickCareEncourage = dto.LastQuickCareAt?.Encourage ?? 0;
        entity.UnlockedEchoIdsJson = SerializeUnlockIds(dto.UnlockedEchoIds);
        entity.EchoDanceCompletions = Math.Max(0, dto.EchoDanceCompletions);
        entity.PeakTotalResonanceAsFluffling = Math.Max(0, dto.PeakTotalResonanceAsFluffling);

        return entity;
    }

    public static PlayerEcho CreateDefaultFluffling(Player player)
    {
        var now = DateTimeOffset.UtcNow;
        return new PlayerEcho
        {
            Id = Guid.NewGuid(),
            PlayerId = player.Id,
            EchoDataId = "fluffling_web",
            DisplayName = "Fluffling",
            Happiness = 100,
            KeeperLevel = 1,
            DriftFocus = "joy",
            PassiveDayKey = now.UtcDateTime.ToString("yyyy-MM-dd"),
            LastInteractionUtc = now,
            CreatedAt = now,
            UpdatedAt = now,
            UnlockedEchoIdsJson = DefaultUnlockEchoIdsJson,
        };
    }

    public static List<string> DeserializeUnlockIds(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return ["fluffling_web"];
        }

        try
        {
            var list = JsonSerializer.Deserialize<List<string>>(json, JsonOptions);
            if (list is not { Count: > 0 })
            {
                return ["fluffling_web"];
            }

            if (!list.Any(static id => string.Equals(id, "fluffling_web", StringComparison.OrdinalIgnoreCase)))
            {
                list.Insert(0, "fluffling_web");
            }

            return list;
        }
        catch (JsonException)
        {
            return ["fluffling_web"];
        }
    }

    private static string SerializeUnlockIds(IReadOnlyList<string>? ids)
    {
        var safe = ids is not { Count: > 0 }
            ? new List<string> { "fluffling_web" }
            : ids.Distinct().Where(s => !string.IsNullOrWhiteSpace(s)).Select(s => s.Trim()).ToList();
        if (safe.Count == 0)
        {
            safe.Add("fluffling_web");
        }

        if (!safe.Any(static id => string.Equals(id, "fluffling_web", StringComparison.OrdinalIgnoreCase)))
        {
            safe.Insert(0, "fluffling_web");
        }

        return JsonSerializer.Serialize(safe, JsonOptions);
    }
}
