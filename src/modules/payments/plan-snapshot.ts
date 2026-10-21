const STRING_KEYS = ['destinationName', 'destinationKey', 'hotelTitle', 'transportTitle'] as const;
const NUMBER_KEYS = [
  'daysCount',
  'nightsCount',
  'travelersCount',
  'roomsCount',
  'hotelPricePerNight',
  'hotelTotalCost',
  'transportPricePerPerson',
  'transportTotalCost',
  'attractionsCount',
  'attractionsTotalCost',
  'grandTotalCost',
  'perPersonCost',
] as const;

const MAX_STRING_LENGTH = 200;
const MAX_ATTRACTIONS = 50;
const MAX_AMOUNT = 10_000_000_000;

function cleanString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim().slice(0, MAX_STRING_LENGTH) : undefined;
}

function cleanNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= MAX_AMOUNT ? value : undefined;
}

/**
 * Reduces the client-supplied plan snapshot to the known display fields with bounded types.
 * The result is informational only: the charged amount never depends on it.
 */
export function sanitizePlanSnapshot(raw: unknown): Record<string, unknown> | undefined {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return undefined;
  }
  const source = raw as Record<string, unknown>;
  const clean: Record<string, unknown> = {};

  for (const key of STRING_KEYS) {
    const value = cleanString(source[key]);
    if (value !== undefined) clean[key] = value;
  }
  for (const key of NUMBER_KEYS) {
    const value = cleanNumber(source[key]);
    if (value !== undefined) clean[key] = value;
  }

  if (Array.isArray(source.attractions)) {
    clean.attractions = source.attractions.slice(0, MAX_ATTRACTIONS).flatMap((entry: unknown) => {
      if (typeof entry !== 'object' || entry === null) return [];
      const item = entry as Record<string, unknown>;
      const name = cleanString(item.name);
      if (!name) return [];
      return [
        {
          id: cleanString(item.id) ?? name,
          name,
          price: cleanNumber(item.price) ?? 0,
          category: cleanString(item.category) ?? '',
        },
      ];
    });
  }

  return Object.keys(clean).length > 0 ? clean : undefined;
}
