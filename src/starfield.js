import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './config.js';

// Przewijane, paralaksowe tło z gwiazd. Zwraca obiekt z metodą update(delta).
// Lekkie: kilkadziesiąt sprite'ów gwiazd na 3 warstwach o różnej prędkości.
export function createStarfield(scene, { layers = 3, perLayer = 24 } = {}) {
  const stars = [];
  const speeds = [12, 30, 60]; // px/s wg warstwy (głębia)

  for (let layer = 0; layer < layers; layer++) {
    for (let i = 0; i < perLayer; i++) {
      const texIndex = Math.min(layer, 3); // dalsze warstwy = mniejsze gwiazdy
      const star = scene.add.image(
        Phaser.Math.Between(0, GAME_WIDTH),
        Phaser.Math.Between(0, GAME_HEIGHT),
        `star_${texIndex}`
      );
      star.setAlpha(0.25 + layer * 0.25);
      star.setScale(0.4 + layer * 0.25);
      star.speed = speeds[layer] ?? 30;
      star.setDepth(-100 + layer);
      stars.push(star);
    }
  }

  return {
    update(delta) {
      const dt = delta / 1000;
      for (const s of stars) {
        s.y += s.speed * dt;
        if (s.y > GAME_HEIGHT + 8) {
          s.y = -8;
          s.x = Phaser.Math.Between(0, GAME_WIDTH);
        }
      }
    },
    destroy() {
      stars.forEach((s) => s.destroy());
    },
  };
}
