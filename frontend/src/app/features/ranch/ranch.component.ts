import { Component, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GameBridgeService } from '../../core/services/game-bridge.service';
import { EchoDriftService } from '../../core/services/echo-drift.service';
import { EchoSaveService } from '../../core/services/echo-save.service';
import { PlayerStore } from '../../core/services/player-store.service';
import { ResonanceBarsComponent } from '../../shared/components/resonance-bars/resonance-bars.component';
import { PhaserGameComponent } from '../../game/phaser-game.component';
import { EvolutionOverlayComponent } from './evolution-overlay.component';
import { QuickCareBarComponent } from './quick-care-bar.component';
import { WeekPlannerComponent } from './week-planner.component';

@Component({
  selector: 'app-ranch',
  standalone: true,
  imports: [
    PhaserGameComponent,
    RouterLink,
    ResonanceBarsComponent,
    QuickCareBarComponent,
    EvolutionOverlayComponent,
    WeekPlannerComponent,
  ],
  templateUrl: './ranch.component.html',
  styleUrl: './ranch.component.css',
})
export class RanchComponent implements OnInit, OnDestroy {
  readonly store = inject(PlayerStore);
  readonly bridge = inject(GameBridgeService);
  private readonly save = inject(EchoSaveService);
  private readonly drift = inject(EchoDriftService);

  constructor() {
    effect(() => {
      this.store.joy();
      this.store.discipline();
      this.store.courage();
      this.store.harmony();
      this.store.petCount();
      this.store.resonanceShards();
      this.store.happiness();
      this.store.echoDanceCompletions();
      this.store.peakTotalResonanceAsFluffling();
      this.store.unlockedEchoIds();
      this.store.currentEcho();
      this.store.gameWeek();
      this.store.trainingPlan();
      this.save.scheduleSave();
    });

    effect(() => {
      const ready = this.bridge.phaserReady();
      const echo = this.store.currentEcho();
      if (ready) {
        this.bridge.syncRanchEchoFromStore(echo);
      }
    });
  }

  readonly playingOffline = this.save.playingOffline;
  readonly evolutionOpen = signal(false);
  readonly weekNotice = signal('');

  ngOnInit(): void {
    void this.save.hydrate().then(() => this.drift.start());
  }

  ngOnDestroy(): void {
    this.drift.stop();
    void this.save.saveNow();
  }

  launchEchoDance(): void {
    this.bridge.launchMinigame('echo-dance');
  }

  launchHarmonyGarden(): void {
    this.bridge.launchMinigame('harmony-garden');
  }

  onEndWeek(): void {
    const completedWeek = this.store.gameWeek();
    if (!this.store.endWeek()) {
      return;
    }

    this.weekNotice.set(
      `Week ${completedWeek} complete! Plan week ${this.store.gameWeek()} — training payouts come next.`,
    );
    this.save.scheduleSave();
  }
}
