// natebot.js 

let board, game, stockfish;
let playerColor = "white";
let aiColor = "black";
let difficulty = "kyle";
let openingBook = {};
let selectedOpening = null;     
let selectedOpeningDisplay = ""; 
let openingPlayed = false;
let selectedSquare = null;
let capturedAI = [];
let capturedPlayer = [];


(function boot() {
  const colorSel = document.getElementById("colorSelect");
  const startBtn = document.getElementById("startBtn");

  loadOpenings();

  colorSel.addEventListener("change", async (e) => {
    playerColor = e.target.value;
    aiColor = (playerColor === "white") ? "black" : "white";
    await loadOpenings();
  });

  document.querySelectorAll("input[name=difficulty]").forEach(r => {
    r.addEventListener("change", (e) => { difficulty = e.target.value; });
  });

  startBtn.addEventListener("click", () => {
    playerColor = colorSel.value;
    aiColor = (playerColor === "white") ? "black" : "white";
    selectedOpening = document.getElementById("openingSelect").value || "";
    selectedOpeningDisplay = openingBook[selectedOpening]?.name || selectedOpening || "Unknown Opening";
    startGame();
  });

  document.getElementById("weedBtn").addEventListener("click", weedThemOut);
  document.getElementById("resignBtn").addEventListener("click", resignToMenu);
  document.getElementById("exportBtn").addEventListener("click", exportPGN);

  window.addEventListener("resize", () => { if (board) board.resize(); });
})();


function currentPieceSet() {
  const direct = localStorage.getItem("pieceSet");
  if (direct) return direct;

  try {
    const s = JSON.parse(localStorage.getItem("natebotSettings"));
    if (s && s.pieceSet) {
      localStorage.setItem("pieceSet", s.pieceSet);
      return s.pieceSet;
    }
  } catch (_) {}

  return "meme";
}

function pieceImgPath(color, letter) {
  const set = currentPieceSet();
  if (letter === "K") {
    if (color === "w" && aiColor === "white") return `pieces/${set}/wKn.png`;
    if (color === "b" && aiColor === "black") return `pieces/${set}/bKn.png`;
  }
  return `pieces/${set}/${color}${letter}.png`;
}


async function loadOpenings() {
  const sel = document.getElementById("openingSelect");
  if (!sel) return;

  const file = (playerColor === "white") ? "blackOpenings.json" : "whiteOpenings.json";
  try {
    const res = await fetch("data/" + file, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load " + file);
    openingBook = await res.json();

    sel.innerHTML = "";
    for (const [key, val] of Object.entries(openingBook)) {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = val.name || key;
      sel.appendChild(opt);
    }
    selectedOpening = sel.value || "";
    selectedOpeningDisplay = openingBook[selectedOpening]?.name || selectedOpening || "Unknown Opening";
  } catch (err) {
    console.error(err);
    sel.innerHTML = `<option value="">(no openings found)</option>`;
    openingBook = {};
    selectedOpening = "";
    selectedOpeningDisplay = "";
  }
}


function pieceTheme(piece) {
  return pieceImgPath(piece[0], piece[1]);
}


function startGame() {
  game = new Chess();
  capturedAI = [];
  capturedPlayer = [];
  updateCaptured();
  updateMoveList();
  document.getElementById("status").textContent = "";
  openingPlayed = false;

  document.getElementById("menu").style.display = "none";
  document.getElementById("gameArea").style.display = "flex";

  board = Chessboard("board", {
    orientation: playerColor,
    position: "start",
    draggable: false,
    pieceTheme: pieceTheme
  });

  const boardEl = document.getElementById("board");
  boardEl.removeEventListener("click", onBoardClick);
  boardEl.addEventListener("click", onBoardClick);

  setTimeout(() => { if (board) board.resize(); }, 0);
  initStockfish();

  if (aiColor === "white") {
    setTimeout(() => {
      if (!playBookMoveIfAvailable()) engineMove();
    }, 300);
  }
}

function initStockfish() {
  stockfish = new Worker("js/stockfish.js");
  stockfish.postMessage("uci");
  stockfish.onmessage = function (e) {
    const line = e.data || "";
    if (line.startsWith("bestmove")) {
      const uci = line.split(" ")[1];
      if (uci && uci !== "(none)") {
        applyMove({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: "q" });
      }
    }
  };
}


function onBoardClick(e) {
  const squareEl = e.target.closest(".square-55d63");
  if (!squareEl) return;
  const sqClass = Array.from(squareEl.classList).find(c => /^square-[a-h][1-8]$/.test(c));
  if (!sqClass) return;
  handleSquareClick(sqClass.slice(7));
}

function handleSquareClick(square) {
  if (game.game_over()) return;
  const turn = game.turn();
  const isPlayersTurn = (playerColor === "white" && turn === "w") || (playerColor === "black" && turn === "b");
  if (!isPlayersTurn) return;

  if (!selectedSquare) {
    const piece = game.get(square);
    if (!piece) return;
    const mine = (playerColor === "white" && piece.color === "w") || (playerColor === "black" && piece.color === "b");
    if (!mine) return;
    selectedSquare = square;
    highlightSquare(square);
    return;
  }

  const move = { from: selectedSquare, to: square, promotion: "q" };
  selectedSquare = null;
  clearHighlights();

  if (game.move(move)) {
    game.undo();
    applyMove(move);
    setTimeout(() => {
      if (!game.game_over()) {
        const aiTurn = (aiColor === "white" && game.turn() === "w") || (aiColor === "black" && game.turn() === "b");
        if (aiTurn) {
          if (!playBookMoveIfAvailable()) engineMove();
        }
      }
    }, 250);
  }
}


function highlightSquare(square) {
  clearHighlights();
  const el = document.querySelector(".square-" + square);
  if (el) el.classList.add("highlight");
}
function highlightMove(from, to) {
  clearHighlights();
  const fromEl = document.querySelector(".square-" + from);
  const toEl = document.querySelector(".square-" + to);
  if (fromEl) fromEl.classList.add("highlight");
  if (toEl) toEl.classList.add("highlight");
}
function clearHighlights() {
  document.querySelectorAll("#board .highlight").forEach(el => el.classList.remove("highlight"));
}


function applyMove(moveObj) {
  const move = game.move(moveObj);
  if (!move) return;

  if (move.captured) {
    if (move.color === "w") capturedAI.push(move.captured);
    else capturedPlayer.push(move.captured);
    updateCaptured();
  }

  board.position(game.fen());
  updateMoveList();
  checkGameOver();
}

function engineMove() {
  if (game.game_over()) return;
  if (difficulty === "kyle") {
    const moves = game.moves({ verbose: true });
    if (!moves.length) return;
    const mv = moves[moves.length - 1];
    applyMove({ from: mv.from, to: mv.to, promotion: "q" });
  } else {
    stockfish.postMessage("position fen " + game.fen());
    stockfish.postMessage("go depth " + (difficulty === "nate" ? 5 : 20));
  }
}

function playBookMoveIfAvailable() {
  if (!selectedOpening || !openingBook[selectedOpening]) return false;
  const line = openingBook[selectedOpening].moves;
  if (!Array.isArray(line) || !line.length) return false;

  const idx = game.history().length;
  const sideToMove = (idx % 2 === 0) ? "w" : "b";
  const aiIsToMove = (aiColor === "white" && sideToMove === "w") || (aiColor === "black" && sideToMove === "b");
  if (!aiIsToMove || idx >= line.length) return false;

  const san = line[idx];
  const made = game.move(san);
  if (!made) return false;

  if (made.captured) {
    capturedPlayer.push(made.captured);
    updateCaptured();
  }

  board.position(game.fen());
  updateMoveList();
  if (game.history().length >= line.length) openingPlayed = true;
  return true;
}


function updateMoveList() {
  document.getElementById("movelist").innerHTML = game.pgn({ max_width: 5, newline_char: "<br>" });
}
function updateCaptured() {
  const aiHTML = capturedAI.map(lc => `<img src="${pieceImgPath('b', lc.toUpperCase())}" class="cap">`).join(" ");
  const playerHTML = capturedPlayer.map(lc => `<img src="${pieceImgPath('w', lc.toUpperCase())}" class="cap">`).join(" ");
  if (document.getElementById("capturedAI")) document.getElementById("capturedAI").innerHTML = aiHTML;
  if (document.getElementById("capturedPlayer")) document.getElementById("capturedPlayer").innerHTML = playerHTML;
}
window.updateCaptured = updateCaptured;


function checkGameOver() {
  if (!game.game_over()) return;

  let msg = "Draw!";
  if (game.in_checkmate()) msg = (game.turn() === "w" ? "NateBot Wins!" : "You Win!");
  document.getElementById("status").textContent = msg;

  const winner = (game.turn() === "w") ? "black" : "white";

  console.log("Game Over → Winner:", winner, "| PlayerColor:", playerColor, "| Difficulty:", difficulty, "| Opening:", selectedOpeningDisplay);

  if (typeof window.checkWin === "function") {
    try {
      if (!selectedOpeningDisplay) {
        selectedOpeningDisplay = openingBook[selectedOpening]?.name || selectedOpening || "Unknown Opening";
      }
      window.checkWin(winner);
    } catch (e) {
      console.warn("checkWin threw:", e);
    }
  } else {
    const isPlayerWinner = (winner === playerColor);
    const d = String(difficulty || "").toLowerCase();
    const isNateBot = (d === "natebot" || d === "nate");
    if (isPlayerWinner && isNateBot && typeof window.unlockAchievement === "function") {
      const name = selectedOpeningDisplay || openingBook[selectedOpening]?.name || selectedOpening || "Unknown Opening";
      window.unlockAchievement(name);
    }
  }
}


function resignToMenu() {
  document.getElementById("status").textContent = "You resigned!";
  try { if (stockfish) stockfish.terminate(); } catch (_) {}
  stockfish = null; board = null; game = null;
  document.getElementById("gameArea").style.display = "none";
  document.getElementById("menu").style.display = "flex";
  loadOpenings();
}

function exportPGN() {
  const pgn = game ? game.pgn() : "";
  const blob = new Blob([pgn], { type: "application/x-chess-pgn" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "natebot_game.pgn";
  a.click();
  URL.revokeObjectURL(url);
}


// Weed Them Out

function weedThemOut() {
  const btn = document.getElementById("weedBtn");
  if (!btn || game.game_over()) return;

  btn.disabled = true;
  const oldLabel = btn.textContent;
  btn.textContent = "…thinking";

  const legal = game.moves({ verbose: true });
  if (!legal.length) {
    btn.disabled = false;
    btn.textContent = oldLabel;
    return;
  }

  const bad = legal[legal.length - 1];
  const snd = document.getElementById("weedSound");
  if (snd) { try { snd.currentTime = 0; snd.play(); } catch (_) {} }

  highlightMove(bad.from, bad.to);

  setTimeout(() => {
    clearHighlights();
    btn.disabled = false;
    btn.textContent = oldLabel;
  }, 1200);
}
