import gen1Image from "../assets/gens/1.png";
import gen2Image from "../assets/gens/2.png";
import gen3Image from "../assets/gens/3.png";
import gen4Image from "../assets/gens/4.png";
import gen5Image from "../assets/gens/5.png";
import type { GenerationData } from "../types";

export const GENERATIONS: GenerationData[] = [
  {
    generation: 1,
    name: "GEN 1",
    color: "#FF6B6B",
    description: "Kanto Region - 5 Battles",
    image: gen1Image,
  },
  {
    generation: 2,
    name: "GEN 2",
    color: "#4ECDC4",
    description: "Johto Region - 5 Battles",
    image: gen2Image,
  },
  {
    generation: 3,
    name: "GEN 3",
    color: "#95E1D3",
    description: "Hoenn Region - 5 Battles",
    image: gen3Image,
  },
  {
    generation: 4,
    name: "GEN 4",
    color: "#F38181",
    description: "Sinnoh Region - 5 Battles",
    image: gen4Image,
  },
  {
    generation: 5,
    name: "GEN 5",
    color: "#AA96DA",
    description: "Unova Region - 5 Battles",
    image: gen5Image,
  },
];

export const BATTLES_PER_GENERATION = 5;
