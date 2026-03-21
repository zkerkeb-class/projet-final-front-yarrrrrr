export interface Battle {
  id: number;
  /** identifiant dans la collection dresseurs (Id) */
  dresseurId?: number;
  opponentName: string;
  completed: boolean;
  avatar?: string;
  type?: string;
}

export interface DresseurPokemon {
  Id: number;
  Nom: string;
  Niveau: number;
  Type1: string;
  Type2?: string | null;
  Faiblesse: string[];
  Resistance: string[];
  Photo: string;
  // for enriched responses
  stats?: PokemonStats;
}

export interface Dresseur {
  Id: number;
  Gen: number;
  Nom: string;
  Type: string;
  Avatar: string;
  Pokemon: DresseurPokemon[];
}

export interface Generation {
  id: number;
  name: string;
  battles: Battle[];
  image?: string;
}

export interface GenerationData {
  generation: number;
  name: string;
  color: string;
  description: string;
  image: string;
}

export interface PokemonStats {
  hp: number;
  attack: number;
  defense: number;
  spAtk: number;
  spDef: number;
  speed: number;
}

export interface Pokemon {
  id: number;
  name: string;
  image: string;
  types: string[];
  stats: PokemonStats;
  height: number;
  weight: number;
}

export interface TeamPokemon extends Pokemon {
  teamSlot?: number;
}

export interface Team {
  id?: string;
  userId: number;
  generationId: number;
  pokemonTeam: Pokemon[];
  createdAt?: Date;
  updatedAt?: Date;
}
