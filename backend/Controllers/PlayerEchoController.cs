using EchoesOfResonance.API.Models.Dtos;
using EchoesOfResonance.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace EchoesOfResonance.API.Controllers;

[ApiController]
[Route("api/players")]
public class PlayerEchoController(PlayerEchoService playerEchoService) : ControllerBase
{
    [HttpGet("{playerId}/echo/health")]
    public IActionResult Health(string playerId)
    {
        return Ok(new { status = "ok", playerId, serverTime = DateTimeOffset.UtcNow });
    }

    [HttpGet("{playerId}/echo")]
    public async Task<ActionResult<PlayerEchoDto>> GetEcho(string playerId, CancellationToken cancellationToken)
    {
        var externalId = ResolvePlayerId(playerId);
        var dto = await playerEchoService.GetEchoAsync(externalId, cancellationToken);
        return Ok(dto);
    }

    [HttpPut("{playerId}/echo")]
    public async Task<ActionResult<PlayerEchoDto>> SaveEcho(
        string playerId,
        [FromBody] PlayerEchoDto dto,
        CancellationToken cancellationToken)
    {
        if (dto is null)
        {
            return BadRequest();
        }

        var externalId = ResolvePlayerId(playerId);
        var saved = await playerEchoService.SaveEchoAsync(externalId, dto, cancellationToken);
        return Ok(saved);
    }

    [HttpPost("{playerId}/echo/actions/quick-care")]
    public async Task<ActionResult<PlayerEchoDto>> QuickCare(
        string playerId,
        [FromBody] QuickCareRequestDto body,
        CancellationToken cancellationToken)
    {
        if (body is null || string.IsNullOrWhiteSpace(body.Kind))
        {
            return BadRequest(new { error = "kind_required" });
        }

        if (!ResonanceService.IsQuickCareKindValid(body.Kind))
        {
            return BadRequest(new { error = "invalid_kind" });
        }

        var externalId = ResolvePlayerId(playerId);
        var outcome = await playerEchoService.ApplyQuickCareAsync(externalId, body.Kind, cancellationToken);

        if (outcome.Echo is null && outcome.CooldownRemainingMs > 0)
        {
            return StatusCode(StatusCodes.Status429TooManyRequests, new { error = "cooldown", retryAfterMs = outcome.CooldownRemainingMs });
        }

        return outcome.Echo is null ? BadRequest(new { error = "quick_care_failed" }) : Ok(outcome.Echo);
    }

    [HttpPost("{playerId}/echo/drift/tick")]
    public async Task<ActionResult<DriftTickResponseDto>> DriftTick(string playerId, CancellationToken cancellationToken)
    {
        var externalId = ResolvePlayerId(playerId);
        var dto = await playerEchoService.ApplyDriftTickAsync(externalId, cancellationToken);
        return Ok(dto);
    }

    private string ResolvePlayerId(string routePlayerId)
    {
        if (Request.Headers.TryGetValue("X-Player-Id", out var headerValues))
        {
            var header = headerValues.FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(header))
            {
                return header.Trim();
            }
        }

        return routePlayerId.Trim();
    }
}
