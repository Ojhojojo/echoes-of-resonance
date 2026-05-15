import Phaser from 'phaser';

/** Procedural Fluffling texture until real art is imported. */
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

/** Procedural Starling placeholder — aerial bird stub (optional PNG: `starling_base.png`). */
export function createStarlingTexture(scene: Phaser.Scene, key = 'starling'): void {
  if (scene.textures.exists(key)) {
    return;
  }

  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0x3d5a80, 1);
  g.fillEllipse(48, 52, 52, 28);
  g.fillStyle(0x7ee8ff, 0.85);
  g.fillEllipse(56, 48, 22, 14);
  g.fillStyle(0x5bc0be, 0.9);
  g.beginPath();
  g.moveTo(28, 48);
  g.lineTo(8, 62);
  g.lineTo(32, 58);
  g.closePath();
  g.fillPath();
  g.lineStyle(4, 0x9b5de5, 0.95);
  g.beginPath();
  g.moveTo(72, 52);
  g.lineTo(92, 46);
  g.lineTo(78, 58);
  g.strokePath();
  g.fillStyle(0x1a1a2e, 1);
  g.fillCircle(38, 46, 5);
  g.fillStyle(0x00f5d4, 0.9);
  g.fillCircle(39, 45, 2);
  g.lineStyle(2, 0xffd60a, 0.9);
  g.beginPath();
  g.moveTo(44, 42);
  g.lineTo(52, 36);
  g.lineTo(60, 44);
  g.strokePath();
  g.generateTexture(key, 96, 96);
  g.destroy();
}
