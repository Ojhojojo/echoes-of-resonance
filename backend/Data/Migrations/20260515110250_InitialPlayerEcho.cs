using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EchoesOfResonance.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialPlayerEcho : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Players",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    ExternalId = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Players", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PlayerEchoes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    PlayerId = table.Column<Guid>(type: "TEXT", nullable: false),
                    EchoDataId = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    DisplayName = table.Column<string>(type: "TEXT", maxLength: 128, nullable: false),
                    Joy = table.Column<int>(type: "INTEGER", nullable: false),
                    Discipline = table.Column<int>(type: "INTEGER", nullable: false),
                    Courage = table.Column<int>(type: "INTEGER", nullable: false),
                    Harmony = table.Column<int>(type: "INTEGER", nullable: false),
                    KeeperLevel = table.Column<int>(type: "INTEGER", nullable: false),
                    ResonanceShards = table.Column<int>(type: "INTEGER", nullable: false),
                    PetCount = table.Column<int>(type: "INTEGER", nullable: false),
                    Happiness = table.Column<int>(type: "INTEGER", nullable: false),
                    LastInteractionUtc = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    PassivePointsToday = table.Column<int>(type: "INTEGER", nullable: false),
                    PassiveDayKey = table.Column<string>(type: "TEXT", maxLength: 16, nullable: false),
                    DriftFocus = table.Column<string>(type: "TEXT", maxLength: 16, nullable: false),
                    LastQuickCarePet = table.Column<long>(type: "INTEGER", nullable: false),
                    LastQuickCareFeed = table.Column<long>(type: "INTEGER", nullable: false),
                    LastQuickCareEncourage = table.Column<long>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlayerEchoes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlayerEchoes_Players_PlayerId",
                        column: x => x.PlayerId,
                        principalTable: "Players",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PlayerEchoes_PlayerId",
                table: "PlayerEchoes",
                column: "PlayerId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Players_ExternalId",
                table: "Players",
                column: "ExternalId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PlayerEchoes");

            migrationBuilder.DropTable(
                name: "Players");
        }
    }
}
