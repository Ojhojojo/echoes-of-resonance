import echoDefinitions from '../../../assets/data/echo-definitions.json';

/** Per-echo resonance bias notes (from `echo-definitions.json`). */
export interface EchoResonanceBiasAxis {
  strength: string;
  notes: string;
}

export interface EchoDefinition {
  baseId: string;
  displayName: string;
  resonanceBias: Partial<Record<'joy' | 'discipline' | 'courage' | 'harmony', EchoResonanceBiasAxis>>;
  /** MVP drift multipliers — derived from High/Medium/Low profile. */
  driftWeights: Partial<Record<'joy' | 'discipline' | 'courage' | 'harmony', number>>;
}

export const ECHO_CATALOG = echoDefinitions as Record<string, EchoDefinition>;

export const FLUFFLING_ECHO_ID = 'fluffling_web' as const;
export const DROPLET_ECHO_ID = 'droplet_web' as const;
export const SPROUT_ECHO_ID = 'sprout_web' as const;
export const SPARK_ECHO_ID = 'spark_web' as const;

export const STARTER_ECHO_IDS = [
  FLUFFLING_ECHO_ID,
  DROPLET_ECHO_ID,
  SPROUT_ECHO_ID,
  SPARK_ECHO_ID,
] as const;

export type StarterEchoId = (typeof STARTER_ECHO_IDS)[number];

export interface StarterEggOption {
  echoId: StarterEchoId;
  displayName: string;
  eggImageUrl: string;
  hatchLine: string;
}

export const STARTER_EGGS: readonly StarterEggOption[] = [
  {
    echoId: FLUFFLING_ECHO_ID,
    displayName: 'Fluffling',
    eggImageUrl: 'assets/game/sprites/fluffling_egg.jpg',
    hatchLine: 'A playful cloud of warmth bursts free!',
  },
  {
    echoId: DROPLET_ECHO_ID,
    displayName: 'Droplet',
    eggImageUrl: 'assets/game/sprites/droplet_egg.jpg',
    hatchLine: 'Gentle ripples settle into a smiling raindrop.',
  },
  {
    echoId: SPROUT_ECHO_ID,
    displayName: 'Sprout',
    eggImageUrl: 'assets/game/sprites/sprout_egg.jpg',
    hatchLine: 'A shy leaf unfurls — patient growth begins.',
  },
  {
    echoId: SPARK_ECHO_ID,
    displayName: 'Spark',
    eggImageUrl: 'assets/game/sprites/spark_egg.jpg',
    hatchLine: 'Crackling courage leaps out with a bright grin!',
  },
] as const;

const TEXTURE_KEY_BY_ECHO_ID: Record<string, string> = {
  [FLUFFLING_ECHO_ID]: 'fluffling',
  [DROPLET_ECHO_ID]: 'droplet',
  [SPROUT_ECHO_ID]: 'sprout',
  [SPARK_ECHO_ID]: 'spark',
};

const BASE_SPRITE_BY_TEXTURE_KEY: Record<string, string> = {
  fluffling: 'assets/game/sprites/fluffling_base.jpg',
  droplet: 'assets/game/sprites/droplet_base.png',
  sprout: 'assets/game/sprites/sprout_base.png',
  spark: 'assets/game/sprites/spark_base.png',
};

export function getEchoDefinition(baseId: string): EchoDefinition | undefined {
  return ECHO_CATALOG[baseId];
}

export function isStarterEchoId(echoId: string): echoId is StarterEchoId {
  return (STARTER_ECHO_IDS as readonly string[]).includes(echoId);
}

export function echoIdToTextureKey(echoId: string): string {
  return TEXTURE_KEY_BY_ECHO_ID[echoId] ?? 'fluffling';
}

export function starterTextureKeys(): string[] {
  return Object.values(TEXTURE_KEY_BY_ECHO_ID);
}

export function baseSpritePathForTextureKey(textureKey: string): string | undefined {
  return BASE_SPRITE_BY_TEXTURE_KEY[textureKey];
}
