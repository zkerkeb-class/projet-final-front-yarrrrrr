const TYPE_TRANSLATIONS_FR: Record<string, string> = {
  normal: "Normal",
  feu: "Feu",
  fire: "Feu",
  eau: "Eau",
  water: "Eau",
  plante: "Plante",
  grass: "Plante",
  electrik: "Électrik",
  elektrik: "Électrik",
  electric: "Électrik",
  glace: "Glace",
  ice: "Glace",
  combat: "Combat",
  fighting: "Combat",
  poison: "Poison",
  sol: "Sol",
  ground: "Sol",
  vol: "Vol",
  flying: "Vol",
  psy: "Psy",
  psychic: "Psy",
  insecte: "Insecte",
  bug: "Insecte",
  roche: "Roche",
  rock: "Roche",
  spectre: "Spectre",
  ghost: "Spectre",
  dragon: "Dragon",
  tenebres: "Ténèbres",
  dark: "Ténèbres",
  acier: "Acier",
  steel: "Acier",
  fee: "Fée",
  fairy: "Fée",
};

const normalizeTypeKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export const translatePokemonType = (type: string) => {
  const normalized = normalizeTypeKey(type);
  return TYPE_TRANSLATIONS_FR[normalized] || type;
};
