import type { GenerationData } from "../../types";
import "./GenerationCard.css";

interface GenerationCardProps {
  generation: GenerationData;
  onEnterArena: () => void;
}

export const GenerationCard = ({
  generation,
  onEnterArena,
}: GenerationCardProps) => {
  return (
    <div className="generation-card" style={{ borderColor: generation.color }}>
      <div className="generation-header">
        <h1 className="generation-title" style={{ color: generation.color }}>
          {generation.name}
        </h1>
      </div>

      {/* Placeholder image - carré noir */}
      <div
        className="generation-image-placeholder"
        style={{ backgroundColor: "#000" }}
      >
        <span className="placeholder-text">GEN {generation.generation}</span>
      </div>

      <div className="generation-info">
        <h2 className="generation-subtitle">CHALLENGE</h2>
        <p className="generation-description">{generation.description}</p>
      </div>

      <button
        className="enter-arena-button"
        style={{
          backgroundColor: generation.color,
          boxShadow: `0 4px 15px ${generation.color}40`,
        }}
        onClick={onEnterArena}
      >
        Enter Arena
      </button>

      {/* Icônes Pokémon placeholder */}
      <div className="pokemon-icons">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="pokemon-icon-placeholder"></div>
        ))}
      </div>
    </div>
  );
};
