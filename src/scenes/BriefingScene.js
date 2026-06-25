import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { createStarfield } from '../starfield.js';

// Lekki ekran fabularny przed sektorem — briefing misji.
const BRIEFING = [
  'ROK 2147.',
  '',
  'Z głębi układu nadciąga RÓJ —',
  'obcy organizm, który pożera',
  'całe cywilizacje.',
  '',
  'Jesteś pilotem myśliwca AEGIS,',
  'ostatniej linii obrony Ziemi.',
  '',
  'SEKTOR 1 — PAS ASTEROID',
  'Powstrzymaj zwiadowców Roju.',
  'Nie pozwól im przedrzeć się',
  'w stronę Ziemi.',
];

export default class BriefingScene extends Phaser.Scene {
  constructor() {
    super('Briefing');
  }

  create() {
    this.starfield = createStarfield(this, { perLayer: 16 });
    const cx = GAME_WIDTH / 2;

    this.add
      .text(cx, 120, '// TRANSMISJA PRZYCHODZĄCA', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#4dff9e',
      })
      .setOrigin(0.5);

    const body = this.add
      .text(cx, 160, '', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#cdd6ff',
        align: 'center',
        lineSpacing: 8,
      })
      .setOrigin(0.5, 0);

    // Efekt „pisania" — dokładamy kolejne linie.
    const fullText = BRIEFING.join('\n');
    let shown = 0;
    const timer = this.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        shown += 2;
        body.setText(fullText.slice(0, shown));
        if (shown >= fullText.length) timer.remove();
      },
    });

    const start = this.add
      .text(cx, GAME_HEIGHT - 120, '► START MISJI', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#ffffff',
        backgroundColor: '#173a5e',
        padding: { x: 20, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.tweens.add({ targets: start, alpha: 0.5, duration: 800, yoyo: true, repeat: -1 });

    const launch = () => {
      // Pierwsze dotknięcie/klawisz dokańcza tekst; drugie startuje misję.
      if (timer.getProgress() < 1 && shown < fullText.length) {
        shown = fullText.length;
        body.setText(fullText);
        timer.remove();
        return;
      }
      this.scene.start('Game');
    };

    start.on('pointerdown', () => this.scene.start('Game'));
    this.input.keyboard.on('keydown', launch);
    this.input.on('pointerdown', launch);
  }

  update(_time, delta) {
    this.starfield.update(delta);
  }
}
