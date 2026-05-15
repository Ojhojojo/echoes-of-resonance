# Echoes of Resonance - Project Tracker

## ✅ Locked / Decided
- Story pillars (5 core pillars)
- Overall game concept & tone
- Training systems (Active minigames + Echo Drift passive + Quick Care)
- Evolution driven by Resonance axes (Joy, Discipline, Courage, Harmony)
- Tech Stack: Angular + Phaser.js (frontend/game) + ASP.NET Core + EF Core (backend) + Capacitor (mobile)
- Art direction: 2D sprites/animations
- Web-first → PWA → Mobile

## 📋 Next Up - High Priority
### 1. Project Setup (Monorepo)
- [ ] Clean repo: remove Unity folders (`Assets/`, `Library/`, etc.)
- [ ] Create new structure: `/frontend/` (Angular + Phaser) + `/backend/` (ASP.NET)
- [ ] Initialize Angular + Phaser project
- [ ] Initialize ASP.NET Core Web API + EF Core
- [ ] Update root README.md + .gitignore
- [ ] Set up Capacitor config (after web is playable)

### 2. Core Data & Architecture
- [ ] Design Angular + Phaser high-level architecture (scenes, services, state)
- [ ] Backend: Player, Echo, Resonance models + DbContext
- [ ] API endpoints for Resonance calculations, save/load, Echo data
- [ ] Migrate Resonance logic to backend where appropriate

### 3. First Prototype (Web)
- [ ] Implement one starter Echo (e.g. Fluffling) with Phaser sprite + basic animations
- [ ] Basic ranch screen (Phaser scene + Angular shell)
- [ ] Echo Drift (passive) system (timer + backend sync)
- [ ] One active minigame prototype (suggest: Echo Dance or Harmony Garden)

### 4. Decisions Needed (Please reply with your preference)
- [ ] Art Style final confirmation (pixel art vs hand-drawn vs other — see ART_STYLE_GUIDE.md)
- [ ] Target Platform Priority: Web/PWA first, then Android/iOS
- [ ] Multiplayer scope for MVP: Single-player + local AI (keep online light)

## Future Features (Backlog)
- Full evolution system with visual morphs
- Remaining minigames
- Online matchmaking & PvP battles
- Breeding / egg system
- Memory shard lore collection
- Ranch customization
- Monetization (cosmetics, egg packs)

## Notes
- We are using Cursor + Grok as main development partners.
- Goal: Vertical slice (one monster fully trainable + one minigame + passive system) as fast as possible.
- No code generation from Grok — design & planning only.

---
**Last Updated**: May 15, 2026