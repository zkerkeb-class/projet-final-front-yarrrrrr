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
          const r2 = await fetch(`http://localhost:3001/api/dresseurs/${dresseurId}`);
          if (r2.ok) {
            const d = await r2.json();
            setOpponent(d);
          }
        } catch (err) {
          console.error("Erreur chargement dresseur page combat", err);
        }
      }

      setLoading(false);
    };
    load();
  }, [authUser, gen, dresseurId]);

  const handleEnd = (won: boolean) => {
    if (won && opponent) {
      markCompleted(opponent.Id);
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
    <BattleScreen playerTeam={playerTeam} opponent={opponent} onEnd={handleEnd} />
  );
}
