namespace EchoesOfResonance.API.Domain.Entities;

/// <summary>Keeper account — auth deferred; identified by <see cref="ExternalId"/> from the client.</summary>
public class Player
{
    public Guid Id { get; set; }
    public string ExternalId { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
    public PlayerEcho? Echo { get; set; }
}
