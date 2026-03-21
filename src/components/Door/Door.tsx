import type { Battle } from "../../types";
import "./Door.css";

interface DoorProps {
  battle: Battle;
  generationColor: string;
  onBattleClick: () => void;
}

export const Door = ({ battle, generationColor, onBattleClick }: DoorProps) => {
  const getTypeImageUrl = (type?: string) => {
    if (!type) return undefined;
    return `http://localhost:3001/assets/type/${type}.png`;
  };

  const getTypes = (typeString?: string) => {
    if (!typeString) return [];
    return typeString.split("/").map((t) => t.trim().toLowerCase());
  };

  const types = getTypes(battle.type);
  return (
    <div
      className={`door ${battle.completed ? "completed" : ""}`}
      onClick={onBattleClick}
      style={{
        borderColor: battle.completed ? "#2A75BB" : "#E3350D",
      }}
    >
      {/* <div className="door-number" style={{ color: generationColor }}>
        {battle.id}
      </div> */}

      <div className="door-content">
        <div className="door-image-placeholder">
          {battle.avatar ? (
            <img src={battle.avatar} alt={battle.opponentName} />
          ) : (
            <div className="no-image">?</div>
          )}
          {battle.completed && <span className="check-mark">✓</span>}
        </div>

        <h3 className="door-opponent">{battle.opponentName}</h3>

        {types.length > 0 && (
          <div className="door-types-container">
            {types.map((type, idx) => (
              <div key={idx} className="door-type-wrapper">
                <img
                  src={getTypeImageUrl(type)}
                  alt={type}
                  className="door-type-icon"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        className="door-hover-effect"
        style={{ backgroundColor: `${generationColor}20` }}
      ></div>
    </div>
  );
};
