# Echoes of Resonance - Repository File Structure

**Monorepo layout** for the Unity client + future server + shared code.  
**Last updated**: May 11, 2026

## Root Directory
echoes-of-resonance/          ← root
├── frontend/                 ← Angular + Phaser (the actual game)
│   ├── src/
│   │   ├── app/              ← Angular app (components, services, stores)
│   │   ├── assets/           ← sprites, animations, audio (Phaser-ready)
│   │   ├── game/             ← Phaser-specific folder (scenes, managers, Echo logic)
│   │   └── environments/
│   ├── angular.json
│   ├── package.json
│   ├── tsconfig.json
│   └── capacitor.config.ts   ← added later for mobile
│
├── backend/                  ← ASP.NET Core API + EF Core
│   ├── Controllers/
│   ├── Models/
│   ├── Services/             ← Resonance calculations, player progress, etc.
│   ├── Data/                 ← EF Core DbContext + migrations
│   ├── Program.cs
│   └── EchoesOfResonance.API.csproj
│
├── grok/                     ← keep exactly as-is (design docs only — update contents above)
│   ├── DESIGN.md
│   ├── TODO.md
│   └── ...
│
├── .github/                  ← workflows (CI for frontend + backend)
├── docs/                     ← optional: exported design PDFs or player-facing lore
├── README.md                 ← update with new setup instructions + tech stack
├── .gitignore                ← replace Unity ignores with Angular + .NET ignores
├── .editorconfig
└── package.json              ← root (optional: for shared scripts or concurrently running front+back)

---

**Quick Terminal Commands** (from repo root):
```bash
mkdir -p grok
cat > grok/FileStructure.md << 'EOF'
# Paste the markdown content above here
EOF
git add grok/FileStructure.md
git commit -m "Add FileStructure.md - monorepo layout"
git push origin develop