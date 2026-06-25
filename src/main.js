import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from './config.js';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import BriefingScene from './scenes/BriefingScene.js';
import GameScene from './scenes/GameScene.js';
import ResultScene from './scenes/ResultScene.js';

const config = {
  type: Phaser.AUTO, // WebGL z fallbackiem na Canvas
  parent: 'game',
  backgroundColor: COLORS.bg,
  scale: {
    mode: Phaser.Scale.FIT, // skalowanie z zachowaniem proporcji
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  render: {
    pixelArt: false,
    antialias: true,
  },
  scene: [BootScene, MenuScene, BriefingScene, GameScene, ResultScene],
};

const game = new Phaser.Game(config);

// Usuń loader z HTML, gdy Phaser jest gotowy.
game.events.once('ready', () => {
  const boot = document.getElementById('boot');
  if (boot) boot.remove();
});

// W trybie deweloperskim wystaw instancję gry do konsoli (debug/testy).
if (import.meta.env?.DEV) {
  window.__GAME__ = game;
}

export default game;
