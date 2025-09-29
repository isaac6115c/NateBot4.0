let score = 0;
let hatchClicks = 0;
let hatchBroken = false;
let gameOver = false;
let firstHeadShown = false;
let peekTimeout = null;

const scoreEl = document.getElementById("score");
const hatchEl = document.getElementById("hatch");
const headEl = document.getElementById("head");
const restartBtn = document.getElementById("restartBtn");
const gameArea = document.getElementById("game-area");

function updateScore(msg) {
  scoreEl.textContent = msg ? msg : "Score: " + score;
}


hatchEl.addEventListener("click", () => {
  if (hatchBroken || gameOver) return;

  hatchClicks++;
  if (hatchClicks >= 10) {
    hatchBroken = true;
    hatchEl.src = "images/hatch_open.png";
    hatchEl.style.pointerEvents = "none";
    setTimeout(peekCycle, 1000);
  }
});

function peekCycle() {
  if (!hatchBroken || gameOver) return;

  headEl.style.display = "block";
  headEl.style.transition = "all 0.3s ease-in-out";

  const hatchSize = gameArea.offsetWidth;
  const headSize = headEl.offsetWidth;
  const sides = ["top", "bottom", "left", "right"];
  const side = sides[Math.floor(Math.random() * sides.length)];


  headEl.style.top = "auto";
  headEl.style.bottom = "auto";
  headEl.style.left = "auto";
  headEl.style.right = "auto";

 
  if (side === "top") {
    const x = Math.floor(Math.random() * (hatchSize - headSize));
    headEl.style.left = x + "px";
    headEl.style.top = -headSize + "px";
    headEl.style.transform = "rotate(180deg)";
    setTimeout(() => { headEl.style.top = "0px"; }, 100);
  }

  if (side === "bottom") {
    const x = Math.floor(Math.random() * (hatchSize - headSize));
    headEl.style.left = x + "px";
    headEl.style.bottom = -headSize + "px";
    headEl.style.transform = "rotate(0deg)";
    setTimeout(() => { headEl.style.bottom = "0px"; }, 100);
  }

  if (side === "left") {
    const y = Math.floor(Math.random() * (hatchSize - headSize));
    headEl.style.top = y + "px";
    headEl.style.left = -headSize + "px";
    headEl.style.transform = "rotate(90deg)";
    setTimeout(() => { headEl.style.left = "0px"; }, 100);
  }

  if (side === "right") {
    const y = Math.floor(Math.random() * (hatchSize - headSize));
    headEl.style.top = y + "px";
    headEl.style.right = -headSize + "px";
    headEl.style.transform = "rotate(-90deg)";
    setTimeout(() => { headEl.style.right = "0px"; }, 100);
  }

  firstHeadShown = true;

  
  if (peekTimeout) clearTimeout(peekTimeout);
  peekTimeout = setTimeout(() => {
    if (!gameOver) endGame(); 
  }, 1100);
}

headEl.addEventListener("click", (e) => {
  if (gameOver) return;

  score += 100;
  updateScore();
  headEl.style.display = "none";

  if (peekTimeout) clearTimeout(peekTimeout); 
  setTimeout(peekCycle, 800); 
  e.stopPropagation();
});

document.addEventListener("click", (e) => {
  if (!firstHeadShown || gameOver) return;
  if (e.target !== headEl && e.target !== hatchEl && e.target !== restartBtn) {
    endGame();
  }
});

function endGame() {
  gameOver = true;
  if (peekTimeout) clearTimeout(peekTimeout);
  headEl.style.display = "none";
  updateScore("Game Over! You Missed, now hatch is open and we have a mira | Final Score: " + score);
}

restartBtn.addEventListener("click", () => {
  score = 0;
  hatchClicks = 0;
  hatchBroken = false;
  gameOver = false;
  firstHeadShown = false;
  if (peekTimeout) clearTimeout(peekTimeout);
  updateScore();

  hatchEl.src = "images/hatch_closed.png";
  hatchEl.style.pointerEvents = "auto";
  headEl.style.display = "none";
});
