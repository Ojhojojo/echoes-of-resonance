# echoes-of-resonance

Echoes of Resonance — Angular + Phaser MVP (client-only saves).

## MVP dev workflow (no backend required)

The app runs in **client-only mode** (`environment.clientOnly`). Progress is stored in the browser under `eor_snapshot_v2` (migrates from legacy `eor_fluffling_v1` if present).

```bash
cd frontend && npm start
# http://localhost:4200  ·  Egg: /egg  ·  Ranch: /ranch
```

You do **not** need `dotnet run` for MVP playtests. The ASP.NET API remains in `backend/` for when sync returns (Phase 9).

Optional backend (API-first path when `clientOnly` is false):

```bash
cd backend && dotnet run --project EchoesOfResonance.API.csproj
```
