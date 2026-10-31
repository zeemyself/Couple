import {
    CONFIG,
    Direction,
    OppositeDirection,
    GameState
} from './config.js';
import { AssetLoader } from './assets.js';
import { Maze } from './maze.js';
import { Player } from './player.js';
import { InputController } from './input.js';
import { EffectsManager } from './effects.js';
import { UIController } from './ui.js';
import { getAllStages, getStageByNumber } from './stages.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        const params = new URLSearchParams(window.location.search);
        const requestedStage = Number(params.get('stage'));
        const allStages = getAllStages();

        this.state = GameState.LOADING;
        this.stage = requestedStage >= 1 && requestedStage <= allStages.length ? requestedStage : 1;
        const initialStageObj = getStageByNumber(this.stage);
        this.maxTime = initialStageObj ? initialStageObj.timeLimit : CONFIG.STAGE_TIMES[0];
        this.timeRemaining = this.maxTime;
        this.completedStages = new Set();

        this.lastFrameTime = 0;
        this.accumulator = 0;
        this.elapsedSec = 0;
        this.autoAdvanceTimer = null;

        this.assets = new AssetLoader();
        this.effects = new EffectsManager();

        this.maze = new Maze(this.stage);
        this.playerA = new Player(CONFIG.SPAWN_P1.x, CONFIG.SPAWN_P1.y, 1, this.maze);
        this.playerB = new Player(CONFIG.SPAWN_P2.x, CONFIG.SPAWN_P2.y, 2, this.maze);

        this.ui = new UIController({
            onStartGame: () => this.startStage(this.stage),
            onNextStage: () => this.advanceStage(),
            onRestartStage: () => this.startStage(this.stage),
            onResumeGame: () => this.togglePause(),
            onSelectStage: (stageNum) => this.startStage(stageNum)
        });

        this.input = new InputController({
            onDirectionChange: (dir) => this.applyInputDirection(dir),
            onPrimaryAction: (code) => this.handlePrimaryKey(code),
            onRestart: () => {
                if (this.state !== GameState.MENU && this.state !== GameState.LOADING) {
                    this.startStage(this.stage);
                }
            },
            onTogglePause: () => this.togglePause()
        });
    }

    async init() {
        await this.assets.loadAll();
        this.setState(GameState.MENU);
        this.lastFrameTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    clearAutoAdvance() {
        if (this.autoAdvanceTimer) {
            clearTimeout(this.autoAdvanceTimer);
            this.autoAdvanceTimer = null;
        }
    }

    setState(newState) {
        this.state = newState;
        this.ui.updateHUD({
            stage: this.stage,
            timeRemaining: this.timeRemaining,
            maxTime: this.maxTime,
            state: this.state,
            completedStages: this.completedStages
        });
        this.ui.syncOverlay(this.state, {
            stage: this.stage,
            timeRemaining: this.timeRemaining
        });
    }

    startStage(stageNum = this.stage) {
        this.clearAutoAdvance();
        const allStages = getAllStages();
        this.stage = Math.max(1, Math.min(allStages.length, stageNum));
        const stageObj = getStageByNumber(this.stage);
        this.maxTime = (stageObj && stageObj.timeLimit) || 60;
        this.timeRemaining = this.maxTime;
        this.accumulator = 0;

        this.effects.clear();
        this.maze = new Maze(this.stage);
        this.playerA = new Player(CONFIG.SPAWN_P1.x, CONFIG.SPAWN_P1.y, 1, this.maze);
        this.playerB = new Player(CONFIG.SPAWN_P2.x, CONFIG.SPAWN_P2.y, 2, this.maze);

        this.input.resetDirections();
        this.setState(GameState.PLAYING);
    }

    advanceStage() {
        this.clearAutoAdvance();
        const allStages = getAllStages();
        if (this.stage < allStages.length) {
            this.startStage(this.stage + 1);
        } else {
            this.startStage(1);
        }
    }

    togglePause() {
        if (this.state === GameState.PLAYING) {
            this.input.resetDirections();
            this.setState(GameState.PAUSED);
        } else if (this.state === GameState.PAUSED) {
            this.setState(GameState.PLAYING);
        }
    }

    handlePrimaryKey(code) {
        switch (this.state) {
            case GameState.MENU:
                this.startStage(this.stage);
                break;
            case GameState.PAUSED:
                this.togglePause();
                break;
            case GameState.STAGE_COMPLETE:
            case GameState.VICTORY:
                if (code === 'Enter' || code === 'Space') {
                    this.advanceStage();
                }
                break;
            case GameState.GAMEOVER_TIME:
            case GameState.GAMEOVER_DEAD:
                if (code === 'Enter' || code === 'Space') {
                    this.startStage(this.stage);
                }
                break;
        }
    }

    applyInputDirection(dir) {
        if (this.state !== GameState.PLAYING) return;
        this.playerA.nextDirection = dir;
        this.playerB.nextDirection = OppositeDirection[dir] || Direction.STILL;
    }

    fixedUpdate() {
        this.playerA.update();
        this.playerB.update();

        // Spawn subtle motion trails when moving
        if (this.playerA.direction !== Direction.STILL) {
            const posA = this.playerA.getScreenCenter(1);
            this.effects.spawnTrail(posA.x, posA.y + 10, '#fb7185');
        }
        if (this.playerB.direction !== Direction.STILL) {
            const posB = this.playerB.getScreenCenter(1);
            this.effects.spawnTrail(posB.x, posB.y + 10, '#38bdf8');
        }

        // Check goal condition: P1 at (380, 260) and P2 at (420, 260)
        const { p1TargetX, p2TargetX, targetY, tolerance } = CONFIG.GOAL;
        const p1AtGoal =
            Math.abs(this.playerA.x - p1TargetX) < tolerance &&
            Math.abs(this.playerA.y - targetY) < tolerance;
        const p2AtGoal =
            Math.abs(this.playerB.x - p2TargetX) < tolerance &&
            Math.abs(this.playerB.y - targetY) < tolerance;

        if (p1AtGoal && p2AtGoal) {
            this.onStageComplete();
            return;
        }

        // Check water hazard collision
        const p1Dead = this.playerA.isDead();
        const p2Dead = this.playerB.isDead();
        if (p1Dead || p2Dead) {
            const victim = p1Dead ? this.playerA : this.playerB;
            const splashPos = victim.getScreenCenter(1);
            this.effects.spawnWaterSplash(splashPos.x, splashPos.y);
            this.setState(GameState.GAMEOVER_DEAD);
        }
    }

    onStageComplete() {
        this.completedStages.add(this.stage);
        this.effects.spawnGoalCelebration(
            CONFIG.GOAL.x,
            CONFIG.CANVAS_HEIGHT - CONFIG.GOAL.y
        );

        const allStages = getAllStages();
        if (this.stage >= allStages.length) {
            this.setState(GameState.VICTORY);
        } else {
            this.setState(GameState.STAGE_COMPLETE);
            this.clearAutoAdvance();
            this.autoAdvanceTimer = setTimeout(() => {
                if (this.state === GameState.STAGE_COMPLETE) {
                    this.advanceStage();
                }
            }, CONFIG.AUTO_ADVANCE_MS);
        }
    }

    update(deltaMs) {
        this.elapsedSec += deltaMs / 1000;
        this.effects.update(deltaMs);

        if (this.state !== GameState.PLAYING) return;

        this.timeRemaining -= deltaMs / 1000;
        if (this.timeRemaining <= 0) {
            this.timeRemaining = 0;
            this.effects.triggerShake(240, 5);
            this.setState(GameState.GAMEOVER_TIME);
            return;
        }

        this.accumulator += deltaMs;
        while (this.accumulator >= CONFIG.FIXED_DT && this.state === GameState.PLAYING) {
            this.fixedUpdate();
            this.accumulator -= CONFIG.FIXED_DT;
        }

        this.ui.updateHUD({
            stage: this.stage,
            timeRemaining: this.timeRemaining,
            maxTime: this.maxTime,
            state: this.state,
            completedStages: this.completedStages
        });
    }

    draw() {
        const ctx = this.ctx;
        const alpha = this.state === GameState.PLAYING
            ? Math.min(1, this.accumulator / CONFIG.FIXED_DT)
            : 1;

        ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        const shook = this.effects.applyScreenShake(ctx);

        this.maze.draw(ctx, this.assets, this.elapsedSec);
        this.effects.draw(ctx);
        this.playerA.draw(ctx, this.assets, alpha);
        this.playerB.draw(ctx, this.assets, alpha);

        this.effects.restoreScreenShake(ctx, shook);
    }

    loop(now) {
        const rawDelta = now - this.lastFrameTime;
        this.lastFrameTime = now;
        const deltaMs = Math.min(CONFIG.MAX_FRAME_DELTA, Math.max(0, rawDelta));

        this.update(deltaMs);
        this.draw();

        requestAnimationFrame((t) => this.loop(t));
    }
}
