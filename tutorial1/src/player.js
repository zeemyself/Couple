import { CONFIG, Direction } from './config.js';

export class Player {
    constructor(x, y, playerNum, maze) {
        this.x = x;
        this.y = y;
        this.prevX = x;
        this.prevY = y;
        this.playerNum = playerNum;
        this.maze = maze;
        this.direction = Direction.STILL;
        this.nextDirection = Direction.STILL;
        this.stepPhase = 0;
    }

    isAtCenter() {
        return (this.x + 20) % CONFIG.TILE_SIZE === 0 &&
               (this.y + 20) % CONFIG.TILE_SIZE === 0;
    }

    isPossibleToMove(dir) {
        if (dir === Direction.STILL) return true;

        let nextBlockX = (this.x - 20) / CONFIG.TILE_SIZE;
        let nextBlockY = (this.y - 20) / CONFIG.TILE_SIZE;

        switch (dir) {
            case Direction.UP:
                nextBlockY += 1;
                break;
            case Direction.DOWN:
                nextBlockY -= 1;
                break;
            case Direction.LEFT:
                nextBlockX -= 1;
                break;
            case Direction.RIGHT:
                nextBlockX += 1;
                break;
        }

        return !this.maze.isWall(nextBlockX, nextBlockY);
    }

    update() {
        this.prevX = this.x;
        this.prevY = this.y;

        if (this.isAtCenter()) {
            if (this.isPossibleToMove(this.nextDirection)) {
                this.direction = this.nextDirection;
            } else if (!this.isPossibleToMove(this.direction)) {
                this.direction = Direction.STILL;
            } else {
                this.direction = Direction.STILL;
            }
        }

        switch (this.direction) {
            case Direction.UP:
                this.y += CONFIG.MOVE_STEP;
                break;
            case Direction.DOWN:
                this.y -= CONFIG.MOVE_STEP;
                break;
            case Direction.LEFT:
                this.x -= CONFIG.MOVE_STEP;
                break;
            case Direction.RIGHT:
                this.x += CONFIG.MOVE_STEP;
                break;
        }

        if (this.direction !== Direction.STILL) {
            this.stepPhase += 0.35;
        } else {
            this.stepPhase = 0;
        }
    }

    isDead() {
        const blockX = Math.round((this.x - 20) / CONFIG.TILE_SIZE);
        const blockY = Math.round((this.y - 20) / CONFIG.TILE_SIZE);
        return this.maze.isHazard(blockX, blockY);
    }

    getScreenCenter(alpha = 1) {
        const interpX = this.prevX + (this.x - this.prevX) * alpha;
        const interpY = this.prevY + (this.y - this.prevY) * alpha;
        return {
            x: interpX,
            y: CONFIG.CANVAS_HEIGHT - interpY
        };
    }

    draw(ctx, assets, alpha = 1) {
        const { x: screenX, y: screenY } = this.getScreenCenter(alpha);
        const bobOffset = this.direction !== Direction.STILL
            ? Math.abs(Math.sin(this.stepPhase)) * 2.5
            : 0;

        const isP1 = this.playerNum === 1;
        const accentColor = isP1 ? '#fb7185' : '#38bdf8';
        const sprite = assets.get(isP1 ? 'player1' : 'player2');

        ctx.save();

        // Ground shadow
        ctx.fillStyle = 'rgba(2, 6, 23, 0.45)';
        ctx.beginPath();
        ctx.ellipse(screenX, screenY + 16, 13, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Subtle player ring highlight
        ctx.strokeStyle = isP1 ? 'rgba(251, 113, 133, 0.55)' : 'rgba(56, 189, 248, 0.55)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(screenX, screenY - bobOffset, 19, 0, Math.PI * 2);
        ctx.stroke();

        // Original 40x40 sprite
        if (sprite) {
            ctx.drawImage(
                sprite,
                screenX - 20,
                screenY - 20 - bobOffset,
                CONFIG.TILE_SIZE,
                CONFIG.TILE_SIZE
            );
        } else {
            ctx.fillStyle = accentColor;
            ctx.beginPath();
            ctx.arc(screenX, screenY - bobOffset, 15, 0, Math.PI * 2);
            ctx.fill();
        }

        // Floating P1 / P2 badge for quick visual identification
        const badgeY = screenY - 26 - bobOffset;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(screenX - 11, badgeY - 7, 22, 13, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.font = '700 9px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(isP1 ? 'P1' : 'P2', screenX, badgeY);

        ctx.restore();
    }
}
