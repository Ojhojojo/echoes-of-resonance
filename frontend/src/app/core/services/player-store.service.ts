import { Injectable, computed, signal } from '@angular/core';
import {
  clampCareValue,
  computeCareState,
  type CareState,
} from '../data/care-meters';
import {
  FLUFFLING_ECHO_ID,
  getEchoDefinition,
  isStarterEchoId,
  type StarterEchoId,
} from '../data/echo-catalog';
import {
  clampMrStat,
  DEFAULT_MR_STATS,
  normalizeMrStats,
  type MrStatKey,
  type MrStats,
} from '../data/echo-stats';
import type { SlotPayout } from '../data/training-payouts';
import {
  advanceTournamentRank,
  normalizeTournamentRank,
  type TournamentRank,
} from '../data/tournament-data';
import {
  createEmptyTrainingPlan,
  isTrainingPlanComplete,
  normalizeTrainingPlan,
  type TrainingActivityId,
  type TrainingPlan,
} from '../data/training-plan';

/** Resonance axis keys — aligned with design pillars. */
export type ResonanceAxis = 'joy' | 'discipline' | 'courage' | 'harmony';

export type DriftFocus = 'balanced' | 'joy';

export type QuickCareKind = 'pet' | 'feed' | 'encourage';

export interface CurrentEcho {
  echoId: string;
  displayName: string;
}

export interface PlayerSnapshot {
  version: 1;
  /** False until the player completes egg onboarding (M1). */
  hasHatched?: boolean;
  currentEcho: CurrentEcho | null;
  joy: number;
  discipline: number;
  courage: number;
  harmony: number;
  keeperLevel: number;
  resonanceShards: number;
  petCount: number;
  happiness: number;
  fatigue?: number;
  lastInteractionAt: number;
  passivePointsToday: number;
  passiveDayKey: string;
  driftFocus: DriftFocus;
  lastQuickCareAt: Record<QuickCareKind, number>;
  /** Echo ids unlocked for keeper (persisted server-side; Phase 6). */
  unlockedEchoIds?: string[];
  echoDanceCompletions?: number;
  peakTotalResonanceAsFluffling?: number;
  /** In-game week counter (1 = first week after hatch). */
  gameWeek?: number;
  /** Mon–Fri training slots (M2). */
  trainingPlan?: TrainingPlan;
  /** MR combat stats (M3). */
  power?: number;
  speed?: number;
  defense?: number;
  life?: number;
  weekendAdventureDone?: boolean;
  weekendTournamentDone?: boolean;
  tournamentRank?: TournamentRank;
}

/**
 * Client-side player / Echo state (signals only — no NgRx for MVP).
 */
@Injectable({ providedIn: 'root' })
export class PlayerStore {
  static readonly MaxAxis = 1000;
  static readonly PassiveDailyCap = 250;
  static readonly QuickCareCooldownMs = 4 * 60 * 60 * 1000;

  readonly hasHatched = signal(false);

  readonly currentEcho = signal<CurrentEcho | null>(null);

  readonly joy = signal(0);
  readonly discipline = signal(0);
  readonly courage = signal(0);
  readonly harmony = signal(0);

  readonly keeperLevel = signal(1);
  readonly resonanceShards = signal(0);
  readonly petCount = signal(0);

  readonly happiness = signal(100);
  /** 0 = rested, 100 = exhausted. */
  readonly fatigue = signal(0);

  readonly careState = computed<CareState>(() =>
    computeCareState(this.happiness(), this.fatigue()),
  );

  readonly lastInteractionAt = signal(Date.now());
  readonly passivePointsToday = signal(0);
  readonly passiveDayKey = signal(this.todayKey());
  readonly driftFocus = signal<DriftFocus>('joy');

  readonly lastQuickCareAt = signal<Record<QuickCareKind, number>>({
    pet: 0,
    feed: 0,
    encourage: 0,
  });

  /** Echo ids this keeper has unlocked (server persists via snapshot). */
  readonly unlockedEchoIds = signal<string[]>([]);

  readonly echoDanceCompletions = signal(0);
  /** Max sum of four axes observed while Fluffling was the active Echo (reserved for future progression). */
  readonly peakTotalResonanceAsFluffling = signal(0);

  readonly passiveCapReached = signal(false);

  readonly gameWeek = signal(1);
  readonly trainingPlan = signal<TrainingPlan>(createEmptyTrainingPlan());

  readonly trainingPlanComplete = computed(() => isTrainingPlanComplete(this.trainingPlan()));

  readonly weekendAdventureDone = signal(false);
  readonly weekendTournamentDone = signal(false);
  readonly tournamentRank = signal<TournamentRank>('D');

  readonly canPlayWeekend = computed(
    () => this.trainingPlanComplete() && this.hasHatched(),
  );

  readonly canEndWeek = computed(
    () =>
      this.trainingPlanComplete() &&
      this.weekendAdventureDone() &&
      this.weekendTournamentDone(),
  );

  readonly power = signal(DEFAULT_MR_STATS.power);
  readonly speed = signal(DEFAULT_MR_STATS.speed);
  readonly defense = signal(DEFAULT_MR_STATS.defense);
  readonly life = signal(DEFAULT_MR_STATS.life);

  readonly mrStats = computed<MrStats>(() => ({
    power: this.power(),
    speed: this.speed(),
    defense: this.defense(),
    life: this.life(),
  }));

  readonly totalResonance = computed(
    () => this.joy() + this.discipline() + this.courage() + this.harmony(),
  );

  setCurrentEcho(echo: CurrentEcho | null): void {
    if (echo && !this.unlockedEchoIds().includes(echo.echoId)) {
      return;
    }
    this.currentEcho.set(echo);
    this.progressionPulse();
  }

  /** Egg onboarding — sets partner, unlocks starter, resets keeper progress. */
  hatchStarter(echoId: StarterEchoId): boolean {
    if (!isStarterEchoId(echoId)) {
      return false;
    }
    const def = getEchoDefinition(echoId);
    if (!def) {
      return false;
    }

    this.hasHatched.set(true);
    this.unlockedEchoIds.set([echoId]);
    this.currentEcho.set({ echoId, displayName: def.displayName });
    this.resetKeeperProgress();
    this.touchInteraction();
    this.progressionPulse();
    return true;
  }

  private resetKeeperProgress(): void {
    this.joy.set(0);
    this.discipline.set(0);
    this.courage.set(0);
    this.harmony.set(0);
    this.keeperLevel.set(1);
    this.resonanceShards.set(0);
    this.petCount.set(0);
    this.happiness.set(100);
    this.fatigue.set(0);
    this.passivePointsToday.set(0);
    this.passiveDayKey.set(this.todayKey());
    this.passiveCapReached.set(false);
    this.driftFocus.set('joy');
    this.lastQuickCareAt.set({ pet: 0, feed: 0, encourage: 0 });
    this.echoDanceCompletions.set(0);
    this.peakTotalResonanceAsFluffling.set(0);
    this.gameWeek.set(1);
    this.trainingPlan.set(createEmptyTrainingPlan());
    this.power.set(DEFAULT_MR_STATS.power);
    this.speed.set(DEFAULT_MR_STATS.speed);
    this.defense.set(DEFAULT_MR_STATS.defense);
    this.life.set(DEFAULT_MR_STATS.life);
    this.weekendAdventureDone.set(false);
    this.weekendTournamentDone.set(false);
    this.tournamentRank.set('D');
  }

  resetWeekendProgress(): void {
    this.weekendAdventureDone.set(false);
    this.weekendTournamentDone.set(false);
  }

  adjustHappiness(delta: number): void {
    this.happiness.set(clampCareValue(this.happiness() + delta));
  }

  adjustFatigue(delta: number): void {
    this.fatigue.set(clampCareValue(this.fatigue() + delta));
  }

  /** Long absence — gentle neglect pressure (hydrate). */
  applyCatchUpCare(hoursAway: number): void {
    if (hoursAway < 8) {
      return;
    }
    const days = Math.min(3, Math.floor(hoursAway / 24));
    this.adjustFatigue(days * 6);
    this.adjustHappiness(-days * 4);
  }

  /** Called when resolving the training plan at End Week. */
  applyWeeklyCareSettlement(plan: TrainingPlan): void {
    const restDays = plan.filter((slot) => slot === 'rest').length;
    if (restDays === 0) {
      this.adjustFatigue(12);
      this.adjustHappiness(-4);
    } else if (restDays >= 2) {
      this.adjustFatigue(-6);
      this.adjustHappiness(3);
    }

    const care = this.careState();
    if (care.dissonance === 'strong') {
      this.adjustHappiness(-6);
    } else if (care.dissonance === 'mild') {
      this.adjustHappiness(-2);
    }
  }

  applyAdventureRewards(dominantAxis: ResonanceAxis, endingId?: string): void {
    this.addAxis('courage', 12);
    if (endingId === 'balanced') {
      this.addAxis('joy', 8);
      this.addAxis('harmony', 8);
      this.addAxis('discipline', 6);
      this.addAxis('courage', 6);
      this.applyMrStatDelta({ power: 2, speed: 2, defense: 2, life: 2 });
      this.resonanceShards.update((c) => c + 2);
      this.happiness.update((h) => Math.min(100, h + 8));
      this.adjustFatigue(6);
      this.weekendAdventureDone.set(true);
      return;
    }
    switch (dominantAxis) {
      case 'joy':
        this.addAxis('joy', 16);
        this.applyMrStatDelta({ speed: 4 });
        break;
      case 'discipline':
        this.addAxis('discipline', 14);
        this.applyMrStatDelta({ defense: 4 });
        break;
      case 'courage':
        this.addAxis('courage', 10);
        this.applyMrStatDelta({ power: 4 });
        break;
      case 'harmony':
        this.addAxis('harmony', 16);
        this.applyMrStatDelta({ life: 4 });
        break;
    }
    this.resonanceShards.update((c) => c + 1);
    this.happiness.update((h) => Math.min(100, h + 6));
    this.adjustFatigue(8);
    this.weekendAdventureDone.set(true);
  }

  applyTournamentResult(won: boolean): void {
    if (won) {
      this.addAxis('courage', 10);
      this.addAxis('discipline', 6);
      this.applyMrStatDelta({ power: 4, speed: 4 });
      this.happiness.update((h) => Math.min(100, h + 5));
      this.adjustFatigue(-4);
      this.tournamentRank.update((r) => advanceTournamentRank(r));
    } else {
      this.addAxis('courage', 5);
      this.addAxis('harmony', 6);
      this.applyMrStatDelta({ defense: 3, life: 3 });
      this.happiness.update((h) => Math.min(100, Math.max(0, h - 2)));
      this.adjustFatigue(10);
    }
    this.resonanceShards.update((c) => c + (won ? 2 : 1));
    this.weekendTournamentDone.set(true);
  }

  recordEchoDanceCompletion(): void {
    this.echoDanceCompletions.update((n) => n + 1);
    this.touchInteraction();
    this.progressionPulse();
  }

  touchInteraction(): void {
    this.lastInteractionAt.set(Date.now());
  }

  setAxis(axis: ResonanceAxis, value: number): void {
    const v = this.clampAxis(value);
    switch (axis) {
      case 'joy':
        this.joy.set(v);
        break;
      case 'discipline':
        this.discipline.set(v);
        break;
      case 'courage':
        this.courage.set(v);
        break;
      case 'harmony':
        this.harmony.set(v);
        break;
    }
    this.touchInteraction();
    this.progressionPulse();
  }

  addAxis(axis: ResonanceAxis, delta: number): number {
    const before = this.getAxis(axis);
    this.setAxis(axis, before + delta);
    return this.getAxis(axis) - before;
  }

  getAxis(axis: ResonanceAxis): number {
    switch (axis) {
      case 'joy':
        return this.joy();
      case 'discipline':
        return this.discipline();
      case 'courage':
        return this.courage();
      case 'harmony':
        return this.harmony();
    }
  }

  applyPetBondNudge(): void {
    this.addAxis('joy', 4);
    this.addAxis('harmony', 1);
    this.petCount.update((n) => n + 1);
    this.adjustHappiness(3);
    this.adjustFatigue(-4);
  }

  applyQuickCare(kind: QuickCareKind): boolean {
    if (!this.canQuickCare(kind)) {
      return false;
    }

    const total = this.rollQuickCarePoints();
    const joyShare = Math.ceil(total * 0.5);
    const harmonyShare = Math.ceil(total * 0.25);
    const courageShare = Math.floor((total - joyShare - harmonyShare) * 0.6);
    const disciplineShare = total - joyShare - harmonyShare - courageShare;

    this.addAxis('joy', joyShare);
    this.addAxis('harmony', harmonyShare);
    this.addAxis('courage', Math.max(0, courageShare));
    this.addAxis('discipline', Math.max(0, disciplineShare));
    this.adjustHappiness(4);
    this.adjustFatigue(-6);
    this.resonanceShards.update((c) => c + 1);

    const map = { ...this.lastQuickCareAt() };
    map[kind] = Date.now();
    this.lastQuickCareAt.set(map);
    return true;
  }

  canQuickCare(kind: QuickCareKind): boolean {
    const last = this.lastQuickCareAt()[kind];
    return Date.now() - last >= PlayerStore.QuickCareCooldownMs;
  }

  quickCareCooldownRemainingMs(kind: QuickCareKind): number {
    const last = this.lastQuickCareAt()[kind];
    return Math.max(0, PlayerStore.QuickCareCooldownMs - (Date.now() - last));
  }

  applyMinigameReward(score: number): void {
    const joyGain = Math.round(score * 0.65);
    const harmonyGain = Math.round(score * 0.25);
    const courageGain = score - joyGain - harmonyGain;
    this.addAxis('joy', joyGain);
    this.addAxis('harmony', harmonyGain);
    this.addAxis('courage', Math.max(0, courageGain));
    this.resonanceShards.update((c) => c + 2);
    this.adjustHappiness(5);
    this.adjustFatigue(6);
  }

  /** Harmony Garden payout — Harmony-biased (Phase 6 prototype). */
  applyHarmonyGardenRound(score: number): void {
    const harmonyGain = Math.round(score * 0.55);
    const joyGain = Math.round(score * 0.28);
    const courageGain = Math.round(score * 0.1);
    let disciplineGain = score - harmonyGain - joyGain - courageGain;
    if (disciplineGain < 0) {
      disciplineGain = 0;
    }
    this.addAxis('harmony', harmonyGain);
    this.addAxis('joy', joyGain);
    this.addAxis('courage', courageGain);
    this.addAxis('discipline', disciplineGain);
    this.adjustHappiness(4);
    this.adjustFatigue(5);
    this.resonanceShards.update((c) => c + 1);
  }

  /**
   * Passive gain with daily soft cap (~250). Returns points actually applied.
   */
  applyPassiveGain(joy: number, discipline: number, courage: number, harmony: number): number {
    this.ensurePassiveDay();
    const requested = joy + discipline + courage + harmony;
    const room = Math.max(0, PlayerStore.PassiveDailyCap - this.passivePointsToday());
    if (room <= 0) {
      this.passiveCapReached.set(true);
      return 0;
    }

    let scale = 1;
    if (requested > room) {
      scale = room / requested;
    }

    const j = Math.round(joy * scale);
    const d = Math.round(discipline * scale);
    const c = Math.round(courage * scale);
    const h = Math.round(harmony * scale);
    const applied = j + d + c + h;

    this.addAxis('joy', j);
    this.addAxis('discipline', d);
    this.addAxis('courage', c);
    this.addAxis('harmony', h);

    this.passivePointsToday.update((p) => p + applied);
    this.passiveCapReached.set(this.passivePointsToday() >= PlayerStore.PassiveDailyCap);
    return applied;
  }

  /** Tab-open periodic drift — mirrors backend ApplyTabOpenDriftTick. */
  applyTabOpenDriftTick(): number {
    this.ensurePassiveDay();
    if (this.passivePointsToday() >= PlayerStore.PassiveDailyCap) {
      return 0;
    }

    const baseGain = 3 + Math.floor(Math.random() * 4);
    const joy = Math.round(baseGain * 0.5);
    const harmony = Math.round(baseGain * 0.2);
    const courage = Math.round(baseGain * 0.15);
    const discipline = baseGain - joy - harmony - courage;
    return this.applyPassiveGain(joy, discipline, courage, harmony);
  }

  applyOfflineDriftHours(hours: number): number {
    if (hours <= 0) {
      return 0;
    }

    const cappedHours = Math.min(hours, 72);
    let totalApplied = 0;

    for (let i = 0; i < Math.floor(cappedHours); i++) {
      const base = 12 + Math.floor(Math.random() * 17);
      const joy = Math.round(base * 0.45);
      const harmony = Math.round(base * 0.2);
      const courage = Math.round(base * 0.18);
      const discipline = base - joy - harmony - courage;
      totalApplied += this.applyPassiveGain(joy, discipline, courage, harmony);
      if (this.passiveCapReached()) {
        break;
      }
    }

    return totalApplied;
  }

  addCurrency(amount: number): void {
    this.resonanceShards.update((c) => Math.max(0, c + amount));
  }

  setKeeperLevel(level: number): void {
    this.keeperLevel.set(Math.max(1, Math.floor(level)));
  }

  applyMrStatDelta(delta: Partial<MrStats>): void {
    if (delta.power) {
      this.power.update((v) => clampMrStat(v + delta.power!));
    }
    if (delta.speed) {
      this.speed.update((v) => clampMrStat(v + delta.speed!));
    }
    if (delta.defense) {
      this.defense.update((v) => clampMrStat(v + delta.defense!));
    }
    if (delta.life) {
      this.life.update((v) => clampMrStat(v + delta.life!));
    }
  }

  setMrStat(key: MrStatKey, value: number): void {
    const v = clampMrStat(value);
    switch (key) {
      case 'power':
        this.power.set(v);
        break;
      case 'speed':
        this.speed.set(v);
        break;
      case 'defense':
        this.defense.set(v);
        break;
      case 'life':
        this.life.set(v);
        break;
    }
  }

  /** Applies one training-day payout (used by WeekResolverService). */
  applySlotPayout(payout: SlotPayout): void {
    if (payout.joy) {
      this.addAxis('joy', payout.joy);
    }
    if (payout.discipline) {
      this.addAxis('discipline', payout.discipline);
    }
    if (payout.courage) {
      this.addAxis('courage', payout.courage);
    }
    if (payout.harmony) {
      this.addAxis('harmony', payout.harmony);
    }
    this.applyMrStatDelta({
      power: payout.power,
      speed: payout.speed,
      defense: payout.defense,
      life: payout.life,
    });
    if (payout.happiness) {
      this.adjustHappiness(payout.happiness);
    }
    if (payout.fatigue) {
      this.adjustFatigue(payout.fatigue);
    }
    if (payout.shards) {
      this.resonanceShards.update((c) => c + payout.shards!);
    }
  }

  setTrainingSlot(dayIndex: number, activity: TrainingActivityId | null): void {
    if (dayIndex < 0 || dayIndex >= 5) {
      return;
    }
    const plan = [...this.trainingPlan()] as TrainingPlan;
    plan[dayIndex] = activity;
    this.trainingPlan.set(plan);
    this.touchInteraction();
  }

  toSnapshot(): PlayerSnapshot {
    return {
      version: 1,
      hasHatched: this.hasHatched(),
      currentEcho: this.currentEcho(),
      joy: this.joy(),
      discipline: this.discipline(),
      courage: this.courage(),
      harmony: this.harmony(),
      keeperLevel: this.keeperLevel(),
      resonanceShards: this.resonanceShards(),
      petCount: this.petCount(),
      happiness: this.happiness(),
      fatigue: this.fatigue(),
      lastInteractionAt: this.lastInteractionAt(),
      passivePointsToday: this.passivePointsToday(),
      passiveDayKey: this.passiveDayKey(),
      driftFocus: this.driftFocus(),
      lastQuickCareAt: { ...this.lastQuickCareAt() },
      unlockedEchoIds: [...this.unlockedEchoIds()],
      echoDanceCompletions: this.echoDanceCompletions(),
      peakTotalResonanceAsFluffling: this.peakTotalResonanceAsFluffling(),
      gameWeek: this.gameWeek(),
      trainingPlan: [...this.trainingPlan()] as TrainingPlan,
      power: this.power(),
      speed: this.speed(),
      defense: this.defense(),
      life: this.life(),
      weekendAdventureDone: this.weekendAdventureDone(),
      weekendTournamentDone: this.weekendTournamentDone(),
      tournamentRank: this.tournamentRank(),
    };
  }

  loadSnapshot(data: PlayerSnapshot): void {
    if (!data || data.version !== 1) {
      return;
    }

    const hatched = data.hasHatched ?? !!data.currentEcho;
    this.hasHatched.set(hatched);

    this.joy.set(this.clampAxis(data.joy));
    this.discipline.set(this.clampAxis(data.discipline));
    this.courage.set(this.clampAxis(data.courage));
    this.harmony.set(this.clampAxis(data.harmony));
    this.keeperLevel.set(data.keeperLevel ?? 1);
    this.resonanceShards.set(data.resonanceShards ?? 0);
    this.petCount.set(data.petCount ?? 0);
    this.happiness.set(clampCareValue(data.happiness ?? 100));
    this.fatigue.set(clampCareValue(data.fatigue ?? 0));
    this.lastInteractionAt.set(data.lastInteractionAt ?? Date.now());
    this.passivePointsToday.set(data.passivePointsToday ?? 0);
    this.passiveDayKey.set(data.passiveDayKey ?? this.todayKey());
    this.driftFocus.set(data.driftFocus ?? 'joy');
    this.lastQuickCareAt.set({
      pet: data.lastQuickCareAt?.pet ?? 0,
      feed: data.lastQuickCareAt?.feed ?? 0,
      encourage: data.lastQuickCareAt?.encourage ?? 0,
    });
    const ids = data.unlockedEchoIds?.filter(Boolean) ?? [];
    if (hatched) {
      const unlocked = ids.length ? [...ids] : [FLUFFLING_ECHO_ID];
      if (!unlocked.some((id) => id === FLUFFLING_ECHO_ID)) {
        unlocked.unshift(FLUFFLING_ECHO_ID);
      }
      this.unlockedEchoIds.set(unlocked);
    } else {
      this.unlockedEchoIds.set([...ids]);
    }

    const total =
      this.clampAxis(data.joy) +
      this.clampAxis(data.discipline) +
      this.clampAxis(data.courage) +
      this.clampAxis(data.harmony);
    let peak = Math.max(0, data.peakTotalResonanceAsFluffling ?? 0);
    if (data.currentEcho?.echoId === FLUFFLING_ECHO_ID) {
      peak = Math.max(peak, total);
    }
    this.peakTotalResonanceAsFluffling.set(
      Math.min(PlayerStore.MaxAxis * 4, peak),
    );
    this.echoDanceCompletions.set(Math.max(0, data.echoDanceCompletions ?? 0));
    this.gameWeek.set(Math.max(1, data.gameWeek ?? 1));
    this.trainingPlan.set(normalizeTrainingPlan(data.trainingPlan));
    const stats = normalizeMrStats({
      power: data.power,
      speed: data.speed,
      defense: data.defense,
      life: data.life,
    });
    this.power.set(stats.power);
    this.speed.set(stats.speed);
    this.defense.set(stats.defense);
    this.life.set(stats.life);
    this.weekendAdventureDone.set(!!data.weekendAdventureDone);
    this.weekendTournamentDone.set(!!data.weekendTournamentDone);
    this.tournamentRank.set(normalizeTournamentRank(data.tournamentRank));

    let current = data.currentEcho;
    if (current && !this.unlockedEchoIds().includes(current.echoId)) {
      const def = getEchoDefinition(FLUFFLING_ECHO_ID);
      current = { echoId: FLUFFLING_ECHO_ID, displayName: def?.displayName ?? 'Fluffling' };
    }
    this.currentEcho.set(current);
    this.ensurePassiveDay();
    this.passiveCapReached.set(this.passivePointsToday() >= PlayerStore.PassiveDailyCap);
    this.progressionPulse();
  }

  ensurePassiveDay(): void {
    const key = this.todayKey();
    if (this.passiveDayKey() !== key) {
      this.passiveDayKey.set(key);
      this.passivePointsToday.set(0);
      this.passiveCapReached.set(false);
    }
  }

  private rollQuickCarePoints(): number {
    return 10 + Math.floor(Math.random() * 11);
  }

  private todayKey(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private clampAxis(n: number): number {
    return Math.max(0, Math.min(PlayerStore.MaxAxis, Math.round(n)));
  }

  private progressionPulse(): void {
    this.refreshFlufflingPeak();
  }

  private refreshFlufflingPeak(): void {
    if (this.currentEcho()?.echoId !== FLUFFLING_ECHO_ID) {
      return;
    }
    const total = this.joy() + this.discipline() + this.courage() + this.harmony();
    const cap = PlayerStore.MaxAxis * 4;
    const clamped = Math.min(cap, total);
    this.peakTotalResonanceAsFluffling.update((p) => Math.max(p, clamped));
  }
}
