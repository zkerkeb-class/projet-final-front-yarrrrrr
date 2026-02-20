import "./Titre.css";

interface TitreProps {
  text?: string;
}

export const Titre = ({ text = "Pokémon Rogue League" }: TitreProps) => {
  return (
    <div className="title-container">
      <h1 className="title-blue">{text}</h1>
      <h1 className="title-yellow">{text}</h1>
    </div>
  );
};
