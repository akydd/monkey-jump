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

    const startText = this.add.text(width / 2, height / 2 + 60, 'Press SPACE to Start', {
      fontSize: '24px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: startText,
      alpha: 0,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('Game');
    });
  }
}
