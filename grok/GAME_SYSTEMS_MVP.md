# GAME_SYSTEMS_MVP.md
**Adventure • Tournament • Evolution • Week Planner Activities**  
For Echoes of Resonance — MVP scope (solo-dev, mobile-first, automatic systems)

Locked to **DESIGN.md** pillars: joyful tone, Resonance axes (Joy, Discipline, Courage, Harmony), ~15 min/day loop, automatic evolution, no microtransactions.

---

## Week Planner Activities (Mon–Fri slots)

| Activity            | Title                | Short Description                                                                 | Resonance Hint                  | MVP Notes                     |
|---------------------|----------------------|-----------------------------------------------------------------------------------|---------------------------------|-------------------------------|
| Rest                | Quiet Reflection     | Let your Echo drift through soft memories. A gentle day of recovery.             | +Harmony, Fatigue recovery     | Passive vibe, low effort     |
| Echo Dance          | Echo Dance           | Move together to upbeat rhythms from the old world. Feel the joy build!          | Strong +Joy, some Courage      | Minigame trigger             |
| Harmony Garden      | Harmony Garden       | Tend glowing memory-flowers together. A peaceful ritual of growth.               | Strong +Harmony, minor Discipline | Minigame trigger          |
| Drift               | Echo Drift           | Release your Echo into the gentle currents of the Resonance Sea.                 | Balanced small gains all axes  | Passive synergy focus        |
| Discipline Circuit  | Discipline Circuit   | (Future) Run focused training loops. Build focus and resilience.                 | Strong +Discipline             | Stub for later               |
| Rift Exploration    | Rift Exploration     | (Future) Venture into shimmering memory rifts. Face small surprises.            | +Courage, some Joy             | Stub for later               |

**UI Tip**: Show as tappable cards with tiny axis preview icons. One click → launch minigame or passive effect.

---

## Adventure — "The Fading Lantern Festival" (MVP Template)

**Length**: 3–5 nodes, choice-based, ~2–4 minutes.  
**Trigger**: Weekend slot or dedicated button.  
**Rewards**: Resonance XP + small stat bump + 1 Memory Shard.  
**Implementation**: Simple JSON-driven or state array (linear with flavor branches).

### Node Flow

1. **Opening**  
   "The old Lantern Festival grounds shimmer back into existence. Your Echo tugs you forward excitedly."

2. **Choice 1 — The Broken Path**  
   - A) Cheer them on and dance through the gap (+Joy)  
   - B) Carefully guide them step-by-step (+Harmony/Discipline)  
   - C) Leap ahead bravely (+Courage)

3. **Choice 2 — The Fading Lanterns** (starter flavor)  
   - Fluffling: "Breathe warm sparks to relight them"  
   - Droplet: "Gather dewdrops to make them glow again"  
   - Sprout: "Weave fresh vines to hold them steady"  
   - Spark: "Send a quick zap to spark them back"

4. **Climax — The Central Lantern**  
   "The great central lantern flickers weakly. Your Echo looks to you."  
   - A) Pour shared joyful energy (+Joy heavy)  
   - B) Stand firm and protect it (+Courage/Discipline)  
   - C) Sing a quiet harmony song (+Harmony)

5. **Endings** (based on dominant axis)  
   - **Joy-heavy**: "The sky fills with bright, playful lanterns. Your Echo beams!"  
   - **Courage-heavy**: "The lanterns blaze strong — a beacon of bravery."  
   - **Harmony-heavy**: "A gentle wave of warm light spreads. You both feel deeply connected."  
   - **Balanced**: Rare "Prism Lantern" ending (+extra reward)

**MVP Note**: Track dominant choice axis only. No complex state.

---

## Tournament System (MVP)

**Frequency**: One per weekend.  
**Format**: 3-round timing-based rhythm combat.  
**Ranks**: D → D+ → C → B → A → S

### Opponent Pool (rotate 3–4 per event)
- D: Bubbles, Flicker
- C: Leafwhisper, Flarepup
- B: Stormkit, Tideheart
- A: Blazewing, Verdant Guardian
- S: Echo Sovereign

### Flavor Text
**Win lines**:
- "Your Echo’s timing was perfect — the crowd cheers!"
- "[Starter] stole the show with brilliant resonance!"
- "A dazzling display! Rank up!"

**Lose lines** (encouraging):
- "Close one! Your Echo learned a lot."
- "A worthy challenge. You’ll shine brighter next time."
- "The connection flickered — but you’re both still glowing."

**Rewards**: Rank points + Resonance XP + small items. Forgiving difficulty curve.

---

## Evolution System — Stage 1 (Automatic)

**Trigger**: After sufficient weeks + dominant axis clear (or balanced). No player choice.  
**Visuals**: Sprite swap + particle burst + 3-second overlay.

### Flavor Texts
- **Joy-heavy → Playful Form**  
  "Your Echo bursts with vibrant energy! Joy has shaped them into a lively, mischievous form."

- **Courage-heavy → Brave Form**  
  "Courage has forged your Echo into a bold protector, ready to face any rift."

- **Harmony-heavy → Gentle Form**  
  "Deep harmony blooms — your Echo becomes a calming, nurturing presence."

- **Discipline-heavy → Focused Form**  
  "Discipline has refined your Echo into a steady, resilient companion."

- **Balanced (Rare) → Prism Form**  
  "A rare resonance harmony! Your Echo shines with all colors — a true Prism form."

**Future Stages**: Expand similarly in later evolutions.

---

**Next Steps** (for Cursor):
- Wire planner activities to existing minigame hooks.
- Add Adventure & Tournament as weekend features.
- Implement auto-evolution check on End Week.
- Use `localStorage` only for MVP.

Keep aligned with **DESIGN.md** and **RESONANCE_SYSTEM_DESIGN.md**.