/** Monster Rancher–style combat stats (M3). */
export type MrStatKey = 'power' | 'speed' | 'defense' | 'life';

export interface MrStats {
  power: number;
  speed: number;
  defense: number;
  life: number;
}

export const MR_STAT_KEYS: readonly MrStatKey[] = ['power', 'speed', 'defense', 'life'] as const;

export const MR_STAT_LABELS: Record<MrStatKey, string> = {
  power: 'Power',
  speed: 'Speed',
  defense: 'Defense',
  life: 'Life',
};

export const DEFAULT_MR_STATS: MrStats = {
  power: 10,
  speed: 10,
  defense: 10,
  life: 10,
};

export const MR_STAT_MAX = 999;

export function clampMrStat(value: number): number {
  return Math.max(0, Math.min(MR_STAT_MAX, Math.round(value)));
}

export function normalizeMrStats(raw: Partial<MrStats> | undefined | null): MrStats {
  return {
    power: clampMrStat(raw?.power ?? DEFAULT_MR_STATS.power),
    speed: clampMrStat(raw?.speed ?? DEFAULT_MR_STATS.speed),
    defense: clampMrStat(raw?.defense ?? DEFAULT_MR_STATS.defense),
    life: clampMrStat(raw?.life ?? DEFAULT_MR_STATS.life),
  };
}

export function emptyMrStats(): MrStats {
  return { power: 0, speed: 0, defense: 0, life: 0 };
}

export function addMrStats(a: MrStats, b: Partial<MrStats>): MrStats {
  return {
    power: clampMrStat(a.power + (b.power ?? 0)),
    speed: clampMrStat(a.speed + (b.speed ?? 0)),
    defense: clampMrStat(a.defense + (b.defense ?? 0)),
    life: clampMrStat(a.life + (b.life ?? 0)),
  };
}
