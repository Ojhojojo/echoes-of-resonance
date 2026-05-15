import Phaser from 'phaser';
import { GAME_BRIDGE_REGISTRY_KEY } from '../game-config';
import { SCENE_ECHO_DANCE, SCENE_RANCH } from '../scene-keys';
import type { GameBridgeService, MinigameTier } from '../../core/services/game-bridge.service';
import { createFlufflingTexture } from './texture-utils';

type HitQuality = 'none' | 'perfect' | 'good' | 'miss';

interface RhythmBeat {
  centerMs: number;
  quality: HitQuality;
}

/**
 * Echo Dance — timing judgments (perfect / good / miss) with combo streak scaling.
 */
export class EchoDanceScene extends Phaser.Scene {
  static readonly Key = SCENE_ECHO_DANCE;

  private beats: RhythmBeat[] = [];
  private startTime = 0;
  private label!: Phaser.GameObjects.Text;
  private comboLabel!: Phaser.GameObjects.Text;
  private finished = false;

  private combo = 0;
  private maxCombo = 0;
  private score = 0;
  private misses = 0;

  private readonly perfectWindowMs = 105;
  private readonly goodWindowMs = 260;

  constructor() {
    super({ key: EchoDanceScene.Key });
  }

  create(): void {
    if (!this.textures.exists('fluffling')) {
      createFlufflingTexture(this, 'fluffling');
    }

    const w = this.scale.width;
    const h = this.scale.height;

    this.add.rectangle(w / 2, h / 2, w, h, 0x2a1a4a, 1);
    this.add.sprite(w / 2, h * 0.45, 'fluffling').setScale(1.2);

    this.label = this.add
      .text(w / 2, h * 0.1, 'Echo Dance — tap the glowing beat!', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        color: '#ffe8a8',
      })
      .setOrigin(0.5);

    this.comboLabel = this.add
      .text(w / 2, h * 0.17, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        color: '#b8f7ff',
      })
      .setOrigin(0.5);

    const beatCount = 8;
    const sessionMs = 16000;
    const gap = sessionMs / beatCount;
    for (let i = 0; i < beatCount; i++) {
      this.beats.push({ centerMs: 1300 + i * gap, quality: 'none' });
    }

    this.startTime = this.time.now;
    this.input.on('pointerdown', () => this.onTap());

    this.time.delayedCall(sessionMs + 450, () => this.finishSession());
  }

  override update(): void {
    if (this.finished) {
      return;
    }
    const elapsed = this.time.now - this.startTime;
    const next = this.beats.find((b) => b.quality === 'none' && elapsed <= b.centerMs + this.goodWindowMs);
    const rush = next && elapsed >= next.centerMs - this.goodWindowMs;
    this.label.setText(
      rush ? 'NOW!' : `Score ${this.score} · Combo ×${this.combo}`,
    );
    this.comboLabel.setText(this.combo > 1 ? `Combo ${this.combo}` : '');
  }

  private onTap(): void {
    const elapsed = this.time.now - this.startTime;

    const candidates = this.beats.filter((b) => b.quality === 'none');
    if (candidates.length === 0) {
      return;
    }

    let best: RhythmBeat | null = null;
    let bestDelta = Infinity;
    for (const b of candidates) {
      const d = Math.abs(elapsed - b.centerMs);
      if (d <= this.goodWindowMs && d < bestDelta) {
        bestDelta = d;
        best = b;
      }
    }

    const comboMultiplier = 1 + Math.min(this.combo, 10) * 0.07;

    if (!best) {
      this.registerMiss('off-beat');
      return;
    }

    const delta = elapsed - best.centerMs;
    const abs = Math.abs(delta);

    if (abs <= this.perfectWindowMs) {
      best.quality = 'perfect';
      const pts = Math.round(18 * comboMultiplier);
      this.score += pts;
      this.combo += 1;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      this.flashTap(0xfffde7);
      this.spawnBurst(best.centerMs, 'PERFECT');
    } else if (abs <= this.goodWindowMs) {
      best.quality = 'good';
      const pts = Math.round(11 * comboMultiplier);
      this.score += pts;
      this.combo += 1;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      const early = delta < 0;
      this.flashTap(0xffe0b2);
      this.spawnBurst(best.centerMs, early ? 'EARLY' : 'LATE');
    }
  }

  private registerMiss(reason: string): void {
    void reason;
    this.misses += 1;
    this.combo = 0;
    this.score = Math.max(0, this.score - 4);
    this.cameras.main.shake(120, 0.004);
  }

  private flashTap(color: number): void {
    this.cameras.main.flash(70, (color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff);
  }

  private spawnBurst(centerMs: number, tag: string): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const t = this.add
      .text(w / 2, h * 0.58, tag, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setAlpha(0.95);
    this.tweens.add({
      targets: t,
      alpha: 0,
      y: h * 0.52,
      duration: 520,
      ease: 'Sine.easeOut',
      onComplete: () => t.destroy(),
    });
    void centerMs;
  }

  private finishSession(): void {
    if (this.finished) {
      return;
    }
    this.finished = true;

    const unresolved = this.beats.filter((b) => b.quality === 'none').length;
    this.score -= unresolved * 6;
    this.score = Math.max(8, Math.min(115, this.score));

    let tier: MinigameTier = 'poor';
    if (this.score >= 92 || (this.score >= 78 && this.maxCombo >= 7)) {
      tier = 'perfect';
    } else if (this.score >= 72) {
      tier = 'excellent';
    } else if (this.score >= 48) {
      tier = 'good';
    }

    const w = this.scale.width;
    const h = this.scale.height;
    this.add
      .text(
        w / 2,
        h * 0.72,
        `${tier.toUpperCase()} · score ${this.score} · max combo ${this.maxCombo} · misses ${this.misses}`,
        {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '18px',
          color: '#ffffff',
        },
      )
      .setOrigin(0.5);

    const bridge = this.game.registry.get(GAME_BRIDGE_REGISTRY_KEY) as GameBridgeService | undefined;
    bridge?.completeMinigame({ gameId: 'echo-dance', score: this.score, tier });

    this.time.delayedCall(1300, () => {
      if (this.scene.isActive(SCENE_ECHO_DANCE)) {
        this.scene.stop(SCENE_ECHO_DANCE);
        this.scene.resume(SCENE_RANCH);
      }
    });
  }
}
