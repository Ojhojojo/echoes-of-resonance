import Phaser from 'phaser';

/** Registry key for which Echo skin the ranch should show (Phaser reads synchronously). */
export const RANCH_ECHO_REGISTRY_KEY = 'ranchEcho';

/** Design resolution — canvas scales with FIT inside the host div (mobile-friendly). */
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

/** Registry key used by Phaser scenes to resolve the Angular bridge. */
export const GAME_BRIDGE_REGISTRY_KEY = 'gameBridge';

/**
 * Base Phaser config: sky-ranch palette, arcade physics (idle / light motion only for now).
 * Parent must be the host HTMLElement (see PhaserGameComponent).
 */
export function createGameConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    transparent: false,
    backgroundColor: '#7ec8ff',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    input: {
      activePointers: 3,
      touch: { capture: true },
    },
    render: {
      antialias: true,
      pixelArt: false,
    },
  };
}
