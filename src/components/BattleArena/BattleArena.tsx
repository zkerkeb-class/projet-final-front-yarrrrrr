import { useState, useEffect, useCallback } from "react";
import type { Battle, GenerationData, Dresseur } from "../../types";
import type { AuthUser } from "../login/login";
import { Door } from "../Door/Door";
import "./BattleArena.css";

interface BattleArenaProps {
  generation: GenerationData;
  onBackToCarousel: () => void;
  onBuildTeam?: () => void;
  userLevel?: number;
  userUsername?: string;
  authToken?: string;
  onProfileUpdated?: (updatedUser: AuthUser) => void;
}

export const BattleArena = ({
  generation,
  onBackToCarousel,
  onBuildTeam,
  userLevel,
  userUsername,
  authToken,
  onProfileUpdated,
}: BattleArenaProps) => {
  const [battles, setBattles] = useState<Battle[]>([]);
  const [levelUpProcessing, setLevelUpProcessing] = useState(false);
  const [loadingDresseurs, setLoadingDresseurs] = useState(true);

  // Précharger les images des types
  useEffect(() => {
    const preloadTypeImages = (types: string[]) => {
      types.forEach((type) => {
        const img = new Image();
        img.src = `http://localhost:3001/assets/type/${type}.png`;
      });
    };

    if (battles.length > 0) {
      const typeSet = new Set<string>();
      battles.forEach((battle) => {
        if (battle.type) {
          battle.type.split("/").forEach((t) => {
            typeSet.add(t.trim().toLowerCase());
          });
        }
      });
      preloadTypeImages(Array.from(typeSet));
    }
  }, [battles]);

  // Charger les dresseurs au démarrage
  useEffect(() => {
    const loadDresseurs = async () => {
      try {
        const response = await fetch(
          `http://localhost:3001/api/dresseurs/gen/${generation.generation}`,
        );
        if (response.ok) {
          const dresseurs: Dresseur[] = await response.json();
          // Créer les battles à partir des dresseurs
          const newBattles: Battle[] = dresseurs.map((dresseur, index) => ({
            id: index + 1,
            opponentName: dresseur.Nom,
            completed: false,
            avatar: dresseur.Avatar,
            type: dresseur.Type.toLowerCase(),
          }));
          setBattles(newBattles);
        }
      } catch (error) {
        console.error(
          `Erreur chargement dresseurs gen ${generation.generation}:`,
          error,
        );
      } finally {
        setLoadingDresseurs(false);
      }
    };

    loadDresseurs();
  }, [generation.generation]);

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
  const allBattlesCompleted = completedBattles === battles.length;

  const handleLevelUp = useCallback(async () => {
    if (levelUpProcessing) return;

    setLevelUpProcessing(true);

    try {
      const newLevel = (userLevel || 0) + 1;
      const response = await fetch(
        `http://localhost:3001/api/users/${userUsername}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ niveau: newLevel }),
        },
      );

      if (response.ok) {
        const updatedUser = await response.json();
        // Appeler le callback pour mettre à jour le profil dans l'app
        if (onProfileUpdated) {
          onProfileUpdated(updatedUser.user);
        }
        console.log(
          `✨ Niveau augmenté de ${userLevel} à ${newLevel}! Porte suivante débloquée!`,
        );
      } else {
        console.error("Erreur lors de la mise à jour du niveau");
      }
    } catch (error) {
      console.error("Erreur API lors de la mise à jour du niveau:", error);
    } finally {
      setLevelUpProcessing(false);
    }
  }, [userLevel, userUsername, authToken, onProfileUpdated, levelUpProcessing]);

  // Effet pour vérifier si tous les combats sont complétés et mettre à jour le niveau
  useEffect(() => {
    if (
      allBattlesCompleted &&
      !levelUpProcessing &&
      userLevel &&
      userLevel === generation.generation &&
      userLevel < 6 &&
      userUsername &&
      authToken &&
      onProfileUpdated
    ) {
      handleLevelUp();
    }
  }, [
    allBattlesCompleted,
    levelUpProcessing,
    userLevel,
    generation.generation,
    userUsername,
    authToken,
    onProfileUpdated,
    handleLevelUp,
  ]);

  return (
    <div className="battle-arena">
      <div className="arena-header">
        <button className="back-button" onClick={onBackToCarousel}>
          ← Back to Generations
        </button>

        <h1 className="arena-title" style={{ color: generation.color }}>
          {generation.name} - Battle Arena
        </h1>

        <button
          className="build-team-button"
          onClick={onBuildTeam}
          style={{ borderColor: generation.color, color: generation.color }}
        >
          🎮 Build Your Team
        </button>

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
        {loadingDresseurs ? (
          <div className="loading">Chargement des adversaires...</div>
        ) : (
          battles.map((battle) => (
            <Door
              key={battle.id}
              battle={battle}
              generationColor={generation.color}
              onBattleClick={() => handleBattleClick(battle.id)}
            />
          ))
        )}
      </div>

      <div className="arena-footer">
        {allBattlesCompleted && userLevel === generation.generation && (
          <div className="level-up-message">
            🎉 Tous les combats sont terminés! Niveau augmenté de {userLevel} à{" "}
            {userLevel + 1}! Porte suivante débloquée!
          </div>
        )}
        {allBattlesCompleted &&
          userLevel &&
          userLevel > generation.generation && (
            <div className="all-complete-message">
              ✨ Vous avez déjà terminé cette génération!
            </div>
          )}
      </div>
    </div>
  );
};
