import { useState } from "react";
import { Carousel, GenerationCard, BattleArena } from "./components";
import { Titre } from "./components/Titre/Titre";
import { GENERATIONS } from "./constants/generations";
import type { GenerationData } from "./types";
import "./App.css";

function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedGeneration, setSelectedGeneration] =
    useState<GenerationData | null>(null);

  const handleEnterArena = (generation: GenerationData) => {
    setSelectedGeneration(generation);
  };

  const handleBackToCarousel = () => {
    setSelectedGeneration(null);
  };

  if (selectedGeneration) {
    return (
      <BattleArena
        generation={selectedGeneration}
        onBackToCarousel={handleBackToCarousel}
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
