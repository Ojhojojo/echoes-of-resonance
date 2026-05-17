import Phaser from 'phaser';
import {
  baseSpritePathForTextureKey,
  starterTextureKeys,
} from '../../core/data/echo-catalog';
import { RanchScene } from './RanchScene';
import { ensureStarterTexture } from './texture-utils';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  preload(): void {
    this.load.on('loaderror', (_file: Phaser.Loader.File) => {
      const key = _file.key;
      if (typeof key === 'string') {
        ensureStarterTexture(this, key);
      }
    });

    for (const key of starterTextureKeys()) {
      if (this.textures.exists(key)) {
        continue;
      }
      const path = baseSpritePathForTextureKey(key);
      if (path) {
        this.load.image(key, path);
      }
    }

    if (!this.textures.exists('ranch-bg')) {
      this.load.image('ranch-bg', 'assets/game/backgrounds/backgroundColorGrass.png');
    }
  }

  create(): void {
    for (const key of starterTextureKeys()) {
      ensureStarterTexture(this, key);
    }
    this.scene.start(RanchScene.Key);
  }
}
