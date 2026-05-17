import { Injectable } from '@angular/core';
import { getEchoDefinition } from '../data/echo-catalog';
import { emptyMrStats, type MrStats } from '../data/echo-stats';
import { TRAINING_SLOT_PAYOUTS, type SlotPayout } from '../data/training-payouts';
import {
  createEmptyTrainingPlan,
  getActivityOption,
  isTrainingPlanComplete,
  WEEKDAY_LABELS,
} from '../data/training-plan';
import { PlayerStore, type ResonanceAxis } from './player-store.service';

export interface WeekResolutionResult {
  completedWeek: number;
  nextWeek: number;
  resonanceGained: Record<ResonanceAxis, number>;
  statsGained: MrStats;
  slotSummaries: string[];
}

@Injectable({ providedIn: 'root' })
export class WeekResolverService {
  /** Resolves Mon–Fri plan, applies payouts, advances week. */
  resolveWeek(store: PlayerStore): WeekResolutionResult | null {
    const plan = store.trainingPlan();
    if (!store.canEndWeek()) {
      return null;
    }

    const completedWeek = store.gameWeek();
    const echoId = store.currentEcho()?.echoId;
    const def = echoId ? getEchoDefinition(echoId) : undefined;

    const resonanceGained: Record<ResonanceAxis, number> = {
      joy: 0,
      discipline: 0,
      courage: 0,
      harmony: 0,
    };
    const statsGained = emptyMrStats();
    const slotSummaries: string[] = [];

    for (let i = 0; i < plan.length; i++) {
      const activity = plan[i];
      if (!activity) {
        continue;
      }

      const scaled = this.scalePayout(TRAINING_SLOT_PAYOUTS[activity], def?.driftWeights);
      store.applySlotPayout(scaled);
      this.accumulateResonance(resonanceGained, scaled);
      this.accumulateStats(statsGained, scaled);

      const label = getActivityOption(activity)?.label ?? activity;
      slotSummaries.push(`${WEEKDAY_LABELS[i]} ${label}: ${this.formatSlotGain(scaled)}`);
    }

    store.applyWeeklyCareSettlement(plan);

    store.gameWeek.update((w) => Math.max(1, w) + 1);
    store.trainingPlan.set(createEmptyTrainingPlan());
    store.resetWeekendProgress();
    store.touchInteraction();

    return {
      completedWeek,
      nextWeek: store.gameWeek(),
      resonanceGained,
      statsGained,
      slotSummaries,
    };
  }

  formatWeekSummary(result: WeekResolutionResult): string {
    const r = result.resonanceGained;
    const s = result.statsGained;
    const resTotal = r.joy + r.discipline + r.courage + r.harmony;
    const statTotal = s.power + s.speed + s.defense + s.life;
    return (
      `Week ${result.completedWeek} complete! +${resTotal} resonance, ` +
      `+${statTotal} MR stats (P${s.power} Sp${s.speed} D${s.defense} L${s.life}). ` +
      `Plan week ${result.nextWeek}.`
    );
  }

  private scalePayout(
    payout: SlotPayout,
    weights: Partial<Record<ResonanceAxis, number>> | undefined,
  ): SlotPayout {
    const w = weights ?? {};
    return {
      joy: this.scaleAxis(payout.joy, w.joy ?? 1),
      discipline: this.scaleAxis(payout.discipline, w.discipline ?? 1),
      courage: this.scaleAxis(payout.courage, w.courage ?? 1),
      harmony: this.scaleAxis(payout.harmony, w.harmony ?? 1),
      power: payout.power,
      speed: payout.speed,
      defense: payout.defense,
      life: payout.life,
      happiness: payout.happiness,
      fatigue: payout.fatigue,
      shards: payout.shards,
    };
  }

  private scaleAxis(base: number | undefined, weight: number): number | undefined {
    if (base === undefined || base === 0) {
      return undefined;
    }
    const clamped = Math.max(0.75, Math.min(1.35, weight));
    return Math.max(1, Math.round(base * clamped));
  }

  private accumulateResonance(target: Record<ResonanceAxis, number>, payout: SlotPayout): void {
    if (payout.joy) {
      target.joy += payout.joy;
    }
    if (payout.discipline) {
      target.discipline += payout.discipline;
    }
    if (payout.courage) {
      target.courage += payout.courage;
    }
    if (payout.harmony) {
      target.harmony += payout.harmony;
    }
  }

  private accumulateStats(target: MrStats, payout: SlotPayout): void {
    if (payout.power) {
      target.power += payout.power;
    }
    if (payout.speed) {
      target.speed += payout.speed;
    }
    if (payout.defense) {
      target.defense += payout.defense;
    }
    if (payout.life) {
      target.life += payout.life;
    }
  }

  private formatSlotGain(payout: SlotPayout): string {
    const parts: string[] = [];
    const axes: ResonanceAxis[] = ['joy', 'discipline', 'courage', 'harmony'];
    for (const axis of axes) {
      const v = payout[axis];
      if (v) {
        parts.push(`+${v} ${axis}`);
      }
    }
    if (payout.power) {
      parts.push(`+${payout.power} pow`);
    }
    if (payout.speed) {
      parts.push(`+${payout.speed} spd`);
    }
    if (payout.defense) {
      parts.push(`+${payout.defense} def`);
    }
    if (payout.life) {
      parts.push(`+${payout.life} life`);
    }
    if (payout.fatigue) {
      parts.push(payout.fatigue > 0 ? `+${payout.fatigue} fatigue` : `${payout.fatigue} fatigue`);
    }
    return parts.length ? parts.join(', ') : 'steady week';
  }
}
