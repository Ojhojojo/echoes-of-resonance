import Phaser from 'phaser';
import { GAME_BRIDGE_REGISTRY_KEY } from '../game-config';
import { SCENE_HARMONY_GARDEN, SCENE_RANCH } from '../scene-keys';
import type { GameBridgeService, MinigameTier } from '../../core/services/game-bridge.service';
import { createFlufflingTexture } from './texture-utils';

interface BloomTarget {
  x: number;
  y: number;
  collected: boolean;
}

/**
 * Harmony Garden prototype — tap blooming buds before they fade (Harmony training slice).
 */
export class HarmonyGardenScene extends Phaser.Scene {
  static readonly Key = SCENE_HARMONY_GARDEN;

  private buds: BloomTarget[] = [];
  private tapsOk = 0;
  private label!: Phaser.GameObjects.Text;
  private finished = false;
  private deadlineMs = 0;

  constructor() {
    super({ key: HarmonyGardenScene.Key });
  }

  create(): void {
    if (!this.textures.exists('fluffling')) {
      createFlufflingTexture(this, 'fluffling');
    }

    const w = this.scale.width;
    const h = this.scale.height;

    this.add.rectangle(w / 2, h / 2, w, h, 0x14342b, 1);
    this.add.sprite(w / 2, h * 0.42, 'fluffling').setScale(1).setAlpha(0.85);

    this.label = this.add
      .text(w / 2, h * 0.1, 'Harmony Garden — tap each bloom once!', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        color: '#d8ffe8',
      })
      .setOrigin(0.5);

    const count = 5;
    const pad = w * 0.14;
    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.FloatBetween(pad, w - pad);
      const y = Phaser.Math.FloatBetween(h * 0.52, h * 0.82);
      this.buds.push({ x, y, collected: false });
      const g = this.add.circle(x, y, 22, 0x7ecf9b, 0.95);
      g.setStrokeStyle(3, 0xffffff, 0.55);
      g.setData('budIndex', i);
      this.tweens.add({
        targets: g,
        scale: { from: 0.85, to: 1.08 },
        duration: 900 + i * 80,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.onTap(pointer));

    this.deadlineMs = this.time.now + 12000;
    this.time.delayedCall(12200, () => this.finishSession());
  }

  override update(): void {
    if (this.finished) {
      return;
    }
    const remaining = Math.max(0, Math.ceil((this.deadlineMs - this.time.now) / 1000));
    this.label.setText(`Harmony blooms ${this.tapsOk}/${this.buds.length} · ${remaining}s`);
  }

  private onTap(pointer: Phaser.Input.Pointer): void {
    if (this.finished) {
      return;
    }

    for (let i = 0; i < this.buds.length; i++) {
      const b = this.buds[i];
      if (b.collected) {
        continue;
      }
      const dx = pointer.worldX - b.x;
      const dy = pointer.worldY - b.y;
      if (dx * dx + dy * dy < 40 * 40) {
        b.collected = true;
        this.tapsOk++;
        const sparkle = this.add.circle(b.x, b.y, 10, 0xfff7c2, 1);
        this.tweens.add({
          targets: sparkle,
          alpha: 0,
          scale: 2.4,
          duration: 420,
          onComplete: () => sparkle.destroy(),
        });
        return;
      }
    }
  }

  private finishSession(): void {
    if (this.finished) {
      return;
    }
    this.finished = true;

    const ratio = this.tapsOk / this.buds.length;
    let tier: MinigameTier = 'poor';
    let score = 28;
    if (ratio >= 0.85) {
      tier = 'excellent';
      score = 72;
    } else if (ratio >= 0.5) {
      tier = 'good';
      score = 52;
    }

    const w = this.scale.width;
    const h = this.scale.height;
    this.add
      .text(w / 2, h * 0.92, `${tier.toUpperCase()} — Harmony bond +${score}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    const bridge = this.game.registry.get(GAME_BRIDGE_REGISTRY_KEY) as GameBridgeService | undefined;
    bridge?.completeHarmonyGarden({ gameId: 'harmony-garden', score, tier });

    this.time.delayedCall(900, () => {
      if (this.scene.isActive(SCENE_HARMONY_GARDEN)) {
        this.scene.stop(SCENE_HARMONY_GARDEN);
        this.scene.resume(SCENE_RANCH);
      }
    });
  }
}
