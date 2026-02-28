import { useState } from "react";
import { Carousel, GenerationCard, BattleArena, TeamBuilder } from "./components";
import { Titre } from "./components/Titre/Titre";
import { GENERATIONS } from "./constants/generations";
import type { GenerationData } from "./types";
import "./App.css";

function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedGeneration, setSelectedGeneration] =
    useState<GenerationData | null>(null);
  const [buildingTeam, setBuildingTeam] = useState(false);

  const handleEnterArena = (generation: GenerationData) => {
    setSelectedGeneration(generation);
  };

  const handleBuildTeam = () => {
    setBuildingTeam(true);
  };

  const handleBackToArena = () => {
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
            onEnterArena={() => handleEnterArena(gen)}
          />
        ))}
      </Carousel>
    </div>
  );
}

export default App;
