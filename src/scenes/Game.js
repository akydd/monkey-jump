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

    // Background — dark forest
    this.add.rectangle(TRUNK_X, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, 0x0a1a0a);

    // Tree trunk
    this.add.rectangle(TRUNK_X, WORLD_HEIGHT / 2, TRUNK_WIDTH, WORLD_HEIGHT, 0x3d1c00);

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
    this.heightText = this.add.text(10, 10, 'Height: 0m', {
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setScrollFactor(0).setDepth(10);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.mobileInput = { left: false, right: false, jumpJustPressed: false };
    this._createMobileButtons();
    this.maxHeight = 0;
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
    const b = this.platforms.create(x, y, 'pixel')
      .setDisplaySize(width, 18)
      .setTint(0x6b3a2a)
      .refreshBody();
    b.setData('breakable', breakable);
    b.setData('standTime', 0);
    return b;
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
    platform.setTint(0x6b3a2a);
  }

  _breakBranch(platform) {
    platform.setData('breaking', true);
    this.tweens.killTweensOf(platform);

    // Disable physics immediately so the player starts falling right away
    platform.body.enable = false;

    // Visual fade-out
    this.tweens.add({
      targets: platform,
      alpha: 0,
      duration: 250,
      ease: 'Power2',
      onComplete: () => platform.destroy(),
    });
  }

  // ── Main loop ────────────────────────────────────────────────────────────

  update(_time, delta) {
    this.player.update(this.cursors, this.mobileInput);

    this._handleBranchTimer(delta);

    const height = Math.max(0, GROUND_Y - this.player.y);
    if (height > this.maxHeight) this.maxHeight = height;
    this.heightText.setText(`Height: ${Math.floor(this.maxHeight / 10)}m`);

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
