import { HttpErrorResponse } from '@angular/common/http';
import { Component, NgZone, inject, input } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GameBridgeService } from '../../core/services/game-bridge.service';
import { EchoSaveService } from '../../core/services/echo-save.service';
import { EchoApiService } from '../../core/services/echo-api.service';
import { PlayerIdentityService } from '../../core/services/player-identity.service';
import { PlayerStore, type QuickCareKind } from '../../core/services/player-store.service';

@Component({
  selector: 'app-quick-care-bar',
  standalone: true,
  host: {
    '[class.quick-care-host--immersive]': 'immersive()',
  },
  templateUrl: './quick-care-bar.component.html',
  styleUrl: './quick-care-bar.component.css',
})
export class QuickCareBarComponent {
  readonly immersive = input(false, { transform: (v: boolean | string) => v === '' || v === true });
  readonly store = inject(PlayerStore);
  private readonly bridge = inject(GameBridgeService);
  private readonly save = inject(EchoSaveService);
  private readonly api = inject(EchoApiService);
  private readonly identity = inject(PlayerIdentityService);
  private readonly zone = inject(NgZone);

  readonly kinds: { kind: QuickCareKind; label: string; emoji: string }[] = [
    { kind: 'pet', label: 'Pet', emoji: '🐾' },
    { kind: 'feed', label: 'Feed', emoji: '🍓' },
    { kind: 'encourage', label: 'Encourage', emoji: '✨' },
  ];

  async use(kind: QuickCareKind): Promise<void> {
    if (!this.store.canQuickCare(kind)) {
      return;
    }

    if (environment.clientOnly || this.save.playingOffline()) {
      if (this.bridge.notifyQuickCare(kind)) {
        this.bridge.pulseQuickCareFx(kind);
        this.save.scheduleSave();
      }
      return;
    }

    const pid = this.identity.getOrCreatePlayerId();
    try {
      const snap = await firstValueFrom(this.api.quickCare(pid, kind));
      this.zone.run(() => {
        this.store.loadSnapshot(snap);
        this.bridge.pulseQuickCareFx(kind);
        this.save.scheduleSave();
      });
    } catch (e: unknown) {
      if (e instanceof HttpErrorResponse && e.status === 429) {
        try {
          const snap = await firstValueFrom(this.api.getEcho(pid));
          this.zone.run(() => this.store.loadSnapshot(snap));
        } catch {
          /* ignore */
        }
        return;
      }
      console.warn('[QuickCare] API failed, falling back offline', e);
      if (this.bridge.notifyQuickCare(kind)) {
        this.save.scheduleSave();
      }
    }
  }

  disabled(kind: QuickCareKind): boolean {
    return !this.store.canQuickCare(kind);
  }

  title(kind: QuickCareKind): string {
    if (this.store.canQuickCare(kind)) {
      return '';
    }
    const ms = this.store.quickCareCooldownRemainingMs(kind);
    const min = Math.ceil(ms / 60000);
    return `Available in ~${min} min`;
  }
}
