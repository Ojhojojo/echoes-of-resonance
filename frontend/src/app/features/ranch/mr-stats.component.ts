import { Component, inject } from '@angular/core';
import { MR_STAT_KEYS, MR_STAT_LABELS, type MrStatKey } from '../../core/data/echo-stats';
import { PlayerStore } from '../../core/services/player-store.service';

@Component({
  selector: 'app-mr-stats',
  standalone: true,
  templateUrl: './mr-stats.component.html',
  styleUrl: './mr-stats.component.css',
})
export class MrStatsComponent {
  readonly store = inject(PlayerStore);
  readonly keys = MR_STAT_KEYS;
  readonly labels = MR_STAT_LABELS;

  value(key: MrStatKey): number {
    return this.store.mrStats()[key];
  }
}
