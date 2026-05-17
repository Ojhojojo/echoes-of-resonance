import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  input,
  NgZone,
  OnDestroy,
  PLATFORM_ID,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { Game } from 'phaser';
import { GameBridgeService } from '../core/services/game-bridge.service';

/**
 * Hosts a single Phaser {@link Game} instance inside Angular.
 * Phaser is loaded via dynamic import (see `phaser-bootstrap.ts`) so SSR never evaluates `window`.
 * Phase 3: loading overlay, ResizeObserver for responsive canvas.
 */
@Component({
  selector: 'app-phaser-game',
  standalone: true,
  host: {
    '[class.phaser-host-wrap--immersive]': 'immersive()',
  },
  template: `
    <div class="phaser-host" #phaserHost>
      @if (!bridge.phaserReady()) {
        <div class="phaser-loading" role="status" aria-live="polite">
          <span class="phaser-loading__ring" aria-hidden="true"></span>
          <span class="phaser-loading__text">Loading ranch…</span>
        </div>
      }
      <div #phaserContainer class="phaser-root" role="application" aria-label="Ranch game view"></div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
    }
    :host.phaser-host-wrap--immersive {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }
    .phaser-host {
      position: relative;
      width: 100%;
      max-width: min(100vw - 1.5rem, 920px);
      aspect-ratio: 800 / 600;
      margin-inline: auto;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(30, 60, 90, 0.18);
      touch-action: manipulation;
      background: var(--eor-surface-2, #e8f2ff);
    }
    :host.phaser-host-wrap--immersive .phaser-host {
      position: absolute;
      inset: 0;
      max-width: none;
      width: 100%;
      height: 100%;
      aspect-ratio: unset;
      margin: 0;
      border-radius: 0;
      box-shadow: none;
    }
    .phaser-root {
      width: 100%;
      height: 100%;
    }
    .phaser-root canvas {
      display: block;
      width: 100% !important;
      height: 100% !important;
    }
    .phaser-loading {
      position: absolute;
      inset: 0;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      background: color-mix(in srgb, var(--eor-surface, #fff) 88%, transparent);
      color: var(--eor-text, #1a2b3c);
      font-weight: 600;
    }
    .phaser-loading__ring {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 3px solid var(--eor-border, #c9d7e8);
      border-top-color: var(--eor-accent, #5b8cff);
      animation: eor-spin 0.9s linear infinite;
    }
    .phaser-loading__text {
      font-size: 0.95rem;
    }
    @keyframes eor-spin {
      to {
        transform: rotate(360deg);
      }
    }
  `,
})
export class PhaserGameComponent implements AfterViewInit, OnDestroy {
  /** First scene stack: default `Boot` runs preload then starts `Ranch`; pass `Ranch` to skip boot. */
  readonly sceneKey = input<string>('Boot');

  /** Full-bleed viewport host (ranch immersive layout). */
  readonly immersive = input(false);

  readonly phaserHost = viewChild.required<ElementRef<HTMLDivElement>>('phaserHost');
  readonly phaserContainer = viewChild.required<ElementRef<HTMLDivElement>>('phaserContainer');

  /** Live Phaser instance (null on server / before init). */
  game: Game | null = null;

  readonly bridge = inject(GameBridgeService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);
  private resizeObserver: ResizeObserver | null = null;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    queueMicrotask(() => void this.bootstrapPhaser());
  }

  ngOnDestroy(): void {
    this.teardownResizeObserver();
    this.destroyGame();
  }

  private async bootstrapPhaser(): Promise<void> {
    const host = this.phaserContainer()?.nativeElement;
    if (!host || this.game) {
      return;
    }

    const { bootstrapPhaserGame } = await import('./phaser-bootstrap');

    this.ngZone.runOutsideAngular(() => {
      this.game = bootstrapPhaserGame(host, this.bridge, this.sceneKey());
    });

    this.ngZone.run(() => this.bridge.attachPhaserGame(this.game));
    this.setupResizeObserver();
  }

  private setupResizeObserver(): void {
    const wrap = this.phaserHost()?.nativeElement;
    if (!wrap || typeof ResizeObserver === 'undefined') {
      return;
    }

    this.resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry || !this.game) {
        return;
      }
      const w = Math.max(1, Math.floor(entry.contentRect.width));
      const h = Math.max(1, Math.floor(entry.contentRect.height));
      this.ngZone.runOutsideAngular(() => {
        this.game?.scale.resize(w, h);
      });
    });

    this.resizeObserver.observe(wrap);
    queueMicrotask(() => {
      const rect = wrap.getBoundingClientRect();
      if (this.game && rect.width > 0 && rect.height > 0) {
        this.ngZone.runOutsideAngular(() => {
          this.game?.scale.resize(Math.floor(rect.width), Math.floor(rect.height));
        });
      }
    });
  }

  private teardownResizeObserver(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }

  private destroyGame(): void {
    this.teardownResizeObserver();
    if (!this.game) {
      this.bridge.attachPhaserGame(null);
      return;
    }
    this.ngZone.runOutsideAngular(() => {
      this.game!.destroy(true);
    });
    this.game = null;
    this.bridge.attachPhaserGame(null);
  }
}
