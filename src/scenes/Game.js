import Player from '../entities/Player.js';

const WORLD_WIDTH = 480;
const WORLD_HEIGHT = 8000;
const TRUNK_X = WORLD_WIDTH / 2;
const TRUNK_WIDTH = 50;
const MARGIN = 40;
const GROUND_Y = WORLD_HEIGHT - 120;

const BREAK_WARN_MS  = 1500; // orange flash starts here
const BREAK_TOTAL_MS = 2000; // physics disabled here

export default class Game extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Background — blue sky gradient (deep blue at top, light blue at bottom)
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x1565c0, 0x1565c0, 0x87ceeb, 0x87ceeb, 1);
    sky.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Clouds — scattered throughout the world, behind the trunk
    this._spawnClouds();

    // Tree trunk — bark texture tiled vertically
    this.add.tileSprite(TRUNK_X, WORLD_HEIGHT / 2, TRUNK_WIDTH, WORLD_HEIGHT, 'bark');

    // Branches
    this.platforms = this.physics.add.staticGroup();
    this.spawnBranches();

    // Player starts at the base
    this.player = new Player(this, TRUNK_X, GROUND_Y - 30);
    this.player.setCollideWorldBounds(true);

    // One-way collider — also records which platform the player is standing on.
    // The callback fires during the physics step (preUpdate), so by the time
    // update() runs, activePlatform is already set for this frame.
    this.activePlatform = null;
    this.prevPlatform = null;
    this.airFrames = 0;
    this.physics.add.collider(
      this.player,
      this.platforms,
      (_player, platform) => { this.activePlatform = platform; },
      (_player, platform) => !platform.getData('breaking') && _player.body.velocity.y >= 0,
      this,
    );

    // Camera
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 1, 0.12);

    // HUD
    const hudStyle = { fontSize: '18px', color: '#ffffff', stroke: '#000000', strokeThickness: 3 };
    this.currentHeightText = this.add.text(10, 10, 'Current: 0m', hudStyle)
      .setScrollFactor(0).setDepth(10);
    this.maxHeightText = this.add.text(10, 34, 'Best: 0m', hudStyle)
      .setScrollFactor(0).setDepth(10);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.mobileInput = { left: false, right: false, jumpJustPressed: false };
    this._createMobileButtons();
    this._createPauseButton();
    this.maxHeight = 0;
    this._paused = false;
  }

  _createMobileButtons() {
    const { width, height } = this.scale;
    const btnAlpha = 0.55;
    const btnRadius = 35;
    const margin = 20;
    const y = height - margin - btnRadius;

    const makeBtn = (x, label) => {
      const bg = this.add.circle(x, y, btnRadius, 0x000000, btnAlpha)
        .setScrollFactor(0).setDepth(20).setInteractive();
      this.add.text(x, y, label, { fontSize: '26px', color: '#ffffff' })
        .setOrigin(0.5).setScrollFactor(0).setDepth(21);
      return bg;
    };

    const leftBtn  = makeBtn(margin + btnRadius, '◀');
    const rightBtn = makeBtn(margin + btnRadius * 3 + 10, '▶');
    const jumpBtn  = makeBtn(width - margin - btnRadius, '▲');

    leftBtn.on('pointerdown',  () => { this.mobileInput.left = true; });
    leftBtn.on('pointerup',   () => { this.mobileInput.left = false; });
    leftBtn.on('pointerout',  () => { this.mobileInput.left = false; });

    rightBtn.on('pointerdown', () => { this.mobileInput.right = true; });
    rightBtn.on('pointerup',  () => { this.mobileInput.right = false; });
    rightBtn.on('pointerout', () => { this.mobileInput.right = false; });

    jumpBtn.on('pointerdown',  () => { this.mobileInput.jumpJustPressed = true; });
  }

  // ── Pause ────────────────────────────────────────────────────────────────

  _createPauseButton() {
    const { width, height } = this.scale;

    // Overlay shown while paused
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.45)
      .setScrollFactor(0).setDepth(25).setVisible(false);
    const pauseLabel = this.add.text(width / 2, height / 2, 'PAUSED', {
      fontSize: '48px', color: '#ffffff', stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(26).setVisible(false);

    // Pause button — top-right corner, above the overlay
    const bx = width - 30;
    const by = 30;
    const btn = this.add.circle(bx, by, 22, 0x000000, 0.55)
      .setScrollFactor(0).setDepth(27).setInteractive({ useHandCursor: true });
    const icon = this.add.text(bx, by, '❚❚', { fontSize: '14px', color: '#ffffff' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(28);

    const toggle = () => {
      this._paused = !this._paused;
      if (this._paused) {
        this.physics.pause();
        this.tweens.pauseAll();
        this.time.paused = true;
        icon.setText('▶');
        overlay.setVisible(true);
        pauseLabel.setVisible(true);
      } else {
        this.physics.resume();
        this.tweens.resumeAll();
        this.time.paused = false;
        icon.setText('❚❚');
        overlay.setVisible(false);
        pauseLabel.setVisible(false);
      }
    };

    btn.on('pointerdown', toggle);
    this.input.keyboard.on('keydown-ESC', toggle);
  }

  // ── Cloud generation ─────────────────────────────────────────────────────

  _spawnClouds() {
    const rng = new Phaser.Math.RandomDataGenerator(['monkey-clouds']);
    for (let i = 0; i < 40; i++) {
      const x     = rng.integerInRange(0, WORLD_WIDTH);
      const y     = rng.integerInRange(0, WORLD_HEIGHT - 400);
      const scale = rng.realInRange(0.5, 1.5);
      const alpha = rng.realInRange(0.6, 1.0);
      this.add.image(x, y, 'cloud').setScale(scale).setAlpha(alpha);
    }
  }

  // ── Branch generation ────────────────────────────────────────────────────

  spawnBranches() {
    const rng = new Phaser.Math.RandomDataGenerator(['monkey-jump']);

    // Wide ground platform — never breaks
    this.addBranch(TRUNK_X, GROUND_Y, WORLD_WIDTH - MARGIN * 2, false);

    let y = GROUND_Y;
    let side = 1;

    while (y > 400) {
      y -= rng.integerInRange(136, 187);
      const width = rng.integerInRange(80, 140);

      if (rng.integerInRange(0, 7) === 0) {
        this.addBranch(TRUNK_X, y, WORLD_WIDTH - MARGIN * 2);
      } else {
        this.addBranch(this.branchX(side, width), y, width);
        side *= -1;
      }
    }
  }

  branchX(side, width) {
    const halfWidth = width / 2;
    const halfTrunk = TRUNK_WIDTH / 2;
    // Anchor the inner end of each branch to the trunk edge
    if (side === 1) {
      return TRUNK_X + halfTrunk + halfWidth;
    } else {
      return TRUNK_X - halfTrunk - halfWidth;
    }
  }

  addBranch(x, y, width, breakable = true) {
    const b = this.platforms.create(x, y, 'branch-tile')
      .setDisplaySize(width, 18)
      .refreshBody();
    b.setData('breakable', breakable);
    b.setData('standTime', 0);
    if (breakable) {
      b.setData('leaves', this._addBranchLeaves(x, y, width));
    }
    return b;
  }

  _addBranchLeaves(x, y, width) {
    const leaves = [];
    const add = (lx, ly, flipX = false, scale = 1) => {
      leaves.push(
        this.add.image(lx, ly, 'leaf-cluster')
          .setFlipX(flipX).setScale(scale).setDepth(1),
      );
    };

    if (x > TRUNK_X + 5) {
      // Right branch — tuft at outer (right) tip
      const tip = x + width / 2;
      add(tip - 10, y - 14);
      if (width > 90) add(tip - 36, y - 10, false, 0.75);
    } else if (x < TRUNK_X - 5) {
      // Left branch — tuft at outer (left) tip
      const tip = x - width / 2;
      add(tip + 10, y - 14, true);
      if (width > 90) add(tip + 36, y - 10, true, 0.75);
    } else {
      // Full-width branch — tufts on both ends
      add(x + width / 2 - 10, y - 12);
      add(x - width / 2 + 10, y - 12, true);
    }
    return leaves;
  }

  // ── Breaking logic ───────────────────────────────────────────────────────

  _handleBranchTimer(delta) {
    const platform = this.activePlatform;
    if (!platform || !platform.getData('breakable')) return;
    if (platform.getData('breaking')) return;

    const elapsed = platform.getData('standTime') + delta;
    platform.setData('standTime', elapsed);

    // Warning: tint orange and flash
    if (elapsed >= BREAK_WARN_MS && !platform.getData('warning')) {
      platform.setData('warning', true);
      platform.setTint(0xff6600);
      this.tweens.add({
        targets: platform,
        alpha: 0.35,
        duration: 120,
        yoyo: true,
        repeat: -1,
      });
    }

    if (elapsed >= BREAK_TOTAL_MS) {
      this._breakBranch(platform);
    }
  }

  _resetBranchTimer(platform) {
    if (!platform || !platform.getData('breakable')) return;
    if (platform.getData('breaking')) return;
    platform.setData('standTime', 0);
    platform.setData('warning', false);
    this.tweens.killTweensOf(platform);
    platform.setAlpha(1);
    platform.clearTint();
  }

  _breakBranch(platform) {
    platform.setData('breaking', true);
    this.tweens.killTweensOf(platform);

    const { x, y, displayWidth } = platform;
    const leaves = platform.getData('leaves') || [];

    // Disable physics immediately so the player starts falling right away
    platform.body.enable = false;

    // Fade out branch and leaves together, then schedule regrowth
    this.tweens.add({
      targets: [platform, ...leaves],
      alpha: 0,
      duration: 250,
      ease: 'Power2',
      onComplete: () => {
        platform.destroy();
        leaves.forEach(l => l.destroy());
        this.time.delayedCall(5000, () => this._regrowBranch(x, y, displayWidth));
      },
    });
  }

  _regrowBranch(x, y, width) {
    const b = this.addBranch(x, y, width);
    const leaves = b.getData('leaves') || [];
    [b, ...leaves].forEach(obj => obj.setAlpha(0));
    this.tweens.add({
      targets: [b, ...leaves],
      alpha: 1,
      duration: 600,
      ease: 'Power2',
    });
  }

  // ── Main loop ────────────────────────────────────────────────────────────

  update(_time, delta) {
    if (this._paused) return;

    this.player.update(this.cursors, this.mobileInput);

    this._handleBranchTimer(delta);

    const height = Math.max(0, GROUND_Y - this.player.y);
    if (height > this.maxHeight) this.maxHeight = height;
    this.currentHeightText.setText(`Current: ${Math.floor(height / 10)}m`);
    this.maxHeightText.setText(`Best: ${Math.floor(this.maxHeight / 10)}m`);

    if (this.player.y > WORLD_HEIGHT - 20) {
      this.scene.start('GameOver', { depth: Math.floor(this.maxHeight / 10) });
    }

    // Reset timer only after 3 consecutive frames off the platform, to avoid
    // spurious resets from single-frame collider misses.
    if (this.activePlatform !== null) {
      this.prevPlatform = this.activePlatform;
      this.airFrames = 0;
    } else if (this.prevPlatform) {
      this.airFrames++;
      if (this.airFrames === 3) {
        this._resetBranchTimer(this.prevPlatform);
      }
    }

    // Clear each frame — re-set by the collider callback during next physics step
    this.activePlatform = null;
  }
}
