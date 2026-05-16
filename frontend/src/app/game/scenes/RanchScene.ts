import Phaser from 'phaser';
import {
  echoIdToTextureKey,
  FLUFFLING_ECHO_ID,
  getEchoDefinition,
  starterTextureKeys,
} from '../../core/data/echo-catalog';
import type { GameBridgeService } from '../../core/services/game-bridge.service';
import { Echo } from '../entities/Echo';
import { GAME_BRIDGE_REGISTRY_KEY, RANCH_ECHO_REGISTRY_KEY } from '../game-config';
import { SCENE_RANCH } from '../scene-keys';
import { RanchEchoManager } from '../managers/RanchEchoManager';
import { ensureStarterTexture } from './texture-utils';

export class RanchScene extends Phaser.Scene {
  static readonly Key = SCENE_RANCH;

  private echoEntity!: Echo;
  private echoManager!: RanchEchoManager;
  private particles?: Phaser.GameObjects.Particles.ParticleEmitter;
  private dayNightTint!: Phaser.GameObjects.Rectangle;
  private parallaxFar!: Phaser.GameObjects.Rectangle;
  private parallaxNear!: Phaser.GameObjects.Rectangle;
  private auraFlash!: Phaser.GameObjects.Rectangle;
  private ranchSubtitle?: Phaser.GameObjects.Text;
  private lastPetMs = 0;
  private petTapCount = 0;

  constructor() {
    super({ key: RanchScene.Key });
  }

  create(): void {
    this.ensureEchoTextures();
    const regEchoId =
      (this.game.registry.get(RANCH_ECHO_REGISTRY_KEY) as string | undefined) ??
      this.getBridge()?.getRanchEchoId?.() ??
      FLUFFLING_ECHO_ID;

    const w = this.scale.width;
    const h = this.scale.height;

    this.parallaxFar = this.add.rectangle(w / 2, h * 0.25, w * 1.2, h * 0.5, 0x7ec8ff, 1).setDepth(0);
    this.parallaxNear = this.add.rectangle(w / 2, h * 0.75, w * 1.1, h * 0.55, 0xffd6e8, 0.9).setDepth(1);
    this.add.rectangle(w / 2, h * 0.92, w, h * 0.18, 0xc8f5c8, 0.55).setDepth(1);

    this.dayNightTint = this.add
      .rectangle(w / 2, h / 2, w, h, 0x1a2040, 0)
      .setDepth(5)
      .setScrollFactor(0);

    this.auraFlash = this.add
      .rectangle(w / 2, h / 2, w, h, 0xffe08a, 0)
      .setDepth(6)
      .setScrollFactor(0);

    this.tweens.add({
      targets: this.dayNightTint,
      alpha: { from: 0, to: 0.22 },
      duration: 90000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const bounds = {
      minX: w * 0.15,
      maxX: w * 0.85,
      minY: h * 0.38,
      maxY: h * 0.72,
    };

    const textureKey = this.textureKeyForEchoId(regEchoId);
    const displayName = this.displayNameForEchoId(regEchoId);

    this.echoEntity = new Echo(this, w * 0.5, h * 0.52, textureKey, regEchoId, displayName);
    this.echoManager = new RanchEchoManager(this.echoEntity, bounds);

    this.echoEntity.sprite.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.onEchoTap(pointer);
    });

    this.rebuildParticles(textureKey, this.particleTintForEchoId(regEchoId));

    this.ranchSubtitle = this.add
      .text(w / 2, h * 0.08, this.ranchSubtitleText(displayName), {
        fontFamily: 'system-ui, Segoe UI, sans-serif',
        fontSize: '20px',
        color: '#1a2b3c',
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.game.events.on('bridge-ranch-echo', this.onBridgeRanchEcho, this);
    this.game.events.on('bridge-quick-care', this.onQuickCareFx, this);
    this.game.events.on('bridge-drift-tick', this.onDriftFx, this);
    this.game.events.on('bridge-resonance-pulse', this.onResonancePulse, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);
  }

  override update(time: number, delta: number): void {
    this.echoManager.update(this, time, delta);
    if (this.parallaxFar) {
      this.parallaxFar.x = this.scale.width / 2 + Math.sin(time / 4000) * 12;
    }
    if (this.parallaxNear) {
      this.parallaxNear.x = this.scale.width / 2 + Math.sin(time / 2800) * 18;
    }
  }

  private onShutdown(): void {
    this.game.events.off('bridge-ranch-echo', this.onBridgeRanchEcho, this);
    this.game.events.off('bridge-quick-care', this.onQuickCareFx, this);
    this.game.events.off('bridge-drift-tick', this.onDriftFx, this);
    this.game.events.off('bridge-resonance-pulse', this.onResonancePulse, this);
  }

  private onBridgeRanchEcho(
    _: unknown,
    payload: { echoId: string; displayName: string } | undefined,
  ): void {
    if (!payload?.echoId) {
      return;
    }
    const textureKey = this.textureKeyForEchoId(payload.echoId);
    const name = payload.displayName || this.displayNameForEchoId(payload.echoId);
    this.ensureEchoTextures();
    this.echoEntity.applySkin(textureKey, payload.echoId, name);
    this.rebuildParticles(textureKey, this.particleTintForEchoId(payload.echoId));
    this.ranchSubtitle?.setText(this.ranchSubtitleText(name));
  }

  private ensureEchoTextures(): void {
    for (const key of starterTextureKeys()) {
      ensureStarterTexture(this, key);
    }
  }

  private textureKeyForEchoId(echoId: string): string {
    return echoIdToTextureKey(echoId);
  }

  private displayNameForEchoId(echoId: string): string {
    return getEchoDefinition(echoId)?.displayName ?? 'Fluffling';
  }

  private particleTintForEchoId(echoId: string): number {
    switch (echoIdToTextureKey(echoId)) {
      case 'droplet':
        return 0x70d4ff;
      case 'sprout':
        return 0x90e878;
      case 'spark':
        return 0xffe866;
      default:
        return 0xffc870;
    }
  }

  private ranchSubtitleText(displayName: string): string {
    return `Sky Ranch — tap ${displayName}`;
  }

  private rebuildParticles(textureKey: string, tint: number): void {
    this.particles?.destroy();
    this.particles = undefined;
    if (!this.add.particles) {
      return;
    }
    this.particles = this.add.particles(0, 0, textureKey, {
      scale: { start: 0.12, end: 0 },
      alpha: { start: 0.8, end: 0 },
      speed: { min: 30, max: 90 },
      lifespan: 450,
      quantity: 4,
      tint,
      emitting: false,
    });
    this.particles.setDepth(4);
  }

  private getBridge(): GameBridgeService | undefined {
    return this.game.registry.get(GAME_BRIDGE_REGISTRY_KEY) as GameBridgeService | undefined;
  }

  private onEchoTap(pointer: Phaser.Input.Pointer): void {
    const now = Date.now();
    if (now - this.lastPetMs < 2000) {
      this.petTapCount++;
    } else {
      this.petTapCount = 1;
    }
    this.lastPetMs = now;

    this.echoEntity.applyPetReaction(this);
    this.burstParticles(this.echoEntity.x, this.echoEntity.y);

    if (this.petTapCount >= 2) {
      this.echoEntity.startFollow(pointer, 3000);
      this.petTapCount = 0;
    }

    const bridge = this.getBridge();
    bridge?.notifyPetEcho();
  }

  private onQuickCareFx(): void {
    this.burstParticles(this.echoEntity.x, this.echoEntity.y - 20);
    this.echoEntity.applyPetReaction(this);
  }

  private onDriftFx(): void {
    this.burstParticles(this.echoEntity.x, this.echoEntity.y, 3);
  }

  private onResonancePulse(): void {
    this.tweens.add({
      targets: this.auraFlash,
      alpha: { from: 0.15, to: 0 },
      duration: 400,
      ease: 'Quad.easeOut',
    });
  }

  private burstParticles(x: number, y: number, qty = 8): void {
    this.particles?.emitParticleAt(x, y, qty);
  }
}
