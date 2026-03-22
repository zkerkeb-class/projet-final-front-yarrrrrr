import { useState, useEffect, useRef, useCallback } from "react";
import type { Pokemon, Dresseur } from "../../types";
import { getTypeEffectiveness } from "../../constants/typeChart";
import { translatePokemonType } from "../../constants/typeTranslations";
import "./BattleScreen.css";

interface BattleScreenProps {
  playerTeam: Pokemon[];
  opponent: Dresseur;
  opponentPokemonIds?: number[];
  onEnd: (won: boolean) => void;
}

interface Fighter {
  pokemon: Pokemon;
  currentHp: number;
  slot: number;
}

export default function BattleScreen({ playerTeam, opponent, opponentPokemonIds = [], onEnd }: BattleScreenProps) {
  const [playerFighters, setPlayerFighters] = useState<Fighter[]>([]);
  const [oppFighters, setOppFighters] = useState<Fighter[]>([]);
  const [opponentSprites, setOpponentSprites] = useState<Record<number, string>>({});
  const [playerIdx, setPlayerIdx] = useState(0);
  const [oppIdx, setOppIdx] = useState(0);

  const [log, setLog] = useState<string[]>([]);
  const [waitingForPlayer, setWaitingForPlayer] = useState(false);
  const [opponentNextSpecial, setOpponentNextSpecial] = useState(false);
  const [animating, setAnimating] = useState<"player" | "opponent" | null>(null);
  const [showStart, setShowStart] = useState(true);
  const battleLogRef = useRef<HTMLDivElement | null>(null);
  const opponentSpriteFetchesRef = useRef<Set<number>>(new Set());
  const pokemonNameCacheRef = useRef<Record<number, string>>({});

  const getPokemonArtworkUrl = (pokemonId: number) =>
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`;

  const fetchOpponentSprite = useCallback(async (pokemonId: number, pokemonName: string) => {
    if (!pokemonId) {
      console.warn(`[BattleScreen][SpriteFetch] ID invalide pour ${pokemonName}`);
      return;
    }

    if (opponentSprites[pokemonId]) {
      console.log(`[BattleScreen][SpriteFetch] sprite déjà en cache pour ${pokemonName} (#${pokemonId})`);
      return;
    }

    if (opponentSpriteFetchesRef.current.has(pokemonId)) {
      console.log(`[BattleScreen][SpriteFetch] requête déjà en cours pour ${pokemonName} (#${pokemonId})`);
      return;
    }

    opponentSpriteFetchesRef.current.add(pokemonId);
    console.log(`[BattleScreen][SpriteFetch] début récupération pour ${pokemonName} (#${pokemonId})`);

    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);

      if (!response.ok) {
        console.warn(
          `[BattleScreen][SpriteFetch] échec API pour ${pokemonName} (#${pokemonId}) - status ${response.status}`,
        );
        return;
      }

      const data = await response.json();
      const sprite =
        data?.sprites?.other?.["official-artwork"]?.front_default ||
        data?.sprites?.front_default ||
        "";

      if (!sprite) {
        console.warn(`[BattleScreen][SpriteFetch] aucun sprite trouvé pour ${pokemonName} (#${pokemonId})`);
        return;
      }

      setOpponentSprites((prev) => ({ ...prev, [pokemonId]: sprite }));
      console.log(`[BattleScreen][SpriteFetch] succès pour ${pokemonName} (#${pokemonId}) -> ${sprite}`);
    } catch (error) {
      console.error(`[BattleScreen][SpriteFetch] erreur réseau pour ${pokemonName} (#${pokemonId})`, error);
    } finally {
      opponentSpriteFetchesRef.current.delete(pokemonId);
    }
  }, [opponentSprites]);

  const fetchPokemonNameById = useCallback(async (pokemonId: number) => {
    if (!pokemonId) return undefined;

    if (pokemonNameCacheRef.current[pokemonId]) {
      return pokemonNameCacheRef.current[pokemonId];
    }

    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
      if (!response.ok) return undefined;
      const data = await response.json();
      const name = data?.name as string | undefined;
      if (!name) return undefined;
      const displayName = name.charAt(0).toUpperCase() + name.slice(1);
      pokemonNameCacheRef.current[pokemonId] = displayName;
      return displayName;
    } catch {
      return undefined;
    }
  }, []);

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
    const rawDamageBeforeType = Math.max(10, baseDmg - def);
    return Math.max(0, Math.floor(rawDamageBeforeType * typeMultiplier));
  };

  // advance to next fighter if current is fainted
  const checkFaint = async (nextPlayerHp?: number, nextOppHp?: number) => {
    // protect against empty fighter arrays (initial mount)
    const pf = playerFighters[playerIdx];
    const of = oppFighters[oppIdx];
    if (!pf || !of) return "none" as const;

    const playerHp = nextPlayerHp ?? pf.currentHp;
    const oppHp = nextOppHp ?? of.currentHp;

    if (playerHp <= 0) {
      if (playerIdx + 1 < playerFighters.length) {
        setPlayerIdx(playerIdx + 1);
        addLog(`Votre ${pf.pokemon.name} est KO !`);
        return "switched" as const;
      } else {
        addLog("Vous n'avez plus de Pokémon ! Vous avez perdu...");
        setTimeout(() => onEnd(false), 1500);
        return "ended" as const;
      }
    }
    if (oppHp <= 0) {
      if (oppIdx + 1 < oppFighters.length) {
        const nextOpp = oppFighters[oppIdx + 1];
        const fallbackName = nextOpp?.pokemon?.name;
        const fetchedName = nextOpp?.pokemon?.id
          ? await fetchPokemonNameById(nextOpp.pokemon.id)
          : undefined;
        const nextName = fallbackName || fetchedName || "un Pokémon";
        setOppIdx(oppIdx + 1);
        addLog(`L'adversaire envoie ${nextName} !`);
        return "switched" as const;
      } else {
        addLog("Victoire ! Vous avez battu le champion !");
        setTimeout(() => onEnd(true), 1500);
        return "ended" as const;
      }
    }
    return "none" as const;
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
    if (!attackerF || !defenderF) {
      console.warn("[BattleScreen] Attaque ignorée: attaquant ou défenseur introuvable");
      return { damage: 0, defenderHp: 0 };
    }

    const damage = computeDamage(
      attackerF.pokemon,
      defenderF.pokemon,
      special,
      attackType,
    );
    const nextDefenderHp = Math.max(0, defenderF.currentHp - damage);

    if (attackerSide === "player") {
      setOppFighters((prev) =>
        prev.map((fighter, index) =>
          index === oppIdx ? { ...fighter, currentHp: nextDefenderHp } : fighter,
        ),
      );
    } else {
      setPlayerFighters((prev) =>
        prev.map((fighter, index) =>
          index === playerIdx ? { ...fighter, currentHp: nextDefenderHp } : fighter,
        ),
      );
    }

    setAnimating(attackerSide);
    await new Promise((r) => setTimeout(r, 500));
    setAnimating(null);

    addLog(
      `${
        attackerSide === "player" ? "Vous" : "L'adversaire"
      } utilise une attaque ${special ? "spéciale" : "normale"} de type ${translatePokemonType(attackType)} et inflige ${damage} dégâts !`,
    );

    return { damage, defenderHp: nextDefenderHp };
  };

  // execute a full turn after player choice
  const handlePlayerChoice = async (attackType: string, special: boolean) => {
    setWaitingForPlayer(false);
    let battleEnded = false;

    try {
      const currentPlayer = playerFighters[playerIdx];
      const currentOpponent = oppFighters[oppIdx];
      if (!currentPlayer || !currentOpponent) {
        return;
      }

      // determine order by speed
      const playerSpd = currentPlayer.pokemon.stats.speed;
      const oppSpd = currentOpponent.pokemon.stats.speed;
      const playerFirst = playerSpd >= oppSpd;

      if (playerFirst) {
        const { defenderHp: nextOppHp } = await performAttack("player", special, attackType);
        const statusAfterPlayerAttack = await checkFaint(undefined, nextOppHp);
        if (statusAfterPlayerAttack === "ended") {
          battleEnded = true;
          return;
        }
        if (statusAfterPlayerAttack === "switched") {
          return;
        }

        // opponent action - opponent always uses its first type and alternates special
        const oppType = oppFighters[oppIdx]?.pokemon.types[0] || currentOpponent.pokemon.types[0] || "Normal";
        const oppSpecial = opponentNextSpecial;
        const { defenderHp: nextPlayerHp } = await performAttack("opponent", oppSpecial, oppType);
        setOpponentNextSpecial(!oppSpecial);
        const statusAfterOpponentAttack = await checkFaint(nextPlayerHp, undefined);
        if (statusAfterOpponentAttack === "ended") {
          battleEnded = true;
          return;
        }
        if (statusAfterOpponentAttack === "switched") {
          return;
        }
      } else {
        const oppType = oppFighters[oppIdx]?.pokemon.types[0] || currentOpponent.pokemon.types[0] || "Normal";
        const oppSpecial = opponentNextSpecial;
        const { defenderHp: nextPlayerHp } = await performAttack("opponent", oppSpecial, oppType);
        setOpponentNextSpecial(!oppSpecial);
        const statusAfterOpponentAttack = await checkFaint(nextPlayerHp, undefined);
        if (statusAfterOpponentAttack === "ended") {
          battleEnded = true;
          return;
        }
        if (statusAfterOpponentAttack === "switched") {
          return;
        }

        const { defenderHp: nextOppHp } = await performAttack("player", special, attackType);
        const statusAfterPlayerAttack = await checkFaint(undefined, nextOppHp);
        if (statusAfterPlayerAttack === "ended") {
          battleEnded = true;
          return;
        }
        if (statusAfterPlayerAttack === "switched") {
          return;
        }
      }
    } finally {
      if (!battleEnded) {
        setWaitingForPlayer(true);
      }
    }
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
    if (!oppFighters.length) return;

    const idsFromDb = opponentPokemonIds.filter((pokemonId) => Number.isFinite(pokemonId));
    const idsToFetch = idsFromDb.length
      ? idsFromDb
      : oppFighters.map((fighter) => fighter.pokemon.id);

    console.log("[BattleScreen][SpriteFetch] démarrage du process de récupération des sprites adverses");
    console.log("[BattleScreen][SpriteFetch] IDs source base de données:", idsFromDb);
    console.log("[BattleScreen][SpriteFetch] IDs utilisés pendant le combat:", idsToFetch);

    idsToFetch.forEach((pokemonId, index) => {
      const fighterName = oppFighters[index]?.pokemon.name || `Pokemon-${pokemonId}`;
      fetchOpponentSprite(pokemonId, fighterName);
    });
  }, [oppFighters, opponentPokemonIds, fetchOpponentSprite]);

  useEffect(() => {
    // start battle after small delay
    const timer = setTimeout(() => {
      setShowStart(false);
      setWaitingForPlayer(true);
      addLog(`Un combat commence contre ${opponent.Nom} !`);
    }, 1000);
    return () => clearTimeout(timer);
  }, [opponent]);

  // Keep the combat log pinned to the latest message.
  useEffect(() => {
    if (battleLogRef.current) {
      battleLogRef.current.scrollTop = battleLogRef.current.scrollHeight;
    }
  }, [log]);

  const activePlayer = playerFighters[playerIdx];
  const activeOpp = oppFighters[oppIdx];
  const activeOppPokemonId = opponentPokemonIds[oppIdx] ?? activeOpp?.pokemon.id;

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
              <div className="start-text">En avant {playerFighters[0].pokemon.name} !</div>
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
                src={
                  opponentSprites[activeOppPokemonId] ||
                  getPokemonArtworkUrl(activeOppPokemonId) ||
                  activeOpp.pokemon.image
                }
                alt={activeOpp.pokemon.name}
                onError={(event) => {
                  console.warn(
                    `[BattleScreen][SpriteFetch] affichage échoué pour ${activeOpp.pokemon.name} (#${activeOppPokemonId}), tentative de refetch`,
                  );
                  const image = event.currentTarget;
                  const fallbackStep = Number(image.dataset.fallbackStep || "0");

                  if (fallbackStep === 0) {
                    image.dataset.fallbackStep = "1";
                    image.src = activeOpp.pokemon.image;
                    return;
                  }

                  image.onerror = null;
                  fetchOpponentSprite(activeOppPokemonId, activeOpp.pokemon.name);
                }}
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

      <div className="battle-log" ref={battleLogRef}>
        {log.map((l, idx) => (
          <div key={idx}>{l}</div>
        ))}
      </div>

      {waitingForPlayer && activePlayer && (
        <div className="actions">
          {activePlayer.pokemon.types.flatMap(type => [
            <button key={`${type}-normal`} onClick={() => handlePlayerChoice(type, false)}>
              {translatePokemonType(type)} normale
            </button>,
            <button key={`${type}-special`} onClick={() => handlePlayerChoice(type, true)}>
              {translatePokemonType(type)} spéciale
            </button>,
          ])}
        </div>
      )}
    </div>
  );
}
