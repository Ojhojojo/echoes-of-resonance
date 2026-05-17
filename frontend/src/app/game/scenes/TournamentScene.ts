import Phaser from 'phaser';
import { TOURNAMENT_OPPONENTS, type TournamentRank } from '../../core/data/tournament-data';
import { echoIdToTextureKey } from '../../core/data/echo-catalog';
import { GAME_BRIDGE_REGISTRY_KEY, RANCH_ECHO_REGISTRY_KEY } from '../game-config';
import { SCENE_RANCH, SCENE_TOURNAMENT } from '../scene-keys';
import type { GameBridgeService } from '../../core/services/game-bridge.service';
import { ensureStarterTexture } from './texture-utils';

type HitQuality = 'none' | 'perfect' | 'good' | 'miss';

interface TimingBeat {
  centerMs: number;
  quality: HitQuality;
}

/**
 * Weekend tournament — light timing combat (M5).
 */
export class TournamentScene extends Phaser.Scene {
  static readonly Key = SCENE_TOURNAMENT;

  private beats: TimingBeat[] = [];
  private startTime = 0;
  private label!: Phaser.GameObjects.Text;
  private opponentLabel!: Phaser.GameObjects.Text;
  private finished = false;

  private score = 0;
  private perfects = 0;
  private goods = 0;
  private misses = 0;

  private readonly perfectWindowMs = 95;
  private readonly goodWindowMs = 240;
  private readonly beatCount = 5;
  private readonly sessionMs = 14000;

  constructor() {
    super({ key: TournamentScene.Key });
  }

  create(): void {
    const echoId =
      (this.game.registry.get(RANCH_ECHO_REGISTRY_KEY) as string | undefined) ?? 'fluffling_web';
    const textureKey = echoIdToTextureKey(echoId);
    ensureStarterTexture(this, textureKey);

    const bridge = this.game.registry.get(GAME_BRIDGE_REGISTRY_KEY) as GameBridgeService | undefined;
    const rank = (bridge?.getTournamentRank() ?? 'D') as TournamentRank;
    const opponent = TOURNAMENT_OPPONENTS[rank];

    const w = this.scale.width;
    const h = this.scale.height;

    this.add.rectangle(w / 2, h / 2, w, h, 0x2a1838, 1);
    this.add.rectangle(w / 2, h * 0.5, w * 0.85, 4, 0xffe08a, 0.5);

    if (this.textures.exists(textureKey)) {
      this.add.sprite(w * 0.28, h * 0.48, textureKey).setScale(0.9);
    }

    this.add
      .text(w * 0.72, h * 0.42, 'VS', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '28px',
        color: '#ff8a9a',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.opponentLabel = this.add
      .text(w * 0.72, h * 0.52, opponent, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        color: '#ffd6e8',
      })
      .setOrigin(0.5);

    this.label = this.add
      .text(w / 2, h * 0.1, `Tournament · Rank ${rank} — tap on the pulse!`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        color: '#ffe8a8',
      })
      .setOrigin(0.5);

    const gap = this.sessionMs / this.beatCount;
    for (let i = 0; i < this.beatCount; i++) {
      this.beats.push({ centerMs: 1200 + i * gap, quality: 'none' });
    }

    this.startTime = this.time.now;
    this.input.on('pointerdown', () => this.onTap());

    this.time.delayedCall(this.sessionMs + 400, () => this.finishSession(rank, opponent));
  }

  override update(): void {
    if (this.finished) {
      return;
    }
    const elapsed = this.time.now - this.startTime;
    const next = this.beats.find((b) => b.quality === 'none' && elapsed <= b.centerMs + this.goodWindowMs);
    const rush = next && elapsed >= next.centerMs - this.goodWindowMs;
    this.label.setText(rush ? 'STRIKE!' : `Hits ${this.perfects + this.goods}/${this.beatCount}`);
  }

  private onTap(): void {
    const elapsed = this.time.now - this.startTime;
    const candidates = this.beats.filter((b) => b.quality === 'none');
    if (candidates.length === 0) {
      return;
    }

    let best: TimingBeat | null = null;
    let bestDelta = Infinity;
    for (const b of candidates) {
      const d = Math.abs(elapsed - b.centerMs);
      if (d <= this.goodWindowMs && d < bestDelta) {
        bestDelta = d;
        best = b;
      }
    }

    if (!best) {
      this.misses += 1;
      this.score = Math.max(0, this.score - 5);
      this.cameras.main.shake(100, 0.004);
      return;
    }

    const abs = Math.abs(elapsed - best.centerMs);
    if (abs <= this.perfectWindowMs) {
      best.quality = 'perfect';
      this.perfects += 1;
      this.score += 20;
      this.flashTap(0xfffde7);
    } else {
      best.quality = 'good';
      this.goods += 1;
      this.score += 12;
      this.flashTap(0xffe0b2);
    }
  }

  private flashTap(color: number): void {
    this.cameras.main.flash(60, (color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff);
  }

  private finishSession(rank: TournamentRank, opponent: string): void {
    if (this.finished) {
      return;
    }
    this.finished = true;

    const unresolved = this.beats.filter((b) => b.quality === 'none').length;
    this.misses += unresolved;
    this.score -= unresolved * 8;
    this.score = Math.max(0, this.score);

    const hits = this.perfects + this.goods;
    const won = hits >= 3 && this.score >= 36;
    let grade: 'S' | 'A' | 'B' | 'C' | 'D' = 'D';
    if (this.perfects >= 4) {
      grade = 'S';
    } else if (this.perfects >= 2 && hits >= 4) {
      grade = 'A';
    } else if (hits >= 4) {
      grade = 'B';
    } else if (hits >= 2) {
      grade = 'C';
    }

    const w = this.scale.width;
    const h = this.scale.height;
    const outcome = won ? 'Victory!' : 'Close match';
    this.add
      .text(
        w / 2,
        h * 0.72,
        `${outcome} vs ${opponent}\nGrade ${grade} · ${hits}/${this.beatCount} timings · score ${this.score}`,
        {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '16px',
          color: '#ffffff',
          align: 'center',
        },
      )
      .setOrigin(0.5);

    const bridge = this.game.registry.get(GAME_BRIDGE_REGISTRY_KEY) as GameBridgeService | undefined;
    bridge?.completeTournament({
      won,
      grade,
      score: this.score,
      perfects: this.perfects,
      goods: this.goods,
      misses: this.misses,
      opponent,
      rank,
    });

    this.time.delayedCall(1800, () => {
      if (this.scene.isActive(SCENE_TOURNAMENT)) {
        this.scene.stop(SCENE_TOURNAMENT);
        this.scene.resume(SCENE_RANCH);
      }
    });
  }
}
