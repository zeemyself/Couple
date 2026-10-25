import { GameState } from './config.js';
import { getAllStages, getStageByNumber } from './stages.js';

export class UIController {
    constructor({ onStartGame, onNextStage, onRestartStage, onResumeGame, onSelectStage }) {
        this.onStartGame = onStartGame;
        this.onNextStage = onNextStage;
        this.onRestartStage = onRestartStage;
        this.onResumeGame = onResumeGame;
        this.onSelectStage = onSelectStage;

        this.stageNameEl = document.getElementById('hudStageName');
        this.stagePillsContainer = document.getElementById('stagePills');
        this.timerValueEl = document.getElementById('hudTimerValue');
        this.timerBarEl = document.getElementById('hudTimerBar');
        this.timerBadgeEl = document.getElementById('hudTimerBadge');

        this.btnRestart = document.getElementById('btnRestart');
        this.btnPause = document.getElementById('btnPause');

        this.overlayEl = document.getElementById('gameOverlay');
        this.overlayBadgeEl = document.getElementById('overlayBadge');
        this.overlayTitleEl = document.getElementById('overlayTitle');
        this.overlaySubtitleEl = document.getElementById('overlaySubtitle');
        this.overlayBannerEl = document.getElementById('overlayBanner');
        this.overlayPrimaryBtn = document.getElementById('overlayPrimaryBtn');
        this.overlaySecondaryBtn = document.getElementById('overlaySecondaryBtn');

        this.currentPrimaryHandler = null;
        this.currentSecondaryHandler = null;

        this.buildStagePills();
        this.bindEvents();
    }

    buildStagePills() {
        if (!this.stagePillsContainer) return;
        this.stagePillsContainer.innerHTML = '';

        const stages = getAllStages();
        for (const stageObj of stages) {
            const i = stageObj.stageNumber;
            const pill = document.createElement('button');
            pill.type = 'button';
            pill.className = `stage-pill${stageObj.isCustom ? ' is-custom' : ''}`;
            pill.dataset.stage = String(i);
            pill.textContent = `${i}`;
            pill.title = `Stage ${i}: ${stageObj.name}${stageObj.isCustom ? ' (Custom)' : ''}`;
            pill.addEventListener('click', () => {
                if (this.onSelectStage) {
                    this.onSelectStage(i);
                }
            });
            this.stagePillsContainer.appendChild(pill);
        }
    }

    bindEvents() {
        if (this.btnRestart) {
            this.btnRestart.addEventListener('click', () => {
                if (this.onRestartStage) this.onRestartStage();
            });
        }

        if (this.btnPause) {
            this.btnPause.addEventListener('click', () => {
                if (this.onResumeGame) this.onResumeGame();
            });
        }

        if (this.overlayPrimaryBtn) {
            this.overlayPrimaryBtn.addEventListener('click', () => {
                if (this.currentPrimaryHandler) this.currentPrimaryHandler();
            });
        }

        if (this.overlaySecondaryBtn) {
            this.overlaySecondaryBtn.addEventListener('click', () => {
                if (this.currentSecondaryHandler) this.currentSecondaryHandler();
            });
        }
    }

    updateHUD({ stage, timeRemaining, maxTime, state, completedStages }) {
        const stageObj = getStageByNumber(stage);
        const stageTitle = (stageObj && stageObj.name) || `Stage ${stage}`;
        if (this.stageNameEl) {
            this.stageNameEl.textContent = `Stage ${stage} · ${stageTitle}`;
        }

        if (this.stagePillsContainer) {
            const pills = this.stagePillsContainer.querySelectorAll('.stage-pill');
            pills.forEach((pill) => {
                const pillStage = Number(pill.dataset.stage);
                pill.classList.toggle('is-current', pillStage === stage);
                pill.classList.toggle('is-completed', completedStages.has(pillStage));
            });
        }

        const seconds = Math.max(0, Math.ceil(timeRemaining));
        if (this.timerValueEl) {
            this.timerValueEl.textContent = `${seconds}s`;
        }

        const ratio = Math.max(0, Math.min(1, timeRemaining / (maxTime || 60)));
        if (this.timerBarEl) {
            this.timerBarEl.style.transform = `scaleX(${ratio.toFixed(3)})`;
            this.timerBarEl.dataset.urgency =
                timeRemaining <= 10 ? 'critical' : timeRemaining <= 20 ? 'warning' : 'normal';
        }

        if (this.timerBadgeEl) {
            this.timerBadgeEl.classList.toggle('is-critical', timeRemaining <= 10 && state === GameState.PLAYING);
        }

        if (this.btnPause) {
            this.btnPause.textContent = state === GameState.PAUSED ? 'Resume' : 'Pause';
        }
    }

    syncOverlay(state, { stage, timeRemaining }) {
        if (!this.overlayEl) return;

        if (state === GameState.PLAYING || state === GameState.LOADING) {
            this.overlayEl.classList.add('is-hidden');
            return;
        }

        this.overlayEl.classList.remove('is-hidden');
        this.overlaySecondaryBtn.classList.add('is-hidden');
        this.currentSecondaryHandler = null;

        const allStages = getAllStages();
        const stageObj = getStageByNumber(stage);
        const stageTitle = (stageObj && stageObj.name) || `Stage ${stage}`;
        const secondsLeft = Math.max(0, Math.ceil(timeRemaining));

        switch (state) {
            case GameState.MENU:
                this.overlayBadgeEl.textContent = '2-Player Mirrored Puzzle';
                this.overlayBadgeEl.dataset.tone = 'info';
                this.overlayTitleEl.textContent = 'Couple Maze';
                this.overlaySubtitleEl.textContent =
                    'Guide both characters to the central goal together! Moving Player 1 in any direction moves Player 2 in the exact opposite direction.';
                this.setBannerImage('images/welcome.png', 'Couple Maze Welcome Banner');
                this.overlayPrimaryBtn.textContent = 'Start Game (Space)';
                this.currentPrimaryHandler = () => this.onStartGame();
                break;

            case GameState.PAUSED:
                this.overlayBadgeEl.textContent = `Stage ${stage} Paused`;
                this.overlayBadgeEl.dataset.tone = 'info';
                this.overlayTitleEl.textContent = 'Game Paused';
                this.overlaySubtitleEl.textContent = `${stageTitle} — ${secondsLeft}s remaining on the clock.`;
                this.setBannerImage(null);
                this.overlayPrimaryBtn.textContent = 'Resume (Space / P)';
                this.currentPrimaryHandler = () => this.onResumeGame();
                this.overlaySecondaryBtn.textContent = 'Restart Stage (R)';
                this.overlaySecondaryBtn.classList.remove('is-hidden');
                this.currentSecondaryHandler = () => this.onRestartStage();
                break;

            case GameState.STAGE_COMPLETE:
                this.overlayBadgeEl.textContent = `Stage ${stage} Cleared!`;
                this.overlayBadgeEl.dataset.tone = 'success';
                this.overlayTitleEl.textContent = 'Together at Last!';
                this.overlaySubtitleEl.textContent =
                    `Cleared ${stageTitle} with ${secondsLeft}s remaining. Advancing to Stage ${stage + 1}...`;
                this.setBannerImage('images/win.png', 'Stage Complete');
                this.overlayPrimaryBtn.textContent = `Next Stage (${stage + 1}/${allStages.length}) ↵`;
                this.currentPrimaryHandler = () => this.onNextStage();
                break;

            case GameState.VICTORY:
                this.overlayBadgeEl.textContent = `All ${allStages.length} Stages Complete!`;
                this.overlayBadgeEl.dataset.tone = 'success';
                this.overlayTitleEl.textContent = 'Victory! Perfect Couple';
                this.overlaySubtitleEl.textContent =
                    `You conquered all ${allStages.length} labyrinth stages and reunited the couple!`;
                this.setBannerImage('images/win.png', 'Victory Banner');
                this.overlayPrimaryBtn.textContent = 'Play Again from Stage 1 ↵';
                this.currentPrimaryHandler = () => this.onNextStage();
                break;

            case GameState.GAMEOVER_TIME:
                this.overlayBadgeEl.textContent = 'Time Expired';
                this.overlayBadgeEl.dataset.tone = 'danger';
                this.overlayTitleEl.textContent = 'Out of Time!';
                this.overlaySubtitleEl.textContent =
                    `The clock ran out on Stage ${stage} (${stageTitle}). Try using walls to align both players!`;
                this.setBannerImage('images/GO.png', 'Game Over - Time Out');
                this.overlayPrimaryBtn.textContent = 'Try Again (Enter)';
                this.currentPrimaryHandler = () => this.onRestartStage();
                break;

            case GameState.GAMEOVER_DEAD:
                this.overlayBadgeEl.textContent = 'Water Hazard';
                this.overlayBadgeEl.dataset.tone = 'danger';
                this.overlayTitleEl.textContent = 'Splashed in the Water!';
                this.overlaySubtitleEl.textContent =
                    'Watch both characters closely—when you move one player around a corner, make sure the other avoids the blue water tiles!';
                this.setBannerImage('images/dead.jpg', 'Game Over - Water Hazard');
                this.overlayPrimaryBtn.textContent = 'Try Again (Enter)';
                this.currentPrimaryHandler = () => this.onRestartStage();
                break;
        }
    }

    setBannerImage(src, alt = '') {
        if (!this.overlayBannerEl) return;
        if (!src) {
            this.overlayBannerEl.classList.add('is-hidden');
            this.overlayBannerEl.removeAttribute('src');
            return;
        }
        this.overlayBannerEl.src = src;
        this.overlayBannerEl.alt = alt;
        this.overlayBannerEl.classList.remove('is-hidden');
    }
}
