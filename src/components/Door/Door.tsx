import type { Battle } from "../../types";
import "./Door.css";

interface DoorProps {
  battle: Battle;
  generationColor: string;
  onBattleClick: () => void;
}

export const Door = ({ battle, generationColor, onBattleClick }: DoorProps) => {
  return (
    <div
      className={`door ${battle.completed ? "completed" : ""}`}
      onClick={onBattleClick}
      style={{
        borderColor: battle.completed ? "#4CAF50" : generationColor,
      }}
    >
      <div className="door-number" style={{ color: generationColor }}>
        {battle.id}
      </div>

      <div className="door-content">
        <div className="door-image-placeholder">
          {battle.completed && <span className="check-mark">✓</span>}
        </div>

        <h3 className="door-opponent">{battle.opponentName}</h3>

        <div className={`door-difficulty difficulty-${battle.difficulty}`}>
          {battle.difficulty.toUpperCase()}
        </div>
      </div>

      <div
        className="door-hover-effect"
        style={{ backgroundColor: `${generationColor}20` }}
      ></div>
    </div>
  );
};
