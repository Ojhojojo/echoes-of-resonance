export type TournamentRank = 'D' | 'D+' | 'C' | 'B' | 'A' | 'S';

export const TOURNAMENT_RANKS: readonly TournamentRank[] = ['D', 'D+', 'C', 'B', 'A', 'S'] as const;

export const TOURNAMENT_OPPONENTS: Record<TournamentRank, string> = {
  D: 'Bubbles',
  'D+': 'Flicker',
  C: 'Leafwhisper',
  B: 'Stormkit',
  A: 'Blazewing',
  S: 'Echo Sovereign',
};

export function normalizeTournamentRank(raw: string | undefined | null): TournamentRank {
  if (raw && (TOURNAMENT_RANKS as readonly string[]).includes(raw)) {
    return raw as TournamentRank;
  }
  return 'D';
}

export function advanceTournamentRank(current: TournamentRank): TournamentRank {
  const idx = TOURNAMENT_RANKS.indexOf(current);
  if (idx < 0 || idx >= TOURNAMENT_RANKS.length - 1) {
    return current;
  }
  return TOURNAMENT_RANKS[idx + 1];
}

export function tournamentRankLabel(rank: TournamentRank): string {
  return `Rank ${rank}`;
}
