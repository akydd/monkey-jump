export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'monkey-idle');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.play('monkey-idle');

    // Falls asleep after this many ms of standing still with no input
    this.SLEEP_DELAY = 20000;
    this._idleTime = 0;
    this._asleep = false;
  }

  update(cursors, mobileInput = {}, delta = 0) {
    const onGround = this.body.blocked.down;

    // Any movement input wakes the monkey immediately
    const inputActive =
      cursors.left.isDown || cursors.right.isDown || cursors.up.isDown ||
      mobileInput.left || mobileInput.right || mobileInput.jumpJustPressed;

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

    // Track how long the monkey has been standing still and idle
    const standingStill =
      onGround && !inputActive &&
      Math.abs(this.body.velocity.x) < 10 && Math.abs(this.body.velocity.y) < 10;
    if (standingStill) {
      this._idleTime += delta;
      if (this._idleTime >= this.SLEEP_DELAY) this._asleep = true;
    } else {
      this._idleTime = 0;
      this._asleep = false;
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
    } else if (this._asleep) {
      next = 'monkey-sleep';
    } else {
      next = 'monkey-idle';
    }

    if (this.anims.currentAnim?.key !== next) {
      this.play(next);
    }
  }
}
