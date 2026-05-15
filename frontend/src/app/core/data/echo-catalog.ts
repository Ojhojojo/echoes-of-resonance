import echoDefinitions from '../../../assets/data/echo-definitions.json';

/** Matches DESIGN.md Echo Roster (exact qualitative bias for Starling). */
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

export const STARLING_ECHO_ID = 'starling_web' as const;
export const FLUFFLING_ECHO_ID = 'fluffling_web' as const;

/** Total resonance on Fluffling required to unlock Starling (DESIGN.md). */
export const STARLING_UNLOCK_FUFFLING_TOTAL_RESONANCE = 120;

export function getEchoDefinition(baseId: string): EchoDefinition | undefined {
  return ECHO_CATALOG[baseId];
}
