export interface ZodiacSign {
  id: string;
  name: string;
  nameVi: string;
  symbol: string;
  dateRange: string;
  element: "fire" | "earth" | "air" | "water";
  quality: "cardinal" | "fixed" | "mutable";
  rulingPlanet: string;
  traits: string[];
  color: string;
  luckyNumber: number;
  luckyDay: string;
  compatibility: {
    love: string[];
    friendship: string[];
    career: string[];
  };
}

export interface BirthChart {
  id: string;
  userId: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  houses: House[];
  planets: PlanetPosition[];
  aspects: Aspect[];
  risingSign: string;
  moonSign: string;
  sunSign: string;
}

export interface House {
  number: number;
  sign: string;
  signId: string;
  degree: number;
  cusp: number;
  ruler: string;
}

export interface PlanetPosition {
  planet: string;
  signId: string;
  degree: number;
  minutes: number;
  house: number;
  isRetrograde: boolean;
  speed: number;
}

export interface Aspect {
  planet1: string;
  planet2: string;
  type:
    | "conjunction"
    | "opposition"
    | "trine"
    | "square"
    | "sextile"
    | "quincunx"
    | "semi-sextile";
  orb: number;
  angle: number;
  isApplying: boolean;
}

export interface Horoscope {
  id: string;
  zodiacSign: string;
  date: string;
  love: string;
  career: string;
  health: string;
  finance: string;
  general: string;
  luckyColor: string;
  luckyNumber: number;
  mood: "happy" | "calm" | "energetic" | "thoughtful" | "romantic";
}

export interface CompatibilityResult {
  sign1: string;
  sign2: string;
  score: number;
  description: string;
  strengths: string[];
  weaknesses: string[];
  advice: string;
  loveCompatibility: number;
  friendshipCompatibility: number;
  careerCompatibility: number;
}

export interface AstrologyTransit {
  id: string;
  planet: string;
  sign: string;
  date: string;
  description: string;
  impact: "positive" | "neutral" | "challenging";
  aspect?: string;
}
