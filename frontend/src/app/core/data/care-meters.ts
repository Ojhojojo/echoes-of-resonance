/** Care meter thresholds — harmony vs. dissonance (DESIGN.md). */
export type DissonanceLevel = 'none' | 'mild' | 'strong';

export interface CareState {
  happiness: number;
  fatigue: number;
  dissonance: DissonanceLevel;
  inDissonance: boolean;
  careMessage: string;
}

export const CARE_MAX = 100;

export const HAPPINESS_MILD_DISSONANCE = 40;
export const HAPPINESS_STRONG_DISSONANCE = 25;
export const FATIGUE_MILD_DISSONANCE = 70;
export const FATIGUE_STRONG_DISSONANCE = 85;

export function clampCareValue(value: number): number {
  return Math.max(0, Math.min(CARE_MAX, Math.round(value)));
}

export function computeCareState(happiness: number, fatigue: number): CareState {
  const h = clampCareValue(happiness);
  const f = clampCareValue(fatigue);

  let dissonance: DissonanceLevel = 'none';
  if (h < HAPPINESS_STRONG_DISSONANCE || f > FATIGUE_STRONG_DISSONANCE) {
    dissonance = 'strong';
  } else if (h < HAPPINESS_MILD_DISSONANCE || f > FATIGUE_MILD_DISSONANCE) {
    dissonance = 'mild';
  }

  return {
    happiness: h,
    fatigue: f,
    dissonance,
    inDissonance: dissonance !== 'none',
    careMessage: careMessageFor(dissonance, h, f),
  };
}

function careMessageFor(dissonance: DissonanceLevel, happiness: number, fatigue: number): string {
  if (dissonance === 'none') {
    if (happiness >= 80 && fatigue <= 30) {
      return 'Your Echo glows with steady resonance.';
    }
    if (fatigue > 50) {
      return 'A rest day would help your partner recharge.';
    }
    return 'Bond feels warm and balanced.';
  }
  if (dissonance === 'strong') {
    if (fatigue > FATIGUE_MILD_DISSONANCE && happiness < HAPPINESS_MILD_DISSONANCE) {
      return 'Your Echo is worn out — rest and Quick Care will help.';
    }
    if (happiness < HAPPINESS_STRONG_DISSONANCE) {
      return 'Dissonance hums — spend time together to reconnect.';
    }
    return 'Strong dissonance — gentle care will restore harmony.';
  }
  if (fatigue > FATIGUE_MILD_DISSONANCE) {
    return 'Fatigue is building — try Rest or Quick Care.';
  }
  return 'A faint dissonance — a little care goes a long way.';
}
