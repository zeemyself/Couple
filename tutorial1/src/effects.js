export class EffectsManager {
    constructor() {
        this.particles = [];
        this.ripples = [];
        this.shakeTime = 0;
        this.shakeIntensity = 0;
    }

    clear() {
        this.particles.length = 0;
        this.ripples.length = 0;
        this.shakeTime = 0;
        this.shakeIntensity = 0;
    }

    triggerShake(durationMs = 260, intensity = 6) {
        this.shakeTime = durationMs;
        this.shakeIntensity = intensity;
    }

    spawnTrail(screenX, screenY, color) {
        if (Math.random() > 0.45) return;
        this.particles.push({
            x: screenX + (Math.random() - 0.5) * 14,
            y: screenY + (Math.random() - 0.5) * 14,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4 - 0.15,
            radius: 2 + Math.random() * 2.5,
            alpha: 0.7,
            decay: 0.03,
            color,
            type: 'circle'
        });
    }

    spawnGoalCelebration(screenX, screenY) {
        const colors = ['#ff6b8b', '#ffd166', '#4ecdc4', '#a855f7', '#ffffff'];
        for (let i = 0; i < 42; i++) {
            const angle = (Math.PI * 2 * i) / 42 + (Math.random() - 0.5) * 0.25;
            const speed = 1.4 + Math.random() * 3.8;
            this.particles.push({
                x: screenX,
                y: screenY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1.2,
                gravity: 0.06,
                radius: 3.5 + Math.random() * 3.5,
                alpha: 1,
                decay: 0.015 + Math.random() * 0.01,
                color: colors[i % colors.length],
                type: i % 3 === 0 ? 'heart' : 'circle'
            });
        }
    }

    spawnWaterSplash(screenX, screenY) {
        this.triggerShake(320, 7);
        for (let i = 0; i < 3; i++) {
            this.ripples.push({
                x: screenX,
                y: screenY,
                radius: 4 + i * 6,
                maxRadius: 34 + i * 10,
                alpha: 0.9 - i * 0.2,
                speed: 1.1 + i * 0.2
            });
        }
        const colors = ['#38bdf8', '#bae6fd', '#0284c7', '#ffffff'];
        for (let i = 0; i < 26; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3.2;
            this.particles.push({
                x: screenX,
                y: screenY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 0.8,
                gravity: 0.08,
                radius: 2.5 + Math.random() * 3,
                alpha: 0.95,
                decay: 0.022,
                color: colors[i % colors.length],
                type: 'circle'
            });
        }
    }

    update(dtMs) {
        if (this.shakeTime > 0) {
            this.shakeTime = Math.max(0, this.shakeTime - dtMs);
        }

        const scale = dtMs / 16.67;

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * scale;
            p.y += p.vy * scale;
            if (p.gravity) {
                p.vy += p.gravity * scale;
            }
            p.alpha -= p.decay * scale;
            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }

        for (let i = this.ripples.length - 1; i >= 0; i--) {
            const r = this.ripples[i];
            r.radius += r.speed * scale;
            r.alpha = Math.max(0, 1 - r.radius / r.maxRadius);
            if (r.radius >= r.maxRadius) {
                this.ripples.splice(i, 1);
            }
        }
    }

    applyScreenShake(ctx) {
        if (this.shakeTime <= 0) return false;
        const dx = (Math.random() - 0.5) * this.shakeIntensity * 2;
        const dy = (Math.random() - 0.5) * this.shakeIntensity * 2;
        ctx.save();
        ctx.translate(dx, dy);
        return true;
    }

    restoreScreenShake(ctx, shook) {
        if (shook) {
            ctx.restore();
        }
    }

    draw(ctx) {
        // Draw water ripples
        for (const r of this.ripples) {
            ctx.save();
            ctx.strokeStyle = `rgba(186, 230, 253, ${r.alpha.toFixed(3)})`;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Draw particles
        for (const p of this.particles) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.fillStyle = p.color;

            if (p.type === 'heart') {
                this.drawHeart(ctx, p.x, p.y, p.radius * 1.4);
            } else {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }

    drawHeart(ctx, x, y, size) {
        ctx.beginPath();
        const topCurveHeight = size * 0.3;
        ctx.moveTo(x, y + topCurveHeight);
        ctx.bezierCurveTo(
            x, y,
            x - size / 2, y,
            x - size / 2, y + topCurveHeight
        );
        ctx.bezierCurveTo(
            x - size / 2, y + (size + topCurveHeight) / 2,
            x, y + (size + topCurveHeight) / 1.5,
            x, y + size
        );
        ctx.bezierCurveTo(
            x, y + (size + topCurveHeight) / 1.5,
            x + size / 2, y + (size + topCurveHeight) / 2,
            x + size / 2, y + topCurveHeight
        );
        ctx.bezierCurveTo(
            x + size / 2, y,
            x, y,
            x, y + topCurveHeight
        );
        ctx.closePath();
        ctx.fill();
    }
}
