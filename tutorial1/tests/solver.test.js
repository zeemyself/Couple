import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG, Direction, OppositeDirection, MAZES } from '../src/config.js';
import { Maze } from '../src/maze.js';
import { Player } from '../src/player.js';
import { parseStageInput, solveStage, validateStageGrid } from '../src/solver.js';
import { addCustomStage, deleteCustomStage, getAllStages, getCustomStages } from '../src/stages.js';

const NAME_TO_DIR = {
    UP: Direction.UP,
    DOWN: Direction.DOWN,
    LEFT: Direction.LEFT,
    RIGHT: Direction.RIGHT
};

test('Built-in stages are structurally valid and solvable via BFS', () => {
    for (let i = 0; i < MAZES.length; i++) {
        const map = MAZES[i];
        const validation = validateStageGrid(map);
        assert.equal(validation.valid, true, `Stage ${i + 1} should be structurally valid`);

        const result = solveStage(map);
        assert.equal(result.solvable, true, `Stage ${i + 1} should be solvable`);
        assert.ok(result.minMoves > 0, `Stage ${i + 1} should require at least 1 move`);
        assert.equal(result.solution.length, result.minMoves);
    }
});

test('BFS solution moves actually solve the stage in Player/Maze physics simulation', () => {
    for (let i = 0; i < MAZES.length; i++) {
        const map = MAZES[i];
        const result = solveStage(map);
        assert.equal(result.solvable, true);

        const maze = new Maze(i + 1, map);
        const p1 = new Player(CONFIG.SPAWN_P1.x, CONFIG.SPAWN_P1.y, 1, maze);
        const p2 = new Player(CONFIG.SPAWN_P2.x, CONFIG.SPAWN_P2.y, 2, maze);

        const ticksPerTile = CONFIG.TILE_SIZE / CONFIG.MOVE_STEP;

        for (const moveName of result.solution) {
            const dir = NAME_TO_DIR[moveName];
            p1.nextDirection = dir;
            p2.nextDirection = OppositeDirection[dir];

            for (let t = 0; t < ticksPerTile; t++) {
                p1.update();
                p2.update();
                assert.equal(p1.isDead(), false, `P1 should not hit water on Stage ${i + 1}`);
                assert.equal(p2.isDead(), false, `P2 should not hit water on Stage ${i + 1}`);
            }
        }

        assert.equal(p1.x, CONFIG.GOAL.p1TargetX, `P1 should end at goal X on Stage ${i + 1}`);
        assert.equal(p1.y, CONFIG.GOAL.targetY, `P1 should end at goal Y on Stage ${i + 1}`);
        assert.equal(p2.x, CONFIG.GOAL.p2TargetX, `P2 should end at goal X on Stage ${i + 1}`);
        assert.equal(p2.y, CONFIG.GOAL.targetY, `P2 should end at goal Y on Stage ${i + 1}`);
    }
});

test('Unsolvable mazes are rejected by solveStage and addCustomStage', () => {
    // Goal completely walled off above and below
    const walledGoalMap = [
        '####################',
        '#..................#',
        '#..................#',
        '#..................#',
        '#..................#',
        '#.......####.......#',
        '#.......#..#.......#',
        '#.......####.......#',
        '#..................#',
        '#..................#',
        '#..................#',
        '#..................#',
        '####################'
    ];

    const res1 = solveStage(walledGoalMap);
    assert.equal(res1.valid, true);
    assert.equal(res1.solvable, false);
    assert.equal(res1.solution, null);

    // Goal surrounded by fatal water hazards ('O')
    const waterTrapMap = [
        '####################',
        '#..................#',
        '#..................#',
        '#..................#',
        '#..................#',
        '#.......OOOO.......#',
        '#.......O..O.......#',
        '#.......OOOO.......#',
        '#..................#',
        '#..................#',
        '#..................#',
        '#..................#',
        '####################'
    ];

    const res2 = solveStage(waterTrapMap);
    assert.equal(res2.valid, true);
    assert.equal(res2.solvable, false);

    assert.throws(() => {
        addCustomStage({ name: 'Impossible Maze', map: walledGoalMap });
    }, /No valid path exists/);
});

test('Structural validation catches invalid dimensions, characters, and blocked spawns/goal', () => {
    // Wrong row count
    const shortMap = MAZES[0].slice(0, 10);
    assert.equal(validateStageGrid(shortMap).valid, false);

    // Invalid character
    const badCharMap = [...MAZES[0]];
    badCharMap[1] = '#........X.........#';
    assert.equal(validateStageGrid(badCharMap).valid, false);

    // Blocked P1 spawn at (r=11, c=1)
    const blockedSpawnMap = [...MAZES[0]];
    blockedSpawnMap[11] = '##.................#';
    assert.equal(validateStageGrid(blockedSpawnMap).valid, false);

    // Blocked central goal at (r=6, c=9..10)
    const blockedGoalMap = [...MAZES[0]];
    blockedGoalMap[6] = '#.....########.....#';
    assert.equal(validateStageGrid(blockedGoalMap).valid, false);
});

test('parseStageInput parses both raw ASCII text and JSON stage formats', () => {
    const asciiText = MAZES[0].join('\n');
    const parsedAscii = parseStageInput(asciiText);
    assert.ok(!parsedAscii.error);
    assert.equal(parsedAscii.map.length, 13);

    const jsonText = JSON.stringify({
        name: 'Uploaded JSON Stage',
        map: MAZES[1]
    });
    const parsedJson = parseStageInput(jsonText);
    assert.ok(!parsedJson.error);
    assert.equal(parsedJson.name, 'Uploaded JSON Stage');
    assert.deepEqual(parsedJson.map, MAZES[1]);
});

test('addCustomStage stores solvable stage and deleteCustomStage removes it', () => {
    const beforeCount = getCustomStages().length;
    const saved = addCustomStage({
        name: 'Unit Test Stage',
        map: MAZES[0]
    });

    assert.equal(saved.name, 'Unit Test Stage');
    assert.equal(saved.isCustom, true);
    assert.equal(getCustomStages().length, beforeCount + 1);
    assert.equal(getAllStages().length, MAZES.length + beforeCount + 1);

    deleteCustomStage(saved.id);
    assert.equal(getCustomStages().length, beforeCount);
});
