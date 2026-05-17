# Manual checklist (humans / Grok)

**MVP mode:** Gameplay polish uses **`localStorage` only** — you do **not** need the API for MVP QA. See [MVP_PLAN.md](MVP_PLAN.md).

**Workflow:** You choose when to run dev servers. Automation should prefer `npm run build` over long-lived processes.

## Run & verify the application (MVP — frontend only)

**Terminal — Angular**

```bash
cd frontend
npm start
```

- App: **http://localhost:4200**
- Egg flow: **http://localhost:4200/egg** (once implemented)
- Ranch: **http://localhost:4200/ranch**

**Optional — compile-only**

```bash
cd frontend && npm run build
```

**Backend (parked — only when testing old API features)**

```bash
cd backend && dotnet run --project EchoesOfResonance.API.csproj
```

- Base URL: **http://localhost:5261** · Swagger: **http://localhost:5261/swagger**

## Grok — design & copy (MVP)

- [x] **Four egg designs** + short hatch copy per starter (Fluffling, Droplet, Sprout, Spark)
- [ ] **Week planner** activity list descriptions (Rest, Echo Dance, Harmony Garden, Drift, stubs)
- [ ] **Adventure** — 1 short scenario template (3–5 nodes, 2–3 choice texts per starter theme)
- [ ] **Tournament** — opponent name, rank ladder (D→S), win/lose flavor lines
- [ ] **Evolution Stage 1** — branch flavor text for automatic evolutions (Joy / Courage / Harmony / balanced rare)
- [ ] Finish **Droplet, Sprout, Spark** in `STARTER_MONSTERS.md` + evolution path bullets

## Grok — art (MVP)

- [ ] **4 egg sprites** (selection screen)
- [ ] Confirm all **4 base sprites** under `frontend/src/assets/game/sprites/` (paths in `STARTER_MONSTERS.md`)
- [ ] **Stage 1** art for Fluffling (min 2 branches); placeholders OK for other starters initially
- [ ] Ranch **sky-island background** (static PNG)
- [ ] Tournament / adventure **UI frames** or icons if needed

## Assets and attribution

- [ ] Choose **free/CC0** packs if replacing procedural art; download into `frontend/src/assets/…`
- [ ] Add **`CREDITS.md`** at repo root with license + links per file
- [ ] Rhythm **SFX / music** for Echo Dance, tournament timing hits, evolution sting (Freesound — verify license)

## Tools and environment

- [ ] If **`dotnet build`** fails on Windows with “cannot copy … EchoesOfResonance.API.exe”, **stop your running API** (the terminal where `dotnet run` is active, or end that process), then build again
- [ ] **`dotnet ef`** aligned with project runtime if migrations fail: `dotnet tool update --global dotnet-ef`
- [ ] After pulling new migrations: `cd backend` → `dotnet ef database update --project EchoesOfResonance.API.csproj`
- [ ] SQLite file `backend/echoes.db` is gitignored — backup locally if you care about dev saves

## QA (manual) — MVP loop

- [ ] **Egg → hatch:** pick each starter once; correct sprite on ranch
- [ ] **Week planner:** assign Mon–Fri; **End Week** updates resonance + MR stats
- [ ] **Adventure:** complete weekend run; rewards persist after refresh
- [ ] **Tournament:** timing windows feel fair; outcome changes rank or rewards
- [ ] **Evolution:** triggers **automatically** (no branch picker); sprite updates
- [ ] **localStorage:** clear test — progress survives refresh; `clientOnly` needs no API
- [ ] Echo Dance / Harmony Garden still launch from planned slots
- [ ] **Immersive ranch** (`/ranch`): no page scroll; canvas edge-to-edge; dock + Quick Care do not overlap (safe-area on notch devices)
- [ ] **Plan sheet:** Week tab — assign Mon–Fri, weekend adventure/tournament, End Week at **390×844**
- [ ] **Plan sheet:** Status tab — MR stats + resonance bars readable
- [ ] Launch Dance / Garden / Adventure / Tournament — HUD hidden; return restores HUD
- [ ] Desktop fullscreen: same layout (not centered dashboard); plan sheet max ~480px centered
- [ ] Mobile ~390px: planner, Quick Care, timing combat usable

## Parked (post-MVP)

- [ ] API Quick Care **429**, drift tick, GET/PUT snapshot (Phase 5C regression)
- [ ] Server-validated minigame scores

---

**Companion:** Implementation status and phase notes stay in [TODO.md](TODO.md).
