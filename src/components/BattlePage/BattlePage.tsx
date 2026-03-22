import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { AuthUser } from "../login/login";
import type { Pokemon, Dresseur } from "../../types";
import BattleScreen from "../BattleScreen/BattleScreen";
import { useBattleProgress } from "../../contexts/BattleProgressContext";

interface BattlePageProps {
  authUser?: AuthUser;
}

export default function BattlePage({ authUser }: BattlePageProps) {
  const { gen, dresseurId } = useParams<{ gen: string; dresseurId: string }>();
  const navigate = useNavigate();
  const [playerTeam, setPlayerTeam] = useState<Pokemon[]>([]);
  const [opponent, setOpponent] = useState<Dresseur | null>(null);
  const [opponentPokemonIds, setOpponentPokemonIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const { markCompleted } = useBattleProgress();

  useEffect(() => {
    const load = async () => {
      if (authUser && gen) {
        try {
          const res = await fetch(
            `http://localhost:3001/api/teams/${authUser.id}/${gen}`,
          );
          if (res.ok) {
            const data = await res.json();
            setPlayerTeam(data.pokemonTeam || []);
          } else {
            setPlayerTeam([]);
          }
        } catch (err) {
          console.error("Erreur chargement équipe en page de combat", err);
          setPlayerTeam([]);
        }
      }

      if (dresseurId) {
        try {
          console.log(`[BattlePage] Récupération des données de combat pour le dresseur #${dresseurId}`);
          const [dresseurRes, idsRes] = await Promise.all([
            fetch(`http://localhost:3001/api/dresseurs/${dresseurId}`),
            fetch(`http://localhost:3001/api/dresseurs/${dresseurId}/pokemon-ids`),
          ]);

          if (dresseurRes.ok) {
            const d = await dresseurRes.json();
            setOpponent(d);
          }

          if (idsRes.ok) {
            const idsData = await idsRes.json();
            const ids = Array.isArray(idsData?.pokemonIds)
              ? idsData.pokemonIds.filter((id: unknown): id is number => typeof id === "number")
              : [];
            setOpponentPokemonIds(ids);
            console.log("[BattlePage] IDs pokémon adverses récupérés depuis la base:", ids);
          } else {
            setOpponentPokemonIds([]);
            console.warn("[BattlePage] Impossible de récupérer la liste des IDs pokémon du dresseur");
          }
        } catch (err) {
          console.error("Erreur chargement dresseur page combat", err);
          setOpponentPokemonIds([]);
        }
      }

      setLoading(false);
    };
    load();
  }, [authUser, gen, dresseurId]);

  const handleEnd = (won: boolean) => {
    if (won && opponent && gen) {
      markCompleted(opponent.Id, Number(gen));
    }
    navigate(-1);
  };

  if (loading) {
    return <div className="loading">Chargement du combat...</div>;
  }
  if (!opponent) {
    return <div>Adversaire introuvable.</div>;
  }

  return (
    <BattleScreen
      playerTeam={playerTeam}
      opponent={opponent}
      opponentPokemonIds={opponentPokemonIds}
      onEnd={handleEnd}
    />
  );
}
