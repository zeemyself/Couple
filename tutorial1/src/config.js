export const CONFIG = {
    TILE_SIZE: 40,
    COLS: 20,
    ROWS: 13,
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 520,
    MOVE_STEP: 5,
    TICK_RATE: 60,
    FIXED_DT: 1000 / 60,
    MAX_FRAME_DELTA: 100,
    AUTO_ADVANCE_MS: 2800,
    SPAWN_P1: { x: 60, y: 60 },
    SPAWN_P2: { x: 740, y: 460 },
    GOAL: {
        x: 400,
        y: 260,
        width: 80,
        height: 40,
        p1TargetX: 380,
        p2TargetX: 420,
        targetY: 260,
        tolerance: 8
    },
    STAGE_TIMES: [60, 60, 60, 60]
};

export const Direction = Object.freeze({
    STILL: 0,
    LEFT: 1,
    RIGHT: 2,
    UP: 3,
    DOWN: 4
});

export const OppositeDirection = Object.freeze({
    [Direction.STILL]: Direction.STILL,
    [Direction.LEFT]: Direction.RIGHT,
    [Direction.RIGHT]: Direction.LEFT,
    [Direction.UP]: Direction.DOWN,
    [Direction.DOWN]: Direction.UP
});

export const GameState = Object.freeze({
    LOADING: 'loading',
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    STAGE_COMPLETE: 'stage_complete',
    GAMEOVER_TIME: 'gameover_time',
    GAMEOVER_DEAD: 'gameover_dead',
    VICTORY: 'victory'
});

export const MAZES = [
    // Stage 1: Classic Symmetry
    [
        '####################',
        '#..................#',
        '#.###.###..###.###.#',
        '#.#...#.O....#...#.#',
        '#.#.###.####.###.#.#',
        '#.#.#..........#.#.#',
        '#.....###..###.....#',
        '#.#.#..........#.#.#',
        '#.#.###O####.###.#.#',
        '#.#...#......#...#.#',
        '#.###.###..###.###O#',
        '#..................#',
        '####################'
    ],
    // Stage 2: Tight Corridors
    [
        '####################',
        '#.###............#.#',
        '#.###.###..###.###.#',
        '#.#...#......#...#.#',
        '#.#.###.####.###.#.#',
        '#.#.#..........#.#.#',
        '#.....###..###.#.#.#',
        '#.#.#..........#...#',
        '#.#.###O####.###.#.#',
        '#.#...#......#...#.#',
        '#.#######..###.###.#',
        '#.#..............#.#',
        '####################'
    ],
    // Stage 3: Water Lakes
    [
        '####################',
        '#.##.#.OOO..##.#.#.#',
        '#.##.#.OOO..##...#.#',
        '#.##...OOO.#.#.#.#.#',
        '#.##.#.OOO##.#.#.#.#',
        '#.#..#...#.#.#.#.#.#',
        '#..#.#.......#.#.#.#',
        '#.#..####.##...#.#.#',
        '#.##..OOO##.##.#.#.#',
        '#.##O........#.#.#.#',
        '#..#OOO####.##.#...#',
        '#............O.#.#.#',
        '####################'
    ],
    // Stage 4: Labyrinth Finale
    [
        '####################',
        '#..................#',
        '#.############.#####',
        '#.#.#...#O...#.....#',
        '#...###.#..#.#####.#',
        '#.#.#......#.#.....#',
        '#...#.###..#.O..####',
        '#.#.#.#....#.#.....#',
        '#.#.#.#.#..#.#####.#',
        '#.#...#.##.#.......#',
        '#.#.#...#..#######.#',
        '#.#.########.......#',
        '####################'
    ]
];

export const STAGE_NAMES = [
    'Mirror Courtyard',
    'Twin Corridors',
    'Flooded Ruins',
    'Labyrinth Finale'
];
