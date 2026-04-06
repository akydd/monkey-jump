export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'monkey-idle');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.play('monkey-idle');
  }

  update(cursors, mobileInput = {}) {
    const onGround = this.body.blocked.down;

    // Horizontal movement
    if (cursors.left.isDown || mobileInput.left) {
      this.setVelocityX(-260);
      this.setFlipX(true);
    } else if (cursors.right.isDown || mobileInput.right) {
      this.setVelocityX(260);
      this.setFlipX(false);
    } else {
      this.setVelocityX(0);
    }

    // Jump — consume the one-shot mobile flag immediately
    const jumpPressed = Phaser.Input.Keyboard.JustDown(cursors.up) || mobileInput.jumpJustPressed;
    mobileInput.jumpJustPressed = false;
    if (jumpPressed && onGround) {
      this.setVelocityY(-480);
      this.scene.sound.play('jump', { volume: 0.7 });
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
