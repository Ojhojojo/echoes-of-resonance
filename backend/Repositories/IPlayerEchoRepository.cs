using EchoesOfResonance.API.Domain.Entities;

namespace EchoesOfResonance.API.Repositories;

public interface IPlayerEchoRepository
{
    Task<Player?> GetPlayerByExternalIdAsync(string externalId, CancellationToken cancellationToken = default);
    Task<PlayerEcho?> GetEchoByPlayerExternalIdAsync(string externalId, CancellationToken cancellationToken = default);
    Task<Player> EnsurePlayerAsync(string externalId, CancellationToken cancellationToken = default);
    Task<PlayerEcho> UpsertEchoAsync(PlayerEcho echo, CancellationToken cancellationToken = default);
}
