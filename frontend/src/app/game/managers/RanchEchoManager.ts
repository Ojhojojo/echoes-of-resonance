import Phaser from 'phaser';
import { Echo, type EchoBounds } from '../entities/Echo';

/** Updates Echo wander / follow each frame. */
export class RanchEchoManager {
  readonly echo: Echo;
  private readonly bounds: EchoBounds;

  constructor(echo: Echo, bounds: EchoBounds) {
    this.echo = echo;
    this.bounds = bounds;
  }

  update(scene: Phaser.Scene, time: number, delta: number): void {
    this.echo.tickWander(scene, this.bounds, delta);
    const bob = Math.sin(time / 400) * 4;
    this.echo.sprite.y += bob * 0.02;
  }
}
