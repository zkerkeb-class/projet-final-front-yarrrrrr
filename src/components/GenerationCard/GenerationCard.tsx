import { BATTLES_PER_GENERATION } from "../../constants/generations";
import { useBattleProgress } from "../../contexts/BattleProgressContext";
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
  const { getCompletedCountForGeneration } = useBattleProgress();
  const completedBattles = getCompletedCountForGeneration(generation.generation);
  const previousGenerationCompleted =
    generation.generation === 1 ||
    getCompletedCountForGeneration(generation.generation - 1) >=
      BATTLES_PER_GENERATION;
  const isLocked = generation.generation > userLevel && !previousGenerationCompleted;
  const progressPercentage = Math.min(
    (completedBattles / BATTLES_PER_GENERATION) * 100,
    100,
  );

  return (
    <div className="generation-card" style={{ borderColor: "#E3350D" }}>
      <div className="generation-header">
        <h1 className="generation-title">
          {generation.name}
        </h1>
        {completedBattles > 0 && (
          <span className="generation-status-badge">
            {completedBattles === BATTLES_PER_GENERATION ? "Complétée" : `${completedBattles} battu${completedBattles > 1 ? "s" : ""}`}
          </span>
        )}
      </div>

      <div className="generation-image-placeholder">
        <img
          className={`generation-image ${isLocked ? "generation-image-locked" : ""}`}
          src={generation.image}
          alt={`Illustration de ${generation.name}`}
        />
      </div>

      <div className="generation-info">
        <h2 className="generation-subtitle">CHALLENGE</h2>
        <p className="generation-description">{generation.description}</p>
        <div className="generation-progress-section">
          <div className="generation-progress-label">
            Champions battus : {completedBattles} / {BATTLES_PER_GENERATION}
          </div>
          <div className="generation-progress-bar">
            <div
              className="generation-progress-fill"
              style={{
                width: `${progressPercentage}%`,
                backgroundColor: generation.color,
              }}
            />
          </div>
        </div>
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
          {isLocked ? "🔒 Verrouillé" : "Entrer dans l'arène"}
        </button>
        {isLocked && (
          <div className="lock-tooltip">
            Veuillez finir le niveau précédent pour débloquer cette porte
          </div>
        )}
      </div>

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
