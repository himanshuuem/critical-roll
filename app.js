import { DIE_SIDES, rollSet, rollDie, critical, notation, duelWinner } from "./dice.js";

const HISTORY_KEY = "critical-roll-history";
const MAX_HISTORY = 25;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const ROLL_MS = reducedMotion ? 0 : 650;

// SVG silhouettes so every die type is recognisable at a glance.
const SHAPES = {
  4: '<polygon points="50,6 95,90 5,90"/>',
  6: '<rect x="10" y="10" width="80" height="80" rx="12"/>',
  8: '<polygon points="50,4 94,50 50,96 6,50"/>',
  10: '<polygon points="50,4 92,40 76,92 24,92 8,40"/>',
  12: '<polygon points="50,4 88,22 96,62 70,94 30,94 4,62 12,22"/>',
  20: '<polygon points="50,3 93,27 93,73 50,97 7,73 7,27"/>',
};

const state = { sides: 20, count: 1, modifier: 0, mode: "normal", history: loadHistory(), rolling: false };
const duel = { p1: 0, p2: 0, over: false };

const $ = (selector) => document.querySelector(selector);
const picker = $(".die-picker");
const tray = $(".dice-tray");
const totalValue = $(".total-value");
const totalLabel = $(".total-label");
const rollBtn = $("#rollBtn");
const historyList = $("#historyList");

function loadHistory() {
  try {
    const stored = JSON.parse(localStorage.getItem(HISTORY_KEY));
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function saveHistory() {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history));
  } catch {
    // History just won't persist.
  }
}

function dieSvg(sides, value, extraClass = "") {
  return `<svg class="die d${sides} ${extraClass}" viewBox="0 0 100 100" role="img" aria-label="d${sides} showing ${value}">
    <g class="shape">${SHAPES[sides]}</g>
    <text x="50" y="${sides === 4 ? 70 : 58}" text-anchor="middle" dominant-baseline="middle">${value}</text>
  </svg>`;
}

function renderPicker() {
  picker.innerHTML = DIE_SIDES.map((sides) => `
    <button type="button" role="radio" aria-checked="${sides === state.sides}" data-sides="${sides}" class="pick">
      ${dieSvg(sides, sides)}<span>d${sides}</span>
    </button>`).join("");
}

function renderControls() {
  $("#count").textContent = state.count;
  $("#modifier").textContent = state.modifier >= 0 ? `+${state.modifier}` : state.modifier;
  rollBtn.querySelector(".expr").textContent = notation(state);
}

function renderHistory() {
  historyList.replaceChildren(...state.history.map((entry) => {
    const li = document.createElement("li");
    const expr = Object.assign(document.createElement("span"), { className: "h-expr", textContent: entry.expr });
    const dice = Object.assign(document.createElement("span"), { className: "h-dice", textContent: `[${entry.dice.join(", ")}]` });
    const total = Object.assign(document.createElement("strong"), { textContent: entry.total });
    if (entry.crit) li.dataset.crit = entry.crit;
    li.append(expr, dice, total);
    return li;
  }));
}

function roll() {
  if (state.rolling) return;
  state.rolling = true;
  rollBtn.disabled = true;
  const result = rollSet(state);
  const crit = critical(result);

  // Tumble animation: show random faces, then settle on the real result.
  tray.innerHTML = result.dice.map(() => dieSvg(state.sides, "?", "tumbling")).join("");
  totalValue.textContent = "…";
  totalLabel.textContent = "rolling";

  setTimeout(() => {
    tray.innerHTML = result.dice.map((value) => dieSvg(state.sides, value, "landed")).join("")
      + (result.discarded ? `<p class="discarded">discarded: [${result.discarded.dice.join(", ")}] = ${result.discarded.total}</p>` : "");
    totalValue.textContent = result.total;
    totalLabel.textContent = crit === "success" ? "NATURAL 20!" : crit === "fail" ? "Critical fail…" : notation(state);
    document.body.dataset.crit = crit ?? "";
    state.history = [{ expr: notation(state), dice: result.dice, total: result.total, crit }, ...state.history].slice(0, MAX_HISTORY);
    saveHistory();
    renderHistory();
    state.rolling = false;
    rollBtn.disabled = false;
  }, ROLL_MS);
}

picker.addEventListener("click", (event) => {
  const button = event.target.closest("[data-sides]");
  if (!button) return;
  state.sides = Number(button.dataset.sides);
  renderPicker();
  renderControls();
  picker.querySelector(`[data-sides="${state.sides}"]`).focus();
});

picker.addEventListener("keydown", (event) => {
  if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
  const index = DIE_SIDES.indexOf(state.sides);
  const next = DIE_SIDES[(index + (event.key === "ArrowRight" ? 1 : -1) + DIE_SIDES.length) % DIE_SIDES.length];
  picker.querySelector(`[data-sides="${next}"]`).click();
});

document.querySelector(".controls").addEventListener("click", (event) => {
  const step = event.target.closest("[data-step]");
  if (!step) return;
  const key = step.dataset.step;
  const delta = Number(step.dataset.delta);
  const [min, max] = key === "count" ? [1, 10] : [-20, 20];
  state[key] = Math.min(max, Math.max(min, state[key] + delta));
  renderControls();
});

$("#mode").addEventListener("change", (event) => {
  state.mode = event.target.value;
  renderControls();
});

rollBtn.addEventListener("click", roll);
$("#clearHistory").addEventListener("click", () => {
  state.history = [];
  saveHistory();
  renderHistory();
});

document.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() !== "r" || event.target.closest("input, select, textarea")) return;
  if (!$("#panel-roll").hidden) roll();
  else $("#duelBtn").click();
});

// --- Tabs (WAI-ARIA tabs pattern) ---
const tabs = [...document.querySelectorAll('[role="tab"]')];
function selectTab(tab) {
  for (const t of tabs) {
    const selected = t === tab;
    t.setAttribute("aria-selected", String(selected));
    t.tabIndex = selected ? 0 : -1;
    document.getElementById(t.getAttribute("aria-controls")).hidden = !selected;
  }
  tab.focus();
}
tabs.forEach((tab, i) => {
  tab.addEventListener("click", () => selectTab(tab));
  tab.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") selectTab(tabs[(i + 1) % tabs.length]);
    if (event.key === "ArrowLeft") selectTab(tabs[(i - 1 + tabs.length) % tabs.length]);
  });
});

// --- Duel mode (the original Dicee game, levelled up) ---
const WINS_NEEDED = 3;
const duelists = Object.fromEntries(["p1", "p2"].map((p) => [p, document.querySelector(`[data-player="${p}"]`)]));
const duelResult = $(".duel-result");
const duelBtn = $("#duelBtn");

function playerName(p) {
  return duelists[p].querySelector(".name-input").value.trim() || (p === "p1" ? "Player 1" : "Player 2");
}

function resetDuel() {
  duel.p1 = 0;
  duel.p2 = 0;
  duel.over = false;
  for (const p of ["p1", "p2"]) {
    duelists[p].querySelector(".score").textContent = "0";
    duelists[p].querySelector(".duel-die").textContent = "?";
    duelists[p].classList.remove("winner", "champion");
  }
  duelResult.textContent = "Ready when you are.";
  duelBtn.textContent = "⚔️ Duel!";
}

duelBtn.addEventListener("click", () => {
  if (duel.over) return resetDuel();
  const rolls = { p1: rollDie(20), p2: rollDie(20) };
  const winner = duelWinner(rolls.p1, rolls.p2);
  for (const p of ["p1", "p2"]) {
    const die = duelists[p].querySelector(".duel-die");
    die.textContent = rolls[p];
    die.classList.remove("shake");
    void die.offsetWidth;
    die.classList.add("shake");
    duelists[p].classList.toggle("winner", winner === p);
  }
  if (winner === "draw") {
    duelResult.textContent = `Both rolled ${rolls.p1}. A draw, so roll again!`;
    return;
  }
  duel[winner] += 1;
  duelists[winner].querySelector(".score").textContent = duel[winner];
  if (duel[winner] >= WINS_NEEDED) {
    duel.over = true;
    duelists[winner].classList.add("champion");
    duelResult.textContent = `👑 ${playerName(winner)} wins the match ${duel[winner]}–${duel[winner === "p1" ? "p2" : "p1"]}!`;
    duelBtn.textContent = "New match";
  } else {
    duelResult.textContent = `${playerName(winner)} takes the round (${rolls[winner]} vs ${rolls[winner === "p1" ? "p2" : "p1"]}).`;
  }
});
$("#duelReset").addEventListener("click", resetDuel);

renderPicker();
renderControls();
renderHistory();

tray.innerHTML = dieSvg(state.sides, "?");
