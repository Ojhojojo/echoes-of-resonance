import Phaser from 'phaser';
import {
  LANTERN_FESTIVAL_ADVENTURE,
  resolveAdventureEnding,
  type AdventureChoice,
  type AdventureNode,
} from '../../core/data/adventure-lantern-festival';
import { echoIdToTextureKey } from '../../core/data/echo-catalog';
import type { ResonanceAxis } from '../../core/services/player-store.service';
import { GAME_BRIDGE_REGISTRY_KEY, RANCH_ECHO_REGISTRY_KEY } from '../game-config';
import { SCENE_ADVENTURE, SCENE_RANCH } from '../scene-keys';
import type { GameBridgeService } from '../../core/services/game-bridge.service';
import { ensureStarterTexture } from './texture-utils';

/**
 * Lite weekend expedition — choice nodes (M4).
 */
export class AdventureScene extends Phaser.Scene {
  static readonly Key = SCENE_ADVENTURE;

  private nodeIndex = 0;
  private axisScores: Record<ResonanceAxis, number> = {
    joy: 0,
    discipline: 0,
    courage: 0,
    harmony: 0,
  };

  private bodyText!: Phaser.GameObjects.Text;
  private titleText!: Phaser.GameObjects.Text;
  private choiceButtons: Phaser.GameObjects.Text[] = [];
  private finished = false;

  constructor() {
    super({ key: AdventureScene.Key });
  }

  create(): void {
    const echoId =
      (this.game.registry.get(RANCH_ECHO_REGISTRY_KEY) as string | undefined) ?? 'fluffling_web';
    const textureKey = echoIdToTextureKey(echoId);
    ensureStarterTexture(this, textureKey);

    const w = this.scale.width;
    const h = this.scale.height;

    this.add.rectangle(w / 2, h / 2, w, h, 0x1a2840, 1);
    this.add.rectangle(w / 2, h * 0.35, w * 0.9, h * 0.45, 0x2d4466, 0.55).setStrokeStyle(2, 0x6ec8ff, 0.4);

    if (this.textures.exists(textureKey)) {
      this.add.sprite(w * 0.18, h * 0.38, textureKey).setScale(0.85);
    }

    this.titleText = this.add
      .text(w / 2, h * 0.08, LANTERN_FESTIVAL_ADVENTURE.title, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        color: '#ffe8a8',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.bodyText = this.add
      .text(w / 2, h * 0.22, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        color: '#e8f4ff',
        wordWrap: { width: w * 0.82 },
        align: 'center',
      })
      .setOrigin(0.5, 0);

    this.add
      .text(w / 2, h * 0.92, 'Tap a choice · Esc not used', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        color: '#8ab0cc',
      })
      .setOrigin(0.5);

    this.showNode(echoId);
  }

  private showNode(echoId: string): void {
    this.clearChoices();

    const nodes = LANTERN_FESTIVAL_ADVENTURE.nodes;
    if (this.nodeIndex >= nodes.length) {
      this.finishAdventure();
      return;
    }

    const node = nodes[this.nodeIndex];
    this.bodyText.setText(node.body);
    this.titleText.setText(
      `${LANTERN_FESTIVAL_ADVENTURE.title} (${this.nodeIndex + 1}/${nodes.length})`,
    );

    const choices = this.resolveChoices(node, echoId);
    const w = this.scale.width;
    const startY = this.scale.height * 0.52;
    const gap = 46;

    choices.forEach((choice, i) => {
      const btn = this.add
        .text(w / 2, startY + i * gap, choice.label, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '15px',
          color: '#1a2b3c',
          backgroundColor: '#b8e8ff',
          padding: { x: 14, y: 8 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#ffe8a8' }));
      btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#b8e8ff' }));
      btn.on('pointerdown', () => this.pickChoice(choice));
      this.choiceButtons.push(btn);
    });
  }

  private static readonly STARTER_CHOICE_INDEX: Record<string, number> = {
    fluffling_web: 0,
    droplet_web: 1,
    sprout_web: 2,
    spark_web: 3,
  };

  private resolveChoices(node: AdventureNode, echoId: string): AdventureChoice[] {
    if (!node.starterFlavor) {
      return node.choices;
    }

    const idx = AdventureScene.STARTER_CHOICE_INDEX[echoId] ?? 0;
    const base = node.choices[idx] ?? node.choices[0];
    const flavor = node.starterFlavor[echoId];
    if (!base) {
      return node.choices;
    }
    return [{ ...base, label: flavor ?? base.label }];
  }

  private pickChoice(choice: AdventureChoice): void {
    if (this.finished) {
      return;
    }

    this.axisScores[choice.axis] += choice.axisPoints;
    this.nodeIndex += 1;
    const echoId =
      (this.game.registry.get(RANCH_ECHO_REGISTRY_KEY) as string | undefined) ?? 'fluffling_web';
    this.showNode(echoId);
  }

  private clearChoices(): void {
    for (const btn of this.choiceButtons) {
      btn.destroy();
    }
    this.choiceButtons = [];
  }

  private finishAdventure(): void {
    if (this.finished) {
      return;
    }
    this.finished = true;
    this.clearChoices();

    const { endingId, dominantAxis } = resolveAdventureEnding(this.axisScores);
    const ending =
      LANTERN_FESTIVAL_ADVENTURE.endings[endingId] ??
      LANTERN_FESTIVAL_ADVENTURE.endings['harmony'];

    const w = this.scale.width;
    const h = this.scale.height;

    this.bodyText.setText(`${ending.title}\n\n${ending.body}`);
    this.titleText.setText('Adventure complete');

    const bridge = this.game.registry.get(GAME_BRIDGE_REGISTRY_KEY) as GameBridgeService | undefined;
    bridge?.completeAdventure({
      adventureId: LANTERN_FESTIVAL_ADVENTURE.id,
      endingId,
      dominantAxis,
      axisScores: { ...this.axisScores },
    });

    this.time.delayedCall(2200, () => {
      if (this.scene.isActive(SCENE_ADVENTURE)) {
        this.scene.stop(SCENE_ADVENTURE);
        this.scene.resume(SCENE_RANCH);
      }
    });
  }
}
