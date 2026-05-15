import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { EchoApiService } from './echo-api.service';
import { PlayerIdentityService } from './player-identity.service';
import { PlayerSnapshot, PlayerStore } from './player-store.service';

const LEGACY_STORAGE_KEY = 'eor_fluffling_v1';
const OFFLINE_QUEUE_KEY = 'eor_offline_queue';

/**
 * API-first persistence with localStorage fallback and offline queue (Phase 5).
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

  /** True when last hydrate/save could not reach the API. */
  readonly playingOffline = signal(false);

  async hydrate(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.playerId = this.identity.getOrCreatePlayerId();
    this.bindVisibilityFlush();

    try {
      const snapshot = await firstValueFrom(this.api.getEcho(this.playerId));
      this.store.loadSnapshot(snapshot);
      this.cacheLegacy(snapshot);
      this.playingOffline.set(false);
      await this.flushOfflineQueue();
    } catch (e) {
      console.warn('[EchoSave] API hydrate failed, using local fallback', e);
      this.loadLegacyLocal();
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
    this.cacheLegacy(snapshot);

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
    if (!isPlatformBrowser(this.platformId) || this.flushInFlight || !this.playerId) {
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

  private loadLegacyLocal(): void {
    try {
      const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as PlayerSnapshot;
        this.store.loadSnapshot(data);
      }
    } catch (e) {
      console.warn('[EchoSave] Failed to load legacy save', e);
    }
  }

  private cacheLegacy(snapshot: PlayerSnapshot): void {
    try {
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(snapshot));
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
