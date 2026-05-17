import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EchoApiService } from './echo-api.service';
import { PlayerIdentityService } from './player-identity.service';
import { PlayerSnapshot, PlayerStore } from './player-store.service';

const SNAPSHOT_KEY = 'eor_snapshot_v2';
const LEGACY_STORAGE_KEY = 'eor_fluffling_v1';
const OFFLINE_QUEUE_KEY = 'eor_offline_queue';

/**
 * Persistence: local-only when `environment.clientOnly`, otherwise API-first with fallback.
 */
@Injectable({ providedIn: 'root' })
export class EchoSaveService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly store = inject(PlayerStore);
  private readonly api = inject(EchoApiService);
  private readonly identity = inject(PlayerIdentityService);

  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private playerId = '';
  private flushInFlight = false;
  private visibilityHandler: (() => void) | null = null;
  private hydratePromise: Promise<void> | null = null;

  /** True when API hydrate/save failed and local fallback is active (not set in client-only mode). */
  readonly playingOffline = signal(false);

  async hydrate(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (!this.hydratePromise) {
      this.hydratePromise = this.runHydrate();
    }
    return this.hydratePromise;
  }

  private async runHydrate(): Promise<void> {
    this.playerId = this.identity.getOrCreatePlayerId();

    if (environment.clientOnly) {
      this.loadLocalSnapshot();
      if (this.store.hasHatched()) {
        this.applyCatchUpAbsence();
      }
      this.playingOffline.set(false);
      this.scheduleSave();
      return;
    }

    this.bindVisibilityFlush();

    try {
      const snapshot = await firstValueFrom(this.api.getEcho(this.playerId));
      this.store.loadSnapshot(snapshot);
      this.persistLocal(snapshot);
      this.playingOffline.set(false);
      await this.flushOfflineQueue();
    } catch (e) {
      console.warn('[EchoSave] API hydrate failed, using local fallback', e);
      this.loadLocalSnapshot();
      this.playingOffline.set(true);
    }

    this.store.touchInteraction();
    this.scheduleSave();
  }

  scheduleSave(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    this.saveTimer = setTimeout(() => void this.saveNow(), 400);
  }

  async saveNow(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    if (!this.playerId) {
      this.playerId = this.identity.getOrCreatePlayerId();
    }

    const snapshot = this.store.toSnapshot();

    if (environment.clientOnly) {
      this.persistLocal(snapshot);
      return;
    }

    this.persistLocal(snapshot);

    try {
      await firstValueFrom(this.api.saveEcho(this.playerId, snapshot));
      this.playingOffline.set(false);
      await this.flushOfflineQueue();
    } catch (e) {
      console.warn('[EchoSave] API save failed, queued for retry', e);
      this.enqueueOffline(snapshot);
      this.playingOffline.set(true);
    }
  }

  async flushOfflineQueue(): Promise<void> {
    if (
      environment.clientOnly ||
      !isPlatformBrowser(this.platformId) ||
      this.flushInFlight ||
      !this.playerId
    ) {
      return;
    }

    const queue = this.readQueue();
    if (queue.length === 0) {
      return;
    }

    this.flushInFlight = true;
    const remaining: PlayerSnapshot[] = [];

    try {
      for (const snapshot of queue) {
        try {
          await firstValueFrom(this.api.saveEcho(this.playerId, snapshot));
        } catch {
          remaining.push(snapshot);
          break;
        }
      }

      this.writeQueue(remaining);
      if (remaining.length === 0) {
        this.playingOffline.set(false);
      }
    } finally {
      this.flushInFlight = false;
    }
  }

  private bindVisibilityFlush(): void {
    if (!isPlatformBrowser(this.platformId) || this.visibilityHandler) {
      return;
    }

    this.visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        void this.flushOfflineQueue();
      }
    };
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  private loadLocalSnapshot(): void {
    try {
      const raw =
        localStorage.getItem(SNAPSHOT_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!raw) {
        return;
      }

      const data = JSON.parse(raw) as PlayerSnapshot;
      this.store.loadSnapshot(data);

      if (!localStorage.getItem(SNAPSHOT_KEY)) {
        this.persistLocal(this.store.toSnapshot());
      }
    } catch (e) {
      console.warn('[EchoSave] Failed to load local save', e);
    }
  }

  private applyCatchUpAbsence(): void {
    const hoursAway = (Date.now() - this.store.lastInteractionAt()) / (1000 * 60 * 60);
    if (hoursAway < 0.25) {
      return;
    }

    this.store.applyCatchUpCare(hoursAway);
    this.store.applyOfflineDriftHours(hoursAway);
    this.store.touchInteraction();
  }

  private persistLocal(snapshot: PlayerSnapshot): void {
    try {
      localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
    } catch {
      /* ignore quota errors */
    }
  }

  private enqueueOffline(snapshot: PlayerSnapshot): void {
    const queue = this.readQueue();
    queue.push(snapshot);
    this.writeQueue(queue);
  }

  private readQueue(): PlayerSnapshot[] {
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw) as PlayerSnapshot[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeQueue(queue: PlayerSnapshot[]): void {
    try {
      if (queue.length === 0) {
        localStorage.removeItem(OFFLINE_QUEUE_KEY);
      } else {
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      }
    } catch {
      /* ignore */
    }
  }
}
