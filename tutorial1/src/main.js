import { Game } from './game.js';

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game');
    if (!canvas) return;
    const game = new Game(canvas);
    window.game = game;
    game.init();
});
