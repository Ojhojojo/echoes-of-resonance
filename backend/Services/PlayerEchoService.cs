using EchoesOfResonance.API.Domain.Entities;
using EchoesOfResonance.API.Models.Dtos;
using EchoesOfResonance.API.Repositories;

namespace EchoesOfResonance.API.Services;

public sealed record QuickCareOutcome(PlayerEchoDto? Echo, long CooldownRemainingMs);

public class PlayerEchoService(
    IPlayerEchoRepository repository,
    ResonanceService resonanceService)
{
    public async Task<PlayerEchoDto> GetEchoAsync(string externalId, CancellationToken cancellationToken = default)
    {
        var echo = await repository.GetEchoByPlayerExternalIdAsync(externalId, cancellationToken);

        if (echo is null)
        {
            var player = await repository.EnsurePlayerAsync(externalId, cancellationToken);
            echo = PlayerEchoMapper.CreateDefaultFluffling(player);
            echo = await repository.UpsertEchoAsync(echo, cancellationToken);
            return PlayerEchoMapper.ToDto(echo);
        }

        var driftApplied = resonanceService.ApplyOfflineDrift(echo, DateTimeOffset.UtcNow);
        if (driftApplied > 0)
        {
            echo = await repository.UpsertEchoAsync(echo, cancellationToken);
        }

        return PlayerEchoMapper.ToDto(echo);
    }

    public async Task<PlayerEchoDto> SaveEchoAsync(string externalId, PlayerEchoDto dto, CancellationToken cancellationToken = default)
    {
        var player = await repository.EnsurePlayerAsync(externalId, cancellationToken);
        var existing = await repository.GetEchoByPlayerExternalIdAsync(externalId, cancellationToken);

        var entity = PlayerEchoMapper.ToEntity(dto, player, existing);
        entity.LastInteractionUtc = DateTimeOffset.UtcNow;
        ResonanceService.EnsurePassiveDay(entity, DateTimeOffset.UtcNow);

        var saved = await repository.UpsertEchoAsync(entity, cancellationToken);
        return PlayerEchoMapper.ToDto(saved);
    }

    public async Task<QuickCareOutcome> ApplyQuickCareAsync(string externalId, string kind, CancellationToken cancellationToken = default)
    {
        var echo = await GetOrCreateEchoTrackedAsync(externalId, cancellationToken);
        var utc = DateTimeOffset.UtcNow;

        if (!resonanceService.TryApplyQuickCare(echo, kind, utc, out var cooldownRemainingMs))
        {
            return new QuickCareOutcome(null, cooldownRemainingMs);
        }

        echo = await repository.UpsertEchoAsync(echo, cancellationToken);
        return new QuickCareOutcome(PlayerEchoMapper.ToDto(echo), 0);
    }

    public async Task<DriftTickResponseDto> ApplyDriftTickAsync(string externalId, CancellationToken cancellationToken = default)
    {
        var echo = await GetOrCreateEchoTrackedAsync(externalId, cancellationToken);
        var utc = DateTimeOffset.UtcNow;
        var applied = resonanceService.ApplyTabOpenDriftTick(echo, utc);
        echo = await repository.UpsertEchoAsync(echo, cancellationToken);

        return new DriftTickResponseDto
        {
            Echo = PlayerEchoMapper.ToDto(echo),
            AppliedPassivePoints = applied,
        };
    }

    private async Task<PlayerEcho> GetOrCreateEchoTrackedAsync(string externalId, CancellationToken cancellationToken)
    {
        var echo = await repository.GetEchoByPlayerExternalIdAsync(externalId, cancellationToken);
        if (echo is not null)
        {
            return echo;
        }

        var player = await repository.EnsurePlayerAsync(externalId, cancellationToken);
        echo = PlayerEchoMapper.CreateDefaultFluffling(player);
        return await repository.UpsertEchoAsync(echo, cancellationToken);
    }
}
