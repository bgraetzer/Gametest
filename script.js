const canvas = document.getElementById("board");
const context = canvas.getContext("2d");
const startButton = document.getElementById("start");
const scoreEl = document.getElementById("score");
const linesEl = document.getElementById("lines");
const levelEl = document.getElementById("level");

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const EMPTY = "#111827";

const COLORS = [
  "#f97316",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#eab308",
  "#ef4444",
  "#06b6d4",
];

const SHAPES = [
  [[1, 1, 1, 1]],
  [
    [1, 0, 0],
    [1, 1, 1],
  ],
  [
    [0, 0, 1],
    [1, 1, 1],
  ],
  [
    [1, 1],
    [1, 1],
  ],
  [
    [0, 1, 1],
    [1, 1, 0],
  ],
  [
    [1, 1, 0],
    [0, 1, 1],
  ],
  [
    [0, 1, 0],
    [1, 1, 1],
  ],
];

let board = createBoard();
let currentPiece = null;
let dropCounter = 0;
let dropInterval = 800;
let lastTime = 0;
let score = 0;
let lines = 0;
let level = 1;
let isRunning = false;

function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function drawCell(x, y, value) {
  context.fillStyle = value ? COLORS[value - 1] : EMPTY;
  context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
  context.strokeStyle = "#1f2937";
  context.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

function drawBoard() {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      drawCell(x, y, board[y][x]);
    }
  }
}

function drawPiece(piece) {
  piece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        drawCell(piece.x + x, piece.y + y, piece.color);
      }
    });
  });
}

function collide(boardState, piece) {
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const newX = piece.x + x;
        const newY = piece.y + y;
        if (newX < 0 || newX >= COLS || newY >= ROWS) {
          return true;
        }
        if (newY >= 0 && boardState[newY][newX]) {
          return true;
        }
      }
    }
  }
  return false;
}

function merge(boardState, piece) {
  piece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value && piece.y + y >= 0) {
        boardState[piece.y + y][piece.x + x] = piece.color;
      }
    });
  });
}

function rotate(matrix) {
  return matrix[0].map((_, index) => matrix.map((row) => row[index]).reverse());
}

function playerRotate() {
  const rotated = rotate(currentPiece.shape);
  const previous = currentPiece.shape;
  currentPiece.shape = rotated;
  if (collide(board, currentPiece)) {
    currentPiece.shape = previous;
  }
}

function clearLines() {
  let cleared = 0;
  board = board.filter((row) => {
    if (row.every((cell) => cell !== 0)) {
      cleared++;
      return false;
    }
    return true;
  });

  while (board.length < ROWS) {
    board.unshift(Array(COLS).fill(0));
  }

  if (cleared > 0) {
    lines += cleared;
    score += cleared * 100 * level;
    if (lines >= level * 10) {
      level++;
      dropInterval = Math.max(150, dropInterval - 80);
    }
  }
}

function resetPiece() {
  const index = Math.floor(Math.random() * SHAPES.length);
  currentPiece = {
    shape: SHAPES[index],
    color: index + 1,
    x: Math.floor(COLS / 2) - 1,
    y: -2,
  };

  if (collide(board, currentPiece)) {
    isRunning = false;
  }
}

function update(time = 0) {
  const delta = time - lastTime;
  lastTime = time;
  if (isRunning) {
    dropCounter += delta;
    if (dropCounter > dropInterval) {
      drop();
    }
  }
  draw();
  requestAnimationFrame(update);
}

function drop() {
  currentPiece.y++;
  if (collide(board, currentPiece)) {
    currentPiece.y--;
    merge(board, currentPiece);
    clearLines();
    resetPiece();
  }
  dropCounter = 0;
}

function hardDrop() {
  while (!collide(board, currentPiece)) {
    currentPiece.y++;
  }
  currentPiece.y--;
  merge(board, currentPiece);
  clearLines();
  resetPiece();
  dropCounter = 0;
}

function move(dir) {
  currentPiece.x += dir;
  if (collide(board, currentPiece)) {
    currentPiece.x -= dir;
  }
}

function draw() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  drawBoard();
  if (currentPiece) {
    drawPiece(currentPiece);
  }
  scoreEl.textContent = score;
  linesEl.textContent = lines;
  levelEl.textContent = level;
}

function startGame() {
  board = createBoard();
  score = 0;
  lines = 0;
  level = 1;
  dropInterval = 800;
  isRunning = true;
  resetPiece();
}

startButton.addEventListener("click", () => {
  startGame();
});

document.addEventListener("keydown", (event) => {
  if (!isRunning) {
    return;
  }
  if (event.key === "ArrowLeft") {
    move(-1);
  } else if (event.key === "ArrowRight") {
    move(1);
  } else if (event.key === "ArrowDown") {
    drop();
  } else if (event.key === "ArrowUp") {
    playerRotate();
  } else if (event.key === " ") {
    hardDrop();
  }
});

update();