const pokeAPIURL = "https://pokeapi.co/api/v2/pokemon/";
const game = document.getElementById("game");

let isPaused = false;
let firstPick;
let matches = 0;
let gameSize = 6;

const loadPokemon = async () => {
  const randomIDs = new Set();
  while (randomIDs.size < gameSize) {
    const randomID = Math.floor(Math.random() * 151) + 1;
    randomIDs.add(randomID);
  }
  console.log(randomIDs);
  const pokePromises = [...randomIDs].map((id) => fetch(pokeAPIURL + id));
  const pokemon = await Promise.all(pokePromises);
  return await Promise.all(pokemon.map((res) => res.json()));
};
const clickDifficulty = (event) => {
  const difficulty = event.target.dataset.difficulty;
  if (!difficulty) return;
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
      firstPick = null;
      isPaused = false;
      matches++;
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

const resetGame = () => {
  game.innerHTML = "";
  isPaused = true;
  firstPick = null;
  matches = 0;
  setTimeout(async () => {
    const pokemon = await loadPokemon();
    displayPokemon([...pokemon, ...pokemon]);
    isPaused = false;
  }, 200);
};
