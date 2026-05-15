using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EchoesOfResonance.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddUnlockedEchoIdsJson : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "UnlockedEchoIdsJson",
                table: "PlayerEchoes",
                type: "TEXT",
                maxLength: 512,
                nullable: false,
                defaultValue: "[\"fluffling_web\"]");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UnlockedEchoIdsJson",
                table: "PlayerEchoes");
        }
    }
}
