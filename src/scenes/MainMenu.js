export default class MainMenu extends Phaser.Scene {
  constructor() {
    super('MainMenu');
  }

  create() {
    const { width, height } = this.scale;

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
