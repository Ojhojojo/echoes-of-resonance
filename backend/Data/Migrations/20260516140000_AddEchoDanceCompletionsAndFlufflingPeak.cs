using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EchoesOfResonance.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddEchoDanceCompletionsAndFlufflingPeak : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "EchoDanceCompletions",
                table: "PlayerEchoes",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "PeakTotalResonanceAsFluffling",
                table: "PlayerEchoes",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EchoDanceCompletions",
                table: "PlayerEchoes");

            migrationBuilder.DropColumn(
                name: "PeakTotalResonanceAsFluffling",
                table: "PlayerEchoes");
        }
    }
}
