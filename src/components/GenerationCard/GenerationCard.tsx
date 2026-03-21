import type { GenerationData, Pokemon } from "../../types";
import "./GenerationCard.css";

interface GenerationCardProps {
  generation: GenerationData;
  onEnterArena: () => void;
  team?: Pokemon[];
  userLevel?: number;
}

export const GenerationCard = ({
  generation,
  onEnterArena,
  team = [],
  userLevel = 1,
}: GenerationCardProps) => {
  const isLocked = generation.generation > userLevel;
  return (
    <div className="generation-card" style={{ borderColor: "#E3350D" }}>
      <div className="generation-header">
        <h1 className="generation-title">
          {generation.name}
        </h1>
      </div>

      {/* Placeholder image - carré noir */}
      <div className="generation-image-placeholder">
        <span className="placeholder-text">GEN {generation.generation}</span>
      </div>

      <div className="generation-info">
        <h2 className="generation-subtitle">CHALLENGE</h2>
        <p className="generation-description">{generation.description}</p>
      </div>

      <div className="button-container">
        <button
          className={`enter-arena-button ${isLocked ? "locked" : ""}`}
          style={{
            backgroundColor: isLocked ? "#9CA9BF" : "#2A75BB",
            boxShadow: isLocked
              ? "0 4px 15px rgba(0, 0, 0, 0.2)"
              : "0 4px 15px rgba(255, 203, 5, 0.65)",
          }}
          onClick={isLocked ? undefined : onEnterArena}
          disabled={isLocked}
        >
          {isLocked ? "🔒 Verrouillé" : "Enter Arena"}
        </button>
        {isLocked && (
          <div className="lock-tooltip">
            Veuillez finir le niveau précédent pour débloquer cette porte
          </div>
        )}
      </div>

      {/* Icônes Pokémon placeholder */}
      <div className="pokemon-icons">
        {[...Array(6)].map((_, i) => {
          const p = team && team[i];
          return (
            <div key={i} className="pokemon-icon-placeholder">
              {p ? <img src={p.image} alt={p.name} /> : <span>?</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};
