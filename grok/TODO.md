# Echoes of Resonance - Project Tracker



## Locked / Decided

- Story pillars (5 core pillars)

- Overall game concept and tone

- Training systems (Active minigames + Echo Drift passive + Quick Care)

- Evolution driven by Resonance axes (Joy, Discipline, Courage, Harmony)

- Tech Stack: Angular + Phaser.js (frontend/game) + ASP.NET Core + EF Core (backend) + Capacitor (mobile)

- Art direction: 2D sprites/animations

- Web-first → PWA → Mobile

- Starter Echo: **Fluffling** (Joy-biased)



## Completed

- Angular + Phaser monorepo setup

- PhaserGameComponent bridge + responsive container + SSR-safe lazy Phaser chunk

- BootScene + RanchScene with interaction

- GameBridgeService + PlayerStore (Signals)

- Phases 1–3 foundation (shell, routing, loading overlay, theme tokens)

- **Phase 4 — Fluffling & Resonance MVP (web)**

  - `game/entities/Echo.ts` + `RanchEchoManager`

  - PlayerStore extensions (happiness, passive cap, Quick Care cooldowns, snapshots)

  - `EchoSaveService` (localStorage `eor_fluffling_v1` — superseded by API in Phase 5)

  - `EchoDriftService` (45s tab-open ticks; **5C:** server tick when online)

  - Resonance bars UI + floating Quick Care bar

  - Ranch polish: parallax, day/night tint, particles, wander/follow/pet

  - **Echo Dance** minigame (rhythm judgments + combo; Phase 6 depth ongoing)

- **Phase 5 — Backend + API integration**

  - ASP.NET Core controllers, EF Core SQLite (`echoes.db`), repository + services

  - `GET/PUT api/players/{id}/echo` with `X-Player-Id`; server-side offline drift on GET

  - Angular `EchoApiService`, `PlayerIdentityService`, API-first `EchoSaveService` + offline queue

- **Phase 5C — Server authority (implemented)**

  - `POST api/players/{id}/echo/actions/quick-care` — 4h cooldown, mirrors web gains

  - `POST api/players/{id}/echo/drift/tick` — tab-open passive tick (does not bump offline drift anchor)

  - Angular: Quick Care API-first; drift tick API-first when API reachable



### Phase 6 (in progress — code slices landed)

- [x] **Harmony Garden** prototype scene (`HarmonyGardenScene`) + ranch launcher + Harmony-biased payout (`applyHarmonyGardenRound`)

- [x] **Evolution preview** overlay + `/assets/evolution/fluffling-preview.json`

- [x] **`unlockedEchoIds`** on snapshot + SQLite column (`UnlockedEchoIdsJson`) migration `20260516120000_AddUnlockedEchoIdsJson`

- [ ] Second Echo gameplay unlock rules + switching current Echo UX

- [ ] Art/audio pass (sprites, SFX, music — see [MANUAL_TODOS.md](MANUAL_TODOS.md))



## Phase 4 — Resolved decisions

| Topic | Decision |

|-------|----------|

| Fluffling art | Procedural texture + optional `assets/game/fluffling_base.png` swap-in |

| Minigame (Phase 4) | Echo Dance playable slice → deepening in Phase 6 |

| Resonance UI | Horizontal bars with icons + numeric values |

| Persistence | **API + localStorage fallback** + offline queue (`eor_offline_queue`) |

| Backend | SQLite dev DB (`echoes.db`); SQL Server deferred |



## Phase 5 — Backend integration

- [x] **5A** Controllers + EF Core SQLite + repository + `PlayerEcho` GET/PUT

- [x] **5B** Angular `EchoApiService` + `PlayerIdentityService` + API-first `EchoSaveService`

- [x] **5C** Server Quick Care + drift tick endpoints + Angular wiring



### Human checklist split

See **[MANUAL_TODOS.md](MANUAL_TODOS.md)** for **manual run/verify commands** (API + Angular URLs), assets, `dotnet ef`, and QA (Swagger `429`, etc.). Phase work does **not** require starting dev servers automatically—you run those commands when you want to check the app.

### Dev workflow (you run when verifying)

```bash
# Terminal 1 — API → http://localhost:5261  |  Swagger → http://localhost:5261/swagger
cd backend
dotnet run --project EchoesOfResonance.API.csproj

# Terminal 2 — Angular → http://localhost:4200/ranch
cd frontend
npm start
```

**Compile-only (no running servers):**

```bash
cd backend && dotnet build EchoesOfResonance.API.csproj
cd frontend && npm run build
```

On **`/ranch`**, the client uses stable **`eor_player_id`** (localStorage) and sends **`X-Player-Id`** to the API; when the API is up, **`GET …/echo`** applies server-side offline drift.



## Backlog — Phase 6+ (remaining polish)

- Deeper Echo Dance (music sync, chart authoring)

- Additional pillar minigames (Rift, Discipline Circuit, Bond Feast)

- Real Fluffling sprite sheet / Spine animations

- PWA + Capacitor packaging



## Manual validation checklist (`/ranch`)

1. Fluffling roams; tap to pet → Joy bar increases

2. Double-tap quickly → brief follow behavior

3. Quick Care with API up → persists after refresh; spam → HTTP **429** + synced cooldown

4. Wait ~45s tab visible + API up → drift tick via POST (`appliedPassivePoints`); offline banner skips tab ticks

5. Refresh → state restored from API (or legacy localStorage if API down)

6. Stop API → play → restart API → offline queue flushes; banner clears

7. Echo Dance / Harmony Garden → complete → ranch resonance updates → PUT saves

8. Evolution overlay loads branches JSON (fallback stub if fetch blocked)

9. Mobile viewport (~390px): overlay + canvas usable, no console errors



---

**Last Updated**: May 16, 2026  

**Status**: Phase 5 + 5C complete (web); Phase 6 prototype slices in repo — follow `MANUAL_TODOS.md` for asset/audio QA

