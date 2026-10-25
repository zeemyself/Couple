import { CONFIG, Direction } from './config.js';

export const GRID_POSITIONS = Object.freeze({
    P1_SPAWN: { r: 11, c: 1 },
    P2_SPAWN: { r: 1, c: 18 },
    P1_GOAL: { r: 6, c: 9 },
    P2_GOAL: { r: 6, c: 10 }
});

const VALID_CHARS = new Set(['#', '.', 'O']);

const MOVES = [
    { dir: Direction.UP, name: 'UP', dr1: -1, dc1: 0, dr2: 1, dc2: 0 },
    { dir: Direction.DOWN, name: 'DOWN', dr1: 1, dc1: 0, dr2: -1, dc2: 0 },
    { dir: Direction.LEFT, name: 'LEFT', dr1: 0, dc1: -1, dr2: 0, dc2: 1 },
    { dir: Direction.RIGHT, name: 'RIGHT', dr1: 0, dc1: 1, dr2: 0, dc2: -1 }
];

/**
 * Parses raw text (ASCII lines or JSON string/object) into stage metadata and map array.
 */
export function parseStageInput(input) {
    if (!input) {
        return { error: 'Stage input is empty.' };
    }

    if (typeof input === 'object' && Array.isArray(input.map)) {
        return {
            name: typeof input.name === 'string' ? input.name.trim() : '',
            map: input.map.map((row) => String(row).trim())
        };
    }

    const text = String(input).trim();
    if (!text) {
        return { error: 'Stage input is empty.' };
    }

    // Try JSON format first if it starts with '{' or '['
    if (text.startsWith('{') || text.startsWith('[')) {
        try {
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed)) {
                return {
                    name: '',
                    map: parsed.map((row) => String(row).trim())
                };
            }
            if (parsed && Array.isArray(parsed.map)) {
                return {
                    name: typeof parsed.name === 'string' ? parsed.name.trim() : '',
                    map: parsed.map.map((row) => String(row).trim())
                };
            }
            return { error: 'JSON stage must be an array of row strings or an object with a "map" array.' };
        } catch (err) {
            return { error: `Invalid JSON format: ${err.message}` };
        }
    }

    // Otherwise parse as newline-delimited ASCII rows (supporting quoted/comma-separated lines too)
    const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim().replace(/^['"]|['"],?$/g, ''))
        .filter((line) => line.length > 0);

    return {
        name: '',
        map: lines
    };
}

/**
 * Validates that a stage map array meets all structural rules.
 */
export function validateStageGrid(map) {
    const errors = [];

    if (!Array.isArray(map)) {
        return { valid: false, errors: ['Stage map must be an array of strings.'] };
    }

    if (map.length !== CONFIG.ROWS) {
        errors.push(`Stage must have exactly ${CONFIG.ROWS} rows (found ${map.length}).`);
    }

    for (let r = 0; r < map.length; r++) {
        const row = map[r];
        if (typeof row !== 'string' || row.length !== CONFIG.COLS) {
            errors.push(`Row ${r + 1} must have exactly ${CONFIG.COLS} columns (found ${typeof row === 'string' ? row.length : 'invalid'}).`);
            continue;
        }

        for (let c = 0; c < row.length; c++) {
            const ch = row[c];
            if (!VALID_CHARS.has(ch)) {
                errors.push(`Invalid character "${ch}" at row ${r + 1}, col ${c + 1}. Allowed: '#', '.', 'O'.`);
            }
        }
    }

    if (errors.length > 0) {
        return { valid: false, errors };
    }

    // Check outer border walls
    for (let c = 0; c < CONFIG.COLS; c++) {
        if (map[0][c] !== '#' || map[CONFIG.ROWS - 1][c] !== '#') {
            errors.push('Top and bottom border rows must be enclosed with walls (#).');
            break;
        }
    }
    for (let r = 0; r < CONFIG.ROWS; r++) {
        if (map[r][0] !== '#' || map[r][CONFIG.COLS - 1] !== '#') {
            errors.push('Left and right border columns must be enclosed with walls (#).');
            break;
        }
    }

    // Check critical positions (P1 Spawn, P2 Spawn, Central Goal)
    const { P1_SPAWN, P2_SPAWN, P1_GOAL, P2_GOAL } = GRID_POSITIONS;

    if (map[P1_SPAWN.r][P1_SPAWN.c] !== '.') {
        errors.push(`Player 1 spawn at (row ${P1_SPAWN.r + 1}, col ${P1_SPAWN.c + 1}) must be open floor (.).`);
    }
    if (map[P2_SPAWN.r][P2_SPAWN.c] !== '.') {
        errors.push(`Player 2 spawn at (row ${P2_SPAWN.r + 1}, col ${P2_SPAWN.c + 1}) must be open floor (.).`);
    }
    if (map[P1_GOAL.r][P1_GOAL.c] !== '.' || map[P2_GOAL.r][P2_GOAL.c] !== '.') {
        errors.push(`Central goal tiles at row ${P1_GOAL.r + 1}, cols ${P1_GOAL.c + 1}–${P2_GOAL.c + 1} must be open floor (.).`);
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Runs a Breadth-First Search (BFS) over the 2-player mirrored movement state space
 * to verify whether the maze is solvable without hitting water hazards.
 */
export function solveStage(map) {
    const validation = validateStageGrid(map);
    if (!validation.valid) {
        return {
            valid: false,
            errors: validation.errors,
            solvable: false,
            minMoves: null,
            solution: null,
            visitedStates: 0,
            reason: validation.errors[0]
        };
    }

    const rows = CONFIG.ROWS;
    const cols = CONFIG.COLS;
    const numCells = rows * cols;
    const totalStates = numCells * numCells;

    const { P1_SPAWN, P2_SPAWN, P1_GOAL, P2_GOAL } = GRID_POSITIONS;

    const encodeState = (r1, c1, r2, c2) =>
        ((r1 * cols + c1) * numCells) + (r2 * cols + c2);

    const startState = encodeState(P1_SPAWN.r, P1_SPAWN.c, P2_SPAWN.r, P2_SPAWN.c);
    const goalState = encodeState(P1_GOAL.r, P1_GOAL.c, P2_GOAL.r, P2_GOAL.c);

    const visited = new Uint8Array(totalStates);
    const parentState = new Int32Array(totalStates);
    const parentMove = new Uint8Array(totalStates);
    parentState.fill(-1);

    const queue = new Int32Array(totalStates);
    let head = 0;
    let tail = 0;

    visited[startState] = 1;
    queue[tail++] = startState;

    const isWall = (r, c) => r < 0 || r >= rows || c < 0 || c >= cols || map[r][c] === '#';
    const isHazard = (r, c) => r >= 0 && r < rows && c >= 0 && c < cols && map[r][c] === 'O';

    while (head < tail) {
        const current = queue[head++];
        if (current === goalState) {
            const solution = [];
            let cur = goalState;
            while (cur !== startState) {
                const moveIdx = parentMove[cur];
                solution.push(MOVES[moveIdx].name);
                cur = parentState[cur];
            }
            solution.reverse();

            return {
                valid: true,
                errors: [],
                solvable: true,
                minMoves: solution.length,
                solution,
                visitedStates: tail,
                reason: `Maze is solvable in ${solution.length} moves.`
            };
        }

        const cell1 = Math.floor(current / numCells);
        const cell2 = current % numCells;
        const r1 = Math.floor(cell1 / cols);
        const c1 = cell1 % cols;
        const r2 = Math.floor(cell2 / cols);
        const c2 = cell2 % cols;

        for (let m = 0; m < MOVES.length; m++) {
            const { dr1, dc1, dr2, dc2 } = MOVES[m];

            let nr1 = r1 + dr1;
            let nc1 = c1 + dc1;
            if (isWall(nr1, nc1)) {
                nr1 = r1;
                nc1 = c1;
            }

            let nr2 = r2 + dr2;
            let nc2 = c2 + dc2;
            if (isWall(nr2, nc2)) {
                nr2 = r2;
                nc2 = c2;
            }

            // If either player steps onto a water hazard tile, this move is fatal
            if (isHazard(nr1, nc1) || isHazard(nr2, nc2)) {
                continue;
            }

            const next = encodeState(nr1, nc1, nr2, nc2);
            if (!visited[next]) {
                visited[next] = 1;
                parentState[next] = current;
                parentMove[next] = m;
                queue[tail++] = next;
            }
        }
    }

    return {
        valid: true,
        errors: [],
        solvable: false,
        minMoves: null,
        solution: null,
        visitedStates: tail,
        reason: 'No valid path exists for both players to reach the central goal simultaneously without hitting water.'
    };
}
