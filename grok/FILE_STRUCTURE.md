# Echoes of Resonance - Repository File Structure

**Monorepo layout** for the Unity client + future server + shared code.  
**Last updated**: May 11, 2026

## Root Directory
echoes-of-resonance/                  ← Repository root
├── unity/                            ← Unity project (client)
├── server/                           ← .NET backend (future)
├── shared/                           ← Shared C# models/DTOs (future)
├── grok/                             ← Design & planning docs
├── .gitignore
├── .gitattributes                    ← (recommended for LFS)
├── README.md
├── LICENSE
└── docker-compose.yml                ← (future)
text## Detailed Structure

### `unity/` – Unity Client (2D URP recommended)
unity/
├── Assets/
│   ├── Animations/
│   ├── Audio/
│   │   ├── Music/
│   │   └── SFX/
│   ├── Fonts/
│   ├── Materials/
│   ├── Models/
│   ├── Prefabs/
│   │   ├── Echoes/
│   │   ├── UI/
│   │   └── World/
│   ├── Scenes/
│   │   ├── MainMenu.unity
│   │   ├── Ranch.unity
│   │   └── Minigames/
│   ├── Scripts/
│   │   ├── Core/                     ← Data, Save, Managers
│   │   ├── EchoSystem/               ← Echo, Resonance, Training
│   │   ├── UI/
│   │   ├── Minigames/
│   │   └── Utilities/
│   ├── Sprites/
│   │   ├── Echoes/
│   │   ├── UI/
│   │   └── Environment/
│   ├── Resources/                    ← ScriptableObjects, runtime data
│   └── Editor/                       ← Custom editors & tools
├── Packages/
├── ProjectSettings/
└── ...
text### `grok/` – Design Documentation
grok/
├── Design.md
├── TODO.md
├── FileStructure.md                  ← This file
├── ArtStyle.md                       ← (future)
├── Balance.md                        ← (future)
└── ...
text### Future Folders
- `server/` → ASP.NET Core Web API (.NET 8+)
- `shared/` → Shared class library
- `tools/`  → Build scripts, asset pipelines, etc.

## Key Conventions & Rules
- **Unity project lives in `unity/`** → keeps the monorepo clean.
- All design docs stay in `grok/` (never inside Unity Assets).
- Folder naming: **PascalCase** for most folders.
- Large binary assets (textures, audio, models) → use Git LFS.
- Never commit `unity/Library/`, `unity/Temp/`, etc. (handled by .gitignore).

## Next Steps After Creating This File
1. Create the file in `grok/FileStructure.md`
2. Commit & push to `develop`
3. Create the `unity/` folder
4. Create your Unity project **inside** `unity/`

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