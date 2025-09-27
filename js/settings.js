// settings.js — NateBot 5.1 

const defaultSettings = {
  boardLight: "#f0d9b5",
  boardDark:  "#b58863",
  uiBg:       "#1c1c1c",
  uiText:     "#ffffff",
  uiAccent:   "#e63946",
  pieceSet:   "meme"
};

function $(id) { return document.getElementById(id); }


function ensureBoardColorStyle() {
  if (document.getElementById("nb-dynamic-board-colors")) return;
  const style = document.createElement("style");
  style.id = "nb-dynamic-board-colors";
  style.textContent = `
    .white-1e1d7 { background: var(--board-light) !important; }
    .black-3c85d { background: var(--board-dark)  !important; }
  `;
  document.head.appendChild(style);
}

function getSettings() {
  try {
    const s = JSON.parse(localStorage.getItem("natebotSettings"));
    return { ...defaultSettings, ...(s || {}) };
  } catch { return { ...defaultSettings }; }
}

function applySettings(settings) {
  const r = document.documentElement.style;
  r.setProperty("--board-light", settings.boardLight);
  r.setProperty("--board-dark",  settings.boardDark);
  r.setProperty("--ui-bg",       settings.uiBg);
  r.setProperty("--ui-text",     settings.uiText);
  r.setProperty("--ui-accent",   settings.uiAccent);

  // Update simple color preview tiles
  const preview = document.querySelector(".board-preview");
  if (preview) {
    preview.querySelectorAll(".square.light").forEach(el => el.style.background = settings.boardLight);
    preview.querySelectorAll(".square.dark").forEach(el => el.style.background  = settings.boardDark);
  }

  reloadBoardIfActive(settings);
}

function populateInputs(settings) {
  if ($("boardLight")) $("boardLight").value = settings.boardLight;
  if ($("boardDark"))  $("boardDark").value  = settings.boardDark;
  if ($("uiBg"))       $("uiBg").value       = settings.uiBg;
  if ($("uiText"))     $("uiText").value     = settings.uiText;
  if ($("uiAccent"))   $("uiAccent").value   = settings.uiAccent;
  if ($("pieceSetSelect")) $("pieceSetSelect").value = settings.pieceSet;
}

function collectInputs() {
  return {
    boardLight: $("boardLight") ? $("boardLight").value : defaultSettings.boardLight,
    boardDark:  $("boardDark")  ? $("boardDark").value  : defaultSettings.boardDark,
    uiBg:       $("uiBg")       ? $("uiBg").value       : defaultSettings.uiBg,
    uiText:     $("uiText")     ? $("uiText").value     : defaultSettings.uiText,
    uiAccent:   $("uiAccent")   ? $("uiAccent").value   : defaultSettings.uiAccent,
    pieceSet:   $("pieceSetSelect") ? $("pieceSetSelect").value : defaultSettings.pieceSet
  };
}

function attachPreviewListeners() {
  ["boardLight","boardDark","uiBg","uiText","uiAccent","pieceSetSelect"].forEach(id => {
    const el = $(id);
    if (!el) return;
    el.addEventListener("input", () => {
      const live = collectInputs();
      applySettings(live);
      renderBoardPreview();            
      if (window.updateCaptured) window.updateCaptured();
    });
  });
}


function openSettings() {
  const modal = $("settingsModal");
  if (modal) {
    modal.style.display = "flex";
    modal.style.zIndex = "5000";
  }
}
function closeSettings() {
  const modal = $("settingsModal");
  if (modal) modal.style.display = "none";
}

function saveSettings() {
  const settings = collectInputs();
  localStorage.setItem("natebotSettings", JSON.stringify(settings));
  localStorage.setItem("pieceSet", settings.pieceSet); // quick access for game page
  applySettings(settings);
  renderBoardPreview();
  if (window.updateCaptured) window.updateCaptured();
  closeSettings();
}

function resetSettings() {
  localStorage.removeItem("natebotSettings");
  localStorage.removeItem("pieceSet");
  const settings = { ...defaultSettings };
  populateInputs(settings);
  applySettings(settings);
  renderBoardPreview();
  if (window.updateCaptured) window.updateCaptured();
}


function natebotPieceTheme(piece) {
  const set = currentPieceSet();
  if (piece === "wK" && window.aiColor === "white") return `pieces/${set}/wKn.png`;
  if (piece === "bK" && window.aiColor === "black") return `pieces/${set}/bKn.png`;
  return `pieces/${set}/${piece}.png`;
}

function currentPieceSet() {
  const direct = localStorage.getItem("pieceSet");
  if (direct) return direct;
  try {
    const s = JSON.parse(localStorage.getItem("natebotSettings"));
    if (s && s.pieceSet) return s.pieceSet;
  } catch {}
  return "meme";
}


function renderBoardPreview() {
  const previewEl = document.getElementById("boardPreview");
  if (!previewEl) return;

  if (window.Chessboard) {
    const set = currentPieceSet();
    try {
      previewEl.innerHTML = "";
      Chessboard("boardPreview", {
        position: "start",
        draggable: false,
        pieceTheme: (piece) => `pieces/${set}/${piece}.png`
      });
    } catch (_) {
    
    }
  }
}

function reloadBoardIfActive(settings) {
  if (!window.board || !window.game) return;
  window.board = Chessboard("board", {
    orientation: window.playerColor,
    position: window.game.fen(),
    draggable: false,
    pieceTheme: natebotPieceTheme
  });
}

// Expose globally
window.saveSettings = saveSettings;
window.resetSettings = resetSettings;
window.openSettings = openSettings;
window.closeSettings = closeSettings;
window.natebotPieceTheme = natebotPieceTheme;
window.currentPieceSet = currentPieceSet;

document.addEventListener("DOMContentLoaded", () => {
  ensureBoardColorStyle();
  const settings = getSettings();
  populateInputs(settings);
  applySettings(settings);
  renderBoardPreview();
  attachPreviewListeners();

  const btn = $("settingsBtn");
  if (btn) btn.addEventListener("click", openSettings);

  const closeBtn = $("closeSettings");
  if (closeBtn) closeBtn.addEventListener("click", closeSettings);

  const modal = $("settingsModal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeSettings();
    });
  }
});
