# Monster / Echo Data Model - Echoes of Resonance

## Design Goals
- Data-driven and scalable
- Strong typing with enums/references where possible
- Supports active + passive training
- Clean separation between static data and runtime player data

## Core Architecture

### 1. EchoData (ScriptableObject) - Static Definition
Located in `Assets/Resources/EchoData/` or `Assets/_Project/Data/Echoes/`

**Fields**:
- `string echoId` (unique key, e.g. "fluffling_01")
- `string displayName`
- `Sprite baseSprite`
- `ElementType element` (enum: Fire, Water, Nature, Electric, etc.)
- `RarityType rarity` **(New)** → Common, Uncommon, Rare, Epic, Legendary
- `ResonanceAffinity primaryAffinity`
- `ResonanceAffinity secondaryAffinity`
- `List<EvolutionBranch> possibleEvolutions`
- `BaseStats baseStats`
- `List<string> favoriteFoods` (list of food IDs this lineage likes)

### 2. EvolutionBranch (Structured)
```csharp
public class EvolutionBranch
{
    public EvolutionPath path;           // Enum or ScriptableObject reference
    public int requiredLevel;
    public ResonanceRequirements resonanceRequirements; // min values per axis (capped at 1000)
    public Sprite evolvedSprite;
    public StatsModifier statBonuses;
}
EvolutionPath (Enum – structured as requested)
C#public enum EvolutionPath
{
    None,
    // Fluffling lineage
    PranksterInferno,
    BlazingGuardian,
    HearthSpirit,
    Prismflame,
    
    // Droplet lineage
    TidalSerenade,
    AbyssWarden,
    // ... etc for other lineages
}
3. PlayerEcho (Runtime Instance - Serializable)
Key Fields:

string uniqueId (GUID)
string echoDataId (reference to EchoData SO)
string currentName (player rename)
int currentLevel
int currentExperience
ResonanceProfile resonance (each axis capped at 1000)
EvolutionStage currentStage
EvolutionPath currentEvolutionPath (Now structured enum)
Stats currentStats
string favoriteFood (New) – Player can set one favorite food that gives bonus when used
string personalityTrait (New – useful field) – e.g. "Playful", "Calm", "Bold", "Curious". Derived from dominant resonance or set manually. Affects dialogue, reactions, and minor bonuses.
TrainingHistory trainingHistory (optional)
DateTime lastInteractionTime (for Echo Drift calculations)
float happiness (0-100)
List<string> unlockedMemoryShards

4. ResonanceProfile

int Joy (0 - 1000)
int Discipline (0 - 1000)
int Courage (0 - 1000)
int Harmony (0 - 1000)

Note: Points are capped at 1000 per axis. Excess points can optionally convert to bonus XP or happiness.
5. Supporting Enums

ElementType
RarityType
EvolutionPath
EvolutionStage (Base, Stage1, Stage2, Final)
PersonalityTrait (Playful, Calm, Bold, Loyal, Mysterious, etc.)

Data Flow Summary

Egg chosen → Create PlayerEcho from EchoData
Training → Modify ResonanceProfile (capped) + stats + happiness
Evolution check → Use currentEvolutionPath enum + resonance thresholds
Save → Serialize list of PlayerEcho

Why These Additions Work Well

EvolutionPath enum: Type-safe, easy to switch on in code, great for animations and special logic.
Rarity: Future-proof for egg gacha, drop rates, and online features.
FavoriteFood: Ties nicely into Bond Feast minigame and Quick Care.
PersonalityTrait: Adds flavor to ranch interactions, dialogue, and slight mechanical bonuses (e.g. +10% Joy gain if Playful).

Status: Finalized & Ready for Implementation ✅
Last Updated: May 12, 2026