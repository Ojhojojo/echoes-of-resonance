# Resonance System Design - Echoes of Resonance

## Design Goals
- Make training feel **meaningful yet light and relaxing** (Stardew Valley influence — fun, not grindy).
- Reward both active play and casual/passive play.
- Automatic evolutions based purely on how the player raised their Echo (no manual choice at evolution time).
- Strong emotional feedback and visual delight.
- Mobile-friendly and approachable for all playstyles.

## Core Concepts
**Resonance Profile**
- Four axes, each **capped at 1000 points**:
  - Joy
  - Discipline
  - Courage
  - Harmony
- Total Resonance = sum of all axes (max 4000).

**Dominant Axis** = highest single axis (drives personality, visual aura, and evolution path).

## Point Awarding System (Simplified & Friendly)

### 1. Active Minigames (High Reward, Clear Feedback)
Max **100 points** per session so players can instantly understand how well they performed.

| Minigame              | Primary Axis(es)       | Secondary Axis | Max Points per Session | Notes |
|-----------------------|------------------------|----------------|------------------------|-------|
| Echo Dance            | Joy                    | Harmony        | 100                    | Rhythm & performance |
| Rift Exploration      | Courage                | Joy            | 100                    | Distance + choices |
| Harmony Garden        | Harmony                | Discipline     | 100                    | Combos & balance |
| Discipline Circuit    | Discipline             | Courage        | 100                    | Precision |
| Bond Feast            | Joy + Harmony          | —              | 100                    | Recipe quality |
| Echo Spar (later)     | Courage + Discipline   | —              | 100                    | Combat practice |

- Performance tiers: Poor (30–50), Good (60–79), Excellent (80–94), Perfect (95–100).
- Perfect runs give small bonus to secondary axis.

### 2. Echo Drift (Passive Training)
- Designed to feel **relaxed and balanced** like Stardew Valley — meaningful progress without forcing daily grinding.
- Formula:
BaseGain = 12–28 points per hour (random range)
Bias = 1.4× toward dominant axis, 0.6× toward opposite axis
HappinessModifier = 0.75–1.25×
Daily Soft Cap = ~250 total points across all axes
text- Player can set optional focus (“Joyful Play”, “Balanced Care”, etc.).
- Small chance of bonus items / memory shards.
- Happiness slowly drops if ignored for >36–48 hours (gentle nudge, not punishing).

### 3. Quick Care (Daily Touch)
- +10–20 points split across axes.
- Once per few hours, very low effort.

### 4. PvP Resonance Gains (Future Feature)
- Winning online battles grants **Resonance Points** (e.g. +30–60 total, distributed by battle style).
- Encourages playing with friends and shows “your bond grew stronger through battle”.
- Can be gamified later (tournaments, ranked seasons, special rewards).

## Evolution Rules (Automatic)
- **Fully automatic** based on how the monster was raised.
- When the Echo reaches a level threshold **and** meets resonance requirements → it evolves into the path that best matches its current Resonance Profile.
- Player sees a beautiful evolution scene with flavor text like:
- “Your Fluffling’s overflowing Joy transformed it into a Prankster Inferno!”
- Rare balanced paths (e.g. Prismflame) require very even distribution across axes.
- This reinforces the fantasy: “Your Echo became what you helped it grow into.”

## Happiness & Personality
- **Happiness** (0–100): Affects passive gains and visual mood.
- **PersonalityTrait**: Automatically updates based on dominant axis (Playful, Stoic, Brave, Serene, etc.).
- Minor bonuses (e.g. Playful Echo gains +8% more Joy from Echo Dance).

## Visual & Feedback
- Dominant axis aura color on ranch screen.
- Particle celebrations when gaining lots of one axis.
- Gentle dissonance warnings (sad pose, dim aura) if neglected — easy to fix.

## Philosophy & Scope Control
- Light & fun first. No heavy grinding.
- Players who play actively progress faster and more precisely.
- Passive players still get satisfying growth and cute evolutions.
- Everything tuned for short daily sessions + longer relaxed play.

**Status**: Finalized & Ready for Implementation ✅  
**Last Updated**: May 12, 2026