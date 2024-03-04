import {
  PLAYFIELD_COLUMNS,
  PLAYFIELD_ROWS,
  TETROMINO_NAMES,
  TETROMINOES,
} from "./configs.js";
const btnRestart = document.querySelector(".btn-restart");
const scoreElement = document.querySelector(".score");
const overlay = document.querySelector(".overlay");
const gameGrid = document.querySelector(".grid");
const hoursElement = document.querySelector(".hours");
const minutesElement = document.querySelector(".minutes");
const secondsElement = document.querySelector(".seconds");

let isGameOver = false;
let timedId = null;
let isPaused = false;
let playfield;
let tetromino;
let cells;
let score = 0;
let duration = 0;
let startedAt = new Date();

function displayDuration() {
  if (!isPaused) {
    const now = new Date();
    duration += now - startedAt;
    startedAt = now;
    const hours = Math.floor(duration / 60 / 60 / 1000);
    const minutes = Math.floor((duration - hours * 60) / 60 / 1000);
    const seconds = Math.floor((duration - hours * 60 * 1000) / 1000);

    hoursElement.innerHTML = String(hours).padStart(2, "0");
    minutesElement.innerHTML = String(minutes).padStart(2, "0");
    secondsElement.innerHTML = String(seconds).padStart(2, "0");
  } else {
    startedAt = new Date();
  }
  requestAnimationFrame(displayDuration);
}

requestAnimationFrame(displayDuration);

function init() {
  isGameOver = false;
  score = 0;
  duration = 0;
  startedAt = new Date();
  scoreElement.innerHTML = 0;
  generatePlayField();
  generateTetromino();
  cells = document.querySelectorAll(".grid div");
  moveDown();
}
init();

btnRestart.addEventListener("click", function () {
  gameGrid.innerHTML = "";
  init();
  overlay.style.display = "none";
});

function convertPositionToIndex(row, column) {
  return row * PLAYFIELD_COLUMNS + column;
}

function getRandomElement(array) {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

function countScore(destroyRows) {
  switch (destroyRows) {
    case 1:
      score += 40;
      break;
    case 2:
      score += 100;
      break;
    case 3:
      score += 300;
      break;
    case 4:
      score += 1200;
      break;
  }

  scoreElement.innerHTML = score;
}

function generatePlayField() {
  for (let i = 0; i < PLAYFIELD_ROWS * PLAYFIELD_COLUMNS; i++) {
    const div = document.createElement("div");
    gameGrid.append(div);
  }

  playfield = new Array(PLAYFIELD_ROWS)
    .fill()
    .map(() => new Array(PLAYFIELD_COLUMNS).fill(0));
}

function generateTetromino() {
  const name = getRandomElement(TETROMINO_NAMES);
  const matrix = TETROMINOES[name];
  const column = PLAYFIELD_COLUMNS / 2 - Math.floor(matrix.length / 2);
  const rowTetro = -2;
  tetromino = {
    name,
    matrix,
    row: rowTetro,
    column,
  };
}

function placeTetromino() {
  const matrixSize = tetromino.matrix.length;
  for (let row = 0; row < matrixSize; row++) {
    for (let column = 0; column < matrixSize; column++) {
      if (isOutsideOfTopboard(row)) {
        isGameOver = true;
        return;
      }
      if (tetromino.matrix[row][column]) {
        playfield[tetromino.row + row][tetromino.column + column] =
          tetromino.name;
      }
    }
  }

  const filledRows = findFilledRows();
  removeFilledRows(filledRows);
  generateTetromino();
  countScore(filledRows.length);
}

function removeFilledRows(filledRows) {
  for (let i = 0; i < filledRows.length; i++) {
    const row = filledRows[i];
    dropRowsAbove(row);
  }
}

function dropRowsAbove(rowToDelete) {
  for (let row = rowToDelete; row > 0; row--) {
    playfield[row] = playfield[row - 1];
  }

  playfield[0] = new Array(PLAYFIELD_COLUMNS).fill(0);
}

function findFilledRows() {
  const filledRows = [];
  for (let row = 0; row < PLAYFIELD_ROWS; row++) {
    let filledColumns = 0;
    for (let column = 0; column < PLAYFIELD_COLUMNS; column++) {
      if (playfield[row][column] != 0) {
        filledColumns++;
      }
    }
    if (filledColumns === PLAYFIELD_COLUMNS) {
      filledRows.push(row);
    }
  }

  return filledRows;
}

function drawPlayField() {
  for (let row = 0; row < PLAYFIELD_ROWS; row++) {
    for (let column = 0; column < PLAYFIELD_COLUMNS; column++) {
      if (playfield[row][column] === 0) {
        continue;
      }
      const name = playfield[row][column];
      const cellIndex = convertPositionToIndex(row, column);
      cells[cellIndex].classList.add(name);
    }
  }
}

function drawTetromino() {
  const name = tetromino.name;
  const tetrominoMatrixSize = tetromino.matrix.length;
  for (let row = 0; row < tetrominoMatrixSize; row++) {
    for (let column = 0; column < tetrominoMatrixSize; column++) {
      if (isOutsideOfTopboard(row)) {
        continue;
      }
      if (!tetromino.matrix[row][column]) {
        continue;
      }
      const cellIndex = convertPositionToIndex(
        tetromino.row + row,
        tetromino.column + column
      );
      cells[cellIndex].classList.add(name);
    }
    //column
  }
  //row
}

function draw() {
  cells.forEach((cell) => cell.removeAttribute("class"));
  drawPlayField();
  drawTetromino();
}

draw();

document.addEventListener("keydown", onkeyDown);
function onkeyDown(e) {
  if (e.key == "Escape") {
    togglePauseGame();
  }

  if (!isPaused) {
    switch (e.key) {
      case " ":
        dropTetrominoDown();
        break;
      case "ArrowUp":
        rotate();
        break;
      case "ArrowDown":
        moveTetrominoDown();
        break;
      case "ArrowLeft":
        moveTetrominoLeft();
        break;
      case "ArrowRight":
        moveTetrominoRight();
        break;
    }
  }
  draw();
}

function dropTetrominoDown() {
  while (isValid()) {
    tetromino.row++;
  }
  tetromino.row--;
}

function rotate() {
  rotateTetromino();
  draw();
}

function rotateTetromino() {
  const oldMatrix = tetromino.matrix;
  const rotatedMatrix = rotateMatrix(oldMatrix);

  tetromino.matrix = rotatedMatrix;

  if (!isValid()) {
    tetromino.matrix = oldMatrix;
  }
}

function rotateMatrix(matrixTetromino) {
  const N = matrixTetromino.length;
  const rotateMatrix = [];
  for (let i = 0; i < N; i++) {
    rotateMatrix[i] = [];
    for (let j = 0; j < N; j++) {
      rotateMatrix[i][j] = matrixTetromino[N - j - 1][i];
    }
  }
  return rotateMatrix;
}

function moveTetrominoDown() {
  tetromino.row += 1;
  if (!isValid()) {
    tetromino.row -= 1;
    placeTetromino();
  }
}

function moveTetrominoLeft() {
  tetromino.column -= 1;
  if (!isValid()) {
    tetromino.column += 1;
  }
}

function moveTetrominoRight() {
  tetromino.column += 1;
  if (!isValid()) {
    tetromino.column -= 1;
  }
}

function moveDown() {
  moveTetrominoDown();
  draw();
  stopLoop();
  startLoop();
  if (isGameOver) {
    stopLoop();
    gameOver();
  }
}

function gameOver() {
  overlay.style.display = "flex";
}

function startLoop() {
  if (!timedId) {
    timedId = setTimeout(() => {
      requestAnimationFrame(moveDown);
    }, 700);
  }
}

function stopLoop() {
  cancelAnimationFrame(timedId);
  clearTimeout(timedId);
  timedId = null;
}

function togglePauseGame() {
  if (!isPaused) {
    stopLoop();
  } else {
    startLoop();
  }
  isPaused = !isPaused;
}

function isValid() {
  const matrixSize = tetromino.matrix.length;
  for (let row = 0; row < matrixSize; row++) {
    for (let column = 0; column < matrixSize; column++) {
      // if (tetromino.matrix[row][column]) {
      //   continue;
      // }
      if (isOutsideOfGameboard(row, column)) {
        return false;
      }
      if (hasCollision(row, column)) {
        return false;
      }
    }
  }
  return true;
}

function isOutsideOfTopboard(row) {
  return tetromino.row + row < 0;
}

function isOutsideOfGameboard(row, column) {
  return (
    tetromino.matrix[row][column] &&
    (tetromino.column + column < 0 ||
      tetromino.column + column >= PLAYFIELD_COLUMNS ||
      tetromino.row + row >= playfield.length)
  );
}

function hasCollision(row, column) {
  return (
    tetromino.matrix[row][column] &&
    playfield[tetromino.row + row]?.[tetromino.column + column]
  );
}
