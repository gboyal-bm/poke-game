const pokeAPIURL = "https://pokeapi.co/api/v2/pokemon/";
const game = document.getElementById("game");

let isPaused = false;
let firstPick;
let matches = 0;
let gameSize = 6;

let clicks = 0;
let timerInterval;
let timeLeft = 0;
const GAME_TIME = { easy: 120, medium: 90, hard: 75 };

const loadPokemon = async () => {
  const randomIDs = new Set();
  while (randomIDs.size < gameSize) {
    const randomID = Math.floor(Math.random() * 151) + 1;
    randomIDs.add(randomID);
  }
  console.log(randomIDs);

  try {
    const responses = await Promise.all(
      [...randomIDs].map((id) => axios.get(pokeAPIURL + id)),
    );
    return responses.map((res) => res.data);
  } catch (err) {
    document.getElementById("message").textContent = "Failed to load Pokémon.";
    throw err;
  }
};
const clickDifficulty = (event) => {
  const difficulty = event.target.dataset.difficulty;
  if (!difficulty) return;

  document
    .querySelectorAll("[data-difficulty]")
    .forEach((b) => b.classList.remove("active"));
  event.target.classList.add("active");
  switch (difficulty) {
    case "easy":
      gameSize = 6;
      break;
    case "medium":
      gameSize = 8;
      break;
    case "hard":
      gameSize = 12;
      break;
  }
  console.log(gameSize);
};

const displayPokemon = (pokemon) => {
  pokemon.sort((_) => Math.random() - 0.5);
  const pokemonHTML = pokemon
    .map((pokemon) => {
      return `
    <div class="card" onclick="clickCard(event)" data-pokename="${pokemon.name}">
        <div class="card-front" >
        </div>
    <div class="card-back rotated">
        <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
        <h2>${pokemon.name}</h2>
    </div>
    </div>
    `;
    })
    .join("");
  game.innerHTML = pokemonHTML;
};

const clickCard = (event) => {
  const pokemonCard = event.currentTarget;
  const [front, back] = getFrontandBack(pokemonCard);

  if (front.classList.contains("rotated") || isPaused) return;

  isPaused = true;
  clicks++;
  updateStats();

  rotateElements([front, back]);
  if (!firstPick) {
    firstPick = pokemonCard;
    isPaused = false;
  } else {
    const secondPokename = pokemonCard.dataset.pokename;
    const firstPokename = firstPick.dataset.pokename;

    if (firstPokename !== secondPokename) {
      const [firstFront, firstBack] = getFrontandBack(firstPick);
      setTimeout(() => {
        rotateElements([front, back, firstFront, firstBack]);
        firstPick = null;
        isPaused = false;
      }, 500);
    } else {
      pokemonCard.classList.add("matched");
      firstPick.classList.add("matched");
      firstPick = null;
      isPaused = false;
      matches++;
      updateStats();
      if (matches === gameSize) endGame(true);
    }
  }
};
const rotateElements = (elements) => {
  if (typeof elements !== "object" || !elements.length) return;
  elements.forEach((element) => element.classList.toggle("rotated"));
};

const getFrontandBack = (card) => {
  const front = card.querySelector(".card-front");
  const back = card.querySelector(".card-back");
  return [front, back];
};

const updateStats = () => {
  document.getElementById("clicks").textContent = clicks;
  document.getElementById("matched").textContent = matches;
  document.getElementById("total").textContent = gameSize;
};

const startTimer = () => {
  const difficulty =
    document.querySelector("[data-difficulty].active")?.dataset.difficulty ||
    "easy";
  timeLeft = GAME_TIME[difficulty];
  renderTimer();
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    renderTimer();
    if (timeLeft <= 0) endGame(false);
  }, 1000);
};

const renderTimer = () => {
  const el = document.getElementById("timer");
  const m = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const s = String(timeLeft % 60).padStart(2, "0");
  el.textContent = `${m}:${s}`;
  el.classList.toggle("warning", timeLeft <= 10);
};

const endGame = (won) => {
  clearInterval(timerInterval);
  isPaused = true;
  const msg = document.getElementById("message");
  msg.textContent = won
    ? ` You won! ${matches} pairs in ${clicks} clicks.`
    : " Time's up! Better luck next time.";
};

const activatePowerUp = () => {
  const btn = document.getElementById("powerUpBtn");
  if (btn.disabled || isPaused) return;
  btn.disabled = true;
  btn.textContent = "power up used";
  isPaused = true;
  const savedPick = firstPick;

  document.querySelectorAll(".card:not(.matched)").forEach((card) => {
    const [front, back] = getFrontandBack(card);
    front.classList.add("rotated");
    back.classList.remove("rotated");
  });

  setTimeout(() => {
    document.querySelectorAll(".card:not(.matched)").forEach((card) => {
      if (card !== savedPick) {
        const [front, back] = getFrontandBack(card);
        front.classList.remove("rotated");
        back.classList.add("rotated");
      }
    });
    firstPick = savedPick;
    isPaused = false;
  }, 4000);
};

const toggleTheme = () => {
  const html = document.documentElement;
  const theme = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
  html.setAttribute("data-theme", theme);
  document.getElementById("themeBtn").textContent =
    theme === "dark" ? " Light" : " Dark";
  localStorage.setItem("theme", theme);
};

const savedTheme = localStorage.getItem("theme");
if (savedTheme) {
  document.documentElement.setAttribute("data-theme", savedTheme);
  document.getElementById("themeBtn").textContent =
    savedTheme === "dark" ? " Light" : " Dark";
}

const resetGame = () => {
  game.innerHTML = "";
  isPaused = true;
  firstPick = null;
  matches = 0;
  clicks = 0;
  const powerUpBtn = document.getElementById("powerUpBtn");
  powerUpBtn.disabled = false;
  powerUpBtn.textContent = "Power-Up";
  document.getElementById("message").textContent = "";
  clearInterval(timerInterval);
  updateStats();
  setTimeout(async () => {
    try {
      const pokemon = await loadPokemon();
      displayPokemon([...pokemon, ...pokemon]);
      startTimer();
      isPaused = false;
    } catch (_) {}
  }, 200);
};
