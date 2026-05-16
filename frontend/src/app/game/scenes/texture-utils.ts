import Phaser from 'phaser';

/** Procedural Fluffling fallback if `sprites/fluffling_base.jpg` fails to load. */
export function createFlufflingTexture(scene: Phaser.Scene, key = 'fluffling'): void {
  if (scene.textures.exists(key)) {
    return;
  }

  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0xffb870, 1);
  g.fillCircle(44, 48, 40);
  g.fillStyle(0xff8a4c, 0.35);
  g.fillCircle(44, 52, 36);
  g.fillStyle(0x1a1a2e, 1);
  g.fillCircle(30, 38, 8);
  g.fillCircle(58, 38, 8);
  g.lineStyle(3, 0xff6b6b, 1);
  g.beginPath();
  g.arc(44, 50, 18, Phaser.Math.DegToRad(20), Phaser.Math.DegToRad(160), false);
  g.strokePath();
  g.generateTexture(key, 88, 96);
  g.destroy();
}

export function createDropletTexture(scene: Phaser.Scene, key = 'droplet'): void {
  if (scene.textures.exists(key)) {
    return;
  }

  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0x5ec8ff, 0.85);
  g.fillEllipse(44, 52, 36, 48);
  g.fillStyle(0xffffff, 0.35);
  g.fillEllipse(36, 42, 12, 18);
  g.fillStyle(0x1a2b3c, 1);
  g.fillCircle(34, 50, 5);
  g.fillCircle(52, 50, 5);
  g.generateTexture(key, 88, 96);
  g.destroy();
}

export function createSproutTexture(scene: Phaser.Scene, key = 'sprout'): void {
  if (scene.textures.exists(key)) {
    return;
  }

  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0x8b5a2b, 1);
  g.fillRoundedRect(32, 56, 24, 28, 8);
  g.fillStyle(0x6ecf68, 1);
  g.fillEllipse(44, 36, 40, 28);
  g.fillStyle(0x4aa84a, 0.5);
  g.fillEllipse(44, 34, 28, 16);
  g.fillStyle(0x1a2b3c, 1);
  g.fillCircle(38, 52, 4);
  g.fillCircle(50, 52, 4);
  g.generateTexture(key, 88, 96);
  g.destroy();
}

export function createSparkTexture(scene: Phaser.Scene, key = 'spark'): void {
  if (scene.textures.exists(key)) {
    return;
  }

  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0xffe066, 1);
  g.fillEllipse(44, 54, 38, 34);
  g.fillStyle(0xffc040, 0.6);
  g.fillTriangle(20, 40, 44, 18, 68, 40);
  g.fillStyle(0x1a2b3c, 1);
  g.fillCircle(36, 52, 5);
  g.fillCircle(52, 52, 5);
  g.lineStyle(2, 0x6ec8ff, 1);
  g.lineBetween(12, 58, 24, 48);
  g.lineBetween(76, 58, 64, 48);
  g.generateTexture(key, 88, 96);
  g.destroy();
}

const FALLBACK_CREATORS: Record<string, (scene: Phaser.Scene, key: string) => void> = {
  fluffling: createFlufflingTexture,
  droplet: createDropletTexture,
  sprout: createSproutTexture,
  spark: createSparkTexture,
};

export function ensureStarterTexture(scene: Phaser.Scene, textureKey: string): void {
  if (scene.textures.exists(textureKey)) {
    return;
  }
  FALLBACK_CREATORS[textureKey]?.(scene, textureKey);
}
