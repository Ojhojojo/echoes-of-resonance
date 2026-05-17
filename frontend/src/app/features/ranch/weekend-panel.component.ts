import { Component, inject } from '@angular/core';
import { TOURNAMENT_OPPONENTS, tournamentRankLabel } from '../../core/data/tournament-data';
import { GameBridgeService } from '../../core/services/game-bridge.service';
import { PlayerStore } from '../../core/services/player-store.service';

@Component({
  selector: 'app-weekend-panel',
  standalone: true,
  templateUrl: './weekend-panel.component.html',
  styleUrl: './weekend-panel.component.css',
})
export class WeekendPanelComponent {
  readonly store = inject(PlayerStore);
  readonly bridge = inject(GameBridgeService);

  opponentName(): string {
    return TOURNAMENT_OPPONENTS[this.store.tournamentRank()];
  }

  rankLabel(): string {
    return tournamentRankLabel(this.store.tournamentRank());
  }

  launchAdventure(): void {
    this.bridge.launchAdventure();
  }

  launchTournament(): void {
    this.bridge.launchTournament();
  }
}
