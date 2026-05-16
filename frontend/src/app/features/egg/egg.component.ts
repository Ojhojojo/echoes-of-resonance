import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  STARTER_EGGS,
  type StarterEggOption,
} from '../../core/data/echo-catalog';
import { EchoSaveService } from '../../core/services/echo-save.service';
import { PlayerStore } from '../../core/services/player-store.service';

@Component({
  selector: 'app-egg',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './egg.component.html',
  styleUrl: './egg.component.css',
})
export class EggComponent implements OnInit {
  readonly eggs = STARTER_EGGS;
  readonly store = inject(PlayerStore);
  private readonly save = inject(EchoSaveService);
  private readonly router = inject(Router);

  readonly selected = signal<StarterEggOption | null>(null);
  readonly hatching = signal(false);
  readonly hatchLine = signal('');

  async ngOnInit(): Promise<void> {
    await this.save.hydrate();
    if (this.store.hasHatched()) {
      void this.router.navigate(['/ranch']);
    }
  }

  selectEgg(egg: StarterEggOption): void {
    if (this.hatching()) {
      return;
    }
    this.selected.set(egg);
  }

  async hatch(): Promise<void> {
    const egg = this.selected();
    if (!egg || this.hatching()) {
      return;
    }

    this.hatching.set(true);
    this.hatchLine.set(egg.hatchLine);

    await new Promise((r) => setTimeout(r, 1400));

    const ok = this.store.hatchStarter(egg.echoId);
    if (!ok) {
      this.hatching.set(false);
      return;
    }

    await this.save.saveNow();
    void this.router.navigate(['/ranch']);
  }
}
