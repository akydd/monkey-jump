export default class MainMenu extends Phaser.Scene {
  constructor() {
    super('MainMenu');
  }

  create() {
    const { width, height } = this.scale;

    // Sky gradient background
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x1565c0, 0x1565c0, 0x87ceeb, 0x87ceeb, 1);
    sky.fillRect(0, 0, width, height);

    // Clouds
    const rng = new Phaser.Math.RandomDataGenerator(['monkey-menu-clouds']);
    for (let i = 0; i < 8; i++) {
      const cx    = rng.integerInRange(0, width);
      const cy    = rng.integerInRange(0, height);
      const scale = rng.realInRange(0.4, 1.1);
      const alpha = rng.realInRange(0.6, 1.0);
      this.add.image(cx, cy, 'cloud').setScale(scale).setAlpha(alpha);
    }

    this.add.text(width / 2, height / 3, 'Monkey Jump', {
      fontSize: '48px',
      color: '#ffffff',
    }).setOrigin(0.5);

    const button = this.add.text(width / 2, height / 2 + 60, 'Tap to Start', {
      fontSize: '28px',
      color: '#ffffff',
      backgroundColor: '#226622',
      padding: { x: 24, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: button,
      alpha: 0.6,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    const startGame = () => this.scene.start('Game');
    button.once('pointerdown', startGame);
    this.input.keyboard.once('keydown-SPACE', startGame);
  }
}
