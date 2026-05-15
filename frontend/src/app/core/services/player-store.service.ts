import { Injectable, computed, signal } from '@angular/core';
import {
  FLUFFLING_ECHO_ID,
  STARLING_ECHO_ID,
  STARLING_UNLOCK_FUFFLING_TOTAL_RESONANCE,
  getEchoDefinition,
} from '../data/echo-catalog';

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
  currentEcho: CurrentEcho | null;
  joy: number;
  discipline: number;
  courage: number;
  harmony: number;
  keeperLevel: number;
  resonanceShards: number;
  petCount: number;
  happiness: number;
  lastInteractionAt: number;
  passivePointsToday: number;
  passiveDayKey: string;
  driftFocus: DriftFocus;
  lastQuickCareAt: Record<QuickCareKind, number>;
  /** Echo ids unlocked for keeper (persisted server-side; Phase 6). */
  unlockedEchoIds?: string[];
  echoDanceCompletions?: number;
  peakTotalResonanceAsFluffling?: number;
}

/**
 * Client-side player / Echo state (signals only — no NgRx for MVP).
 */
@Injectable({ providedIn: 'root' })
export class PlayerStore {
  static readonly MaxAxis = 1000;
  static readonly PassiveDailyCap = 250;
  static readonly QuickCareCooldownMs = 4 * 60 * 60 * 1000;

  readonly currentEcho = signal<CurrentEcho | null>({
    echoId: FLUFFLING_ECHO_ID,
    displayName: 'Fluffling',
  });

  readonly joy = signal(0);
  readonly discipline = signal(0);
  readonly courage = signal(0);
  readonly harmony = signal(0);

  readonly keeperLevel = signal(1);
  readonly resonanceShards = signal(0);
  readonly petCount = signal(0);

  readonly happiness = signal(100);
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
  readonly unlockedEchoIds = signal<string[]>([FLUFFLING_ECHO_ID]);

  readonly echoDanceCompletions = signal(0);
  /** Max sum of four axes observed while Fluffling was the active Echo (unlock gate). */
  readonly peakTotalResonanceAsFluffling = signal(0);

  readonly passiveCapReached = signal(false);

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

  /** Dev-only: grant Starling unlock for layout / sprite checks without grinding. */
  debugUnlockStarling(): void {
    this.unlockedEchoIds.update((ids) =>
      ids.includes(STARLING_ECHO_ID) ? ids : [...ids, STARLING_ECHO_ID],
    );
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
    this.happiness.update((h) => Math.min(100, h + 2));
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
    this.happiness.update((h) => Math.min(100, h + 3));
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
    this.happiness.update((h) => Math.min(100, h + 5));
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
    this.happiness.update((h) => Math.min(100, h + 4));
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

  toSnapshot(): PlayerSnapshot {
    return {
      version: 1,
      currentEcho: this.currentEcho(),
      joy: this.joy(),
      discipline: this.discipline(),
      courage: this.courage(),
      harmony: this.harmony(),
      keeperLevel: this.keeperLevel(),
      resonanceShards: this.resonanceShards(),
      petCount: this.petCount(),
      happiness: this.happiness(),
      lastInteractionAt: this.lastInteractionAt(),
      passivePointsToday: this.passivePointsToday(),
      passiveDayKey: this.passiveDayKey(),
      driftFocus: this.driftFocus(),
      lastQuickCareAt: { ...this.lastQuickCareAt() },
      unlockedEchoIds: [...this.unlockedEchoIds()],
      echoDanceCompletions: this.echoDanceCompletions(),
      peakTotalResonanceAsFluffling: this.peakTotalResonanceAsFluffling(),
    };
  }

  loadSnapshot(data: PlayerSnapshot): void {
    if (!data || data.version !== 1) {
      return;
    }

    this.joy.set(this.clampAxis(data.joy));
    this.discipline.set(this.clampAxis(data.discipline));
    this.courage.set(this.clampAxis(data.courage));
    this.harmony.set(this.clampAxis(data.harmony));
    this.keeperLevel.set(data.keeperLevel ?? 1);
    this.resonanceShards.set(data.resonanceShards ?? 0);
    this.petCount.set(data.petCount ?? 0);
    this.happiness.set(Math.max(0, Math.min(100, data.happiness ?? 100)));
    this.lastInteractionAt.set(data.lastInteractionAt ?? Date.now());
    this.passivePointsToday.set(data.passivePointsToday ?? 0);
    this.passiveDayKey.set(data.passiveDayKey ?? this.todayKey());
    this.driftFocus.set(data.driftFocus ?? 'joy');
    this.lastQuickCareAt.set({
      pet: data.lastQuickCareAt?.pet ?? 0,
      feed: data.lastQuickCareAt?.feed ?? 0,
      encourage: data.lastQuickCareAt?.encourage ?? 0,
    });
    const ids = data.unlockedEchoIds?.filter(Boolean);
    const unlocked = ids?.length ? [...ids] : [FLUFFLING_ECHO_ID];
    if (!unlocked.some((id) => id === FLUFFLING_ECHO_ID)) {
      unlocked.unshift(FLUFFLING_ECHO_ID);
    }
    this.unlockedEchoIds.set(unlocked);

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
    this.tryUnlockStarling();
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

  private tryUnlockStarling(): void {
    if (this.unlockedEchoIds().includes(STARLING_ECHO_ID)) {
      return;
    }
    if (this.peakTotalResonanceAsFluffling() < STARLING_UNLOCK_FUFFLING_TOTAL_RESONANCE) {
      return;
    }
    if (this.echoDanceCompletions() < 1) {
      return;
    }
    this.unlockedEchoIds.update((ids) =>
      ids.includes(STARLING_ECHO_ID) ? ids : [...ids, STARLING_ECHO_ID],
    );
  }
}
