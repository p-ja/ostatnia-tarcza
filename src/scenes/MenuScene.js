import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { createStarfield } from '../starfield.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    this.starfield = createStarfield(this);

    const cx = GAME_WIDTH / 2;

    // Tytuł
    this.add
      .text(cx, 220, 'OSTATNIA\nTARCZA', {
        fontFamily: 'Arial Black, system-ui, sans-serif',
        fontSize: '64px',
        color: '#7fe0ff',
        align: 'center',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setShadow(0, 0, '#1b6fa8', 24, true, true);

    this.add
      .text(cx, 330, 'OBRONA ZIEMI · SEKTOR 1', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#6f7bb6',
        letterSpacing: 4,
      })
      .setOrigin(0.5);

    // Statek gracza jako dekoracja
    const ship = this.add.image(cx, 460, 'player').setScale(1.4);
    this.tweens.add({
      targets: ship,
      y: 446,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });

    // Przycisk / wskazówka startu
    const start = this.add
      .text(cx, 600, 'DOTKNIJ, BY ROZPOCZĄĆ', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ffffff',
        backgroundColor: '#173a5e',
        padding: { x: 20, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: start,
      alpha: 0.4,
      duration: 900,
      yoyo: true,
      repeat: -1,
    });

    // Najlepszy wynik z localStorage
    const best = Number(localStorage.getItem('ot_best') || 0);
    if (best > 0) {
      this.add
        .text(cx, 680, `REKORD: ${best}`, {
          fontFamily: 'monospace',
          fontSize: '16px',
          color: '#ffcc4d',
        })
        .setOrigin(0.5);
    }

    const begin = () => this.scene.start('Briefing');
    start.on('pointerdown', begin);
    this.input.keyboard.once('keydown', begin);
  }

  update(_time, delta) {
    this.starfield.update(delta);
  }
}
