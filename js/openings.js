// openings.js 

async function loadOpeningsPage() {
  const whiteDiv = document.getElementById("whiteOpenings");
  const blackDiv = document.getElementById("blackOpenings");

  async function fetchAndRender(path, container, prefix) {
    try {
      const res = await fetch(path, { cache: "no-store" });
      if (!res.ok) throw new Error("Missing " + path);
      const data = await res.json();

      container.innerHTML = "";
      for (const [key, val] of Object.entries(data)) {
        const card = document.createElement("div");
        card.className = "opening-card";
        card.innerHTML = `
          <h3>${val.name}</h3>
          <p>${val.description}</p>
          <button class="view-btn" data-prefix="${prefix}" data-key="${key}">View</button>
          <div class="opening-board" id="${prefix}-${key}" style="display:none"></div>
        `;
        container.appendChild(card);
      }

      // Wire up View buttons
      container.querySelectorAll(".view-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const key = btn.dataset.key;
          const prefix = btn.dataset.prefix;
          const boardDiv = document.getElementById(`${prefix}-${key}`);
          const val = data[key];
          if (!val) return;

        
          boardDiv.style.display = "block";
          boardDiv.innerHTML = ""; 

         
          const board = Chessboard(`${prefix}-${key}`, {
            pieceTheme: pieceThemeForOpenings,
            position: "start",
            draggable: false
          });

         
          const game = new Chess();
          let i = 0;
          function playMoves() {
            if (i >= val.moves.length) return;
            game.move(val.moves[i]);
            board.position(game.fen());
            i++;
            setTimeout(playMoves, 600);
          }
          playMoves();
        });
      });
    } catch (err) {
      console.error(err);
      container.innerHTML = `<p style="color:var(--ui-accent)">Error loading ${path}</p>`;
    }
  }

  fetchAndRender("data/whiteOpenings.json", whiteDiv, "w");
  fetchAndRender("data/blackOpenings.json", blackDiv, "b");
}

document.addEventListener("DOMContentLoaded", loadOpeningsPage);

function currentPieceSet() {
  const direct = localStorage.getItem("pieceSet");
  if (direct) return direct;
  try {
    const s = JSON.parse(localStorage.getItem("natebotSettings"));
    if (s && s.pieceSet) return s.pieceSet;
  } catch (_) {}
  return "meme";
}

function pieceThemeForOpenings(piece) {
  const set = currentPieceSet();
  return `pieces/${set}/${piece}.png`;
}
