const CELL = 40;
const COLS = 20;
const ROWS = 13;
const TOP_OFFSET = 40;
const GOAL_A = { x: 380, y: 260 };
const GOAL_B = { x: 420, y: 260 };
const START_A = { x: 60, y: 60 };
const START_B = { x: 740, y: 460 };

const STAGES = [
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

const STAGE_TIMES = [5, 10, 40, 30];
const KEYS = new Set();

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const state = {
  gameState: 'menu',
  stage: 1,
  timer: STAGE_TIMES[0],
  playerA: { ...START_A },
  playerB: { ...START_B },
  velocity: 220,
  message: 'Press Space to Start'
};

const clamp = (n, min, max) => Math.max(min, Math.min(n, max));
const near = (a, b, eps = 12) => Math.abs(a - b) <= eps;

function worldToCell(x, y) {
  const cellX = Math.round((x - 20) / CELL);
  const cellY = Math.round((y - 20) / CELL);
  return { x: cellX, y: cellY };
}

function cellToStageRow(cellY) {
  return ROWS - cellY - 1;
}

function tileAt(stage, cellX, cellY) {
  const map = STAGES[stage - 1];
  if (cellX < 0 || cellX >= COLS || cellY < 0 || cellY >= ROWS) return '#';
  return map[cellToStageRow(cellY)][cellX];
}

function isWalkable(stage, x, y) {
  const { x: cx, y: cy } = worldToCell(x, y);
  return tileAt(stage, cx, cy) !== '#';
}

function isHazard(stage, x, y) {
  const { x: cx, y: cy } = worldToCell(x, y);
  return tileAt(stage, cx, cy) === 'O';
}

function resetPlayers() {
  state.playerA = { ...START_A };
  state.playerB = { ...START_B };
}

function startStage(stageNumber) {
  state.stage = stageNumber;
  state.timer = STAGE_TIMES[stageNumber - 1];
  state.gameState = 'playing';
  state.message = '';
  resetPlayers();
}

function onKeyDown(e) {
  KEYS.add(e.code);
  if (e.code === 'Space') {
    e.preventDefault();
    if (state.gameState === 'menu') startStage(1);
    else if (state.gameState === 'won-stage') {
      if (state.stage < STAGES.length) startStage(state.stage + 1);
      else {
        state.gameState = 'menu';
        state.stage = 1;
        state.message = 'You cleared all stages! Press Space to play again';
      }
    } else if (state.gameState === 'lost') startStage(state.stage);
  }
}

function onKeyUp(e) {
  KEYS.delete(e.code);
}

window.addEventListener('keydown', onKeyDown);
window.addEventListener('keyup', onKeyUp);

function movePlayers(dt) {
  const input = { x: 0, y: 0 };
  if (KEYS.has('ArrowLeft')) input.x = -1;
  if (KEYS.has('ArrowRight')) input.x = 1;
  if (KEYS.has('ArrowUp')) input.y = 1;
  if (KEYS.has('ArrowDown')) input.y = -1;

  const dirA = input;
  const dirB = { x: -input.x, y: -input.y };

  const step = state.velocity * dt;
  const tryMove = (player, dir) => {
    const next = {
      x: clamp(player.x + dir.x * step, 20, 780),
      y: clamp(player.y + dir.y * step, 20, 500)
    };
    if (isWalkable(state.stage, next.x, player.y)) player.x = next.x;
    if (isWalkable(state.stage, player.x, next.y)) player.y = next.y;
  };

  tryMove(state.playerA, dirA);
  tryMove(state.playerB, dirB);
}

function update(dt) {
  if (state.gameState !== 'playing') return;

  movePlayers(dt);
  state.timer -= dt;

  if (isHazard(state.stage, state.playerA.x, state.playerA.y) || isHazard(state.stage, state.playerB.x, state.playerB.y)) {
    state.gameState = 'lost';
    state.message = 'You fell into water. Press Space to retry';
    return;
  }

  const reachedGoal =
    near(state.playerA.x, GOAL_A.x) && near(state.playerA.y, GOAL_A.y) && near(state.playerB.x, GOAL_B.x) && near(state.playerB.y, GOAL_B.y);
  if (reachedGoal) {
    state.gameState = 'won-stage';
    state.message = state.stage < STAGES.length ? 'Stage cleared! Press Space for next stage' : 'Victory! Press Space to restart';
    return;
  }

  if (state.timer <= 0) {
    state.timer = 0;
    state.gameState = 'lost';
    state.message = 'Time is up. Press Space to retry';
  }
}

function drawMaze() {
  const map = STAGES[state.stage - 1];
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const tile = map[row][col];
      const x = col * CELL;
      const y = TOP_OFFSET + row * CELL;
      if (tile === '#') {
        ctx.fillStyle = '#4f5d75';
        ctx.fillRect(x, y, CELL, CELL);
      } else {
        ctx.fillStyle = '#1d2736';
        ctx.fillRect(x, y, CELL, CELL);
        if (tile === 'O') {
          ctx.fillStyle = '#1f8ea8';
          ctx.fillRect(x + 4, y + 4, CELL - 8, CELL - 8);
        }
      }
    }
  }

  ctx.fillStyle = '#f5c542';
  ctx.fillRect(GOAL_A.x - 14, TOP_OFFSET + (ROWS * CELL - GOAL_A.y) - 14, 28, 28);
  ctx.fillRect(GOAL_B.x - 14, TOP_OFFSET + (ROWS * CELL - GOAL_B.y) - 14, 28, 28);
}

function drawPlayer(player, color) {
  const drawX = player.x;
  const drawY = TOP_OFFSET + (ROWS * CELL - player.y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(drawX, drawY, 14, 0, Math.PI * 2);
  ctx.fill();
}

function drawUI() {
  ctx.fillStyle = '#0e1522';
  ctx.fillRect(0, 0, canvas.width, TOP_OFFSET);
  ctx.fillStyle = '#fff';
  ctx.font = '20px system-ui';
  ctx.fillText(`Stage: ${state.stage}/${STAGES.length}`, 20, 27);
  ctx.fillText(`Time: ${Math.ceil(state.timer)}`, 250, 27);
  ctx.fillText('Move with arrow keys (second player mirrors movement)', 430, 27);
}

function drawOverlay() {
  if (!state.message) return;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 36px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('Couple Maze', canvas.width / 2, 250);
  ctx.font = '24px system-ui';
  ctx.fillText(state.message, canvas.width / 2, 310);
  ctx.textAlign = 'start';
}

let lastTs = performance.now();
function frame(ts) {
  const dt = Math.min((ts - lastTs) / 1000, 0.033);
  lastTs = ts;

  update(dt);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawMaze();
  drawPlayer(state.playerA, '#e8606d');
  drawPlayer(state.playerB, '#73a6ff');
  drawUI();
  drawOverlay();

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
