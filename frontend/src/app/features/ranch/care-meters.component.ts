import { Component, inject, input } from '@angular/core';
import { PlayerStore } from '../../core/services/player-store.service';

@Component({
  selector: 'app-care-meters',
  standalone: true,
  host: {
    '[class.care-meters-host--compact]': 'compact()',
  },
  templateUrl: './care-meters.component.html',
  styleUrl: './care-meters.component.css',
})
export class CareMetersComponent {
  readonly compact = input(false, { transform: (v: boolean | string) => v === '' || v === true });
  readonly store = inject(PlayerStore);
}
