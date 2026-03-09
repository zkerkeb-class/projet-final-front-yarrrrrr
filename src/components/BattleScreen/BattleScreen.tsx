import { useState, useEffect } from "react";
import type { Pokemon, Dresseur } from "../../types";
import { getTypeEffectiveness } from "../../constants/typeChart";
import "./BattleScreen.css";

interface BattleScreenProps {
  playerTeam: Pokemon[];
  opponent: Dresseur;
  onEnd: (won: boolean) => void;
}

interface Fighter {
  pokemon: Pokemon;
  currentHp: number;
  slot: number;
}

export default function BattleScreen({ playerTeam, opponent, onEnd }: BattleScreenProps) {
  const [playerFighters, setPlayerFighters] = useState<Fighter[]>([]);
  const [oppFighters, setOppFighters] = useState<Fighter[]>([]);
  const [playerIdx, setPlayerIdx] = useState(0);
  const [oppIdx, setOppIdx] = useState(0);

  const [log, setLog] = useState<string[]>([]);
  const [waitingForPlayer, setWaitingForPlayer] = useState(false);
  const [opponentNextSpecial, setOpponentNextSpecial] = useState(false);
  const [animating, setAnimating] = useState<"player" | "opponent" | null>(null);
  const [showStart, setShowStart] = useState(true);

  // utility to append log
  const addLog = (text: string) => {
    setLog((prev) => [...prev, text]);
  };

  // damage calculation
  const computeDamage = (
    attacker: Pokemon,
    defender: Pokemon,
    special: boolean,
    attackType: string,
  ) => {
    const baseDmg = special ? attacker.stats.spAtk : attacker.stats.attack;
    const def = special ? defender.stats.spDef : defender.stats.defense;
    const typeMultiplier = getTypeEffectiveness(attackType, defender.types);
    return Math.max(1, Math.floor((baseDmg - def) * typeMultiplier));
  };

  // advance to next fighter if current is fainted
  const checkFaint = () => {
    // protect against empty fighter arrays (initial mount)
    const pf = playerFighters[playerIdx];
    const of = oppFighters[oppIdx];
    if (!pf || !of) return false;

    if (pf.currentHp <= 0) {
      if (playerIdx + 1 < playerFighters.length) {
        setPlayerIdx(playerIdx + 1);
        addLog(`Votre ${pf.pokemon.name} est KO !`);
      } else {
        addLog("Vous n'avez plus de Pokémon ! Vous avez perdu...");
        setTimeout(() => onEnd(false), 1500);
        return true;
      }
    }
    if (of.currentHp <= 0) {
      if (oppIdx + 1 < oppFighters.length) {
        setOppIdx(oppIdx + 1);
        addLog(`L'adversaire envoie ${oppFighters[oppIdx].pokemon.name} !`);
      } else {
        addLog("Victoire ! Vous avez battu le champion !");
        setTimeout(() => onEnd(true), 1500);
        return true;
      }
    }
    return false;
  };

  // perform a single attack action by a side
  const performAttack = async (
    attackerSide: "player" | "opponent",
    special: boolean,
    attackType: string,
  ) => {
    const attackerF =
      attackerSide === "player"
        ? playerFighters[playerIdx]
        : oppFighters[oppIdx];
    const defenderF =
      attackerSide === "player"
        ? oppFighters[oppIdx]
        : playerFighters[playerIdx];
    const damage = computeDamage(
      attackerF.pokemon,
      defenderF.pokemon,
      special,
      attackType,
    );
    defenderF.currentHp = Math.max(0, defenderF.currentHp - damage);

    setAnimating(attackerSide);
    await new Promise((r) => setTimeout(r, 500));
    setAnimating(null);

    addLog(
      `${
        attackerSide === "player" ? "Vous" : "L'adversaire"
      } utilise une attaque ${special ? "spéciale" : "normale"} de type ${attackType} et inflige ${damage} dégâts !`,
    );
  };

  // execute a full turn after player choice
  const handlePlayerChoice = async (attackType: string, special: boolean) => {
    setWaitingForPlayer(false);

    // determine order by speed
    const playerSpd = playerFighters[playerIdx].pokemon.stats.speed;
    const oppSpd = oppFighters[oppIdx].pokemon.stats.speed;
    const playerFirst = playerSpd >= oppSpd;

    if (playerFirst) {
      await performAttack("player", special, attackType);
      if (checkFaint()) return;

      // opponent action - opponent always uses its first type and alternates special
      const oppType = oppFighters[oppIdx].pokemon.types[0];
      const oppSpecial = opponentNextSpecial;
      await performAttack("opponent", oppSpecial, oppType);
      setOpponentNextSpecial(!oppSpecial);
      if (checkFaint()) return;
    } else {
      const oppType = oppFighters[oppIdx].pokemon.types[0];
      const oppSpecial = opponentNextSpecial;
      await performAttack("opponent", oppSpecial, oppType);
      setOpponentNextSpecial(!oppSpecial);
      if (checkFaint()) return;

      await performAttack("player", special, attackType);
      if (checkFaint()) return;
    }

    // next turn ask player again
    setWaitingForPlayer(true);
  };

  useEffect(() => {
    // prepare fighters once at mount
    setPlayerFighters(
      playerTeam.map((p, idx) => ({ pokemon: p, currentHp: p.stats.hp, slot: idx })),
    );
    // convert opponent's pokemon array to our Pokemon interface
    const converted = opponent.Pokemon.map((p) => ({
      pokemon: {
        id: p.Id,
        name: p.Nom,
        image: p.Photo,
        types: [
          p.Type1,
          ...(p.Type2 ? [p.Type2] : []),
        ].filter(Boolean) as string[],
        stats: p.stats || {
          hp: 50,
          attack: 50,
          defense: 50,
          spAtk: 50,
          spDef: 50,
          speed: 50,
        },
        height: 0,
        weight: 0,
      },
      currentHp: p.stats ? p.stats.hp : 50,
      slot: 0,
    }));
    setOppFighters(converted as Fighter[]);
  }, [playerTeam, opponent]);

  useEffect(() => {
    // start battle after small delay
    const timer = setTimeout(() => {
      setShowStart(false);
      setWaitingForPlayer(true);
      addLog(`Un combat commence contre ${opponent.Nom} !`);
    }, 1000);
    return () => clearTimeout(timer);
  }, [opponent]);

  // if one side changed hp or idx, check faint automatically
  useEffect(() => {
    // only run if both arrays have entries
    if (playerFighters.length && oppFighters.length) {
      checkFaint();
    }
  }, [playerIdx, oppIdx, playerFighters, oppFighters]);

  const activePlayer = playerFighters[playerIdx];
  const activeOpp = oppFighters[oppIdx];

  // log stats when active Pokémon change
  useEffect(() => {
    if (activePlayer) {
      console.log("Player Pokémon:", activePlayer.pokemon.name, "Stats:", activePlayer.pokemon.stats);
    }
  }, [activePlayer]);

  useEffect(() => {
    if (activeOpp) {
      console.log("Opponent Pokémon:", activeOpp.pokemon.name, "Stats:", activeOpp.pokemon.stats);
    }
  }, [activeOpp]);

  const handleForfeit = () => {
    addLog("Vous avez fui le combat...");
    setTimeout(() => onEnd(false), 500);
  };

  return (
    <div className="battle-screen">
      {showStart && (
        <div className="start-banner">
          {/* show player's lead Pokémon as a quick intro animation */}
          {playerFighters[0] && (
            <>
              <img
                className="start-pokemon"
                src={playerFighters[0].pokemon.image}
                alt={playerFighters[0].pokemon.name}
              />
              <div className="start-text">Go {playerFighters[0].pokemon.name}!</div>
            </>
          )}
        </div>
      )}

      <div className="battle-field">
        <button className="forfeit-button" onClick={handleForfeit}>Fuir</button>
        <div className="opponent-side">
          {activeOpp && (
            <>
              <img
                className={`pokemon-sprite ${animating === "opponent" ? "attack" : ""}`}
                src={activeOpp.pokemon.image}
                alt={activeOpp.pokemon.name}
              />
              <div className="hp-bar">
                <div
                  className="hp-fill"
                  style={{ width: `${(activeOpp.currentHp / activeOpp.pokemon.stats.hp) * 100}%` }}
                />
                <span className="hp-text">{activeOpp.currentHp} / {activeOpp.pokemon.stats.hp}</span>
              </div>
            </>
          )}
        </div>
        <div className="player-side">
          {activePlayer && (
            <>
              <img
                className={`pokemon-sprite ${animating === "player" ? "attack" : ""}`}
                src={activePlayer.pokemon.image}
                alt={activePlayer.pokemon.name}
              />
              <div className="hp-bar">
                <div
                  className="hp-fill"
                  style={{ width: `${(activePlayer.currentHp / activePlayer.pokemon.stats.hp) * 100}%` }}
                />
                <span className="hp-text">{activePlayer.currentHp} / {activePlayer.pokemon.stats.hp}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="battle-log">
        {log.map((l, idx) => (
          <div key={idx}>{l}</div>
        ))}
      </div>

      {waitingForPlayer && activePlayer && (
        <div className="actions">
          {activePlayer.pokemon.types.flatMap(type => [
            <button key={`${type}-normal`} onClick={() => handlePlayerChoice(type, false)}>
              {type} normale
            </button>,
            <button key={`${type}-special`} onClick={() => handlePlayerChoice(type, true)}>
              {type} spéciale
            </button>,
          ])}
        </div>
      )}
    </div>
  );
}
