import Phaser from 'phaser';
import Boot from './scenes/Boot.js';
import Preloader from './scenes/Preloader.js';
import MainMenu from './scenes/MainMenu.js';
import Game from './scenes/Game.js';
import GameOver from './scenes/GameOver.js';

const config = {
  type: Phaser.AUTO,
  width: 480,
  height: 640,
  backgroundColor: '#0a1a0a',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 600 },
      debug: false,
    },
  },
  scene: [Boot, Preloader, MainMenu, Game, GameOver],
};

new Phaser.Game(config);
