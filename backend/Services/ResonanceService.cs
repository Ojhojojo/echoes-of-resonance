using EchoesOfResonance.API.Domain.Entities;

namespace EchoesOfResonance.API.Services;

/// <summary>Simplified resonance / Echo Drift rules (design doc aligned).</summary>
public class ResonanceService
{
    public const int MaxAxis = 1000;
    public const int PassiveDailyCap = 250;
    public const long QuickCareCooldownMs = 4L * 60 * 60 * 1000;
    private const int MaxDriftCatchUpHours = 72;

    /// <summary>
    /// Active Quick Care — mirrors web <c>PlayerStore.applyQuickCare</c>; updates <see cref="PlayerEcho.LastInteractionUtc"/>.
    /// </summary>
    /// <returns>False when invalid kind (caller → 400) or cooldown (caller → 429).</returns>
    public bool TryApplyQuickCare(PlayerEcho echo, string kind, DateTimeOffset utcNow, out long cooldownRemainingMs)
    {
        cooldownRemainingMs = 0;
        var normalized = NormalizeQuickCareKind(kind);
        if (normalized is null)
        {
            return false;
        }

        var nowMs = utcNow.ToUnixTimeMilliseconds();
        var last = GetQuickCareTimestamp(echo, normalized.Value);
        if (nowMs - last < QuickCareCooldownMs)
        {
            cooldownRemainingMs = QuickCareCooldownMs - (nowMs - last);
            return false;
        }

        EnsurePassiveDay(echo, utcNow);

        var total = Random.Shared.Next(10, 21);
        var joyShare = (int)Math.Ceiling(total * 0.5);
        var harmonyShare = (int)Math.Ceiling(total * 0.25);
        var remainder = total - joyShare - harmonyShare;
        var courageShare = (int)Math.Floor(remainder * 0.6);
        var disciplineShare = total - joyShare - harmonyShare - courageShare;

        echo.Joy = ClampAxis(echo.Joy + joyShare);
        echo.Harmony = ClampAxis(echo.Harmony + harmonyShare);
        echo.Courage = ClampAxis(echo.Courage + Math.Max(0, courageShare));
        echo.Discipline = ClampAxis(echo.Discipline + Math.Max(0, disciplineShare));

        echo.Happiness = ClampHappiness(echo.Happiness + 3);
        echo.ResonanceShards += 1;
        echo.LastInteractionUtc = utcNow;

        SetQuickCareTimestamp(echo, normalized.Value, nowMs);

        return true;
    }

    /// <summary>
    /// Tab-open periodic drift — same axis split as Angular <c>EchoDriftService.tick</c>.
    /// Does <b>not</b> change <see cref="PlayerEcho.LastInteractionUtc"/> (offline hourly drift stays intact).
    /// </summary>
    public int ApplyTabOpenDriftTick(PlayerEcho echo, DateTimeOffset utcNow)
    {
        EnsurePassiveDay(echo, utcNow);
        if (echo.PassivePointsToday >= PassiveDailyCap)
        {
            return 0;
        }

        var baseGain = Random.Shared.Next(3, 7);
        var joy = (int)Math.Round(baseGain * 0.5);
        var harmony = (int)Math.Round(baseGain * 0.2);
        var courage = (int)Math.Round(baseGain * 0.15);
        var discipline = baseGain - joy - harmony - courage;

        return ApplyPassiveGain(echo, joy, discipline, courage, harmony, utcNow);
    }

    public static bool IsQuickCareKindValid(string kind)
    {
        if (string.IsNullOrWhiteSpace(kind))
        {
            return false;
        }

        return kind.Trim().ToLowerInvariant() is "pet" or "feed" or "encourage";
    }

    private static QuickCareKind? NormalizeQuickCareKind(string kind)
    {
        if (string.IsNullOrWhiteSpace(kind))
        {
            return null;
        }

        return kind.Trim().ToLowerInvariant() switch
        {
            "pet" => QuickCareKind.Pet,
            "feed" => QuickCareKind.Feed,
            "encourage" => QuickCareKind.Encourage,
            _ => null,
        };
    }

    private static long GetQuickCareTimestamp(PlayerEcho echo, QuickCareKind kind) =>
        kind switch
        {
            QuickCareKind.Pet => echo.LastQuickCarePet,
            QuickCareKind.Feed => echo.LastQuickCareFeed,
            QuickCareKind.Encourage => echo.LastQuickCareEncourage,
            _ => 0,
        };

    private static void SetQuickCareTimestamp(PlayerEcho echo, QuickCareKind kind, long ms)
    {
        switch (kind)
        {
            case QuickCareKind.Pet:
                echo.LastQuickCarePet = ms;
                break;
            case QuickCareKind.Feed:
                echo.LastQuickCareFeed = ms;
                break;
            case QuickCareKind.Encourage:
                echo.LastQuickCareEncourage = ms;
                break;
        }
    }

    private enum QuickCareKind
    {
        Pet,
        Feed,
        Encourage,
    }

    public int ApplyOfflineDrift(PlayerEcho echo, DateTimeOffset utcNow)
    {
        EnsurePassiveDay(echo, utcNow);

        var hoursAway = (utcNow - echo.LastInteractionUtc).TotalHours;
        if (hoursAway < 0.25)
        {
            return 0;
        }

        var hoursToSim = Math.Min((int)Math.Floor(hoursAway), MaxDriftCatchUpHours);
        var totalApplied = 0;

        for (var h = 0; h < hoursToSim; h++)
        {
            if (echo.PassivePointsToday >= PassiveDailyCap)
            {
                break;
            }

            var baseGain = Random.Shared.Next(12, 29);
            var joy = (int)Math.Round(baseGain * 0.45);
            var harmony = (int)Math.Round(baseGain * 0.2);
            var courage = (int)Math.Round(baseGain * 0.18);
            var discipline = baseGain - joy - harmony - courage;

            totalApplied += ApplyPassiveGain(echo, joy, discipline, courage, harmony, utcNow);
        }

        echo.LastInteractionUtc = utcNow;
        return totalApplied;
    }

    public int ApplyPassiveGain(PlayerEcho echo, int joy, int discipline, int courage, int harmony, DateTimeOffset utcNow)
    {
        EnsurePassiveDay(echo, utcNow);

        var requested = joy + discipline + courage + harmony;
        var room = Math.Max(0, PassiveDailyCap - echo.PassivePointsToday);
        if (room <= 0 || requested <= 0)
        {
            return 0;
        }

        var scale = requested > room ? room / (double)requested : 1.0;
        var j = (int)Math.Round(joy * scale);
        var d = (int)Math.Round(discipline * scale);
        var c = (int)Math.Round(courage * scale);
        var h = (int)Math.Round(harmony * scale);
        var applied = j + d + c + h;

        echo.Joy = ClampAxis(echo.Joy + j);
        echo.Discipline = ClampAxis(echo.Discipline + d);
        echo.Courage = ClampAxis(echo.Courage + c);
        echo.Harmony = ClampAxis(echo.Harmony + h);
        echo.PassivePointsToday += applied;
        return applied;
    }

    public static void EnsurePassiveDay(PlayerEcho echo, DateTimeOffset utcNow)
    {
        var key = utcNow.UtcDateTime.ToString("yyyy-MM-dd");
        if (echo.PassiveDayKey != key)
        {
            echo.PassiveDayKey = key;
            echo.PassivePointsToday = 0;
        }
    }

    public static int ClampAxis(int value) => Math.Clamp(value, 0, MaxAxis);

    public static int ClampHappiness(int value) => Math.Clamp(value, 0, 100);
}
