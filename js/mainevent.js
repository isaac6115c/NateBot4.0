// mainevent.js 


const PGN_FILES = ["game1.pgn", "game2.pgn", "game3.pgn"];


const replayState = {
  game: null,
  board: null,
  moves: [],
  idx: 0
};

document.addEventListener("DOMContentLoaded", initMainEvent);

async function initMainEvent() {
  try {
    const games = await loadPGNs(PGN_FILES);
    const players = buildStandings(games);
    renderStandings(players);
    renderGames(games);

  
    document.getElementById("prevMove").addEventListener("click", prevReplayMove);
    document.getElementById("nextMove").addEventListener("click", nextReplayMove);
    document.getElementById("closeReplay").addEventListener("click", closeReplay);

   
    document.getElementById("replayModal").addEventListener("click", (e) => {
      if (e.target.id === "replayModal") closeReplay();
    });
  } catch (e) {
    console.error(e);
    alert("Failed to load Main Event data. Check console for details.");
  }
}

async function loadPGNs(files) {
  const results = [];
  for (const file of files) {
    const text = await fetch(`pgns/${file}`).then(r => r.text());
    const meta = parseHeaders(text);
    meta.pgn = text;
    meta.file = file;
    results.push(meta);
  }
  return results;
}

function parseHeaders(pgnText) {
  const headers = {};
  const rx = /\[(\w+)\s+"([^"]+)"\]/g;
  let m;
  while ((m = rx.exec(pgnText)) !== null) headers[m[1]] = m[2];
  return {
    round: headers.Round || "?",
    date: headers.Date || "?",
    white: headers.White || "?",
    black: headers.Black || "?",
    result: headers.Result || "*"
  };
}

function buildStandings(games) {
  const players = {};
  for (const g of games) {
    if (!players[g.white]) players[g.white] = { wins: 0, losses: 0, draws: 0, points: 0 };
    if (!players[g.black]) players[g.black] = { wins: 0, losses: 0, draws: 0, points: 0 };

    if (g.result === "1-0") {
      players[g.white].wins++; players[g.white].points += 1;
      players[g.black].losses++;
    } else if (g.result === "0-1") {
      players[g.black].wins++; players[g.black].points += 1;
      players[g.white].losses++;
    } else if (g.result === "1/2-1/2") {
      players[g.white].draws++; players[g.black].draws++;
      players[g.white].points += 0.5; players[g.black].points += 0.5;
    }
  }
  return players;
}

function renderStandings(players) {
  const table = document.getElementById("standingsTable");
  table.innerHTML = `
    <tr><th>Player</th><th>Wins</th><th>Losses</th><th>Draws</th><th>Points</th></tr>
  `;
  Object.keys(players).forEach(name => {
    const { wins, losses, draws, points } = players[name];
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${name}</td><td>${wins}</td><td>${losses}</td><td>${draws}</td><td>${points}</td>`;
    table.appendChild(tr);
  });
}

function renderGames(games) {
  const list = document.getElementById("gameList");
  list.innerHTML = "";
  games.forEach((g, i) => {
    const li = document.createElement("li");
    li.textContent = `Round ${g.round}: ${g.white} vs ${g.black} — ${g.result} (${g.date})`;
    li.addEventListener("click", () => openReplay(g));
    list.appendChild(li);
  });
}


function openReplay(gameMeta) {
 
  const modal = document.getElementById("replayModal");
  modal.style.display = "flex";
  document.getElementById("replayTitle").textContent =
    `Round ${gameMeta.round}: ${gameMeta.white} vs ${gameMeta.black}`;

  replayState.game = new Chess();
  replayState.game.load_pgn(gameMeta.pgn);
  replayState.moves = replayState.game.history(); 
  replayState.game.reset();

 
  const target = document.getElementById("replayBoard");
  target.innerHTML = "";

  
  replayState.board = Chessboard("replayBoard", {
    position: "start",
    pieceTheme: pieceThemeForMainEvent,
    draggable: false
  });

  setTimeout(() => replayState.board && replayState.board.resize(), 50);
}

function nextReplayMove() {
  if (!replayState.game || replayState.idx >= replayState.moves.length) return;
  replayState.game.move(replayState.moves[replayState.idx]);
  replayState.idx++;
  replayState.board.position(replayState.game.fen());
}

function prevReplayMove() {
  if (!replayState.game || replayState.idx === 0) return;
  replayState.idx--;
  replayState.game.reset();
  for (let i = 0; i < replayState.idx; i++) {
    replayState.game.move(replayState.moves[i]);
  }
  replayState.board.position(replayState.game.fen());
}

function closeReplay() {
  const modal = document.getElementById("replayModal");
  modal.style.display = "none";
  const target = document.getElementById("replayBoard");
  target.innerHTML = "";
  replayState.board = null;
  replayState.game = null;
  replayState.moves = [];
  replayState.idx = 0;
}


function currentPieceSet() {
  const direct = localStorage.getItem("pieceSet");
  if (direct) return direct;
  try {
    const s = JSON.parse(localStorage.getItem("natebotSettings"));
    if (s && s.pieceSet) return s.pieceSet;
  } catch (_) {}
  return "meme";
}

function pieceThemeForMainEvent(piece) {
  const set = currentPieceSet();
  return `pieces/${set}/${piece}.png`;
}
