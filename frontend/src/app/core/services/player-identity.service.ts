import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const PLAYER_ID_KEY = 'eor_player_id';

@Injectable({ providedIn: 'root' })
export class PlayerIdentityService {
  private readonly platformId = inject(PLATFORM_ID);

  getOrCreatePlayerId(): string {
    if (!isPlatformBrowser(this.platformId)) {
      return 'ssr-placeholder';
    }

    try {
      const existing = localStorage.getItem(PLAYER_ID_KEY);
      if (existing?.trim()) {
        return existing.trim();
      }

      const id = crypto.randomUUID();
      localStorage.setItem(PLAYER_ID_KEY, id);
      return id;
    } catch {
      return crypto.randomUUID();
    }
  }
}
