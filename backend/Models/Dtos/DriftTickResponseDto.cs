namespace EchoesOfResonance.API.Models.Dtos;

public class DriftTickResponseDto
{
    public PlayerEchoDto Echo { get; set; } = null!;
    public int AppliedPassivePoints { get; set; }
}
