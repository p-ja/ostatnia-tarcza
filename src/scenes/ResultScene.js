import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { createStarfield } from '../starfield.js';

export default class ResultScene extends Phaser.Scene {
  constructor() {
    super('Result');
  }

  init(data) {
    this.result = data;
  }

  create() {
    this.starfield = createStarfield(this, { perLayer: 16 });
    const cx = GAME_WIDTH / 2;
    const { win, reason, score, earth, maxEarth } = this.result;

    this.add
      .text(cx, 200, win ? 'ZWYCIĘSTWO' : 'PORAŻKA', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '52px',
        color: win ? '#4dff9e' : '#ff6b8b',
      })
      .setOrigin(0.5)
      .setShadow(0, 0, win ? '#1d6b46' : '#7a2030', 24, true, true);

    this.add
      .text(cx, 260, reason, { fontFamily: 'monospace', fontSize: '16px', color: '#cdd6ff' })
      .setOrigin(0.5);

    // Fabularny epilog
    const epilogue = win
      ? 'Zwiadowcy Roju odparci.\nZiemia ma jeszcze czas.\nLecz to dopiero pierwszy sektor…'
      : 'Rój przedarł się przez tarczę.\nZiemia potrzebuje nowego pilota.';
    this.add
      .text(cx, 340, epilogue, {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#8a93c2',
        align: 'center',
        lineSpacing: 6,
      })
      .setOrigin(0.5);

    // Statystyki
    const best = Number(localStorage.getItem('ot_best') || 0);
    const isRecord = score >= best && score > 0;
    this.add
      .text(cx, 450, `WYNIK: ${score}`, { fontFamily: 'monospace', fontSize: '28px', color: '#ffffff' })
      .setOrigin(0.5);
    this.add
      .text(cx, 490, `INTEGRALNOŚĆ ZIEMI: ${Math.max(0, earth)}/${maxEarth}`, {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#4d9bff',
      })
      .setOrigin(0.5);
    this.add
      .text(cx, 520, isRecord ? '★ NOWY REKORD ★' : `REKORD: ${best}`, {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#ffcc4d',
      })
      .setOrigin(0.5);

    // Restart
    const btn = this.add
      .text(cx, 620, '► ZAGRAJ PONOWNIE', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#ffffff',
        backgroundColor: '#173a5e',
        padding: { x: 20, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    this.tweens.add({ targets: btn, alpha: 0.5, duration: 800, yoyo: true, repeat: -1 });

    const menuBtn = this.add
      .text(cx, 690, 'MENU GŁÓWNE', { fontFamily: 'monospace', fontSize: '16px', color: '#8a93c2' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => this.scene.start('Game'));
    menuBtn.on('pointerdown', () => this.scene.start('Menu'));
    // Klawisz = restart (po krótkiej zwłoce, by nie złapać resztkowego inputu)
    this.time.delayedCall(400, () => {
      this.input.keyboard.once('keydown', () => this.scene.start('Game'));
    });

    this.events.once('shutdown', () => this.starfield.destroy());
  }

  update(_time, delta) {
    this.starfield.update(delta);
  }
}
