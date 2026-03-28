export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'monkey-idle');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.play('monkey-idle');
  }

  update(cursors) {
    const onGround = this.body.blocked.down;

    // Horizontal movement
    if (cursors.left.isDown) {
      this.setVelocityX(-260);
      this.setFlipX(true);
    } else if (cursors.right.isDown) {
      this.setVelocityX(260);
      this.setFlipX(false);
    } else {
      this.setVelocityX(0);
    }

    // Jump
    if (Phaser.Input.Keyboard.JustDown(cursors.up) && onGround) {
      this.setVelocityY(-480);
    }

    this._updateAnimation(onGround);
  }

  _updateAnimation(onGround) {
    const vy = this.body.velocity.y;
    const vx = this.body.velocity.x;

    let next;
    if (!onGround && vy < -10) {
      next = 'monkey-jump';
    } else if (!onGround && vy > 10) {
      next = 'monkey-fall';
    } else if (Math.abs(vx) > 10) {
      next = 'monkey-run';
    } else {
      next = 'monkey-idle';
    }

    if (this.anims.currentAnim?.key !== next) {
      this.play(next);
    }
  }
}
