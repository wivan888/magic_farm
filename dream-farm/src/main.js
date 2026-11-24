import { Game } from './game.js';

window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('canvas-container');
  const uiRoot = document.getElementById('ui-root');
  const game = new Game(container, uiRoot);
  game.start();
});
