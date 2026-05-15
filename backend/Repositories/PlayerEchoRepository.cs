using EchoesOfResonance.API.Data;
using EchoesOfResonance.API.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace EchoesOfResonance.API.Repositories;

public class PlayerEchoRepository(AppDbContext db) : IPlayerEchoRepository
{
    public async Task<Player?> GetPlayerByExternalIdAsync(string externalId, CancellationToken cancellationToken = default)
    {
        return await db.Players
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.ExternalId == externalId, cancellationToken);
    }

    public async Task<PlayerEcho?> GetEchoByPlayerExternalIdAsync(string externalId, CancellationToken cancellationToken = default)
    {
        return await db.PlayerEchoes
            .Include(e => e.Player)
            .FirstOrDefaultAsync(e => e.Player.ExternalId == externalId, cancellationToken);
    }

    public async Task<Player> EnsurePlayerAsync(string externalId, CancellationToken cancellationToken = default)
    {
        var existing = await db.Players.FirstOrDefaultAsync(p => p.ExternalId == externalId, cancellationToken);
        if (existing is not null)
        {
            return existing;
        }

        var player = new Player
        {
            Id = Guid.NewGuid(),
            ExternalId = externalId,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        db.Players.Add(player);
        await db.SaveChangesAsync(cancellationToken);
        return player;
    }

    public async Task<PlayerEcho> UpsertEchoAsync(PlayerEcho echo, CancellationToken cancellationToken = default)
    {
        var tracked = await db.PlayerEchoes
            .FirstOrDefaultAsync(e => e.PlayerId == echo.PlayerId, cancellationToken);

        echo.UpdatedAt = DateTimeOffset.UtcNow;

        if (tracked is null)
        {
            echo.Id = echo.Id == Guid.Empty ? Guid.NewGuid() : echo.Id;
            echo.CreatedAt = DateTimeOffset.UtcNow;
            db.PlayerEchoes.Add(echo);
        }
        else
        {
            tracked.EchoDataId = echo.EchoDataId;
            tracked.DisplayName = echo.DisplayName;
            tracked.Joy = echo.Joy;
            tracked.Discipline = echo.Discipline;
            tracked.Courage = echo.Courage;
            tracked.Harmony = echo.Harmony;
            tracked.KeeperLevel = echo.KeeperLevel;
            tracked.ResonanceShards = echo.ResonanceShards;
            tracked.PetCount = echo.PetCount;
            tracked.Happiness = echo.Happiness;
            tracked.LastInteractionUtc = echo.LastInteractionUtc;
            tracked.PassivePointsToday = echo.PassivePointsToday;
            tracked.PassiveDayKey = echo.PassiveDayKey;
            tracked.DriftFocus = echo.DriftFocus;
            tracked.LastQuickCarePet = echo.LastQuickCarePet;
            tracked.LastQuickCareFeed = echo.LastQuickCareFeed;
            tracked.LastQuickCareEncourage = echo.LastQuickCareEncourage;
            tracked.UnlockedEchoIdsJson = echo.UnlockedEchoIdsJson;
            tracked.UpdatedAt = echo.UpdatedAt;
            echo = tracked;
        }

        await db.SaveChangesAsync(cancellationToken);
        return echo;
    }
}
