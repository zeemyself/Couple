import { CONFIG, Direction, OppositeDirection, MAZES } from './config.js';
import { AssetLoader } from './assets.js';
import { Maze } from './maze.js';
import { Player } from './player.js';
import { InputController } from './input.js';
import { EffectsManager } from './effects.js';
import { GRID_POSITIONS, parseStageInput, solveStage, validateStageGrid } from './solver.js';
import { addCustomStage, deleteCustomStage, getCustomStages } from './stages.js';

const PRESET_MAPS = {
    starter: [
        '####################',
        '#..................#',
        '#.###..........###.#',
        '#.#..............#.#',
        '#.#...#.####.#...#.#',
        '#.....#......#.....#',
        '#.....###..###.....#',
        '#.....#......#.....#',
        '#.#...#.####.#...#.#',
        '#.#..............#.#',
        '#.###..........###.#',
        '#..................#',
        '####################'
    ],
    open: [
        '####################',
        '#..................#',
        '#..................#',
        '#........##........#',
        '#..................#',
        '#.......#..#.......#',
        '#.......#..#.......#',
        '#.......#..#.......#',
        '#..................#',
        '#........##........#',
        '#..................#',
        '#..................#',
        '####################'
    ],
    stage1: [...MAZES[0]],
    stage2: [...MAZES[1]],
    unsolvable: [
        '####################',
        '#..................#',
        '#.###.###..###.###.#',
        '#.#...#.O....#...#.#',
        '#.#.###.####.###.#.#',
        '#.#.#...####...#.#.#',
        '#.....###..###.....#',
        '#.#.#...####...#.#.#',
        '#.#.###O####.###.#.#',
        '#.#...#......#...#.#',
        '#.###.###..###.###O#',
        '#..................#',
        '####################'
    ]
};

const NAME_TO_DIRECTION = {
    UP: Direction.UP,
    DOWN: Direction.DOWN,
    LEFT: Direction.LEFT,
    RIGHT: Direction.RIGHT
};

class StageUploadApp {
    constructor() {
        this.grid = PRESET_MAPS.starter.map((row) => row.split(''));
        this.activeBrush = '#';
        this.isPainting = false;

        this.solveResult = null;
        this.playtestPassed = false;
        this.rawParseError = null;

        // Playtest state
        this.canvas = document.getElementById('testCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.assets = new AssetLoader();
        this.effects = new EffectsManager();
        this.maze = null;
        this.playerA = null;
        this.playerB = null;
        this.testDead = false;
        this.autoSolveQueue = [];
        this.lastFrameTime = 0;
        this.accumulator = 0;
        this.elapsedSec = 0;

        this.cacheDOM();
        this.buildVisualGrid();
        this.bindEvents();
        this.syncFromGrid();
        this.renderCustomStagesList();
    }

    async init() {
        await this.assets.loadAll();
        this.resetPlaytestArena(false);
        this.lastFrameTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    cacheDOM() {
        this.headerStatusBadge = document.getElementById('headerStatusBadge');
        this.stageNameInput = document.getElementById('stageNameInput');
        this.templateSelect = document.getElementById('templateSelect');
        this.chkSymmetry = document.getElementById('chkSymmetry');
        this.btnClearInterior = document.getElementById('btnClearInterior');
        this.visualGridEl = document.getElementById('visualGrid');

        this.stageFileInput = document.getElementById('stageFileInput');
        this.btnExportTxt = document.getElementById('btnExportTxt');
        this.btnExportJson = document.getElementById('btnExportJson');
        this.rawMapInput = document.getElementById('rawMapInput');
        this.fileUploadStatus = document.getElementById('fileUploadStatus');
        this.btnApplyRawText = document.getElementById('btnApplyRawText');

        this.btnRunSolver = document.getElementById('btnRunSolver');
        this.checkStructureCard = document.getElementById('checkStructureCard');
        this.checkStructureIcon = document.getElementById('checkStructureIcon');
        this.checkStructureDesc = document.getElementById('checkStructureDesc');

        this.checkSolverCard = document.getElementById('checkSolverCard');
        this.checkSolverIcon = document.getElementById('checkSolverIcon');
        this.checkSolverDesc = document.getElementById('checkSolverDesc');

        this.checkPlaytestCard = document.getElementById('checkPlaytestCard');
        this.checkPlaytestIcon = document.getElementById('checkPlaytestIcon');
        this.checkPlaytestDesc = document.getElementById('checkPlaytestDesc');

        this.playtestStatusText = document.getElementById('playtestStatusText');
        this.playtestBanner = document.getElementById('playtestBanner');
        this.btnAutoSolve = document.getElementById('btnAutoSolve');
        this.btnResetTest = document.getElementById('btnResetTest');

        this.btnSubmitStage = document.getElementById('btnSubmitStage');
        this.submitHelperText = document.getElementById('submitHelperText');
        this.submitSuccessBanner = document.getElementById('submitSuccessBanner');

        this.customStageCount = document.getElementById('customStageCount');
        this.customStagesList = document.getElementById('customStagesList');
    }

    isLockedCell(r, c) {
        if (r === 0 || r === CONFIG.ROWS - 1 || c === 0 || c === CONFIG.COLS - 1) {
            return true;
        }
        const { P1_SPAWN, P2_SPAWN, P1_GOAL, P2_GOAL } = GRID_POSITIONS;
        if (r === P1_SPAWN.r && c === P1_SPAWN.c) return true;
        if (r === P2_SPAWN.r && c === P2_SPAWN.c) return true;
        if (r === P1_GOAL.r && c === P1_GOAL.c) return true;
        if (r === P2_GOAL.r && c === P2_GOAL.c) return true;
        return false;
    }

    getSpecialCellRole(r, c) {
        const { P1_SPAWN, P2_SPAWN, P1_GOAL, P2_GOAL } = GRID_POSITIONS;
        if (r === P1_SPAWN.r && c === P1_SPAWN.c) return 'p1';
        if (r === P2_SPAWN.r && c === P2_SPAWN.c) return 'p2';
        if ((r === P1_GOAL.r && c === P1_GOAL.c) || (r === P2_GOAL.r && c === P2_GOAL.c)) return 'goal';
        if (r === 0 || r === CONFIG.ROWS - 1 || c === 0 || c === CONFIG.COLS - 1) return 'border';
        return null;
    }

    buildVisualGrid() {
        this.visualGridEl.innerHTML = '';
        this.cellElements = [];

        for (let r = 0; r < CONFIG.ROWS; r++) {
            const rowEls = [];
            for (let c = 0; c < CONFIG.COLS; c++) {
                const cell = document.createElement('button');
                cell.type = 'button';
                cell.className = 'grid-cell';
                cell.dataset.r = String(r);
                cell.dataset.c = String(c);

                const role = this.getSpecialCellRole(r, c);
                if (role) {
                    cell.dataset.role = role;
                    cell.classList.add('is-locked');
                }

                cell.addEventListener('pointerdown', (e) => {
                    e.preventDefault();
                    this.isPainting = true;
                    this.paintCell(r, c);
                });

                cell.addEventListener('pointerenter', () => {
                    if (this.isPainting) {
                        this.paintCell(r, c);
                    }
                });

                this.visualGridEl.appendChild(cell);
                rowEls.push(cell);
            }
            this.cellElements.push(rowEls);
        }

        window.addEventListener('pointerup', () => {
            this.isPainting = false;
        });
    }

    paintCell(r, c) {
        if (this.isLockedCell(r, c)) return;

        let changed = false;
        if (this.grid[r][c] !== this.activeBrush) {
            this.grid[r][c] = this.activeBrush;
            changed = true;
        }

        if (this.chkSymmetry && this.chkSymmetry.checked) {
            const mr = CONFIG.ROWS - 1 - r;
            const mc = CONFIG.COLS - 1 - c;
            if (!this.isLockedCell(mr, mc) && this.grid[mr][mc] !== this.activeBrush) {
                this.grid[mr][mc] = this.activeBrush;
                changed = true;
            }
        }

        if (changed) {
            this.rawParseError = null;
            this.syncFromGrid();
        }
    }

    getMapStrings() {
        return this.grid.map((row) => row.join(''));
    }

    loadMapStrings(mapArray, preserveError = false) {
        if (!preserveError) {
            this.rawParseError = null;
        }
        this.grid = mapArray.map((row) => row.split(''));
        this.syncFromGrid();
    }

    syncFromGrid() {
        // Update visual cells
        for (let r = 0; r < CONFIG.ROWS; r++) {
            for (let c = 0; c < CONFIG.COLS; c++) {
                const cell = this.cellElements[r][c];
                const ch = this.grid[r][c];
                const role = this.getSpecialCellRole(r, c);
                cell.dataset.tile = ch;

                if (role === 'p1') {
                    cell.textContent = 'P1';
                } else if (role === 'p2') {
                    cell.textContent = 'P2';
                } else if (role === 'goal') {
                    cell.textContent = '★';
                } else {
                    cell.textContent = ch === '.' ? '' : ch;
                }
            }
        }

        // Sync raw ASCII textarea
        const mapStrings = this.getMapStrings();
        if (document.activeElement !== this.rawMapInput) {
            this.rawMapInput.value = mapStrings.join('\n');
        }

        // Invalidate playtest whenever map changes and run BFS solver
        this.playtestPassed = false;
        this.submitSuccessBanner.classList.add('is-hidden');
        this.runVerification();
        this.resetPlaytestArena(false);
    }

    runVerification() {
        if (this.rawParseError) {
            this.solveResult = {
                valid: false,
                errors: [this.rawParseError],
                solvable: false,
                minMoves: null,
                solution: null,
                visitedStates: 0,
                reason: this.rawParseError
            };
        } else {
            const mapStrings = this.getMapStrings();
            this.solveResult = solveStage(mapStrings);
        }

        this.updateVerificationUI();
    }

    updateVerificationUI() {
        const res = this.solveResult;

        // 1. Structural Check
        if (res && res.valid) {
            this.setStepStatus(
                this.checkStructureCard,
                this.checkStructureIcon,
                this.checkStructureDesc,
                'pass',
                '✓',
                'Valid 20×13 grid. Outer walls, P1/P2 spawns, and central goal are open.'
            );
        } else {
            const errMsg = (res && res.errors && res.errors[0]) || 'Invalid stage layout.';
            this.setStepStatus(
                this.checkStructureCard,
                this.checkStructureIcon,
                this.checkStructureDesc,
                'fail',
                '✕',
                errMsg
            );
        }

        // 2. Automated BFS Solvability Check
        if (!res || !res.valid) {
            this.setStepStatus(
                this.checkSolverCard,
                this.checkSolverIcon,
                this.checkSolverDesc,
                'pending',
                '•',
                'Fix structural errors above to run the BFS solvability check.'
            );
            this.btnAutoSolve.disabled = true;
        } else if (res.solvable) {
            this.setStepStatus(
                this.checkSolverCard,
                this.checkSolverIcon,
                this.checkSolverDesc,
                'pass',
                '✓',
                `Solvable! Optimal path found in ${res.minMoves} moves (${res.visitedStates.toLocaleString()} states explored).`
            );
            this.btnAutoSolve.disabled = false;
        } else {
            this.setStepStatus(
                this.checkSolverCard,
                this.checkSolverIcon,
                this.checkSolverDesc,
                'fail',
                '✕',
                `${res.reason} (${res.visitedStates.toLocaleString()} reachable states checked).`
            );
            this.btnAutoSolve.disabled = true;
        }

        // 3. Interactive Playtest Verification
        if (!res || !res.solvable) {
            this.setStepStatus(
                this.checkPlaytestCard,
                this.checkPlaytestIcon,
                this.checkPlaytestDesc,
                'pending',
                '•',
                'Stage must be solvable before playtest verification can pass.'
            );
        } else if (this.playtestPassed) {
            this.setStepStatus(
                this.checkPlaytestCard,
                this.checkPlaytestIcon,
                this.checkPlaytestDesc,
                'pass',
                '✓',
                'Playtest cleared! Both players reached the central goal.'
            );
        } else {
            this.setStepStatus(
                this.checkPlaytestCard,
                this.checkPlaytestIcon,
                this.checkPlaytestDesc,
                'active',
                '▶',
                'Play the stage below (or click "Demo BFS Solution") and reach the central goal to verify.'
            );
        }

        // Overall Header & Submit Button
        const canSubmit = Boolean(res && res.valid && res.solvable && this.playtestPassed);
        this.btnSubmitStage.disabled = !canSubmit;

        if (canSubmit) {
            this.headerStatusBadge.textContent = 'Verified & Ready to Submit';
            this.headerStatusBadge.dataset.tone = 'success';
            this.submitHelperText.textContent =
                `All checks passed (optimal path: ${res.minMoves} moves). Click "Submit Verified Stage" to add it to the game!`;
        } else if (res && !res.solvable) {
            this.headerStatusBadge.textContent = 'Unsolvable Stage';
            this.headerStatusBadge.dataset.tone = 'danger';
            this.submitHelperText.textContent =
                'Submission blocked: this maze cannot be solved. Adjust walls or hazards until a valid path exists.';
        } else {
            this.headerStatusBadge.textContent = 'Playtest Required';
            this.headerStatusBadge.dataset.tone = 'info';
            this.submitHelperText.textContent =
                'BFS confirmed this maze is solvable! Clear the stage on the playtest canvas above to unlock submission.';
        }
    }

    setStepStatus(cardEl, iconEl, descEl, status, iconText, descText) {
        cardEl.dataset.status = status;
        iconEl.textContent = iconText;
        descEl.textContent = descText;
    }

    bindEvents() {
        // Brush selector buttons
        document.querySelectorAll('[data-brush]').forEach((btn) => {
            btn.addEventListener('click', () => {
                this.activeBrush = btn.getAttribute('data-brush');
                document.querySelectorAll('[data-brush]').forEach((b) => {
                    b.classList.toggle('is-active', b === btn);
                });
            });
        });

        // Template preset selector
        this.templateSelect.addEventListener('change', () => {
            const key = this.templateSelect.value;
            const preset = PRESET_MAPS[key];
            if (preset) {
                this.loadMapStrings(preset);
            }
        });

        // Clear Interior
        this.btnClearInterior.addEventListener('click', () => {
            for (let r = 1; r < CONFIG.ROWS - 1; r++) {
                for (let c = 1; c < CONFIG.COLS - 1; c++) {
                    this.grid[r][c] = '.';
                }
            }
            this.rawParseError = null;
            this.syncFromGrid();
        });

        // Raw ASCII Text Apply
        const applyRawText = () => {
            const parsed = parseStageInput(this.rawMapInput.value);
            if (parsed.error) {
                this.rawParseError = parsed.error;
                this.playtestPassed = false;
                this.runVerification();
                return;
            }
            if (parsed.name) {
                this.stageNameInput.value = parsed.name;
            }
            const validation = validateStageGrid(parsed.map);
            if (!validation.valid) {
                this.rawParseError = validation.errors[0];
                this.playtestPassed = false;
                this.runVerification();
                return;
            }
            this.fileUploadStatus.textContent = 'Applied text map to visual grid.';
            this.loadMapStrings(parsed.map);
        };

        this.btnApplyRawText.addEventListener('click', applyRawText);
        this.rawMapInput.addEventListener('input', () => {
            const parsed = parseStageInput(this.rawMapInput.value);
            if (!parsed.error && Array.isArray(parsed.map)) {
                const validation = validateStageGrid(parsed.map);
                if (validation.valid) {
                    this.loadMapStrings(parsed.map);
                } else {
                    this.rawParseError = validation.errors[0];
                    this.playtestPassed = false;
                    this.runVerification();
                }
            } else if (parsed.error) {
                this.rawParseError = parsed.error;
                this.playtestPassed = false;
                this.runVerification();
            }
        });

        // File Upload (.txt or .json)
        this.stageFileInput.addEventListener('change', async (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;

            try {
                const content = await file.text();
                const parsed = parseStageInput(content);
                if (parsed.error) {
                    this.rawParseError = `File "${file.name}": ${parsed.error}`;
                    this.fileUploadStatus.textContent = this.rawParseError;
                    this.playtestPassed = false;
                    this.runVerification();
                    return;
                }

                if (parsed.name) {
                    this.stageNameInput.value = parsed.name;
                } else {
                    const baseName = file.name.replace(/\.(txt|json)$/i, '');
                    if (baseName) this.stageNameInput.value = baseName;
                }

                this.rawMapInput.value = parsed.map.join('\n');
                const validation = validateStageGrid(parsed.map);
                if (!validation.valid) {
                    this.rawParseError = `File "${file.name}": ${validation.errors[0]}`;
                    this.fileUploadStatus.textContent = this.rawParseError;
                    this.playtestPassed = false;
                    this.runVerification();
                    return;
                }

                this.fileUploadStatus.textContent = `Loaded "${file.name}" successfully.`;
                this.loadMapStrings(parsed.map);
            } finally {
                this.stageFileInput.value = '';
            }
        });

        // Export .txt and .json
        this.btnExportTxt.addEventListener('click', () => {
            const content = this.getMapStrings().join('\n') + '\n';
            const slug = (this.stageNameInput.value || 'custom-stage').toLowerCase().replace(/[^a-z0-9]+/g, '-');
            this.downloadFile(`${slug}.txt`, content, 'text/plain');
        });

        this.btnExportJson.addEventListener('click', () => {
            const payload = {
                name: (this.stageNameInput.value || 'Custom Stage').trim(),
                map: this.getMapStrings()
            };
            const slug = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            this.downloadFile(`${slug}.json`, JSON.stringify(payload, null, 2), 'application/json');
        });

        // Re-run Solver button
        this.btnRunSolver.addEventListener('click', () => {
            this.runVerification();
        });

        // Playtest controls
        this.btnResetTest.addEventListener('click', () => {
            this.resetPlaytestArena(true);
        });

        this.btnAutoSolve.addEventListener('click', () => {
            this.startAutoSolveDemo();
        });

        this.input = new InputController({
            onDirectionChange: (dir) => {
                if (this.autoSolveQueue.length > 0 && dir !== Direction.STILL) {
                    // User took manual control
                    this.autoSolveQueue.length = 0;
                }
                this.applyTestDirection(dir);
            },
            onPrimaryAction: () => {
                if (this.testDead) {
                    this.resetPlaytestArena(true);
                }
            },
            onRestart: () => {
                this.resetPlaytestArena(true);
            },
            onTogglePause: () => {}
        });

        // Submit Stage button
        this.btnSubmitStage.addEventListener('click', () => {
            this.handleSubmitStage();
        });
    }

    downloadFile(filename, content, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    resetPlaytestArena(keepPassedFlag = false) {
        if (!keepPassedFlag) {
            this.playtestPassed = false;
        }
        this.testDead = false;
        this.autoSolveQueue.length = 0;
        this.accumulator = 0;
        this.effects.clear();

        const mapStrings = this.getMapStrings();
        const isValid = validateStageGrid(mapStrings).valid;
        const safeMap = isValid ? mapStrings : PRESET_MAPS.starter;

        this.maze = new Maze(1, safeMap);
        this.playerA = new Player(CONFIG.SPAWN_P1.x, CONFIG.SPAWN_P1.y, 1, this.maze);
        this.playerB = new Player(CONFIG.SPAWN_P2.x, CONFIG.SPAWN_P2.y, 2, this.maze);

        if (this.input) {
            this.input.resetDirections();
        }

        if (this.playtestPassed) {
            this.showPlaytestBanner('Playtest Verified! Ready to Submit.', 'success');
        } else {
            this.hidePlaytestBanner();
        }
        this.playtestStatusText.textContent = 'Playtest Arena — Guide P1 & P2 to the central goal';
        this.updateVerificationUI();
    }

    startAutoSolveDemo() {
        if (!this.solveResult || !this.solveResult.solvable || !this.solveResult.solution) {
            return;
        }
        this.resetPlaytestArena(this.playtestPassed);
        this.autoSolveQueue = [...this.solveResult.solution];
        this.playtestStatusText.textContent = `Replaying BFS Solution (${this.autoSolveQueue.length} moves)…`;
    }

    applyTestDirection(dir) {
        if (!this.playerA || !this.playerB || this.testDead) return;
        this.playerA.nextDirection = dir;
        this.playerB.nextDirection = OppositeDirection[dir] || Direction.STILL;
    }

    showPlaytestBanner(message, tone = 'info') {
        if (!this.playtestBanner) return;
        this.playtestBanner.textContent = message;
        this.playtestBanner.dataset.tone = tone;
        this.playtestBanner.classList.remove('is-hidden');
    }

    hidePlaytestBanner() {
        if (!this.playtestBanner) return;
        this.playtestBanner.classList.add('is-hidden');
    }

    fixedUpdate() {
        if (!this.playerA || !this.playerB || this.testDead) return;
        if (!this.solveResult || !this.solveResult.valid) return;

        // If auto-solving and both players are at tile centers, feed next move
        if (this.autoSolveQueue.length > 0 && this.playerA.isAtCenter() && this.playerB.isAtCenter()) {
            const nextMoveName = this.autoSolveQueue.shift();
            const dir = NAME_TO_DIRECTION[nextMoveName] || Direction.STILL;
            this.applyTestDirection(dir);
        } else if (
            this.autoSolveQueue.length === 0 &&
            this.input &&
            this.input.getCurrentDirection() === Direction.STILL &&
            this.playerA.isAtCenter() &&
            this.playerB.isAtCenter()
        ) {
            this.applyTestDirection(Direction.STILL);
        }

        this.playerA.update();
        this.playerB.update();

        if (this.playerA.direction !== Direction.STILL) {
            const posA = this.playerA.getScreenCenter(1);
            this.effects.spawnTrail(posA.x, posA.y + 10, '#fb7185');
        }
        if (this.playerB.direction !== Direction.STILL) {
            const posB = this.playerB.getScreenCenter(1);
            this.effects.spawnTrail(posB.x, posB.y + 10, '#38bdf8');
        }

        // Check goal condition
        const { p1TargetX, p2TargetX, targetY, tolerance } = CONFIG.GOAL;
        const p1AtGoal =
            Math.abs(this.playerA.x - p1TargetX) < tolerance &&
            Math.abs(this.playerA.y - targetY) < tolerance;
        const p2AtGoal =
            Math.abs(this.playerB.x - p2TargetX) < tolerance &&
            Math.abs(this.playerB.y - targetY) < tolerance;

        if (p1AtGoal && p2AtGoal) {
            this.autoSolveQueue.length = 0;
            this.applyTestDirection(Direction.STILL);
            this.playerA.direction = Direction.STILL;
            this.playerB.direction = Direction.STILL;

            if (!this.playtestPassed) {
                this.playtestPassed = true;
                this.effects.spawnGoalCelebration(
                    CONFIG.GOAL.x,
                    CONFIG.CANVAS_HEIGHT - CONFIG.GOAL.y
                );
                this.showPlaytestBanner('Stage Cleared! Solvability Confirmed ✓', 'success');
                this.playtestStatusText.textContent = 'Playtest Verified — Stage is ready to submit!';
                this.updateVerificationUI();
            }
            return;
        }

        // Check water hazard collision
        const p1Dead = this.playerA.isDead();
        const p2Dead = this.playerB.isDead();
        if (p1Dead || p2Dead) {
            this.testDead = true;
            this.autoSolveQueue.length = 0;
            const victim = p1Dead ? this.playerA : this.playerB;
            const splashPos = victim.getScreenCenter(1);
            this.effects.spawnWaterSplash(splashPos.x, splashPos.y);
            this.showPlaytestBanner('Splashed in Water! Press R or Reset Test to retry.', 'danger');
            this.playtestStatusText.textContent = 'Hit water hazard — press R to reset';
        }
    }

    update(deltaMs) {
        this.elapsedSec += deltaMs / 1000;
        this.effects.update(deltaMs);

        this.accumulator += deltaMs;
        while (this.accumulator >= CONFIG.FIXED_DT) {
            this.fixedUpdate();
            this.accumulator -= CONFIG.FIXED_DT;
        }
    }

    draw() {
        const ctx = this.ctx;
        const alpha = Math.min(1, this.accumulator / CONFIG.FIXED_DT);

        ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        const shook = this.effects.applyScreenShake(ctx);

        if (this.maze) {
            this.maze.draw(ctx, this.assets, this.elapsedSec);
        }
        this.effects.draw(ctx);
        if (this.playerA && this.playerB) {
            this.playerA.draw(ctx, this.assets, alpha);
            this.playerB.draw(ctx, this.assets, alpha);
        }

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

    handleSubmitStage() {
        const mapStrings = this.getMapStrings();
        const check = solveStage(mapStrings);
        if (!check.solvable || !this.playtestPassed) {
            this.updateVerificationUI();
            return;
        }

        const name = (this.stageNameInput.value || '').trim() || 'Custom Stage';
        const savedStage = addCustomStage({
            name,
            map: mapStrings
        });

        this.renderCustomStagesList();

        this.submitSuccessBanner.innerHTML = `
            <div>
                <strong>Stage "${this.escapeHtml(savedStage.name)}" Submitted!</strong>
                <span>Added as Stage ${savedStage.stageNumber} (${savedStage.minMoves} optimal moves).</span>
            </div>
            <a href="index.html?stage=${savedStage.stageNumber}" class="btn-primary btn-play-submitted">
                Play Stage ${savedStage.stageNumber} Now →
            </a>
        `;
        this.submitSuccessBanner.classList.remove('is-hidden');
    }

    renderCustomStagesList() {
        const customStages = getCustomStages();
        this.customStageCount.textContent = `${customStages.length} custom stage${customStages.length === 1 ? '' : 's'} saved`;

        if (customStages.length === 0) {
            this.customStagesList.innerHTML = `
                <div class="empty-custom-stages">
                    No custom stages uploaded yet. Design and verify a stage above to add it to the game!
                </div>
            `;
            return;
        }

        this.customStagesList.innerHTML = '';
        for (const stage of customStages) {
            const item = document.createElement('div');
            item.className = 'custom-stage-item';
            item.innerHTML = `
                <div class="custom-stage-meta">
                    <span class="stage-pill is-current">${stage.stageNumber}</span>
                    <div>
                        <div class="custom-stage-title">${this.escapeHtml(stage.name)}</div>
                        <div class="verify-desc">${stage.minMoves ? `Optimal: ${stage.minMoves} moves` : 'Verified solvable'}</div>
                    </div>
                </div>
                <div class="custom-stage-actions">
                    <button type="button" class="hud-btn btn-load-stage">Edit</button>
                    <a href="index.html?stage=${stage.stageNumber}" class="hud-btn hud-btn-accent">Play</a>
                    <button type="button" class="hud-btn btn-delete-stage">Delete</button>
                </div>
            `;

            item.querySelector('.btn-load-stage').addEventListener('click', () => {
                this.stageNameInput.value = stage.name;
                this.loadMapStrings(stage.map);
            });

            item.querySelector('.btn-delete-stage').addEventListener('click', () => {
                deleteCustomStage(stage.id);
                this.renderCustomStagesList();
            });

            this.customStagesList.appendChild(item);
        }
    }

    escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const app = new StageUploadApp();
    window.stageUploadApp = app;
    app.init();
});
