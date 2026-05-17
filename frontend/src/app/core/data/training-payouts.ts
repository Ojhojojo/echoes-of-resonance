import type { TrainingActivityId } from './training-plan';

/** Per-day training payout applied at End Week (M3). */
export interface SlotPayout {
  joy?: number;
  discipline?: number;
  courage?: number;
  harmony?: number;
  power?: number;
  speed?: number;
  defense?: number;
  life?: number;
  happiness?: number;
  fatigue?: number;
  shards?: number;
}

export const TRAINING_SLOT_PAYOUTS: Record<TrainingActivityId, SlotPayout> = {
  rest: { harmony: 10, life: 6, defense: 3, happiness: 10, fatigue: -24 },
  'echo-dance': { joy: 22, speed: 6, shards: 1, fatigue: 10 },
  'harmony-garden': { harmony: 20, joy: 6, life: 4, fatigue: 8 },
  'drift-focus': {
    joy: 6,
    discipline: 6,
    courage: 6,
    harmony: 6,
    power: 2,
    speed: 2,
    defense: 2,
    life: 2,
    fatigue: 5,
  },
  'discipline-circuit': { discipline: 20, defense: 6, power: 4, fatigue: 12 },
  'rift-prep': { courage: 22, speed: 5, power: 4, shards: 1, fatigue: 14 },
};
