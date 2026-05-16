# Echoes of Resonance - Game Design Document

## Core Concept
In a world where the boundary between the physical realm and the shattered **Digital Echo** has begun to thin, mysterious **Resonance Eggs** appear. Players are **Resonance Keepers** who raise, train, and evolve digital soul creatures called **Echoes** on floating sky-ranches. Blend of Monster Rancher care/training, Digimon bond-driven evolutions, and Pokémon collecting/adventure.

### Locked Story Pillars
1. **Resonance & Bonds**  
   Echoes are digital souls that grow with the player. Training builds Resonance across four axes: **Joy, Discipline, Courage, Harmony**. These directly shape personality and evolution paths. Deep bonds create meaningful partner relationships.

2. **The Shattered Echo Realm**  
   Vibrant sky-islands, ancient ruins, and glowing rifts to the Digital Echo. Eggs emerge from rifts. Mystery: Why are the rifts reopening now?

3. **Legacy & Discovery**  
   Every Echo carries fragments of a lost civilization. Training and battling uncover memory shards that unlock new content, ranch upgrades, and breeding options.

4. **Growth Through Care**  
   Evolution is driven by training style and player choices, not just levels. Every monster feels unique and personal. Cute base forms remain adorable across evolutions.

5. **Harmony vs. Dissonance**  
   Wholesome, uplifting tone with light melancholy. Neglect creates temporary dissonance (visual/emotional feedback). No major villains at launch — focus on personal growth and community duels.

**Tone**: Bright, emotional, Studio Ghibli × Digimon × Monster Rancher. Soundtrack: Chill electronic + acoustic.

### Tech Stack (Locked)
**Frontend / Game**: Angular + Phaser.js  
- Web-first development. Phaser for all 2D gameplay (ranch, minigames, battles, Echo animations).  
- Angular for UI, state management, routing, and shell.

**Backend**: ASP.NET Core API + EF Core  
- Monster data, Resonance calculations, persistence, user accounts.

**Mobile**: Capacitor (iOS + Android)  
- Thin native wrapper after web version is playable.

**PWA**: Angular PWA for early testing and installable web version.

**Art**: 2D sprites / animations (to be finalized in ART_STYLE_GUIDE.md).

### Training Systems
#### Active Minigames (High Control, High Reward)
1. **Echo Dance** – Rhythm game (Joy)  
2. **Rift Exploration** – Light platformer/runner (Courage)  
3. **Harmony Garden** – Match-3 / gardening puzzle (Harmony)  
4. **Discipline Circuit** – Precision obstacle course (Discipline)  
5. **Bond Feast** – Cooking/feeding sim (Joy + Harmony)  
6. **Echo Spar** – Pattern combat practice (Courage + Discipline, unlocked later)

#### Passive Training - "Echo Drift"
- Set-and-forget system (30 min – 8+ hours, works offline).  
- Semi-random Resonance gains, biased by current personality and past training.  
- Implemented via backend timers + client polling / push notifications.

#### Quick Care
One-tap daily actions (Pet, Feed, Encourage) for small balanced boosts.

### Evolution Rules
- Driven by dominant Resonance axes + total stats.  
- Non-linear branches with visual morphs and personality changes.  
- Passive training produces more “balanced/unpredictable” personalities.  
- Active training allows precise shaping of desired evolutions.

### Architecture Notes
- All game logic (scenes, managers, Resonance engine) lives in `frontend/src/game/`.  
- Angular services communicate with backend API for persistence and heavy calculations.  
- Phaser handles rendering, input, and real-time gameplay loops.

### Echo Roster (Locked for MVP)

#### 1. Fluffling (Starter — playable in MVP)
- **Base ID**: `fluffling_web`
- **Type**: Fluffy cloud-like digital critter
- **Primary Bias**: Joy (high)
- **Personality**: Playful, affectionate, easy to please
- **Animations Needed**: Idle (bob), Walk, Happy, Pet Reaction
- **Unlock**: Default

**Future Echoes (starter roster — see `STARTER_MONSTERS.md`)**: **Droplet**, **Sprout**, and **Spark** have base sprite art and design notes; wire them into the client and catalog when multi-echo play is scheduled. No second playable Echo is locked for MVP beyond this four-starter vision.

---
**MVP (May 2026):** Week planner + adventures + tournaments; egg hatch (4 starters); client-only saves. See [MVP_PLAN.md](MVP_PLAN.md).

**Last Updated**: May 16, 2026  
**Status**: Story pillars locked | Tech stack locked | MVP gameplay loop locked | Unity abandoned