import { Injectable, NgZone, inject, signal } from '@angular/core';
import type { Game, Scene } from 'phaser';
import {
  PlayerStore,
  type CurrentEcho,
  type QuickCareKind,
  type ResonanceAxis,
} from './player-store.service';
import {
  SCENE_ECHO_DANCE,
  SCENE_HARMONY_GARDEN,
  SCENE_RANCH,
} from '../../game/scene-keys';
import { RANCH_ECHO_REGISTRY_KEY } from '../../game/game-config';
import { FLUFFLING_ECHO_ID, getEchoDefinition } from '../data/echo-catalog';

export type MinigameTier = 'poor' | 'good' | 'excellent' | 'perfect';

export interface MinigameResult {
  gameId: string;
  score: number;
  tier: MinigameTier;
}

export type BridgeEvent =
  | { type: 'pet'; at: number }
  | { type: 'quick-care'; kind: QuickCareKind; at: number }
  | { type: 'drift'; at: number }
  | { type: 'minigame-complete'; gameId: string; at: number }
  | { type: 'resonance-update'; axis: ResonanceAxis; at: number };

@Injectable({ providedIn: 'root' })
export class GameBridgeService {
  private readonly zone = inject(NgZone);
  private readonly playerStore = inject(PlayerStore);

  readonly phaserReady = signal(false);
  readonly activeMinigame = signal<string | null>(null);
  readonly lastEvent = signal<BridgeEvent | null>(null);

  private phaserGame: Game | null = null;

  attachPhaserGame(game: Game | null): void {
    this.phaserGame = game;
    this.phaserReady.set(game !== null);
    if (game) {
      game.registry.set(RANCH_ECHO_REGISTRY_KEY, this.getRanchEchoId());
      queueMicrotask(() => this.syncRanchEchoFromStore(this.playerStore.currentEcho()));
    }
  }

  getRanchEchoId(): string {
    return this.playerStore.currentEcho()?.echoId ?? FLUFFLING_ECHO_ID;
  }

  /** Keeps Phaser registry + ranch scene in sync with Angular `currentEcho`. */
  syncRanchEchoFromStore(echo: CurrentEcho | null): void {
    if (!this.phaserGame) {
      return;
    }
    const id = echo?.echoId ?? FLUFFLING_ECHO_ID;
    const displayName =
      echo?.displayName ?? getEchoDefinition(id)?.displayName ?? 'Fluffling';
    this.phaserGame.registry.set(RANCH_ECHO_REGISTRY_KEY, id);
    this.emitGame('bridge-ranch-echo', { echoId: id, displayName });
  }

  notifyPetEcho(): void {
    this.zone.run(() => {
      this.playerStore.applyPetBondNudge();
      this.lastEvent.set({ type: 'pet', at: Date.now() });
      this.emitGame('bridge-quick-care', 'pet');
      this.emitGame('bridge-resonance-pulse', 'joy');
    });
  }

  notifyQuickCare(kind: QuickCareKind): boolean {
    let ok = false;
    this.zone.run(() => {
      ok = this.playerStore.applyQuickCare(kind);
      if (ok) {
        this.lastEvent.set({ type: 'quick-care', kind, at: Date.now() });
        this.emitGame('bridge-quick-care', kind);
        this.emitGame('bridge-resonance-pulse', kind === 'feed' ? 'harmony' : 'joy');
      }
    });
    return ok;
  }

  /** Visual / Phaser reactions only — server already applied Quick Care (Phase 5C). */
  pulseQuickCareFx(kind: QuickCareKind): void {
    this.zone.run(() => {
      this.lastEvent.set({ type: 'quick-care', kind, at: Date.now() });
      this.emitGame('bridge-quick-care', kind);
      this.emitGame('bridge-resonance-pulse', kind === 'feed' ? 'harmony' : 'joy');
    });
  }

  notifyDriftTick(): void {
    this.zone.run(() => {
      this.lastEvent.set({ type: 'drift', at: Date.now() });
      this.emitGame('bridge-drift-tick');
      this.emitGame('bridge-resonance-pulse', 'joy');
    });
  }

  addResonance(axis: ResonanceAxis, delta: number): void {
    this.zone.run(() => {
      this.playerStore.addAxis(axis, delta);
      this.lastEvent.set({ type: 'resonance-update', axis, at: Date.now() });
      this.emitGame('bridge-resonance-pulse', axis);
    });
  }

  grantShards(amount: number): void {
    this.zone.run(() => this.playerStore.addCurrency(amount));
  }

  launchMinigame(gameId: string): void {
    if (!this.phaserGame) {
      return;
    }
    this.zone.run(() => {
      this.activeMinigame.set(gameId);
      if (gameId === 'echo-dance') {
        const ranch = this.phaserGame!.scene.getScene(SCENE_RANCH) as Scene | null;
        ranch?.scene.pause();
        ranch?.scene.launch(SCENE_ECHO_DANCE);
      } else if (gameId === 'harmony-garden') {
        const ranch = this.phaserGame!.scene.getScene(SCENE_RANCH) as Scene | null;
        ranch?.scene.pause();
        ranch?.scene.launch(SCENE_HARMONY_GARDEN);
      }
    });
  }

  returnToRanch(): void {
    if (!this.phaserGame) {
      return;
    }
    this.zone.run(() => {
      this.activeMinigame.set(null);
      const dance = this.phaserGame!.scene.getScene(SCENE_ECHO_DANCE) as Scene | null;
      dance?.scene.stop();
      const garden = this.phaserGame!.scene.getScene(SCENE_HARMONY_GARDEN) as Scene | null;
      garden?.scene.stop();
      const ranch = this.phaserGame!.scene.getScene(SCENE_RANCH) as Scene | null;
      ranch?.scene.resume();
    });
  }

  completeMinigame(result: MinigameResult): void {
    this.zone.run(() => {
      this.playerStore.applyMinigameReward(result.score);
      if (result.gameId === 'echo-dance') {
        this.playerStore.recordEchoDanceCompletion();
      }
      this.lastEvent.set({ type: 'minigame-complete', gameId: result.gameId, at: Date.now() });
      this.emitGame('bridge-resonance-pulse', 'joy');
      this.returnToRanch();
    });
  }

  completeHarmonyGarden(result: MinigameResult): void {
    this.zone.run(() => {
      this.playerStore.applyHarmonyGardenRound(result.score);
      this.lastEvent.set({ type: 'minigame-complete', gameId: result.gameId, at: Date.now() });
      this.emitGame('bridge-resonance-pulse', 'harmony');
      this.returnToRanch();
    });
  }

  private emitGame(event: string, payload?: unknown): void {
    this.phaserGame?.events.emit(event, payload);
  }
}
