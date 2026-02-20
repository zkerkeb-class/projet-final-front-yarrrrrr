export interface Battle {
  id: number;
  opponentName: string;
  difficulty: "easy" | "medium" | "hard";
  completed: boolean;
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
