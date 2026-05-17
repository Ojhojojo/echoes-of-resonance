import { Component, effect, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GameBridgeService } from '../../core/services/game-bridge.service';
import { EchoDriftService } from '../../core/services/echo-drift.service';
import { EchoSaveService } from '../../core/services/echo-save.service';
import { PlayerStore } from '../../core/services/player-store.service';
import { WeekResolverService } from '../../core/services/week-resolver.service';
import { ResonanceBarsComponent } from '../../shared/components/resonance-bars/resonance-bars.component';
import { PhaserGameComponent } from '../../game/phaser-game.component';
import { EvolutionOverlayComponent } from './evolution-overlay.component';
import { QuickCareBarComponent } from './quick-care-bar.component';
import { MrStatsComponent } from './mr-stats.component';
import { CareMetersComponent } from './care-meters.component';
import { WeekendPanelComponent } from './weekend-panel.component';
import { WeekPlannerComponent } from './week-planner.component';
import { RanchHudDockComponent } from './ranch-hud-dock.component';

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
    WeekendPanelComponent,
    CareMetersComponent,
    MrStatsComponent,
    RanchHudDockComponent,
  ],
  templateUrl: './ranch.component.html',
  styleUrl: './ranch.component.css',
})
export class RanchComponent implements OnInit, OnDestroy {
  readonly store = inject(PlayerStore);
  readonly bridge = inject(GameBridgeService);
  private readonly save = inject(EchoSaveService);
  private readonly drift = inject(EchoDriftService);
  private readonly weekResolver = inject(WeekResolverService);

  constructor() {
    effect(() => {
      this.store.joy();
      this.store.discipline();
      this.store.courage();
      this.store.harmony();
      this.store.petCount();
      this.store.resonanceShards();
      this.store.happiness();
      this.store.fatigue();
      this.store.echoDanceCompletions();
      this.store.peakTotalResonanceAsFluffling();
      this.store.unlockedEchoIds();
      this.store.currentEcho();
      this.store.gameWeek();
      this.store.trainingPlan();
      this.store.power();
      this.store.speed();
      this.store.defense();
      this.store.life();
      this.store.weekendAdventureDone();
      this.store.weekendTournamentDone();
      this.store.tournamentRank();
      this.save.scheduleSave();
    });

    effect(() => {
      const ready = this.bridge.phaserReady();
      const echo = this.store.currentEcho();
      if (ready) {
        this.bridge.syncRanchEchoFromStore(echo);
      }
    });

    effect(() => {
      const ready = this.bridge.phaserReady();
      const care = this.store.careState();
      if (ready) {
        this.bridge.syncCareState(care);
      }
    });
  }

  readonly playingOffline = this.save.playingOffline;
  readonly evolutionOpen = signal(false);
  readonly planSheetOpen = signal(false);
  readonly sheetTab = signal<'plan' | 'status'>('plan');
  readonly weekNotice = signal('');
  readonly weekSlotSummaries = signal<string[]>([]);

  togglePlanSheet(): void {
    this.planSheetOpen.update((open) => !open);
  }

  closePlanSheet(): void {
    this.planSheetOpen.set(false);
  }

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
    const result = this.weekResolver.resolveWeek(this.store);
    if (!result) {
      return;
    }

    this.weekNotice.set(this.weekResolver.formatWeekSummary(result));
    this.weekSlotSummaries.set(result.slotSummaries);
    this.save.scheduleSave();
  }
}
