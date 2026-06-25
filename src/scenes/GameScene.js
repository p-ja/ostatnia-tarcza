import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, BALANCE } from '../config.js';
import { createStarfield } from '../starfield.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    this.starfield = createStarfield(this);

    // ---- Stan rozgrywki ----
    this.hp = BALANCE.player.maxHp;
    this.earth = BALANCE.earth.integrity;
    this.score = 0;
    this.combo = 0;
    this.invulnUntil = 0;
    this.nextFire = 0;
    this.fireDelay = BALANCE.player.fireDelay;
    this.boostUntil = 0;
    this.gameOver = false;

    // ---- Gracz ----
    this.player = this.physics.add.image(GAME_WIDTH / 2, GAME_HEIGHT - 110, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);
    this.player.body.setSize(this.player.width * 0.6, this.player.height * 0.6, true);

    // Delikatny „silnik" pod statkiem
    this.engine = this.add.particles(0, 0, 'spark', {
      follow: this.player,
      followOffset: { x: 0, y: 22 },
      speedY: { min: 60, max: 140 },
      lifespan: 300,
      scale: { start: 0.5, end: 0 },
      tint: COLORS.accent,
      blendMode: 'ADD',
      frequency: 30,
    });
    this.engine.setDepth(9);

    // ---- Grupy ----
    this.playerBullets = this.physics.add.group();
    this.enemies = this.physics.add.group();
    this.enemyBullets = this.physics.add.group();
    this.meteors = this.physics.add.group();
    this.powerups = this.physics.add.group();

    // ---- Kolizje ----
    this.physics.add.overlap(this.playerBullets, this.enemies, this.hitEnemy, null, this);
    this.physics.add.overlap(this.playerBullets, this.meteors, this.hitMeteor, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.playerHitByEnemy, null, this);
    this.physics.add.overlap(this.player, this.enemyBullets, this.playerHitByBullet, null, this);
    this.physics.add.overlap(this.player, this.meteors, this.playerHitByMeteor, null, this);
    this.physics.add.overlap(this.player, this.powerups, this.collectPowerup, null, this);

    this.setupInput();
    this.buildHud();

    // ---- Fale wrogów ----
    this.waves = this.buildWaves();
    this.currentWave = -1;
    this.waveSpawning = false;
    this.waveTransition = false;
    this.advanceWave();

    // ---- Meteory (tło sektora — Pas Asteroid) ----
    this.meteorTimer = this.time.addEvent({
      delay: 1600,
      loop: true,
      callback: this.spawnMeteor,
      callbackScope: this,
    });

    // Sprzątanie przy zamknięciu sceny
    this.events.once('shutdown', () => {
      this.starfield.destroy();
    });
  }

  // =================== INPUT ===================
  setupInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D');
    this.pointerTarget = null;

    this.input.on('pointerdown', (p) => this.setPointerTarget(p));
    this.input.on('pointermove', (p) => {
      if (p.isDown) this.setPointerTarget(p);
    });
    // Po puszczeniu palca statek zostaje w miejscu (target wyzerowany).
    this.input.on('pointerup', () => {
      this.pointerTarget = null;
    });
  }

  setPointerTarget(pointer) {
    // Unosimy cel nieco nad palec, by kciuk nie zasłaniał statku.
    this.pointerTarget = {
      x: Phaser.Math.Clamp(pointer.x, 0, GAME_WIDTH),
      y: Phaser.Math.Clamp(pointer.y - 60, 0, GAME_HEIGHT),
    };
  }

  // =================== HUD ===================
  buildHud() {
    this.hud = this.add.container(0, 0).setDepth(100);

    // HP — rząd „pips" w lewym górnym rogu
    this.hpPips = [];
    for (let i = 0; i < BALANCE.player.maxHp; i++) {
      const pip = this.add.rectangle(16 + i * 16, 20, 11, 11, COLORS.hp).setOrigin(0, 0.5);
      this.hpPips.push(pip);
      this.hud.add(pip);
    }
    this.hud.add(
      this.add.text(16, 30, 'STATEK', { fontFamily: 'monospace', fontSize: '10px', color: '#6f7bb6' })
    );

    // Pasek integralności Ziemi (na dole)
    this.earthBarBg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 14, GAME_WIDTH - 24, 8, 0x14213d).setOrigin(0.5);
    this.earthBar = this.add.rectangle(13, GAME_HEIGHT - 14, GAME_WIDTH - 26, 6, COLORS.earth).setOrigin(0, 0.5);
    this.hud.add(this.earthBarBg);
    this.hud.add(this.earthBar);
    this.hud.add(
      this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT - 30, 'INTEGRALNOŚĆ ZIEMI', {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#6f7bb6',
        })
        .setOrigin(0.5)
    );

    // Wynik (prawy górny)
    this.scoreText = this.add
      .text(GAME_WIDTH - 16, 14, '0', { fontFamily: 'monospace', fontSize: '22px', color: '#ffffff' })
      .setOrigin(1, 0);
    this.hud.add(this.scoreText);

    // Komunikat fali (środek, chwilowy)
    this.waveText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, '', {
        fontFamily: 'Arial Black, sans-serif',
        fontSize: '34px',
        color: '#7fe0ff',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(101)
      .setAlpha(0);
  }

  updateHud() {
    for (let i = 0; i < this.hpPips.length; i++) {
      this.hpPips[i].setFillStyle(i < this.hp ? COLORS.hp : 0x33384a);
    }
    const frac = Phaser.Math.Clamp(this.earth / BALANCE.earth.integrity, 0, 1);
    this.earthBar.width = (GAME_WIDTH - 26) * frac;
    this.earthBar.setFillStyle(frac > 0.5 ? COLORS.earth : frac > 0.25 ? COLORS.warning : COLORS.enemy);
    this.scoreText.setText(`${this.score}`);
  }

  flashWaveText(msg, color = '#7fe0ff') {
    this.waveText.setText(msg).setColor(color).setAlpha(1).setScale(0.8);
    this.tweens.add({ targets: this.waveText, scale: 1, duration: 300, ease: 'Back.out' });
    this.tweens.add({ targets: this.waveText, alpha: 0, delay: 1100, duration: 500 });
  }

  // =================== FALE ===================
  buildWaves() {
    const col = (n) => 50 + n * ((GAME_WIDTH - 100) / 4); // 5 kolumn 0..4
    const W = [];

    // Fala 1 — zwiadowcy w rzędzie
    W.push({
      label: 'FALA 1',
      enemies: [0, 1, 2, 3, 4].map((i) => ({ kind: 'scout', x: col(i), delay: i * 350 })),
    });

    // Fala 2 — myśliwce tkające sinusoidą
    W.push({
      label: 'FALA 2',
      enemies: [0, 1, 2, 3].map((i) => ({ kind: 'fighter', x: col(i + 0.5), delay: i * 600 })),
    });

    // Fala 3 — szybcy nurkujący z naprzemiennych stron
    W.push({
      label: 'FALA 3',
      enemies: [0, 1, 2, 3, 4, 5].map((i) => ({
        kind: 'diver',
        x: i % 2 === 0 ? col(0.3) : col(3.7),
        delay: i * 450,
      })),
    });

    // Fala 4 — mieszana presja
    W.push({
      label: 'FALA 4',
      enemies: [
        { kind: 'fighter', x: col(1), delay: 0 },
        { kind: 'fighter', x: col(3), delay: 0 },
        { kind: 'scout', x: col(0), delay: 500 },
        { kind: 'scout', x: col(2), delay: 500 },
        { kind: 'scout', x: col(4), delay: 500 },
        { kind: 'diver', x: col(2), delay: 1200 },
        { kind: 'diver', x: col(1), delay: 1600 },
        { kind: 'diver', x: col(3), delay: 1600 },
      ],
    });

    // Fala 5 — MINI-BOSS: ciężki krążownik Roju + osłona
    W.push({
      label: 'KRĄŻOWNIK ROJU',
      boss: true,
      enemies: [
        { kind: 'heavy', x: GAME_WIDTH / 2, delay: 0 },
        { kind: 'scout', x: col(0), delay: 2000 },
        { kind: 'scout', x: col(4), delay: 2000 },
        { kind: 'scout', x: col(1), delay: 4000 },
        { kind: 'scout', x: col(3), delay: 4000 },
      ],
    });

    return W;
  }

  advanceWave() {
    this.currentWave++;
    if (this.currentWave >= this.waves.length) {
      this.win();
      return;
    }
    const wave = this.waves[this.currentWave];
    this.waveSpawning = true;
    this.waveTransition = false;

    this.flashWaveText(wave.label, wave.boss ? '#ff6b8b' : '#7fe0ff');

    let maxDelay = 0;
    for (const e of wave.enemies) {
      maxDelay = Math.max(maxDelay, e.delay);
      this.time.delayedCall(600 + e.delay, () => {
        if (!this.gameOver) this.spawnEnemy(e.kind, e.x);
      });
    }
    // Koniec spawnowania fali
    this.time.delayedCall(600 + maxDelay + 100, () => {
      this.waveSpawning = false;
    });
  }

  // =================== WROGOWIE ===================
  enemyStats(kind) {
    switch (kind) {
      case 'scout':
        return { tex: 'enemy_scout', hp: 1, score: 100, speed: 110, scale: 0.8 };
      case 'fighter':
        return { tex: 'enemy_fighter', hp: 2, score: 200, speed: 90, scale: 0.9 };
      case 'diver':
        return { tex: 'enemy_diver', hp: 1, score: 150, speed: 240, scale: 0.8 };
      case 'heavy':
        return { tex: 'enemy_heavy', hp: 24, score: 2000, speed: 50, scale: 1.8 };
      default:
        return { tex: 'enemy_scout', hp: 1, score: 100, speed: 110, scale: 0.8 };
    }
  }

  spawnEnemy(kind, x) {
    const s = this.enemyStats(kind);
    const e = this.physics.add.image(x, -40, s.tex).setScale(s.scale);
    e.setData('kind', kind);
    e.setData('hp', s.hp);
    e.setData('score', s.score);
    e.setData('baseX', x);
    e.setData('spawnT', this.time.now);
    e.setData('nextFire', this.time.now + Phaser.Math.Between(700, 1500));
    e.setData('maxHp', s.hp);
    e.body.setSize(e.width * 0.7, e.height * 0.7, true);
    e.setDepth(5);
    e.setAngle(180); // wrogowie skierowani „w dół", ku Ziemi
    this.enemies.add(e);

    if (kind === 'scout') {
      e.setVelocityY(s.speed);
    } else if (kind === 'diver') {
      // Lekko namierza pozycję gracza w chwili spawnu
      const dx = Phaser.Math.Clamp(this.player.x - x, -120, 120);
      e.setVelocity(dx * 0.6, s.speed);
    } else if (kind === 'fighter') {
      e.setVelocityY(s.speed);
    } else if (kind === 'heavy') {
      e.setVelocityY(s.speed);
      e.setData('phase', 'enter');
    }
  }

  updateEnemies(time) {
    const list = this.enemies.getChildren();
    for (const e of list) {
      if (!e.active) continue;
      const kind = e.getData('kind');

      if (kind === 'fighter') {
        // Tkanie sinusoidą wokół toru
        const t = (time - e.getData('spawnT')) / 1000;
        e.x = e.getData('baseX') + Math.sin(t * 2.4) * 70;
        // Sporadyczny ostrzał w dół
        if (time > e.getData('nextFire')) {
          this.enemyShoot(e, 0, 1);
          e.setData('nextFire', time + Phaser.Math.Between(1400, 2200));
        }
      } else if (kind === 'heavy') {
        // Mini-boss: wlatuje, zawisa i ostrzeliwuje wachlarzem
        if (e.getData('phase') === 'enter' && e.y >= 150) {
          e.setVelocityY(0);
          e.setData('phase', 'fight');
          e.setData('strafeDir', 1);
        }
        if (e.getData('phase') === 'fight') {
          // Powolny ruch na boki
          if (e.x > GAME_WIDTH - 80) e.setData('strafeDir', -1);
          if (e.x < 80) e.setData('strafeDir', 1);
          e.setVelocityX(70 * e.getData('strafeDir'));
          if (time > e.getData('nextFire')) {
            this.enemyShoot(e, -0.4, 1);
            this.enemyShoot(e, 0, 1);
            this.enemyShoot(e, 0.4, 1);
            e.setData('nextFire', time + 1100);
          }
        }
      }

      // Ucieczka dołem ekranu → uszkodzenie Ziemi
      if (e.y > GAME_HEIGHT + 50) {
        this.damageEarth(kind === 'heavy' ? 0 : 1);
        e.destroy();
      }
    }
  }

  enemyShoot(enemy, dirX, dirY) {
    if (this.gameOver) return;
    const b = this.physics.add.image(enemy.x, enemy.y + 20, 'bullet_enemy');
    this.enemyBullets.add(b);
    const speed = 260;
    b.setVelocity(dirX * speed, dirY * speed);
    b.setDepth(4);
    b.body.setSize(b.width * 0.6, b.height * 0.6, true);
  }

  // =================== STRZELANIE GRACZA ===================
  fire(time) {
    if (time < this.nextFire || this.gameOver) return;
    const delay = time < this.boostUntil ? BALANCE.player.boostFireDelay : this.fireDelay;
    this.nextFire = time + delay;

    const shoot = (offsetX) => {
      const b = this.physics.add.image(this.player.x + offsetX, this.player.y - 26, 'bullet_player');
      this.playerBullets.add(b);
      b.setVelocityY(-BALANCE.player.bulletSpeed);
      b.setDepth(4);
    };

    if (time < this.boostUntil) {
      // Boost: potrójny strzał
      shoot(-12);
      shoot(0);
      shoot(12);
    } else {
      shoot(0);
    }
  }

  // =================== KOLIZJE / OBRAŻENIA ===================
  hitEnemy(bullet, enemy) {
    if (!bullet.active || !enemy.active) return;
    bullet.destroy();
    const hp = enemy.getData('hp') - BALANCE.bullet.damage;
    enemy.setData('hp', hp);
    // Mignięcie trafienia
    enemy.setTintFill(0xffffff);
    this.time.delayedCall(60, () => enemy.active && enemy.clearTint());

    if (hp <= 0) {
      this.destroyEnemy(enemy);
    }
  }

  destroyEnemy(enemy) {
    const score = enemy.getData('score') || 100;
    this.combo = Math.min(this.combo + 1, 20);
    const gained = score + this.combo * 5;
    this.score += gained;
    this.explode(enemy.x, enemy.y, COLORS.enemy, enemy.getData('kind') === 'heavy' ? 2 : 1);

    // Szansa na power-up
    if (Math.random() < BALANCE.powerupDropChance) {
      this.spawnPowerup(enemy.x, enemy.y);
    }
    enemy.destroy();
  }

  hitMeteor(bullet, meteor) {
    if (!bullet.active || !meteor.active) return;
    bullet.destroy();
    const hp = meteor.getData('hp') - 1;
    meteor.setData('hp', hp);
    meteor.setTintFill(0xffffff);
    this.time.delayedCall(60, () => meteor.active && meteor.clearTint());
    if (hp <= 0) {
      this.score += 50;
      this.explode(meteor.x, meteor.y, 0xb8a07a, 1);
      meteor.destroy();
    }
  }

  playerHitByEnemy(_player, enemy) {
    if (!enemy.active) return;
    this.explode(enemy.x, enemy.y, COLORS.enemy, 1);
    enemy.destroy();
    this.damagePlayer();
  }

  playerHitByBullet(_player, bullet) {
    if (!bullet.active) return;
    bullet.destroy();
    this.damagePlayer();
  }

  playerHitByMeteor(_player, meteor) {
    if (!meteor.active) return;
    this.explode(meteor.x, meteor.y, 0xb8a07a, 1);
    meteor.destroy();
    this.damagePlayer();
  }

  damagePlayer() {
    if (this.time.now < this.invulnUntil || this.gameOver) return;
    this.hp -= 1;
    this.combo = 0;
    this.invulnUntil = this.time.now + BALANCE.player.invulnAfterHit;
    this.cameras.main.shake(180, 0.012);
    this.explode(this.player.x, this.player.y, COLORS.accent, 1);
    this.updateHud();

    if (this.hp <= 0) {
      this.lose('STATEK ZNISZCZONY');
      return;
    }
    // Miganie nietykalności
    this.tweens.add({
      targets: this.player,
      alpha: 0.3,
      duration: 120,
      yoyo: true,
      repeat: 6,
      onComplete: () => this.player.setAlpha(1),
    });
  }

  damageEarth(amount) {
    if (amount <= 0 || this.gameOver) return;
    this.earth -= amount;
    this.combo = 0;
    this.cameras.main.flash(120, 80, 30, 60);
    this.updateHud();
    if (this.earth <= 0) {
      this.lose('ZIEMIA UPADŁA');
    }
  }

  // =================== POWER-UPY ===================
  spawnPowerup(x, y) {
    const types = ['health', 'boost', 'shield'];
    const type = Phaser.Utils.Array.GetRandom(types);
    const tex = { health: 'pw_health', boost: 'pw_boost', shield: 'pw_shield' }[type];
    const p = this.physics.add.image(x, y, tex).setScale(0.7);
    p.setData('type', type);
    p.setVelocityY(90);
    p.setDepth(6);
    const tint = { health: COLORS.hp, boost: COLORS.warning, shield: COLORS.accent }[type];
    p.setTint(tint);
    this.powerups.add(p);
    this.tweens.add({ targets: p, angle: 360, duration: 2000, repeat: -1 });
  }

  collectPowerup(_player, p) {
    if (!p.active) return;
    const type = p.getData('type');
    p.destroy();
    if (type === 'health') {
      this.hp = Math.min(this.hp + 1, BALANCE.player.maxHp);
      this.flashWaveText('+ NAPRAWA', '#4dff9e');
    } else if (type === 'boost') {
      this.boostUntil = this.time.now + BALANCE.player.boostDuration;
      this.flashWaveText('POTRÓJNY OGIEŃ', '#ffcc4d');
    } else if (type === 'shield') {
      this.invulnUntil = this.time.now + 3000;
      this.flashWaveText('TARCZA', '#7fe0ff');
      this.tweens.add({ targets: this.player, alpha: 0.5, duration: 200, yoyo: true, repeat: 6 });
    }
    this.updateHud();
  }

  // =================== METEORY ===================
  spawnMeteor() {
    if (this.gameOver) return;
    const big = Math.random() < 0.5;
    const tex = big ? `meteor_${Phaser.Math.Between(0, 1)}` : `meteor_${Phaser.Math.Between(2, 3)}`;
    const x = Phaser.Math.Between(30, GAME_WIDTH - 30);
    const m = this.physics.add.image(x, -40, tex);
    m.setData('hp', big ? 3 : 1);
    m.setVelocity(Phaser.Math.Between(-30, 30), Phaser.Math.Between(70, 130));
    m.setAngularVelocity(Phaser.Math.Between(-60, 60));
    m.setDepth(3);
    m.body.setSize(m.width * 0.7, m.height * 0.7, true);
    this.meteors.add(m);
  }

  // =================== EFEKTY ===================
  explode(x, y, color, scale = 1) {
    const emitter = this.add.particles(x, y, 'spark', {
      speed: { min: 60, max: 220 * scale },
      lifespan: 420,
      scale: { start: 0.9 * scale, end: 0 },
      quantity: 14,
      tint: color,
      blendMode: 'ADD',
      emitting: false,
    });
    emitter.explode(14);
    this.time.delayedCall(500, () => emitter.destroy());

    // Błysk
    const flash = this.add.image(x, y, 'fx_yellow').setTint(color).setScale(scale).setAlpha(0.9).setDepth(8);
    this.tweens.add({
      targets: flash,
      scale: scale * 2,
      alpha: 0,
      duration: 250,
      onComplete: () => flash.destroy(),
    });
  }

  // =================== KONIEC GRY ===================
  win() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.endGame(true, 'SEKTOR OCZYSZCZONY');
  }

  lose(reason) {
    if (this.gameOver) return;
    this.gameOver = true;
    this.endGame(false, reason);
  }

  endGame(win, reason) {
    this.meteorTimer.remove();
    this.physics.pause();
    if (this.engine) this.engine.stop();

    // Zapis rekordu
    const best = Number(localStorage.getItem('ot_best') || 0);
    if (this.score > best) localStorage.setItem('ot_best', String(this.score));

    this.time.delayedCall(900, () => {
      this.scene.start('Result', {
        win,
        reason,
        score: this.score,
        earth: this.earth,
        maxEarth: BALANCE.earth.integrity,
      });
    });
  }

  // =================== PĘTLA ===================
  update(time, delta) {
    this.starfield.update(delta);
    if (this.gameOver) return;

    // --- Ruch gracza ---
    const speed = BALANCE.player.speed;
    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const up = this.cursors.up.isDown || this.keys.W.isDown;
    const down = this.cursors.down.isDown || this.keys.S.isDown;

    if (left || right || up || down) {
      this.player.setVelocity((right - left) * speed, (down - up) * speed);
      this.pointerTarget = null; // klawiatura ma pierwszeństwo
    } else if (this.pointerTarget) {
      // Płynne podążanie za palcem/myszą z ograniczeniem prędkości
      const dx = this.pointerTarget.x - this.player.x;
      const dy = this.pointerTarget.y - this.player.y;
      const vx = Phaser.Math.Clamp(dx * 12, -900, 900);
      const vy = Phaser.Math.Clamp(dy * 12, -900, 900);
      this.player.setVelocity(vx, vy);
    } else {
      this.player.setVelocity(0, 0);
    }

    // --- Auto-ogień (wygodny na mobile i desktop) ---
    this.fire(time);

    // --- Zachowania wrogów ---
    this.updateEnemies(time);

    // --- Czyszczenie obiektów poza ekranem ---
    this.cleanup(this.playerBullets, (b) => b.y < -30);
    this.cleanup(this.enemyBullets, (b) => b.y > GAME_HEIGHT + 30 || b.x < -30 || b.x > GAME_WIDTH + 30);
    this.cleanup(this.meteors, (m) => m.y > GAME_HEIGHT + 60);
    this.cleanup(this.powerups, (p) => p.y > GAME_HEIGHT + 30);

    this.updateHud();

    // --- Przejście do następnej fali ---
    if (!this.waveSpawning && !this.waveTransition && this.enemies.countActive(true) === 0) {
      this.waveTransition = true;
      this.time.delayedCall(1200, () => this.advanceWave());
    }
  }

  cleanup(group, predicate) {
    for (const obj of group.getChildren()) {
      if (obj.active && predicate(obj)) obj.destroy();
    }
  }
}
