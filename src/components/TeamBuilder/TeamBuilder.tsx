import { useState, useEffect } from "react";
import type { Pokemon, GenerationData } from "../../types";
import "./TeamBuilder.css";

interface TeamBuilderProps {
  generation: GenerationData;
  onBackToArena: () => void;
  preFilledTeam?: (Pokemon | null)[];
}

export const TeamBuilder = ({ generation, onBackToArena, preFilledTeam }: TeamBuilderProps) => {
  // Ensure we always have 6 slots. If preFilledTeam is an empty array or missing,
  // initialize with six null slots. If preFilledTeam has <6 entries, pad with nulls.
  const makeInitialTeam = (input?: (Pokemon | null)[]) => {
    if (!input || input.length === 0) return Array(6).fill(null);
    const padded = [...input];
    while (padded.length < 6) padded.push(null);
    return padded.slice(0, 6);
  };

  const [team, setTeam] = useState<(Pokemon | null)[]>(makeInitialTeam(preFilledTeam));

  // If preFilledTeam changes after mount (e.g. loaded async), sync the state.
  useEffect(() => {
    setTeam(makeInitialTeam(preFilledTeam));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preFilledTeam]);
  const [availablePokemon, setAvailablePokemon] = useState<Pokemon[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Récupérer les pokémons de la génération via PokeAPI
  useEffect(() => {
    const fetchPokemon = async () => {
      try {
        setLoading(true);
        
        // Obtenir les pokémons de la génération
        const genResponse = await fetch(
          `https://pokeapi.co/api/v2/generation/${generation.generation}/`
        );
        const genData = await genResponse.json();
        const pokemonList = genData.pokemon_species;

        // Sélectionner 20 pokémons aléatoires
        const shuffled = [...pokemonList].sort(() => Math.random() - 0.5);
        const randomPokemon = shuffled.slice(0, 20);

        // Récupérer les détails de chaque pokémon
        const pokemonDetails = await Promise.all(
          randomPokemon.map(async (p: { name: string }) => {
            const response = await fetch(
              `https://pokeapi.co/api/v2/pokemon/${p.name}/`
            );
            const data = await response.json();
            return {
              id: data.id,
              name: data.name.charAt(0).toUpperCase() + data.name.slice(1),
              image: data.sprites.other["official-artwork"].front_default,
              types: data.types.map((t: { type: { name: string } }) => 
                t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1)
              ),
              stats: {
                hp: data.stats[0].base_stat,
                attack: data.stats[1].base_stat,
                defense: data.stats[2].base_stat,
                spAtk: data.stats[3].base_stat,
                spDef: data.stats[4].base_stat,
                speed: data.stats[5].base_stat,
              },
              height: data.height / 10, // Conversion en mètres
              weight: data.weight / 10, // Conversion en kg
            };
          })
        );

        setAvailablePokemon(pokemonDetails);
        setError(null);
      } catch (err) {
        console.error("Erreur lors de la récupération des pokémons:", err);
        setError("Erreur lors du chargement des pokémons. Veuillez réessayer.");
      } finally {
        setLoading(false);
      }
    };

    fetchPokemon();
  }, [generation.generation]);

  // Drag and drop handlers
  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    pokemon: Pokemon,
    source: "available" | "team",
    index?: number
  ) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("pokemon", JSON.stringify(pokemon));
    e.dataTransfer.setData("source", source);
    if (index !== undefined) {
      e.dataTransfer.setData("sourceIndex", index.toString());
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDropTeam = (e: React.DragEvent<HTMLDivElement>, teamIndex: number) => {
    e.preventDefault();
    
    const pokemonData = e.dataTransfer.getData("pokemon");
    const source = e.dataTransfer.getData("source");
    const pokemon = JSON.parse(pokemonData) as Pokemon;

    if (source === "available") {
      // Ajouter à l'équipe
      const newTeam = [...team];
      newTeam[teamIndex] = pokemon;
      setTeam(newTeam);
    } else if (source === "team") {
      // Permuter deux emplacements d'équipe
      const sourceIndex = parseInt(e.dataTransfer.getData("sourceIndex"));
      const newTeam = [...team];
      [newTeam[teamIndex], newTeam[sourceIndex]] = [newTeam[sourceIndex], newTeam[teamIndex]];
      setTeam(newTeam);
    }
  };

  const handleRemovePokemon = (index: number) => {
    const newTeam = [...team];
    newTeam[index] = null;
    setTeam(newTeam);
  };

  const handleSaveTeam = async () => {
    // Vérifier que l'équipe n'est pas vide
    const filledTeam = team.filter((p) => p !== null);
    if (filledTeam.length === 0) {
      alert("Veuillez ajouter au moins un pokémon à votre équipe!");
      return;
    }

    try {
      const userId = 1; // TODO: utiliser l'id du joueur authentifié

      // vérifier si une équipe existe déjà pour cette génération
      const checkRes = await fetch(
        `http://localhost:3001/api/teams/${userId}/${generation.generation}`
      );
      let response;
      if (checkRes.ok) {
        const existing = await checkRes.json();
        response = await fetch(`http://localhost:3001/api/teams/${existing._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ pokemonTeam: filledTeam }),
        });
      } else {
        // création
        response = await fetch("http://localhost:3001/api/teams", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            generationId: generation.generation,
            pokemonTeam: filledTeam,
          }),
        });
      }

      if (response.ok) {
        alert("Équipe sauvegardée avec succès!");
        onBackToArena();
      } else {
        alert("Erreur lors de la sauvegarde de l'équipe.");
      }
    } catch (err) {
      console.error("Erreur:", err);
      alert("Erreur lors de la sauvegarde de l'équipe.");
    }
  };

  if (loading) {
    return (
      <div className="team-builder">
        <div className="loading">Chargement des pokémons...</div>
      </div>
    );
  }

  return (
    <div className="team-builder">
      <div className="team-builder-header">
        <button className="back-button" onClick={onBackToArena}>
          ← Retour
        </button>
        <h1 style={{ color: generation.color }}>Construisez votre équipe - {generation.name}</h1>
        <button className="save-button" onClick={handleSaveTeam}>
          💾 Sauvegarder l'équipe
        </button>
      </div>

      <div className="team-builder-container">
        {/* Colonne gauche: Équipe */}
        <div className="team-section">
          <h2>Votre Équipe</h2>
          <div className="team-slots">
            {team.map((pokemon, index) => (
              <div
                key={index}
                className={`team-slot ${pokemon ? "filled" : "empty"}`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropTeam(e, index)}
              >
                {pokemon ? (
                  <div className="team-pokemon" draggable onDragStart={(e) => handleDragStart(e, pokemon, "team", index)}>
                    <img src={pokemon.image} alt={pokemon.name} />
                    <div className="pokemon-name-team">{pokemon.name}</div>
                    <button
                      className="remove-btn"
                      onClick={() => handleRemovePokemon(index)}
                      title="Retirer ce pokémon"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="empty-slot">
                    <div className="slot-number">Slot {index + 1}</div>
                    <div className="drag-hint">Glissez un pokémon ici</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Colonne milieu: Pokémons disponibles */}
        <div className="available-section">
          <h2>Pokémons disponibles</h2>
          {error && <div className="error-message">{error}</div>}
          <div className="pokemon-grid">
            {availablePokemon.map((pokemon) => (
              <div
                key={pokemon.id}
                className="pokemon-card"
                draggable
                onDragStart={(e) => handleDragStart(e, pokemon, "available")}
                onClick={() => setSelectedPokemon(pokemon)}
              >
                <img src={pokemon.image} alt={pokemon.name} />
                <div className="pokemon-info-card">
                  <div className="pokemon-name">{pokemon.name}</div>
                  <div className="pokemon-types">
                    {pokemon.types.map((type) => (
                      <span key={type} className="type-badge">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Colonne droite: Détails du pokémon */}
        <div className="details-section">
          <h2>Détails du Pokémon</h2>
          {selectedPokemon ? (
            <div className="pokemon-details">
              <img src={selectedPokemon.image} alt={selectedPokemon.name} className="detail-image" />
              <h3>{selectedPokemon.name}</h3>
              <div className="types">
                {selectedPokemon.types.map((type) => (
                  <span key={type} className="type-badge-detail">
                    {type}
                  </span>
                ))}
              </div>

              <div className="stats">
                <div className="stat-row">
                  <span>HP</span>
                  <div className="stat-bar">
                    <div
                      className="stat-fill"
                      style={{
                        width: `${Math.min((selectedPokemon.stats.hp / 255) * 100, 100)}%`,
                        backgroundColor: "#FF5959",
                      }}
                    />
                  </div>
                  <span className="stat-value">{selectedPokemon.stats.hp}</span>
                </div>
                <div className="stat-row">
                  <span>ATK</span>
                  <div className="stat-bar">
                    <div
                      className="stat-fill"
                      style={{
                        width: `${Math.min((selectedPokemon.stats.attack / 255) * 100, 100)}%`,
                        backgroundColor: "#F08030",
                      }}
                    />
                  </div>
                  <span className="stat-value">{selectedPokemon.stats.attack}</span>
                </div>
                <div className="stat-row">
                  <span>DEF</span>
                  <div className="stat-bar">
                    <div
                      className="stat-fill"
                      style={{
                        width: `${Math.min((selectedPokemon.stats.defense / 255) * 100, 100)}%`,
                        backgroundColor: "#F8D030",
                      }}
                    />
                  </div>
                  <span className="stat-value">{selectedPokemon.stats.defense}</span>
                </div>
                <div className="stat-row">
                  <span>SP.ATK</span>
                  <div className="stat-bar">
                    <div
                      className="stat-fill"
                      style={{
                        width: `${Math.min((selectedPokemon.stats.spAtk / 255) * 100, 100)}%`,
                        backgroundColor: "#7038F8",
                      }}
                    />
                  </div>
                  <span className="stat-value">{selectedPokemon.stats.spAtk}</span>
                </div>
                <div className="stat-row">
                  <span>SP.DEF</span>
                  <div className="stat-bar">
                    <div
                      className="stat-fill"
                      style={{
                        width: `${Math.min((selectedPokemon.stats.spDef / 255) * 100, 100)}%`,
                        backgroundColor: "#78C850",
                      }}
                    />
                  </div>
                  <span className="stat-value">{selectedPokemon.stats.spDef}</span>
                </div>
                <div className="stat-row">
                  <span>SPD</span>
                  <div className="stat-bar">
                    <div
                      className="stat-fill"
                      style={{
                        width: `${Math.min((selectedPokemon.stats.speed / 255) * 100, 100)}%`,
                        backgroundColor: "#F85888",
                      }}
                    />
                  </div>
                  <span className="stat-value">{selectedPokemon.stats.speed}</span>
                </div>
              </div>

              <div className="info">
                <div className="info-row">
                  <span>Hauteur:</span>
                  <span>{selectedPokemon.height.toFixed(1)} m</span>
                </div>
                <div className="info-row">
                  <span>Poids:</span>
                  <span>{selectedPokemon.weight.toFixed(1)} kg</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <p>Cliquez sur un pokémon pour voir ses détails</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
