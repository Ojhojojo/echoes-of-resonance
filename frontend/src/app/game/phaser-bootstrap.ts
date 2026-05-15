import Phaser from 'phaser';
import type { GameBridgeService } from '../core/services/game-bridge.service';
import { createGameConfig, GAME_BRIDGE_REGISTRY_KEY, RANCH_ECHO_REGISTRY_KEY } from './game-config';
import { SCENE_BOOT, SCENE_RANCH } from './scene-keys';
import { BootScene } from './scenes/BootScene';
import { EchoDanceScene } from './scenes/EchoDanceScene';
import { HarmonyGardenScene } from './scenes/HarmonyGardenScene';
import { RanchScene } from './scenes/RanchScene';

export function bootstrapPhaserGame(
  host: HTMLElement,
  bridge: GameBridgeService,
  sceneKey: string,
): Phaser.Game {
  const config = createGameConfig(host);
  config.scene = [BootScene, RanchScene, EchoDanceScene, HarmonyGardenScene];

  const game = new Phaser.Game(config);
  game.registry.set(GAME_BRIDGE_REGISTRY_KEY, bridge);
  game.registry.set(RANCH_ECHO_REGISTRY_KEY, bridge.getRanchEchoId());

  if (sceneKey === SCENE_RANCH) {
    game.scene.start(SCENE_RANCH);
  }

  return game;
}
