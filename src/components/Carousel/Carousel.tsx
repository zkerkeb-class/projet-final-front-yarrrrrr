import "./Carousel.css";

interface CarouselProps {
  children: React.ReactNode[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  userLevel?: number;
}

export const Carousel = ({
  children,
  currentIndex,
  onIndexChange,
}: CarouselProps) => {
  const goToPrevious = () => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < children.length - 1) {
      onIndexChange(currentIndex + 1);
    }
  };

  return (
    <div className="carousel-container">
      <button
        className="carousel-button carousel-button-left"
        onClick={goToPrevious}
        disabled={currentIndex === 0}
        style={{
          opacity: currentIndex === 0 ? 0 : 1,
          pointerEvents: currentIndex === 0 ? "none" : "auto",
        }}
      >
        ‹
      </button>

      <div className="carousel-content">
        <div
          className="carousel-slides"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {children.map((child, index) => (
            <div key={index} className="carousel-slide">
              {child}
            </div>
          ))}
        </div>
      </div>

      <button
        className="carousel-button carousel-button-right"
        onClick={goToNext}
        disabled={currentIndex === children.length - 1}
        style={{
          opacity: currentIndex === children.length - 1 ? 0 : 1,
          pointerEvents: currentIndex === children.length - 1 ? "none" : "auto",
        }}
      >
        ›
      </button>
    </div>
  );
};
