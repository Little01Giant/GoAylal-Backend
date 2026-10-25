const CITY_KEYWORDS: ReadonlyArray<readonly [string, readonly string[]]> = [
  ['shanghai', ['шанхай', 'shanghai']],
  ['tokyo', ['токио', 'tokyo', 'япон', 'japan']],
  ['seoul', ['сөүл', 'seoul', 'солонгос', 'korea']],
  ['phuket', ['пукет', 'пхукет', 'phuket']],
  ['bangkok', ['бангкок', 'bangkok', 'тайланд', 'thailand']],
  ['danang', ['дананг', 'danang', 'хой ан', 'hoi an']],
  ['hanoi', ['ханой', 'hanoi', 'халонг', 'halong']],
  ['dubai', ['дубай', 'dubai', 'эмират', 'uae']],
  ['khuvsgul', ['хөвсгөл', 'нуур', 'khuvsgul']],
  ['beijing', ['бээжин', 'beijing', 'хятад', 'china']],
];

const DAY_WORDS: Readonly<Record<string, number>> = {
  гурав: 3,
  дөрөв: 4,
  тав: 5,
  зургаа: 6,
  долоо: 7,
  найм: 8,
  ес: 9,
  арав: 10,
};

const DEFAULT_DAYS = 5;
const DEFAULT_TRAVELERS = 2;
const MAX_DAYS = 30;
const MAX_TRAVELERS = 20;

export interface ParsedTripRequest {
  /** Undefined when no known destination was mentioned; the planner must then ask instead of guessing. */
  readonly cityKey: string | undefined;
  readonly days: number;
  readonly travelers: number;
}

/** Raised when a message names no known destination. Not an error condition worth logging. */
export class CityNotRecognizedError extends Error {
  constructor() {
    super('No known destination in message');
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function parseTripRequest(message: string): ParsedTripRequest {
  const text = message.toLowerCase();

  const cityKey = CITY_KEYWORDS.find(([, words]) => words.some((w) => text.includes(w)))?.[0];

  // Only numbers attached to a day unit count, so "300 000₮" or "13" never change the length.
  let days = DEFAULT_DAYS;
  const digitDays = /(\d{1,2})\s*(?:өдөр|хоног|days?)/.exec(text);
  const wordDays = /(гурав|дөрөв|тав|зургаа|долоо|найм|ес|арав)\s*(?:өдөр|хоног)/.exec(text);
  if (digitDays?.[1]) {
    days = clamp(parseInt(digitDays[1], 10), 1, MAX_DAYS);
  } else if (wordDays?.[1]) {
    days = DAY_WORDS[wordDays[1]] ?? DEFAULT_DAYS;
  }

  let travelers = DEFAULT_TRAVELERS;
  const digitTravelers = /(\d{1,2})\s*(?:хүн|найз|хүний|travelers?|people|persons?)/.exec(text);
  if (digitTravelers?.[1]) {
    travelers = clamp(parseInt(digitTravelers[1], 10), 1, MAX_TRAVELERS);
  } else if (text.includes('ганцаараа')) {
    travelers = 1;
  } else if (text.includes('гэр бүл')) {
    travelers = 4;
  }

  return { cityKey, days, travelers };
}
