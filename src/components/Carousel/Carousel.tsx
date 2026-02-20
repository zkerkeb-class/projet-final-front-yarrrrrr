import "./Carousel.css";

interface CarouselProps {
  children: React.ReactNode[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
}

export const Carousel = ({
  children,
  currentIndex,
  onIndexChange,
}: CarouselProps) => {
  const goToPrevious = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? children.length - 1 : currentIndex - 1;
    onIndexChange(newIndex);
  };

  const goToNext = () => {
    const isLastSlide = currentIndex === children.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    onIndexChange(newIndex);
  };

  const goToSlide = (slideIndex: number) => {
    onIndexChange(slideIndex);
  };

  return (
    <div className="carousel-container">
      <button
        className="carousel-button carousel-button-left"
        onClick={goToPrevious}
        disabled={currentIndex === 0}
        style={{
          opacity: currentIndex === 0 ? 0 : 1,
          cursor: currentIndex === 0 ? "default" : "pointer",
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
          cursor: currentIndex === children.length - 1 ? "default" : "pointer",
        }}
      >
        ›
      </button>

      <div className="carousel-dots">
        {children.map((_, slideIndex) => (
          <div
            key={slideIndex}
            className={`carousel-dot ${slideIndex === currentIndex ? "active" : ""}`}
            onClick={() => goToSlide(slideIndex)}
          />
        ))}
      </div>
    </div>
  );
};
