using EchoesOfResonance.API.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace EchoesOfResonance.API.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Player> Players => Set<Player>();
    public DbSet<PlayerEcho> PlayerEchoes => Set<PlayerEcho>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Player>(e =>
        {
            e.HasKey(p => p.Id);
            e.HasIndex(p => p.ExternalId).IsUnique();
            e.Property(p => p.ExternalId).HasMaxLength(64);
        });

        modelBuilder.Entity<PlayerEcho>(e =>
        {
            e.HasKey(pe => pe.Id);
            e.HasIndex(pe => pe.PlayerId).IsUnique();
            e.Property(pe => pe.EchoDataId).HasMaxLength(64);
            e.Property(pe => pe.DisplayName).HasMaxLength(128);
            e.Property(pe => pe.PassiveDayKey).HasMaxLength(16);
            e.Property(pe => pe.DriftFocus).HasMaxLength(16);
            e.Property(pe => pe.UnlockedEchoIdsJson).HasMaxLength(512);

            e.HasOne(pe => pe.Player)
                .WithOne(p => p.Echo)
                .HasForeignKey<PlayerEcho>(pe => pe.PlayerId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
