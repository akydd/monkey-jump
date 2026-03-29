export default class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    this._generateTextures();
    this._defineAnimations();
    this.scene.start('Preloader');
  }

  // ── Texture generation ───────────────────────────────────────────────────

  _generateTextures() {
    // 1×1 white pixel — stretched to make branch rectangles
    const pg = this.make.graphics({ add: false });
    pg.fillStyle(0xffffff);
    pg.fillRect(0, 0, 1, 1);
    pg.generateTexture('pixel', 1, 1);
    pg.destroy();

    // 50×64 bark tile — tiled vertically on the trunk
    const bg = this.make.graphics({ add: false });
    const TW = 50, TH = 64;
    // Base
    bg.fillStyle(0x3d1c00);
    bg.fillRect(0, 0, TW, TH);
    // Vertical grain streaks
    const grainColors = [0x5a2b0a, 0x4a2208, 0x6b3310, 0x2e1500];
    const grainXs = [6, 17, 29, 38, 45];
    for (let i = 0; i < grainXs.length; i++) {
      bg.lineStyle(i % 2 === 0 ? 2 : 1, grainColors[i % grainColors.length], 0.8);
      bg.beginPath();
      bg.moveTo(grainXs[i], 0);
      // Slight horizontal waver every 16px
      for (let y = 0; y <= TH; y += 16) {
        bg.lineTo(grainXs[i] + (i % 3 === 0 ? 1 : -1) * (y % 32 < 16 ? 1 : 0), y);
      }
      bg.strokePath();
    }
    // Horizontal crack lines
    for (const [cy, w] of [[18, 28], [42, 20]]) {
      bg.lineStyle(1, 0x1e0a00, 0.9);
      bg.beginPath();
      bg.moveTo(8, cy);
      bg.lineTo(8 + w, cy);
      bg.strokePath();
    }
    bg.generateTexture('bark', TW, TH);
    bg.destroy();

    // 128×64 fluffy cloud
    const cloudG = this.make.graphics({ add: false });
    cloudG.fillStyle(0xffffff, 1);
    cloudG.fillEllipse(40, 44, 64, 36);
    cloudG.fillEllipse(76, 46, 56, 32);
    cloudG.fillEllipse(104, 42, 48, 30);
    cloudG.fillEllipse(46, 28, 52, 40);
    cloudG.fillEllipse(74, 22, 58, 44);
    cloudG.fillEllipse(102, 30, 44, 36);
    cloudG.fillEllipse(68, 10, 40, 30);
    cloudG.generateTexture('cloud', 128, 64);
    cloudG.destroy();

    // 32×18 branch tile — tiled horizontally on each branch
    const branchG = this.make.graphics({ add: false });
    branchG.fillStyle(0x7a3d0e);
    branchG.fillRect(0, 0, 32, 18);
    // Top shadow
    branchG.fillStyle(0x4a2208);
    branchG.fillRect(0, 0, 32, 2);
    // Bottom shadow
    branchG.fillStyle(0x3a1a06);
    branchG.fillRect(0, 16, 32, 2);
    // Highlight ridge
    branchG.fillStyle(0xa05a22);
    branchG.fillRect(0, 5, 32, 4);
    // Vertical grain marks
    branchG.lineStyle(1, 0x5a2d0a, 0.7);
    for (const gx of [8, 18, 27]) {
      branchG.beginPath();
      branchG.moveTo(gx, 2);
      branchG.lineTo(gx + 2, 16);
      branchG.strokePath();
    }
    branchG.generateTexture('branch-tile', 32, 18);
    branchG.destroy();

    // 48×32 leaf cluster — placed at branch tips
    const leafG = this.make.graphics({ add: false });
    leafG.fillStyle(0x1a5e1a);
    leafG.fillEllipse(24, 20, 38, 26);
    leafG.fillStyle(0x2e7d32);
    leafG.fillEllipse(16, 16, 24, 20);
    leafG.fillStyle(0x388e3c);
    leafG.fillEllipse(30, 14, 22, 18);
    leafG.fillStyle(0x43a047);
    leafG.fillEllipse(22, 10, 20, 14);
    leafG.fillStyle(0x4caf50);
    leafG.fillEllipse(28, 8, 14, 10);
    leafG.fillStyle(0x66bb6a);
    leafG.fillEllipse(20, 6, 10, 8);
    leafG.generateTexture('leaf-cluster', 48, 32);
    leafG.destroy();

    // One 40×52 texture per monkey pose
    for (const pose of ['idle', 'run1', 'run2', 'jump', 'fall']) {
      const g = this.make.graphics({ add: false });
      this._drawMonkey(g, pose);
      g.generateTexture(`monkey-${pose}`, 40, 52);
      g.destroy();
    }
  }

  /**
   * Draws a monkey into the given Graphics object.
   * Coordinate space: 40×52, origin top-left.
   *
   * Anatomy anchors:
   *   Head centre   (20, 14)  r = 13
   *   Body centre   (20, 37)  22×20
   *   Shoulders     (12, 30) / (28, 30)
   *   Hips          (16, 47) / (24, 47)
   */
  _drawMonkey(g, pose) {
    const DARK  = 0x7B3F00;   // dark brown — outline / head / ears
    const MID   = 0xC68642;   // mid brown  — body
    const FACE  = 0xDEB887;   // burlywood  — face oval
    const SNOUT = 0xFFDEAD;   // navajowhite
    const PINK  = 0xFFB6C1;   // inner ear

    // Tail (drawn first so body covers the base)
    // Approximated as a polyline — Phaser 3 Graphics has no bezierCurveTo
    g.lineStyle(4, DARK, 1);
    g.beginPath();
    for (const [x, y] of [[28, 43], [31, 47], [35, 46], [37, 41], [36, 35], [32, 28]]) {
      g.lineTo(x, y);
    }
    g.strokePath();

    // Arms
    g.lineStyle(5, DARK, 1);
    switch (pose) {
      case 'idle':
        this._seg(g, 12, 30,  6, 45);
        this._seg(g, 28, 30, 34, 45);
        break;
      case 'run1':
        this._seg(g, 12, 30,  3, 21);   // left arm forward-up
        this._seg(g, 28, 30, 37, 37);   // right arm back-down
        break;
      case 'run2':
        this._seg(g, 12, 30,  3, 37);   // left arm back-down
        this._seg(g, 28, 30, 37, 21);   // right arm forward-up
        break;
      case 'jump':
        this._seg(g, 12, 30,  5, 17);   // both arms raised
        this._seg(g, 28, 30, 35, 17);
        break;
      case 'fall':
        this._seg(g, 12, 30,  1, 30);   // arms spread wide
        this._seg(g, 28, 30, 39, 30);
        break;
    }

    // Legs
    g.lineStyle(6, DARK, 1);
    switch (pose) {
      case 'idle':
        this._seg(g, 16, 47, 12, 52);
        this._seg(g, 24, 47, 28, 52);
        break;
      case 'run1':
        this._seg(g, 16, 47,  6, 52);   // left leg forward
        this._seg(g, 24, 47, 31, 41);   // right leg back/up
        break;
      case 'run2':
        this._seg(g, 16, 47,  9, 41);   // left leg back/up
        this._seg(g, 24, 47, 34, 52);   // right leg forward
        break;
      case 'jump':
        this._seg(g, 16, 47, 11, 41);   // legs tucked up
        this._seg(g, 24, 47, 29, 41);
        break;
      case 'fall':
        this._seg(g, 16, 47, 12, 52);   // legs dangling
        this._seg(g, 24, 47, 28, 52);
        break;
    }

    // Body
    g.fillStyle(MID);
    g.fillEllipse(20, 37, 22, 20);

    // Ears
    g.fillStyle(DARK);
    g.fillCircle(8, 9, 6);
    g.fillCircle(32, 9, 6);
    g.fillStyle(PINK);
    g.fillCircle(8, 9, 3);
    g.fillCircle(32, 9, 3);

    // Head
    g.fillStyle(DARK);
    g.fillCircle(20, 14, 13);

    // Face oval
    g.fillStyle(FACE);
    g.fillEllipse(20, 17, 14, 11);

    // Eyes — white + dark pupil + shine
    g.fillStyle(0xffffff);
    g.fillCircle(15, 12, 3);
    g.fillCircle(25, 12, 3);
    g.fillStyle(0x1a1a2e);
    g.fillCircle(15.5, 12, 1.8);
    g.fillCircle(25.5, 12, 1.8);
    g.fillStyle(0xffffff);
    g.fillCircle(16.3, 11, 0.7);
    g.fillCircle(26.3, 11, 0.7);

    // Snout
    g.fillStyle(SNOUT);
    g.fillEllipse(20, 21, 10, 6);

    // Nostrils
    g.fillStyle(0x5c2d0e);
    g.fillCircle(18.5, 21, 1);
    g.fillCircle(21.5, 21, 1);

    // Mouth — varies by pose
    switch (pose) {
      case 'jump':
        // Surprised "O"
        g.fillStyle(0x5c2d0e);
        g.fillEllipse(20, 24.5, 4, 3);
        break;
      case 'run1':
      case 'run2':
        // Open grin
        g.fillStyle(0x5c2d0e);
        g.fillEllipse(20, 24, 5, 3);
        break;
      default:
        // Calm smile
        g.lineStyle(2, 0x5c2d0e, 1);
        g.beginPath();
        g.arc(20, 22, 2.5, 0, Math.PI);
        g.strokePath();
        break;
    }
  }

  /** Draw a line segment using the current lineStyle. */
  _seg(g, x1, y1, x2, y2) {
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.strokePath();
  }

  // ── Animation definitions ─────────────────────────────────────────────────

  _defineAnimations() {
    this.anims.create({
      key: 'monkey-idle',
      frames: [{ key: 'monkey-idle' }],
      frameRate: 1,
      repeat: -1,
    });

    this.anims.create({
      key: 'monkey-run',
      frames: [
        { key: 'monkey-run1' },
        { key: 'monkey-run2' },
      ],
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: 'monkey-jump',
      frames: [{ key: 'monkey-jump' }],
      frameRate: 1,
      repeat: -1,
    });

    this.anims.create({
      key: 'monkey-fall',
      frames: [{ key: 'monkey-fall' }],
      frameRate: 1,
      repeat: -1,
    });
  }
}
