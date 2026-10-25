import { Direction } from './config.js';

const KEY_TO_DIRECTION = {
    ArrowLeft: Direction.LEFT,
    KeyA: Direction.LEFT,
    ArrowRight: Direction.RIGHT,
    KeyD: Direction.RIGHT,
    ArrowUp: Direction.UP,
    KeyW: Direction.UP,
    ArrowDown: Direction.DOWN,
    KeyS: Direction.DOWN
};

const ATTR_TO_DIRECTION = {
    left: Direction.LEFT,
    right: Direction.RIGHT,
    up: Direction.UP,
    down: Direction.DOWN
};

const DIRECTION_TO_ATTR = {
    [Direction.LEFT]: 'left',
    [Direction.RIGHT]: 'right',
    [Direction.UP]: 'up',
    [Direction.DOWN]: 'down'
};

export class InputController {
    constructor({ onDirectionChange, onPrimaryAction, onRestart, onTogglePause }) {
        this.onDirectionChange = onDirectionChange;
        this.onPrimaryAction = onPrimaryAction;
        this.onRestart = onRestart;
        this.onTogglePause = onTogglePause;

        this.heldCodes = [];
        this.activeTouchDir = Direction.STILL;
        this.dpadButtons = new Map();
        this.swipeStart = null;

        this.bindKeyboard();
        this.bindDpad();
        this.bindCanvasSwipe();
    }

    getCurrentDirection() {
        if (this.activeTouchDir !== Direction.STILL) {
            return this.activeTouchDir;
        }
        if (this.heldCodes.length > 0) {
            const topCode = this.heldCodes[this.heldCodes.length - 1];
            return KEY_TO_DIRECTION[topCode] || Direction.STILL;
        }
        return Direction.STILL;
    }

    emitDirection() {
        const dir = this.getCurrentDirection();
        this.syncDpadVisuals(dir);
        if (this.onDirectionChange) {
            this.onDirectionChange(dir);
        }
    }

    syncDpadVisuals(activeDir) {
        const activeKey = DIRECTION_TO_ATTR[activeDir] || null;
        for (const [dirAttr, btn] of this.dpadButtons.entries()) {
            btn.classList.toggle('is-active', dirAttr === activeKey);
        }
    }

    resetDirections() {
        this.heldCodes.length = 0;
        this.activeTouchDir = Direction.STILL;
        this.emitDirection();
    }

    isTypingInField(e) {
        const el = e.target;
        if (!el || !el.tagName) return false;
        const tag = el.tagName.toUpperCase();
        return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
    }

    bindKeyboard() {
        window.addEventListener('keydown', (e) => {
            if (this.isTypingInField(e)) return;

            if (e.code in KEY_TO_DIRECTION) {
                e.preventDefault();
                const idx = this.heldCodes.indexOf(e.code);
                if (idx !== -1) {
                    this.heldCodes.splice(idx, 1);
                }
                this.heldCodes.push(e.code);
                this.emitDirection();
                return;
            }

            switch (e.code) {
                case 'Space':
                case 'Enter':
                    e.preventDefault();
                    if (this.onPrimaryAction) this.onPrimaryAction(e.code);
                    break;
                case 'KeyR':
                    e.preventDefault();
                    if (this.onRestart) this.onRestart();
                    break;
                case 'KeyP':
                case 'Escape':
                    e.preventDefault();
                    if (this.onTogglePause) this.onTogglePause();
                    break;
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code in KEY_TO_DIRECTION) {
                const idx = this.heldCodes.indexOf(e.code);
                if (idx !== -1) {
                    this.heldCodes.splice(idx, 1);
                    this.emitDirection();
                }
            }
        });

        window.addEventListener('blur', () => {
            this.resetDirections();
        });
    }

    bindDpad() {
        const buttons = document.querySelectorAll('[data-dpad-dir]');
        buttons.forEach((btn) => {
            const dirAttr = btn.getAttribute('data-dpad-dir');
            const dir = ATTR_TO_DIRECTION[dirAttr];
            if (!dir) return;

            this.dpadButtons.set(dirAttr, btn);

            const activate = (e) => {
                e.preventDefault();
                this.activeTouchDir = dir;
                this.emitDirection();
            };

            const deactivate = (e) => {
                e.preventDefault();
                if (this.activeTouchDir === dir) {
                    this.activeTouchDir = Direction.STILL;
                    this.emitDirection();
                }
            };

            btn.addEventListener('pointerdown', activate);
            btn.addEventListener('pointerup', deactivate);
            btn.addEventListener('pointercancel', deactivate);
            btn.addEventListener('pointerleave', deactivate);
            btn.addEventListener('contextmenu', (e) => e.preventDefault());
        });
    }

    bindCanvasSwipe() {
        const canvas = document.getElementById('game');
        if (!canvas) return;

        canvas.addEventListener('pointerdown', (e) => {
            if (e.pointerType === 'mouse') return;
            this.swipeStart = { x: e.clientX, y: e.clientY, id: e.pointerId };
        });

        canvas.addEventListener('pointermove', (e) => {
            if (!this.swipeStart || e.pointerId !== this.swipeStart.id) return;
            const dx = e.clientX - this.swipeStart.x;
            const dy = e.clientY - this.swipeStart.y;
            const threshold = 18;

            if (Math.hypot(dx, dy) < threshold) return;

            if (Math.abs(dx) > Math.abs(dy)) {
                this.activeTouchDir = dx > 0 ? Direction.RIGHT : Direction.LEFT;
            } else {
                this.activeTouchDir = dy > 0 ? Direction.DOWN : Direction.UP;
            }
            this.emitDirection();
        });

        const endSwipe = (e) => {
            if (this.swipeStart && e.pointerId === this.swipeStart.id) {
                this.swipeStart = null;
                this.activeTouchDir = Direction.STILL;
                this.emitDirection();
            }
        };

        canvas.addEventListener('pointerup', endSwipe);
        canvas.addEventListener('pointercancel', endSwipe);
    }
}
