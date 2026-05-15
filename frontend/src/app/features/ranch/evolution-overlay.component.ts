import { HttpClient } from '@angular/common/http';
import { Component, effect, inject, input, output, signal } from '@angular/core';
import { PlayerStore } from '../../core/services/player-store.service';

export interface EvolutionBranch {
  id: string;
  name: string;
  joyRequired?: number;
  disciplineRequired?: number;
  courageRequired?: number;
  harmonyRequired?: number;
  notes?: string;
}

export interface EvolutionPreviewJson {
  echoId: string;
  displayName: string;
  branches: EvolutionBranch[];
}

@Component({
  selector: 'app-evolution-overlay',
  standalone: true,
  templateUrl: './evolution-overlay.component.html',
  styleUrl: './evolution-overlay.component.css',
})
export class EvolutionOverlayComponent {
  private readonly http = inject(HttpClient);
  readonly store = inject(PlayerStore);

  readonly open = input.required<boolean>();
  readonly closed = output<void>();

  readonly remoteData = signal<EvolutionPreviewJson | null>(null);

  constructor() {
    effect(() => {
      if (!this.open()) {
        return;
      }
      if (this.remoteData()) {
        return;
      }

      this.http.get<EvolutionPreviewJson>('/assets/evolution/fluffling-preview.json').subscribe({
        next: (d) => this.remoteData.set(d),
        error: () =>
          this.remoteData.set({
            echoId: 'fluffling_web',
            displayName: 'Fluffling',
            branches: [
              {
                id: 'flare_form',
                name: 'Flare Form',
                joyRequired: 400,
                notes: 'Joy-forward evolution branch.',
              },
              {
                id: 'steady_form',
                name: 'Steady Form',
                disciplineRequired: 400,
                notes: 'Discipline-forward evolution branch.',
              },
            ],
          }),
      });
    });
  }

  close(): void {
    this.closed.emit();
  }

  branchReady(branch: EvolutionBranch): boolean {
    const joyOk = !branch.joyRequired || this.store.joy() >= branch.joyRequired;
    const discOk = !branch.disciplineRequired || this.store.discipline() >= branch.disciplineRequired;
    const courageOk = !branch.courageRequired || this.store.courage() >= branch.courageRequired;
    const harmonyOk = !branch.harmonyRequired || this.store.harmony() >= branch.harmonyRequired;
    return joyOk && discOk && courageOk && harmonyOk;
  }

  branchLockedReason(branch: EvolutionBranch): string | null {
    if (this.branchReady(branch)) {
      return null;
    }
    const bits: string[] = [];
    if (branch.joyRequired && this.store.joy() < branch.joyRequired) {
      bits.push(`Joy ${this.store.joy()}/${branch.joyRequired}`);
    }
    if (branch.disciplineRequired && this.store.discipline() < branch.disciplineRequired) {
      bits.push(`Discipline ${this.store.discipline()}/${branch.disciplineRequired}`);
    }
    if (branch.courageRequired && this.store.courage() < branch.courageRequired) {
      bits.push(`Courage ${this.store.courage()}/${branch.courageRequired}`);
    }
    if (branch.harmonyRequired && this.store.harmony() < branch.harmonyRequired) {
      bits.push(`Harmony ${this.store.harmony()}/${branch.harmonyRequired}`);
    }
    return bits.join(' · ');
  }
}
