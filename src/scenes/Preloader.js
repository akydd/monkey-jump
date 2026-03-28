export default class Preloader extends Phaser.Scene {
  constructor() {
    super('Preloader');
  }

  preload() {
    const { width, height } = this.scale;

    // Loading bar
    const bar = this.add.rectangle(width / 2, height / 2, 0, 24, 0xffffff);
    const outline = this.add.rectangle(width / 2, height / 2, 320, 32).setStrokeStyle(2, 0xffffff);

    this.load.on('progress', (progress) => {
      bar.width = 312 * progress;
    });

    // Load all game assets here
  }

  create() {
    this.scene.start('MainMenu');
  }
}
