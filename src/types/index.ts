export interface Battle {
  id: number;
  opponentName: string;
  completed: boolean;
  avatar?: string;
  type?: string;
}

export interface Dresseur {
  Id: number;
  Gen: number;
  Nom: string;
  Type: string;
  Avatar: string;
  Pokemon: Pokemon[];
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
