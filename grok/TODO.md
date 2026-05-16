# Echoes of Resonance - Project Tracker

## ✅ Locked / Decided
- Story pillars (5 core pillars)
- Overall game concept and tone
- Training systems (Active minigames + Echo Drift passive + Quick Care)
- Evolution driven by Resonance axes — **fully automatic** (Digimon-style)
- Tech Stack: Angular + Phaser.js (frontend/game) + ASP.NET Core + EF Core (backend, **parked for MVP**) + Capacitor (mobile)
- Art direction: 2D sprites/animations (minimal + Grok Imagine approach)
- Web-first → PWA → Mobile
- **MVP pillars:** Week planner + Adventures + Tournaments (~15 min/day, End Week button)
- **Onboarding:** Egg selection → hatch one of **4 starters** (Fluffling, Droplet, Sprout, Spark)
- **MVP persistence:** `localStorage` only (`environment.clientOnly`) — polish gameplay first
- Full design: [MVP_PLAN.md](MVP_PLAN.md)

## 🎉 Accomplished Summary (foundation)
- Full Angular + Phaser foundation with responsive bridge and Signals state
- RanchScene with roaming Echo, pet/follow, particles, day/night
- Resonance UI + Quick Care bar
- EchoDriftService, Harmony Garden, Echo Dance (base), Evolution preview overlay
- Backend Phase 5 + 5C complete (frozen for MVP playtests)
- Four starter base sprites on disk; Fluffling wired in client

## 📋 Current focus — MVP gameplay loop (client-only)

See **[MVP_PLAN.md](MVP_PLAN.md)** for full spec.

### M0 — Client-only mode
- [x] `environment.clientOnly` + `EchoSaveService` local-only path (`eor_snapshot_v2`)
- [x] Dev note in README: MVP = no `dotnet run` required

### M1 — Egg → hatch → starter
- [x] `/egg` route: pick 1 of 4 eggs
- [x] Hatch flow sets `currentEcho` + starter texture
- [x] All four entries in `echo-definitions.json` + BootScene texture loads

### M2 — Week planner
- [x] `trainingPlan` (5 slots) on `PlayerSnapshot`
- [x] Planner UI on `/ranch` + **End Week** button

### M3 — Stats + week resolution
- [ ] MR stats: power / speed / defense / life
- [ ] `WeekResolverService` applies slot payouts

### M4 — Adventures (non-negotiable)
- [ ] `AdventureScene` — lite weekend expedition (3–5 nodes)

### M5 — Tournaments (non-negotiable)
- [ ] `TournamentScene` — **light timing** combat (not full auto)

### M6 — Evolution v1
- [ ] Automatic Stage 1 from resonance profile + week gate
- [ ] Sprite swap + evolution overlay copy

### M7 — Care meters
- [ ] Fatigue + happiness integration; dissonance visuals

### M8 — Polish
- [ ] Starter idle/walk or sheet; mobile QA on planner + combat

## Later phases (post-MVP)

### Phase 7 – Multi-Echo & Ranch Expansion
- [ ] Ranch customization, memory shards
- [ ] Breeding / egg tease (beyond starter pick)

### Phase 8 – Mobile & Polish
- [ ] PWA, Capacitor, tutorial flow

### Phase 9 – Backend return
- [ ] Re-enable API sync when loop is fun
- [ ] Auth, leaderboards, server-validated minigames

## Resolved Decisions (MVP)
| Topic | Decision |
|-------|----------|
| Persistence | **localStorage only** for MVP |
| Session | ~15 min/day, **End Week** advances time |
| Combat | **Light timing** in tournament |
| Evolution | **Automatic** — no player branch pick |
| Starters | **4** via egg hatch |
| Non-negotiable | Week planner, adventures, tournaments |

## Manual Validation Checklist (`/ranch`)
(See [MANUAL_TODOS.md](MANUAL_TODOS.md))
1. Egg → hatch → correct starter on ranch
2. Week plan persists; End Week updates stats/resonance
3. Adventure completes with rewards
4. Tournament uses timing input; win/lose affects state
5. Evolution fires automatically; sprite updates
6. Refresh keeps progress (localStorage)
7. Mobile viewport clean

## Dev Workflow (MVP — frontend only)

```bash
cd frontend && npm start
# App: http://localhost:4200
# Egg: /egg  ·  Ranch: /ranch
```

Compile:

```bash
cd frontend && npm run build
```

Backend (optional, not required for MVP QA):

```bash
cd backend && dotnet run --project EchoesOfResonance.API.csproj
```

Last Updated: May 16, 2026  
Status: **MVP gameplay loop** — client-only, MR3 pillars locked → see MVP_PLAN.md
