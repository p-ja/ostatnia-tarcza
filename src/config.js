// Centralna konfiguracja gry — wymiary, kolory, ścieżki assetów, balans rozgrywki.

// Bazowa rozdzielczość (pionowa — naturalna dla strzelanki i ekranów telefonów).
// Phaser skaluje canvas do okna z zachowaniem proporcji (Scale.FIT).
export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 800;

export const COLORS = {
  bg: 0x05060f,
  accent: 0x5ad1ff,
  player: 0x7fe0ff,
  enemy: 0xff6b8b,
  warning: 0xffcc4d,
  hp: 0x4dff9e,
  earth: 0x4d9bff,
};

// Katalog publiczny Vite = ./assets, więc pliki Kenneya są pod tym prefiksem.
const BASE = 'kenney_simple-space/PNG/Default';

export const ASSETS = {
  player: `${BASE}/ship_C.png`,
  enemies: {
    scout: `${BASE}/enemy_A.png`,
    fighter: `${BASE}/enemy_B.png`,
    diver: `${BASE}/enemy_C.png`,
    heavy: `${BASE}/enemy_E.png`,
  },
  meteors: [
    `${BASE}/meteor_large.png`,
    `${BASE}/meteor_detailedLarge.png`,
    `${BASE}/meteor_small.png`,
    `${BASE}/meteor_detailedSmall.png`,
  ],
  effects: {
    yellow: `${BASE}/effect_yellow.png`,
    purple: `${BASE}/effect_purple.png`,
  },
  stars: [
    `${BASE}/star_tiny.png`,
    `${BASE}/star_small.png`,
    `${BASE}/star_medium.png`,
    `${BASE}/star_large.png`,
  ],
  powerups: {
    health: `${BASE}/icon_plusLarge.png`,
    boost: `${BASE}/icon_exclamationLarge.png`,
    shield: `${BASE}/icon_crossLarge.png`,
  },
};

// Balans rozgrywki — wartości łatwe do strojenia w jednym miejscu.
export const BALANCE = {
  player: {
    maxHp: 5,
    speed: 420, // px/s przy sterowaniu klawiaturą
    fireDelay: 220, // ms między strzałami
    bulletSpeed: 640,
    boostFireDelay: 110, // po zebraniu power-upu boost
    boostDuration: 6000, // ms
    invulnAfterHit: 900, // ms nietykalności po trafieniu
  },
  earth: {
    integrity: 10, // ile wrogów może uciec dołem ekranu, zanim Ziemia padnie
  },
  bullet: {
    damage: 1,
  },
  powerupDropChance: 0.18,
};
