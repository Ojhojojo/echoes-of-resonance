import { isPlatformBrowser } from '@angular/common';
import { Injectable, NgZone, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GameBridgeService } from './game-bridge.service';
import { EchoSaveService } from './echo-save.service';
import { EchoApiService } from './echo-api.service';
import { PlayerIdentityService } from './player-identity.service';
import { PlayerStore } from './player-store.service';

/** Tab-open passive resonance — server tick when online (Phase 5C). */
@Injectable({ providedIn: 'root' })
export class EchoDriftService implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly store = inject(PlayerStore);
  private readonly bridge = inject(GameBridgeService);
  private readonly save = inject(EchoSaveService);
  private readonly api = inject(EchoApiService);
  private readonly identity = inject(PlayerIdentityService);
  private readonly zone = inject(NgZone);

  private intervalId: ReturnType<typeof setInterval> | null = null;
  private active = false;
  private pending = false;

  /** Call from RanchComponent when route is active. */
  start(): void {
    if (!isPlatformBrowser(this.platformId) || this.active) {
      return;
    }
    this.active = true;
    this.intervalId = setInterval(() => void this.tick(), 45_000);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.onVisibility);
    }
  }

  stop(): void {
    this.active = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (isPlatformBrowser(this.platformId) && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.onVisibility);
    }
  }

  ngOnDestroy(): void {
    this.stop();
  }

  private readonly onVisibility = (): void => {
    if (document.visibilityState === 'hidden') {
      void this.save.saveNow();
    }
  };

  private async tick(): Promise<void> {
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
      return;
    }

    if (this.pending) {
      return;
    }

    if (environment.clientOnly) {
      this.pending = true;
      try {
        this.zone.run(() => {
          const applied = this.store.applyTabOpenDriftTick();
          if (applied > 0) {
            this.bridge.notifyDriftTick();
          }
        });
        this.save.scheduleSave();
      } finally {
        this.pending = false;
      }
      return;
    }

    if (this.save.playingOffline()) {
      return;
    }

    this.pending = true;
    const pid = this.identity.getOrCreatePlayerId();

    try {
      const res = await firstValueFrom(this.api.driftTick(pid));
      this.zone.run(() => {
        this.store.loadSnapshot(res.echo);
        if (res.appliedPassivePoints > 0) {
          this.bridge.notifyDriftTick();
        }
      });
      void this.save.scheduleSave();
    } catch {
      /* offline / server down — skip tick (GET drift handles absence). */
    } finally {
      this.pending = false;
    }
  }
}
