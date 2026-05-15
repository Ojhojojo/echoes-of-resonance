# Manual checklist (humans / Grok)

**Workflow:** Phase work in this repo does **not** assume anyone starts or stops the API / Angular dev servers for you. **You** choose when to run the commands below to verify behavior. (Automation should prefer `dotnet build` / `npm run build` over keeping long-lived processes.)

Use this list while implementation lands in code. Check items off as you complete them.

## Run & verify the application (when *you* want to test)

Open **two terminals** from the repo root (or `backend` / `frontend` as shown).

**Terminal 1 — ASP.NET API**

```bash
cd backend
dotnet run --project EchoesOfResonance.API.csproj
```

- Base URL: **http://localhost:5261**
- Swagger (Development): **http://localhost:5261/swagger**
- Health probe (example): `GET http://localhost:5261/api/players/{your-guid}/echo/health` with header `X-Player-Id: {same-guid}`

**Terminal 2 — Angular**

```bash
cd frontend
npm start
```

- App: **http://localhost:4200**
- Ranch / game shell: **http://localhost:4200/ranch**

**Optional — compile-only checks (no servers)**

```bash
cd backend && dotnet build EchoesOfResonance.API.csproj
cd frontend && npm run build
```

## Assets and attribution (optional polish)

- [ ] Choose **free/CC0** packs if replacing procedural art (e.g. Kenney.nl, OpenGameArt CC0); download into `frontend/src/assets/…`
- [ ] Add **`CREDITS.md`** at repo root (or extend `README.md`) with license names + links for every file you add
- [ ] Optional: **Fluffling** swap-in PNG at `frontend/src/assets/game/fluffling_base.png` (already supported by texture pipeline if present)
- [ ] Optional: rhythm **SFX / music** loops for Echo Dance / ranch (Freesound — verify license per clip)

## Tools and environment

- [ ] If **`dotnet build`** fails on Windows with “cannot copy … EchoesOfResonance.API.exe”, **stop your running API** (the terminal where `dotnet run` is active, or end that process), then build again
- [ ] **`dotnet ef`** aligned with project runtime if migrations fail: `dotnet tool update --global dotnet-ef`
- [ ] After pulling new migrations: `cd backend` → `dotnet ef database update --project EchoesOfResonance.API.csproj`
- [ ] SQLite file `backend/echoes.db` is gitignored — backup locally if you care about dev saves

## QA (manual)

- [ ] Phase **5C**: Swagger — `POST …/quick-care` returns **429** when spamming same kind before 4h
- [ ] Phase **5C**: With API up, Quick Care updates bars + **persists** after refresh (no client-only cheat)
- [ ] Phase **5C**: Tab-open drift uses **POST …/drift/tick** when online; no double gains vs offline banner behavior
- [ ] Phase **6**: Echo Dance — early/late/combo feedback feels fair over 3 runs
- [ ] Phase **6**: Harmony Garden launches, completes, grants Harmony, saves
- [ ] Phase **6**: Evolution preview shows branches; `unlockedEchoIds` survives GET/PUT (after migration applied)
- [ ] Mobile `/ranch` — Quick Care + minigame buttons remain usable (~390px width)

## Design / product (not blocking code)

- [ ] Define **second Echo** id + unlock rule when moving beyond placeholder (`starling_web` stub in data JSON)
- [ ] Decide when Echo Dance scores should be **server-validated** (later hardening)

---

**Companion:** Implementation status and phase notes stay in [TODO.md](TODO.md).
