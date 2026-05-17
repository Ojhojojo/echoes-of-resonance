import Phaser from 'phaser';

export type EchoMood = 'idle' | 'happy' | 'following';

export interface EchoBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Phaser-side Echo runtime — movement and reactions only (no authoritative resonance).
 */
export class Echo {
  echoId: string;
  displayName: string;

  readonly sprite: Phaser.GameObjects.Sprite;
  mood: EchoMood = 'idle';

  private wanderTarget: Phaser.Math.Vector2 | null = null;
  private wanderCooldownMs = 0;
  private followUntilMs = 0;
  private followPointer: Phaser.Input.Pointer | null = null;
  private baseY = 0;
  private idleBobTween?: Phaser.Tweens.Tween;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    textureKey: string,
    echoId: string,
    displayName: string,
  ) {
    this.echoId = echoId;
    this.displayName = displayName;
    this.sprite = scene.add.sprite(x, y, textureKey);
    this.sprite.setDepth(3);
    this.sprite.setInteractive({ useHandCursor: true });
    this.baseY = y;
    this.startIdleBob(scene);
  }

  applySkin(textureKey: string, echoId: string, displayName: string): void {
    this.echoId = echoId;
    this.displayName = displayName;
    this.sprite.setTexture(textureKey);
  }

  get x(): number {
    return this.sprite.x;
  }

  get y(): number {
    return this.sprite.y;
  }

  setPosition(x: number, y: number): void {
    this.sprite.setPosition(x, y);
    this.baseY = y;
  }

  applyDissonanceVisual(level: 'none' | 'mild' | 'strong'): void {
    switch (level) {
      case 'none':
        this.sprite.clearTint();
        this.sprite.setAlpha(1);
        break;
      case 'mild':
        this.sprite.setTint(0xddd0e8);
        this.sprite.setAlpha(0.92);
        break;
      case 'strong':
        this.sprite.setTint(0xb8a0c8);
        this.sprite.setAlpha(0.85);
        break;
    }
  }

  applyPetReaction(scene: Phaser.Scene): void {
    this.stopIdleBob();
    this.mood = 'happy';
    scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.12,
      scaleY: 0.9,
      duration: 100,
      yoyo: true,
      ease: 'Quad.easeOut',
      onComplete: () => {
        if (this.mood === 'happy' && Date.now() > this.followUntilMs) {
          this.mood = 'idle';
          this.startIdleBob(scene);
        }
      },
    });
  }

  startFollow(pointer: Phaser.Input.Pointer, durationMs = 3000): void {
    this.stopIdleBob();
    this.mood = 'following';
    this.followPointer = pointer;
    this.followUntilMs = Date.now() + durationMs;
    this.wanderTarget = null;
  }

  tickWander(scene: Phaser.Scene, bounds: EchoBounds, deltaMs: number): void {
    if (this.mood === 'following' && Date.now() < this.followUntilMs && this.followPointer) {
      this.moveToward(this.followPointer.worldX, this.followPointer.worldY, 0.08);
      return;
    }

    if (this.mood === 'following' && Date.now() >= this.followUntilMs) {
      this.mood = 'idle';
      this.followPointer = null;
      this.startIdleBob(scene);
    }

    this.wanderCooldownMs -= deltaMs;
    if (!this.wanderTarget || this.wanderCooldownMs <= 0) {
      this.pickWanderTarget(bounds);
      this.wanderCooldownMs = Phaser.Math.Between(3000, 5000);
    }

    if (this.wanderTarget) {
      const arrived = this.moveToward(this.wanderTarget.x, this.wanderTarget.y, 0.04);
      if (arrived) {
        this.wanderTarget = null;
      }
    }

    this.sprite.rotation = Phaser.Math.Linear(this.sprite.rotation, 0, 0.1);
  }

  moveToward(tx: number, ty: number, lerp: number): boolean {
    if (this.mood === 'idle' && this.idleBobTween?.isPlaying()) {
      this.stopIdleBob();
    }

    const dx = tx - this.sprite.x;
    const dy = ty - this.sprite.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 4) {
      return true;
    }
    this.sprite.x += dx * lerp;
    this.sprite.y += dy * lerp;
    this.baseY = this.sprite.y;
    this.sprite.setFlipX(dx < 0);
    return false;
  }

  private startIdleBob(scene: Phaser.Scene): void {
    if (this.mood !== 'idle') {
      return;
    }
    this.stopIdleBob();
    this.sprite.y = this.baseY;
    this.idleBobTween = scene.tweens.add({
      targets: this.sprite,
      y: this.baseY - 6,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private stopIdleBob(): void {
    this.idleBobTween?.stop();
    this.idleBobTween = undefined;
    this.sprite.y = this.baseY;
  }

  private pickWanderTarget(bounds: EchoBounds): void {
    this.wanderTarget = new Phaser.Math.Vector2(
      Phaser.Math.Between(bounds.minX, bounds.maxX),
      Phaser.Math.Between(bounds.minY, bounds.maxY),
    );
  }
}
