import { useState, useEffect } from "react";
import type { Pokemon, GenerationData } from "../../types";
import type { AuthUser } from "../login/login";
import "./TeamBuilder.css";

interface TeamBuilderProps {
  generation: GenerationData;
  onBackToArena: () => void;
  preFilledTeam?: (Pokemon | null)[];
  authUser: AuthUser | null;
}

export const TeamBuilder = ({ generation, onBackToArena, preFilledTeam, authUser }: TeamBuilderProps) => {
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
  }, [preFilledTeam]);
  const [availablePokemon, setAvailablePokemon] = useState<Pokemon[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rollsLeft, setRollsLeft] = useState<number>(2);

  // Récupérer les pokémons proposés pour cet utilisateur/génération via backend pools
  useEffect(() => {
    const loadPool = async () => {
      try {
        setLoading(true);
        const userId = authUser?.id ?? 1; // Utilisateur connecté
        const res = await fetch(`http://localhost:3001/api/pools/${userId}/${generation.generation}`);
        if (!res.ok) throw new Error("Erreur récupération pool");
        const data = await res.json();
        setAvailablePokemon(data.pokemonPool || []);
        setRollsLeft(typeof data.rollsLeft === 'number' ? data.rollsLeft : 2);
        setError(null);
      } catch (err) {
        console.error("Erreur lors du chargement des pokémons:", err);
        setError("Erreur lors du chargement des pokémons. Veuillez réessayer.");
      } finally {
        setLoading(false);
      }
    };

    loadPool();
  }, [authUser?.id, generation.generation]);

  // Consommer un roll et générer un nouveau pool
  const handleRoll = async () => {
    if (rollsLeft <= 0) {
      alert("Plus de rolls disponibles");
      return;
    }
    try {
      setLoading(true);
      const userId = authUser?.id ?? 1; // Utilisateur connecté
      const res = await fetch(`http://localhost:3001/api/pools/${userId}/${generation.generation}/roll`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        alert(err?.message || "Erreur lors du roll");
        return;
      }
      const data = await res.json();
      setAvailablePokemon(data.pokemonPool || []);
      setRollsLeft(typeof data.rollsLeft === 'number' ? data.rollsLeft : 0);
    } catch (err) {
      console.error(err);
      alert("Erreur lors du roll");
    } finally {
      setLoading(false);
    }
  };

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

  const isPokemonAlreadyInTeam = (pokemonId: number, excludedIndex?: number) => {
    return team.some(
      (member, index) => index !== excludedIndex && member?.id === pokemonId
    );
  };

  const handleDropTeam = (e: React.DragEvent<HTMLDivElement>, teamIndex: number) => {
    e.preventDefault();
    
    const pokemonData = e.dataTransfer.getData("pokemon");
    const source = e.dataTransfer.getData("source");
    const pokemon = JSON.parse(pokemonData) as Pokemon;

    if (source === "available") {
      if (isPokemonAlreadyInTeam(pokemon.id, teamIndex)) {
        alert("Vous ne pouvez pas prendre plusieurs fois le même Pokémon.");
        return;
      }

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

    const uniquePokemonIds = new Set(filledTeam.map((pokemon) => pokemon.id));
    if (uniquePokemonIds.size !== filledTeam.length) {
      alert("Votre équipe ne peut pas contenir plusieurs fois le même Pokémon.");
      return;
    }

    try {
      const userId = authUser?.id ?? 2; // ID du joueur authentifié

      // vérifier si une équipe existe déjà pour cette génération
      const checkRes = await fetch(
        `http://localhost:3001/api/teams/${userId}/${generation.generation}`
      );
      const existing = await checkRes.json();
      let response;
      if (existing._id) {
        // mise à jour de l'équipe existante
        response = await fetch(`http://localhost:3001/api/teams/${existing._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ pokemonTeam: filledTeam }),
        });
      } else {
        // création d'une nouvelle équipe
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
      <div className="team-builder allow-drag-select">
        <div className="loading">Chargement des pokémons...</div>
      </div>
    );
  }

  return (
    <div className="team-builder allow-drag-select">
      <div className="team-builder-header">
        <button className="back-button" onClick={onBackToArena}>
          ← Retour
        </button>
        <h1 style={{ color: generation.color }}>Construisez votre équipe - {generation.name}</h1>
        <div className="header-actions">
          <button
            className="roll-button"
            onClick={handleRoll}
            disabled={loading || rollsLeft <= 0}
            title={rollsLeft > 0 ? "Générer un nouveau pool (consomme un roll)" : "Aucun roll restant"}
          >
            🎲 Roll
          </button>
          <span className="rolls-left">Rolls: {rollsLeft}</span>

          <button className="save-button" onClick={handleSaveTeam}>
            💾 Sauvegarder l'équipe
          </button>
        </div>
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
              (() => {
                const isAlreadySelected = isPokemonAlreadyInTeam(pokemon.id);
                return (
              <div
                key={pokemon.id}
                className={`pokemon-card ${isAlreadySelected ? "pokemon-card-selected" : ""}`}
                draggable={!isAlreadySelected}
                onDragStart={isAlreadySelected ? undefined : (e) => handleDragStart(e, pokemon, "available")}
                onClick={() => setSelectedPokemon(pokemon)}
                title={isAlreadySelected ? "Déjà dans votre équipe" : "Glisser pour ajouter à l'équipe"}
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
                  {isAlreadySelected && <div className="pokemon-selected-label">Déjà choisi</div>}
                </div>
              </div>
                );
              })()
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
