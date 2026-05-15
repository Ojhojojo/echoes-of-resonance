# Cursor Development Guide: Angular + Phaser Integration
**Project**: Echoes of Resonance  
**Goal**: Build a clean, scalable, mobile-friendly Angular + Phaser foundation (web-first, PWA-ready).

## Strict Rules for Cursor (Follow Exactly)
- Use **standalone components** (Angular 19+ style).
- **No NgModules** unless absolutely required.
- Use **Angular Signals** for state (avoid NgRx for MVP).
- Phaser instance must live inside a single reusable component.
- All game logic stays inside `src/game/` — Angular only provides shell + API bridge.
- Never commit actual game assets yet — use placeholders.
- Keep everything responsive and touch-friendly from day 1.

## Target File Structure (Create Exactly)
frontend/src/
├── app/
│   ├── core/
│   │   ├── services/game-bridge.service.ts
│   │   └── services/player-store.service.ts
│   ├── features/
│   │   └── ranch/ranch.component.ts          ← main shell
│   ├── game/
│   │   ├── phaser-game.component.ts          ← ← THE BRIDGE
│   │   ├── game-config.ts
│   │   ├── scenes/
│   │   │   ├── BootScene.ts
│   │   │   └── RanchScene.ts
│   │   ├── managers/
│   │   └── entities/
│   ├── shared/
│   └── app.component.ts
├── assets/game/          ← (create folder — we'll add sprites later)
└── environments/
text## Step-by-Step Development Order (Do in this sequence)

### Phase 1: Phaser Integration (Do This First)
1. Create `phaser-game.component.ts` — a standalone component that:
   - Accepts `@Input() sceneKey` (for switching scenes)
   - Creates/destroys Phaser Game instance
   - Exposes a public `game` property
   - Uses a div with `#phaser-container`

2. Create `game-config.ts` with:
   - Width/Height (use percentage or fixed 800x600 for now)
   - Scale mode suitable for mobile (FILL or FIT)
   - Background color matching our sky-ranch theme
   - Physics: Arcade (simple)

3. Create `BootScene.ts` (minimal preload + launch RanchScene)

4. Create `RanchScene.ts` with:
   - Simple colored background + sky gradient
   - One placeholder Echo sprite (use Phaser rectangle or emoji sprite for now)
   - Basic idle animation (tween bob)
   - Click/tap to pet (log to console + emit via GameBridge)

### Phase 2: Angular Shell & Bridge
1. Update `app.component.ts` to have router-outlet + header/footer.
2. Create `ranch.component.ts` that contains `<app-phaser-game>`.
3. Implement `GameBridgeService` (injectable) for:
   - Two-way communication (Angular ↔ Phaser)
   - Expose methods like `startMinigame()`, `updateResonance()`
   - Listen to Phaser events and update Signals

4. Create `PlayerStore` service with Signals for:
   - Current Echo
   - Resonance values (Joy, Discipline, Courage, Harmony)
   - Player level / currency

### Phase 3: Polish & Mobile Readiness
- Add basic responsive resizing
- Touch support (already in Phaser)
- Dark/light mode compatible colors
- Loading screen integration

## Design Constraints (Respect Locked Pillars)
- Keep ranch peaceful and cute
- All Resonance feedback must feel satisfying
- Quick Care taps must be one-tap delightful
- Everything must run smoothly on mid-tier phones

## Success Criteria for This Phase
- Ranch scene loads inside Angular component
- Can see and interact with at least one Echo (pet → resonance number goes up)
- No console errors
- Page is responsive and looks decent on mobile viewport

## After Completing Phase 1 & 2
Ping Grok with “Phase 1 complete” and I’ll give you the next detailed guide (minigame integration, backend API hooks, etc.).

**Reminder**: Grok does NOT generate code — you build it in Cursor using this guide. Ask Grok for clarifications, pros/cons, or architecture decisions only.

---
**Last Updated**: May 15, 2026
**Status**: Ready for Cursor — start with Phase 1