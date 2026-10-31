export const ASSET_MANIFEST = {
    player1: 'images/player.png',
    player2: 'images/player2.png',
    wall: 'images/wall2.png',
    water: 'images/water.png',
    goal: 'images/goal.png',
    clock: 'images/clock.png',
    welcome: 'images/welcome.png',
    gameover_time: 'images/GO.png',
    gameover_win: 'images/win.png',
    gameover_dead: 'images/dead.jpg'
};

export class AssetLoader {
    constructor() {
        this.images = new Map();
    }

    async loadAll(manifest = ASSET_MANIFEST) {
        const entries = Object.entries(manifest);
        await Promise.all(
            entries.map(([key, src]) => this.loadImage(key, src))
        );
        return this;
    }

    loadImage(key, src) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                this.images.set(key, img);
                resolve(img);
            };
            img.onerror = () => {
                console.warn(`Asset fallback activated for: ${src}`);
                this.images.set(key, null);
                resolve(null);
            };
            img.src = src;
        });
    }

    get(key) {
        const img = this.images.get(key);
        return img && img.complete && img.naturalWidth > 0 ? img : null;
    }
}
