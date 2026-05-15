import { Component, computed, effect, inject, signal } from '@angular/core';
import { GameBridgeService } from '../../../core/services/game-bridge.service';
import { PlayerStore, type ResonanceAxis } from '../../../core/services/player-store.service';

interface BarModel {
  axis: ResonanceAxis;
  label: string;
  icon: string;
  value: number;
  percent: number;
}

@Component({
  selector: 'app-resonance-bars',
  standalone: true,
  templateUrl: './resonance-bars.component.html',
  styleUrl: './resonance-bars.component.css',
})
export class ResonanceBarsComponent {
  private readonly store = inject(PlayerStore);
  private readonly bridge = inject(GameBridgeService);

  readonly pulse = signal(false);

  readonly bars = computed<BarModel[]>(() => [
    this.bar('joy', 'Joy', '☀', this.store.joy()),
    this.bar('discipline', 'Discipline', '◇', this.store.discipline()),
    this.bar('courage', 'Courage', '⚡', this.store.courage()),
    this.bar('harmony', 'Harmony', '♪', this.store.harmony()),
  ]);

  constructor() {
    effect(() => {
      this.bridge.lastEvent();
      this.pulse.set(true);
      const t = setTimeout(() => this.pulse.set(false), 450);
      return () => clearTimeout(t);
    });
  }

  private bar(axis: ResonanceAxis, label: string, icon: string, value: number): BarModel {
    return {
      axis,
      label,
      icon,
      value,
      percent: Math.min(100, (value / PlayerStore.MaxAxis) * 100),
    };
  }
}
