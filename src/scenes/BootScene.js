import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, ASSETS } from '../config.js';

// Ładuje wszystkie assety i tworzy proceduralne tekstury (pociski, błyski).
export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    // Pasek postępu ładowania
    const barW = 240;
    const barX = (GAME_WIDTH - barW) / 2;
    const barY = GAME_HEIGHT / 2;
    const border = this.add.rectangle(GAME_WIDTH / 2, barY, barW + 6, 18).setStrokeStyle(2, COLORS.accent);
    const bar = this.add.rectangle(barX, barY, 0, 12, COLORS.accent).setOrigin(0, 0.5);
    const label = this.add
      .text(GAME_WIDTH / 2, barY - 28, 'WCZYTYWANIE', { fontFamily: 'monospace', fontSize: '14px', color: '#5ad1ff' })
      .setOrigin(0.5);

    this.load.on('progress', (p) => {
      bar.width = barW * p;
    });
    this.load.on('complete', () => {
      border.destroy();
      bar.destroy();
      label.destroy();
    });

    // Statek gracza
    this.load.image('player', ASSETS.player);

    // Wrogowie
    for (const [key, path] of Object.entries(ASSETS.enemies)) {
      this.load.image(`enemy_${key}`, path);
    }

    // Meteory
    ASSETS.meteors.forEach((p, i) => this.load.image(`meteor_${i}`, p));

    // Gwiazdy (tło)
    ASSETS.stars.forEach((p, i) => this.load.image(`star_${i}`, p));

    // Efekty / power-upy
    this.load.image('fx_yellow', ASSETS.effects.yellow);
    this.load.image('fx_purple', ASSETS.effects.purple);
    this.load.image('pw_health', ASSETS.powerups.health);
    this.load.image('pw_boost', ASSETS.powerups.boost);
    this.load.image('pw_shield', ASSETS.powerups.shield);
  }

  create() {
    this.makeBulletTexture('bullet_player', COLORS.player);
    this.makeBulletTexture('bullet_enemy', COLORS.enemy);
    this.makeParticleTexture('spark', 0xffffff);

    this.scene.start('Menu');
  }

  // Smukły, jasny pocisk-laser rysowany proceduralnie (ostry niezależnie od assetów).
  makeBulletTexture(key, color) {
    const w = 6;
    const h = 18;
    const g = this.add.graphics();
    g.fillStyle(color, 1);
    g.fillRoundedRect(0, 0, w, h, 3);
    g.fillStyle(0xffffff, 0.9);
    g.fillRoundedRect(w / 2 - 1, 2, 2, h - 4, 1);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  // Mała okrągła cząsteczka do efektów wybuchów/silnika.
  makeParticleTexture(key, color) {
    const r = 6;
    const g = this.add.graphics();
    g.fillStyle(color, 1);
    g.fillCircle(r, r, r);
    g.generateTexture(key, r * 2, r * 2);
    g.destroy();
  }
}
