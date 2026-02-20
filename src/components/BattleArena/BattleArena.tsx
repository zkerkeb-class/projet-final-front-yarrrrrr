import { useState } from "react";
import type { Battle, GenerationData } from "../../types";
import { Door } from "../Door/Door";
import "./BattleArena.css";

interface BattleArenaProps {
  generation: GenerationData;
  onBackToCarousel: () => void;
}

export const BattleArena = ({
  generation,
  onBackToCarousel,
}: BattleArenaProps) => {
  // Initialiser 5 combats pour cette génération
  const [battles, setBattles] = useState<Battle[]>([
    {
      id: 1,
      opponentName: "Trainer Battle 1",
      difficulty: "easy",
      completed: false,
    },
    {
      id: 2,
      opponentName: "Trainer Battle 2",
      difficulty: "easy",
      completed: false,
    },
    {
      id: 3,
      opponentName: "Gym Leader",
      difficulty: "medium",
      completed: false,
    },
    { id: 4, opponentName: "Elite Four", difficulty: "hard", completed: false },
    { id: 5, opponentName: "Champion", difficulty: "hard", completed: false },
  ]);

  const handleBattleClick = (battleId: number) => {
    // Pour l'instant, juste marquer le combat comme complété
    setBattles((prev) =>
      prev.map((battle) =>
        battle.id === battleId
          ? { ...battle, completed: !battle.completed }
          : battle,
      ),
    );
  };

  const completedBattles = battles.filter((b) => b.completed).length;
  const progress = (completedBattles / battles.length) * 100;

  return (
    <div className="battle-arena">
      <div className="arena-header">
        <button className="back-button" onClick={onBackToCarousel}>
          ← Back to Generations
        </button>

        <h1 className="arena-title" style={{ color: generation.color }}>
          {generation.name} - Battle Arena
        </h1>

        <div className="progress-container">
          <div className="progress-text">
            Progress: {completedBattles} / {battles.length}
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${progress}%`,
                backgroundColor: generation.color,
              }}
            />
          </div>
        </div>
      </div>

      <div className="doors-container">
        {battles.map((battle) => (
          <Door
            key={battle.id}
            battle={battle}
            generationColor={generation.color}
            onBattleClick={() => handleBattleClick(battle.id)}
          />
        ))}
      </div>

      <div className="arena-footer">
        <p className="arena-description">
          Complete all 5 battles to unlock the next generation!
        </p>
      </div>
    </div>
  );
};
