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
const modal = document.getElementById("highscore-modal");
const nameInput = document.getElementById("playerName");
const saveBtn = document.getElementById("saveScoreBtn");

const API_URL = "https://script.google.com/macros/s/AKfycbyp8Je4xi-0BX0co-Ng5j0KyzRbHq67yZ0Eln4zIUP9vjd6940CShyNJHGm8cmg3NkuxA/exec";


function getPeekDuration() {
  const reduction = Math.floor(score / 200) * 50; // ms
  const duration = 1200 - reduction;
  return Math.max(duration, 500); 
}


async function loadLeaderboard() {
  try {
    const res = await fetch(API_URL);
    return await res.json();
  } catch (err) {
    console.error("Error loading leaderboard:", err);
    return [];
  }
}

async function saveScore(name, score) {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ name, score }) 
    });
    const result = await res.json();
    console.log("Saved score:", result);
  } catch (err) {
    console.error("Error saving score:", err);
  }
}

async function renderLeaderboard() {
  const leaderboardList = document.getElementById("leaderboard-list");
  const data = await loadLeaderboard();
  leaderboardList.innerHTML = "";
  data.forEach(entry => {
    const li = document.createElement("li");
    li.textContent = `${entry.name} — ${entry.score}`;
    leaderboardList.appendChild(li);
  });
}

async function tryAddHighScore(finalScore) {
  const data = await loadLeaderboard();
  const qualifies = (data.length < 10) || (finalScore > data[data.length - 1].score);
  if (!qualifies) return;

  
  modal.style.display = "flex";
  nameInput.value = "AAA";
  nameInput.focus();

  let submitting = false;

  const handleSubmit = async () => {
    if (submitting) return;          
    submitting = true;

    
    modal.setAttribute("aria-busy", "true");
    saveBtn.disabled = true;
    nameInput.disabled = true;

    
    let name = (nameInput.value || "???").toUpperCase().slice(0, 3);

    try {
      await saveScore(name, finalScore); 
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
    
      modal.style.display = "none";
      modal.removeAttribute("aria-busy");
      saveBtn.disabled = false;
      nameInput.disabled = false;
      submitting = false;
    }

    
    renderLeaderboard();

    saveBtn.removeEventListener("click", clickOnce);
    nameInput.removeEventListener("keydown", enterOnce);
  };

  const clickOnce = () => handleSubmit();
  const enterOnce = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  saveBtn.addEventListener("click", clickOnce);
  nameInput.addEventListener("keydown", enterOnce);
}




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
  headEl.style.transition = "all 0.2s ease-in-out";

  const hatchSize = gameArea.offsetWidth;
  const headSize = headEl.offsetWidth;
  const sides = ["top", "bottom", "left", "right"];
  const side = sides[Math.floor(Math.random() * sides.length)];

  // reset
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
  }, getPeekDuration());
}

headEl.addEventListener("click", (e) => {
  if (gameOver) return;
  score += 100;
  updateScore();
  headEl.style.display = "none";

  if (peekTimeout) clearTimeout(peekTimeout);
  setTimeout(peekCycle, 600); // next peek
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
  tryAddHighScore(score);
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


renderLeaderboard();
