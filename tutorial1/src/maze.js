import { CONFIG, MAZES } from './config.js';
import { getStageByNumber } from './stages.js';

export class Maze {
    constructor(stage = 1, customMap = null) {
        this.stage = stage;
        if (Array.isArray(customMap) && customMap.length === CONFIG.ROWS) {
            this.map = customMap;
        } else {
            const stageObj = getStageByNumber(stage);
            this.map = (stageObj && stageObj.map) || MAZES[stage - 1] || MAZES[0];
        }
        this.height = this.map.length;
        this.width = this.map[0].length;
    }

    isWall(blockX, blockY) {
        const r = this.height - blockY - 1;
        const c = blockX;
        if (r < 0 || r >= this.height || c < 0 || c >= this.width) {
            return true;
        }
        return this.map[r][c] === '#';
    }

    isHazard(blockX, blockY) {
        const r = this.height - blockY - 1;
        const c = blockX;
        if (r < 0 || r >= this.height || c < 0 || c >= this.width) {
            return false;
        }
        return this.map[r][c] === 'O';
    }

    draw(ctx, assets, elapsedSec = 0) {
        const tileSize = CONFIG.TILE_SIZE;
        const wallImg = assets.get('wall');
        const waterImg = assets.get('water');

        // 1. Draw floor tiles
        for (let r = 0; r < this.height; r++) {
            for (let c = 0; c < this.width; c++) {
                const screenX = c * tileSize;
                const screenY = r * tileSize;
                const isEven = (r + c) % 2 === 0;

                ctx.fillStyle = isEven ? '#1e293b' : '#192334';
                ctx.fillRect(screenX, screenY, tileSize, tileSize);

                // Subtle grid inner line
                ctx.strokeStyle = 'rgba(148, 163, 184, 0.05)';
                ctx.strokeRect(screenX + 0.5, screenY + 0.5, tileSize - 1, tileSize - 1);
            }
        }

        // 2. Draw water hazards and walls
        for (let r = 0; r < this.height; r++) {
            for (let c = 0; c < this.width; c++) {
                const tile = this.map[r][c];
                const screenX = c * tileSize;
                const screenY = r * tileSize;

                if (tile === 'O') {
                    if (waterImg) {
                        ctx.drawImage(waterImg, screenX, screenY, tileSize, tileSize);
                    } else {
                        ctx.fillStyle = '#0284c7';
                        ctx.fillRect(screenX, screenY, tileSize, tileSize);
                    }

                    // Animated water shimmer & danger border
                    const wave = Math.sin(elapsedSec * 3.5 + c * 0.9 + r * 0.7) * 0.14 + 0.18;
                    ctx.fillStyle = `rgba(56, 189, 248, ${wave.toFixed(3)})`;
                    ctx.fillRect(screenX, screenY, tileSize, tileSize);

                    const rippleOffset = Math.sin(elapsedSec * 2.6 + c + r) * 3;
                    ctx.strokeStyle = 'rgba(186, 230, 253, 0.55)';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.arc(screenX + 20, screenY + 20, 9 + rippleOffset, 0, Math.PI * 2);
                    ctx.stroke();

                    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
                    ctx.strokeRect(screenX + 1, screenY + 1, tileSize - 2, tileSize - 2);
                } else if (tile === '#') {
                    // Subtle ambient shadow below walls
                    if (r + 1 < this.height && this.map[r + 1][c] !== '#') {
                        ctx.fillStyle = 'rgba(2, 6, 23, 0.38)';
                        ctx.fillRect(screenX, screenY + tileSize, tileSize, 5);
                    }

                    if (wallImg) {
                        ctx.drawImage(wallImg, screenX, screenY, tileSize, tileSize);
                    } else {
                        ctx.fillStyle = '#475569';
                        ctx.fillRect(screenX, screenY, tileSize, tileSize);
                    }

                    // Top highlight bevel for depth
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
                    ctx.fillRect(screenX, screenY, tileSize, 2);
                }
            }
        }

        // 3. Draw central goal
        this.drawGoal(ctx, assets, elapsedSec);
    }

    drawGoal(ctx, assets, elapsedSec) {
        const goalImg = assets.get('goal');
        const centerX = CONFIG.GOAL.x;
        const centerY = CONFIG.CANVAS_HEIGHT - CONFIG.GOAL.y;
        const drawX = centerX - CONFIG.GOAL.width / 2;
        const drawY = centerY - CONFIG.GOAL.height / 2;

        const pulse = 0.5 + 0.5 * Math.sin(elapsedSec * 4);

        // Pulsing aura beneath the goal
        ctx.save();
        const grad = ctx.createRadialGradient(
            centerX,
            centerY,
            8,
            centerX,
            centerY,
            52 + pulse * 10
        );
        grad.addColorStop(0, `rgba(251, 191, 36, ${(0.36 + pulse * 0.18).toFixed(3)})`);
        grad.addColorStop(0.6, 'rgba(244, 63, 94, 0.14)');
        grad.addColorStop(1, 'rgba(244, 63, 94, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, 54 + pulse * 6, 32 + pulse * 4, 0, 0, Math.PI * 2);
        ctx.fill();

        if (goalImg) {
            ctx.drawImage(goalImg, drawX, drawY, CONFIG.GOAL.width, CONFIG.GOAL.height);
        } else {
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(drawX, drawY, CONFIG.GOAL.width, CONFIG.GOAL.height);
        }

        // Crisp glowing frame around the 2-tile goal zone
        ctx.strokeStyle = `rgba(253, 224, 71, ${(0.55 + pulse * 0.35).toFixed(3)})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(drawX - 1, drawY - 1, CONFIG.GOAL.width + 2, CONFIG.GOAL.height + 2);
        ctx.restore();
    }
}
