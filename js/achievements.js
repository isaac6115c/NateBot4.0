// --- Load achievements from localStorage ---
function getAchievements() {
  return JSON.parse(localStorage.getItem("achievements")) || {};
}

function saveAchievements(data) {
  localStorage.setItem("achievements", JSON.stringify(data));
}

// --- Unlock new achievement ---
function unlockAchievement(openingName) {
  if (!openingName) return;
  let achievements = getAchievements();

  if (!achievements[openingName]) {
    achievements[openingName] = true;
    saveAchievements(achievements);
    showAchievementPopup(openingName);
    updateProgress();
  }
}


function showAchievementPopup(openingName) {
  const popup = document.createElement("div");
  popup.className = "achievement-popup";
  popup.textContent = `🏆 Achievement Unlocked: ${openingName}!`;

  document.body.appendChild(popup);


  try {
    const audio = new Audio("sounds/achievement.mp3");
    audio.volume = 1.0; 
    audio.play().catch(err => console.warn("Achievement sound blocked:", err));
  } catch (e) {
    console.warn("Could not play achievement sound:", e);
  }

  setTimeout(() => {
    popup.classList.add("fade-out");
    setTimeout(() => popup.remove(), 1000);
  }, 3000);
}


function checkWin(winner) {
  console.log(
    "checkWin called → Winner:",
    winner,
    "| PlayerColor:", playerColor,
    "| Difficulty:", difficulty,
    "| Opening:", selectedOpeningDisplay || selectedOpening
  );

  const d = String(difficulty || "").toLowerCase();
  if (winner === playerColor && (d === "natebot" || d === "nate")) {
    const openingName = selectedOpeningDisplay || selectedOpening || "Unknown Opening";
    unlockAchievement(openingName);
  }
}


async function updateProgress() {
  const achievements = getAchievements();

  async function fetchJSON(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error("Missing " + path);
    return res.json();
  }

  try {
    const white = await fetchJSON("data/whiteOpenings.json");
    const black = await fetchJSON("data/blackOpenings.json");
    const allOpenings = [...Object.values(white), ...Object.values(black)];

    let unlockedCount = 0;
    allOpenings.forEach(op => {
      if (achievements[op.name]) unlockedCount++;
    });

    const progressText = document.getElementById("progress");
    if (progressText) {
      progressText.textContent = `Progress: ${unlockedCount} / ${allOpenings.length} unlocked`;
    }

    const percent = (unlockedCount / allOpenings.length) * 100;
    const fill = document.getElementById("progress-fill");
    if (fill) fill.style.width = percent + "%";
  } catch (err) {
    console.error("Error updating progress:", err);
  }
}

document.addEventListener("DOMContentLoaded", updateProgress);
