// 1. APPLICATION STATE (si le state est modifié l'affichage est modifié)
const state = {
    meinePokemon: [],
    listePokemonAPI: []
};

// 2. STATE ACCESSORS/MUTATORS FN'S (mes fonctions qui modifie mon state)
function pokemonLoeschen(id) {
    state.meinePokemon = state.meinePokemon.filter(pokemon => pokemon.id !== id);
    saveInLocalStorage();
    render();
}

function set151PokemonList(pokemons) {
    state.listePokemonAPI = pokemons;
    render();
}

function pushPokemon(pokemon) {
    if (!state.meinePokemon.some(p => p.id === pokemon.id)) {
        state.meinePokemon.push(pokemon);
        saveInLocalStorage();
        render();
    } else {
        alert(`${pokemon.name.toUpperCase()} ist schon in dein Pokedex!`);
    }
}

function stateLoeschen() {
    state.meinePokemon = [];
    saveInLocalStorage();
    render();
}

function saveInLocalStorage() {
    localStorage.setItem("pokemons", JSON.stringify(state.meinePokemon));
}

function loadFromLocalStorage() {
    const pokemons = localStorage.getItem("pokemons");
    if (pokemons) {
        state.meinePokemon = JSON.parse(pokemons);
    }
}

// 3. DOM Node Refs (mes accès à mes elements HTML)
const message = document.getElementById("empty-message");
const pokedex = document.getElementById("pokemon-grid");
const dropDownMenu = document.getElementById("pokemon-select");
const addBtn = document.getElementById("btn-add");
const inputPokemon = document.getElementById("pokemon-input");
const btnClear = document.getElementById("btn-clear")


// 4. DOM Node Creation Fn's (mes fonctions pour crée mes éléments HTML)

function createCard(pokemon) {
    const col = document.createElement("div");
    col.className = "col";

    // HTML-Struktur der Karte erstellen 
    col.innerHTML = `
            <div class="card h-100 text-center shadow-sm pokemon-card">
                <div class="p-3 bg-light text-muted small">
                    #${String(pokemon.id).padStart(3, '0')}
                </div>
                <img src="${pokemon.bild}" class="card-img-top p-3 img-fluid" alt="${pokemon.name}" style="max-height: 180px; object-fit: contain;">
                <div class="card-body d-flex flex-column justify-content-between">
                    <h5 class="card-title text-capitalize fw-bold mb-3">${pokemon.name}</h5>
                    <div class="mb-3">
                        ${pokemon.typen.map(typ => `<span class="badge type-${typ} me-1 text-white shadow-sm">${typ}</span>`).join('')}
                    </div>
                    <button class="btn btn-outline-danger btn-sm w-100 mt-2 btn-delete" data-id="${pokemon.id}">
                        Freilassen
                    </button>
                </div>
            </div>
        `;
    pokedex.appendChild(col);
};

function createOptionWith151Pokemon(pokemons) {
    pokemons.forEach((pokemon, index) => {
        const indexPokemon = index + 1;
        const option = document.createElement("option");
        option.value = indexPokemon;
        option.textContent = `${pokemon.name.toUpperCase()} - #${String(indexPokemon)}`;
        dropDownMenu.appendChild(option);
    });
}


// 5. RENDER FN (fonction qui gère l'affichage)
function render() {
    if (state.listePokemonAPI.length > 0 && dropDownMenu.children.length <= 1) {
        createOptionWith151Pokemon(state.listePokemonAPI);
    }
    pokedex.innerHTML = "";
    if (state.meinePokemon.length === 0) {
        message.classList.remove("d-none");
        return;
    }
    message.classList.add("d-none");
    state.meinePokemon.forEach(pokemon => {
        createCard(pokemon);
    });

};


// 6. EVENT HANDLERS (mes fonctions qui gère les event)
function getIdPokemon(event) {
    if (event.target.classList.contains("btn-delete")) {
        const pokemonId = parseInt(event.target.getAttribute("data-id"));
        pokemonLoeschen(pokemonId);
    }
}

async function appInitialisation() {

    loadFromLocalStorage();
    // 1. Premier affichage (affiche les cartes par défaut)
    render();

    // 2. Appel de l'API pour récupérer les 151 Pokémon
    const pokemons = await get151Pokemon();

    if (pokemons) {
        // 3. On enregistre dans le state (ce qui va relancer render() automatiquement)
        set151PokemonList(pokemons);
    }
}

async function getPokemon() {
    const userChoice = inputPokemon.value.trim().toLowerCase();
    const safePattern = /^[a-z0-9-]+$/;
    if (!safePattern.test(userChoice)) {
        alert("Ungültige Eingabe! Bitte geben Sie einen korrekten Pokémon-Namen oder eine korrekte ID ein (nur Buchstaben und Zahlen zwischen 1 und 151).");
        inputPokemon.value = ""; // On vide l'input suspect
        return; // On arrête la fonction immédiatement
    }

    if (userChoice <= 0 || userChoice > 151) {
        alert(`Ungültige Eingabe ${userChoice}! Bitte geben Sie einen korrekten ID zwischen 1 und 151`);
        inputPokemon.value = "";
        return;
    }
    try {
        const data = await getOnePokemon(userChoice);

        // data vide ou data ne contient aucun id
        if (!data || !data.id) {
            alert("Pokemon existiert nicht");
            return;
        }


        const nouveauPokemon = {
            id: data.id,
            name: data.name,
            bild: data.sprites.other["official-artwork"].front_default,
            typen: data.types.map(element => element.type.name)
        };

        pushPokemon(nouveauPokemon);
        inputPokemon.value = "";

    } catch (error) {
        console.error("Fehler beim Abruf:", error);
        alert("Dieses Pokémon konnte nicht gefunden werden. Bitte überprüfen Sie Ihre Rechtschreibung oder Ihre Internetverbindung.");
    }
}

function clearState() {
    stateLoeschen();
}

function updateInput() {
    inputPokemon.value = dropDownMenu.value;
}



// 7. INIT BINDINGS (appel des mes event + callback)

pokedex.addEventListener("click", getIdPokemon);

document.addEventListener('DOMContentLoaded', appInitialisation);

addBtn.addEventListener("click", getPokemon);

btnClear.addEventListener("click", clearState);

dropDownMenu.addEventListener("change", updateInput);


//8. API Anruf

async function get151Pokemon() {
    try {
        const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=151");
        const data = await response.json();
        //array auf objekt
        return data.results;
    } catch (error) {
        console.log(error);
    }
}

async function getOnePokemon(pokemon) {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon}`);
        const data = await response.json();
        //array auf objekt
        console.log(data);
        return data;
    } catch (error) {
        console.log(error);
    }
}
