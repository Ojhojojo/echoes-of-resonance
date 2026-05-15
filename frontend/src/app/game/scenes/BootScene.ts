import Phaser from 'phaser';
import { RanchScene } from './RanchScene';
import { createFlufflingTexture, createStarlingTexture } from './texture-utils';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  preload(): void {
    this.load.on('loaderror', () => {
      if (!this.textures.exists('fluffling')) {
        createFlufflingTexture(this, 'fluffling');
      }
      if (!this.textures.exists('starling')) {
        createStarlingTexture(this, 'starling');
      }
    });
    if (!this.textures.exists('fluffling')) {
      this.load.image('fluffling', 'assets/game/fluffling_base.png');
    }
    if (!this.textures.exists('starling')) {
      this.load.image('starling', 'assets/game/starling_base.png');
    }
  }

  create(): void {
    if (!this.textures.exists('fluffling')) {
      createFlufflingTexture(this, 'fluffling');
    }
    if (!this.textures.exists('starling')) {
      createStarlingTexture(this, 'starling');
    }
    this.scene.start(RanchScene.Key);
  }
}
