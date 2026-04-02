export default class GameOver extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  create(data) {
    const { width, height } = this.scale;
    const level = data?.level ?? 1;

    this.add.text(width / 2, height / 3, 'Game Over', {
      fontSize: '64px',
      color: '#ff4444',
    }).setOrigin(0.5);

    const levelLabel = level > 1 ? ` (Level ${level})` : '';
    this.add.text(width / 2, height / 2 - 20, `Height reached: ${data.depth ?? 0}m${levelLabel}`, {
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5);

    const restartText = this.add.text(width / 2, height / 2 + 40, 'Press SPACE to Restart', {
      fontSize: '24px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: restartText,
      alpha: 0,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('Game', { level });
    });
  }
}
