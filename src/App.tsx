import { useState, useEffect } from "react";
import { Carousel, GenerationCard, BattleArena, TeamBuilder } from "./components";
import { Titre } from "./components/Titre/Titre";
import { GENERATIONS } from "./constants/generations";
import type { GenerationData, Pokemon } from "./types";
import "./App.css";

function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedGeneration, setSelectedGeneration] =
    useState<GenerationData | null>(null);
  const [buildingTeam, setBuildingTeam] = useState(false);
  const [teams, setTeams] = useState<Record<number, Pokemon[]>>({});

  // charger dès le démarrage les équipes existantes pour chaque génération
  useEffect(() => {
    const userId = 1; // remplacer par l'id du joueur connecté
    const loadAll = async () => {
      const map: Record<number, Pokemon[]> = {};
      for (const gen of GENERATIONS) {
        try {
          const res = await fetch(
            `http://localhost:3001/api/teams/${userId}/${gen.generation}`
          );
          if (res.ok) {
            const data = await res.json();
            map[gen.generation] = data.pokemonTeam || [];
          } else {
            map[gen.generation] = [];
          }
        } catch (err) {
          console.error("Erreur chargement équipe gen", gen.generation, err);
          map[gen.generation] = [];
        }
      }
      setTeams(map);
    };
    loadAll();
  }, []);

  const handleEnterArena = (generation: GenerationData) => {
    setSelectedGeneration(generation);
  };

  const handleBuildTeam = () => {
    setBuildingTeam(true);
  };

  const handleBackToArena = () => {
    // refetch équipe pour la génération actuelle au cas où elle a été modifiée
    if (selectedGeneration) {
      const userId = 1;
      fetch(`http://localhost:3001/api/teams/${userId}/${selectedGeneration.generation}`)
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error("No team");
        })
        .then((data) => {
          setTeams((prev) => ({
            ...prev,
            [selectedGeneration.generation]: data.pokemonTeam || [],
          }));
        })
        .catch(() => {
          setTeams((prev) => ({ ...prev, [selectedGeneration.generation]: [] }));
        });
    }
    setBuildingTeam(false);
  };

  const handleBackToCarousel = () => {
    setSelectedGeneration(null);
    setBuildingTeam(false);
  };

  if (buildingTeam && selectedGeneration) {
    return (
      <TeamBuilder
        generation={selectedGeneration}
        onBackToArena={handleBackToArena}
        preFilledTeam={teams[selectedGeneration.generation] || []}
      />
    );
  }

  if (selectedGeneration) {
    return (
      <BattleArena
        generation={selectedGeneration}
        onBackToCarousel={handleBackToCarousel}
        onBuildTeam={handleBuildTeam}
      />
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <Titre text="Pokemon Rogue League" />
        {/* <p className="app-subtitle">
          Choose your generation and prove your worth!
        </p> */}
      </header>

      <Carousel currentIndex={currentIndex} onIndexChange={setCurrentIndex}>
        {GENERATIONS.map((gen: GenerationData) => (
          <GenerationCard
            key={gen.generation}
            generation={gen}
            team={teams[gen.generation] || []}
            onEnterArena={() => handleEnterArena(gen)}
          />
        ))}
      </Carousel>
    </div>
  );
}

export default App;
