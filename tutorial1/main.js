const TILE_SIZE = 48;
const GRID_WIDTH = 20;
const GRID_HEIGHT = 13;

const stageTimes = [5, 10, 40, 30, 40, 60];

const maps = [
  [
    '####################',
    '#....#..#.....#....#',
    '#.##...#...##.#.##.#',
    '#....#...#....#....#',
    '#.#####.#.######.#.#',
    '#.....#.#........#.#',
    '#.#.###.#.######.#.#',
    '#.#.....#....#...#.#',
    '#.###.######.#.###.#',
    '#.#......#...#.#...#',
    '#.#####.##.###.#.###',
    '#.......#.........O#',
    '####################',
  ],
  [
    '####################',
    '#.#...#......#...#.#',
    '#.###.###..###.###O#',
    '#..................#',
    '####################',
    '#.###............#.#',
    '#.###.###..###.###.#',
    '#.#...#......#...#.#',
    '#.#.###.####.###.#.#',
    '#.#.#..........#.#.#',
    '#.....###..###.#.#.#',
    '#.#.#..........#...#',
    '####################',
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
    '####################',
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
    '####################',
  ],
  [
    '####################',
    '#....#.....O......##',
    '#.##.#.###.#####...#',
    '#.#..#...#.....#.###',
    '#.#.###.#.###.#....#',
    '#.#...#.#.#...#.##.#',
    '#.###.#.#.#.###.##.#',
    '#.....#...#.....#..#',
    '#.#########.#####..#',
    '#.....O........#...#',
    '#.#####.#######.#.##',
    '#...............#..#',
    '####################',
  ],
  [
    '####################',
    '#......O....#......#',
    '#.####.###..#.####.#',
    '#.#......#..#....#.#',
    '#.#.####.#.###.#.#.#',
    '#...#....#.....#...#',
    '###.#.#########.####',
    '#...#.........#....#',
    '#.#####.###.#.###..#',
    '#.....#.#...#..O#..#',
    '#.###.#.#.#####.#.##',
    '#...#...#.......#..#',
    '####################',
  ],
];

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const stageText = document.getElementById('stageText');
const timerText = document.getElementById('timerText');
const messageText = document.getElementById('messageText');
const startButton = document.getElementById('startButton');

const game = {
  stage: 1,
  running: false,
  ended: false,
  timeRemaining: stageTimes[0],
  tickAccumulator: 0,
  playerA: { x: 1, y: 1, dir: { x: 0, y: 0 }, pending: { x: 0, y: 0 } },
  playerB: { x: 18, y: 11, dir: { x: 0, y: 0 }, pending: { x: 0, y: 0 } },
};

const goalCells = [
  { x: 9, y: 6 },
  { x: 10, y: 6 },
];

function mapAt(stage = game.stage) {
  return maps[stage - 1];
}

function isWall(x, y) {
  const map = mapAt();
  if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) return true;
  return map[GRID_HEIGHT - y - 1][x] === '#';
}

function isHazard(x, y) {
  const map = mapAt();
  return map[GRID_HEIGHT - y - 1][x] === 'O';
}

function resetPlayers() {
  game.playerA = { x: 1, y: 1, dir: { x: 0, y: 0 }, pending: { x: 0, y: 0 } };
  game.playerB = { x: 18, y: 11, dir: { x: 0, y: 0 }, pending: { x: 0, y: 0 } };
}

function resetStage() {
  game.running = true;
  game.ended = false;
  game.timeRemaining = stageTimes[game.stage - 1] ?? 20;
  resetPlayers();
  messageText.textContent = 'Arrow keys move both players in mirrored directions.';
  stageText.textContent = `Stage: ${game.stage}`;
}

function gameOver(text) {
  game.running = false;
  game.ended = true;
  messageText.textContent = `${text} Press Start / Space to retry.`;
}

function advanceStage() {
  game.running = false;
  game.ended = true;

  if (game.stage >= maps.length) {
    messageText.textContent = 'You cleared all stages! Press Start to play again from stage 1.';
    game.stage = 1;
    return;
  }

  game.stage += 1;
  messageText.textContent = `Stage clear! Press Start / Space for Stage ${game.stage}.`;
  stageText.textContent = `Stage: ${game.stage}`;
}

function setMirroredDirection(dx, dy) {
  game.playerA.pending = { x: dx, y: dy };
  game.playerB.pending = { x: -dx, y: -dy };
}

function canMove(player, dir) {
  if (dir.x === 0 && dir.y === 0) return true;
  const nx = player.x + dir.x;
  const ny = player.y + dir.y;
  return !isWall(nx, ny);
}

function movePlayer(player) {
  if (canMove(player, player.pending)) {
    player.dir = player.pending;
  } else {
    player.dir = { x: 0, y: 0 };
  }

  if (!canMove(player, player.dir)) return;

  player.x += player.dir.x;
  player.y += player.dir.y;
}

function checkEndConditions() {
  if (isHazard(game.playerA.x, game.playerA.y) || isHazard(game.playerB.x, game.playerB.y)) {
    gameOver('One player touched water.');
    return;
  }

  const p1OnGoal = goalCells.some((g) => g.x === game.playerA.x && g.y === game.playerA.y);
  const p2OnGoal = goalCells.some((g) => g.x === game.playerB.x && g.y === game.playerB.y);

  if (p1OnGoal && p2OnGoal) {
    advanceStage();
  }
}

function update(dt) {
  if (!game.running) return;

  game.timeRemaining = Math.max(0, game.timeRemaining - dt);
  timerText.textContent = `Time: ${Math.ceil(game.timeRemaining)}`;

  if (game.timeRemaining <= 0) {
    gameOver('Time up.');
    return;
  }

  game.tickAccumulator += dt;
  if (game.tickAccumulator < 0.12) return;
  game.tickAccumulator = 0;

  movePlayer(game.playerA);
  movePlayer(game.playerB);
  checkEndConditions();
}

function drawTile(x, y, type) {
  const px = x * TILE_SIZE;
  const py = (GRID_HEIGHT - y - 1) * TILE_SIZE;

  if (type === '#') {
    ctx.fillStyle = '#4d87ff';
    ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = '#84adff';
    ctx.fillRect(px + 6, py + 6, TILE_SIZE - 12, TILE_SIZE - 12);
  } else if (type === 'O') {
    ctx.fillStyle = '#2069f4';
    ctx.beginPath();
    ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, TILE_SIZE / 2.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlayer(player, color) {
  const px = player.x * TILE_SIZE + TILE_SIZE / 2;
  const py = (GRID_HEIGHT - player.y - 1) * TILE_SIZE + TILE_SIZE / 2;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(px, py, TILE_SIZE / 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawGoal() {
  ctx.fillStyle = '#ffce55';
  for (const g of goalCells) {
    const px = g.x * TILE_SIZE;
    const py = (GRID_HEIGHT - g.y - 1) * TILE_SIZE;
    ctx.fillRect(px + 10, py + 10, TILE_SIZE - 20, TILE_SIZE - 20);
  }
}

function render() {
  const map = mapAt();

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#111629';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let row = 0; row < GRID_HEIGHT; row += 1) {
    for (let col = 0; col < GRID_WIDTH; col += 1) {
      drawTile(col, GRID_HEIGHT - row - 1, map[row][col]);
    }
  }

  drawGoal();
  drawPlayer(game.playerA, '#f87171');
  drawPlayer(game.playerB, '#34d399');

  if (!game.running) {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = '600 30px system-ui';
    ctx.fillText(game.ended ? 'Paused' : 'Ready', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '500 20px system-ui';
    ctx.fillText('Press Start or Space', canvas.width / 2, canvas.height / 2 + 16);
  }
}

let previousTime = performance.now();
function loop(now) {
  const dt = (now - previousTime) / 1000;
  previousTime = now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

function start() {
  resetStage();
  timerText.textContent = `Time: ${Math.ceil(game.timeRemaining)}`;
}

window.addEventListener('keydown', (event) => {
  switch (event.key) {
    case 'ArrowLeft':
      setMirroredDirection(-1, 0);
      event.preventDefault();
      break;
    case 'ArrowRight':
      setMirroredDirection(1, 0);
      event.preventDefault();
      break;
    case 'ArrowUp':
      setMirroredDirection(0, 1);
      event.preventDefault();
      break;
    case 'ArrowDown':
      setMirroredDirection(0, -1);
      event.preventDefault();
      break;
    case ' ':
    case 'Enter':
      start();
      event.preventDefault();
      break;
    default:
      break;
  }
});

window.addEventListener('keyup', (event) => {
  if (event.key.startsWith('Arrow')) {
    setMirroredDirection(0, 0);
  }
});

startButton.addEventListener('click', start);

timerText.textContent = `Time: ${Math.ceil(game.timeRemaining)}`;
requestAnimationFrame(loop);
