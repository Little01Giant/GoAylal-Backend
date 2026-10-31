import type { SeedDestinationCity } from '../../src/modules/destinations/destination-city.types.js';

const IMG = 'https://img.example.test/attractions/xx-att-01/1.webp';
const SOURCE = 'https://www.trip.com/travel-guide/attraction/test/place-1?curr=MNT&locale=en-XX';

/** A small city with the full catalog shape; cities are not bundled in code, so tests put one in the database. */
export function makeCity(key = 'beijing', name = 'Бээжин', attractionCount = 12): SeedDestinationCity {
  const code = key.slice(0, 2);
  return {
    key,
    name,
    country: 'Хятад',
    countryKey: 'china',
    flag: '🇨🇳',
    tag: 'Туршилт',
    description: `${name} туршилтын хот`,
    attractions: Array.from({ length: attractionCount }, (_, i) => ({
      rank: i + 1,
      id: `${code}-att-${String(i + 1).padStart(2, '0')}`,
      name: `${name} үзвэр ${i + 1}`,
      category: 'city',
      region: `District, ${name}`,
      estimatedCost: i * 5000,
      estimatedHours: 2,
      imageUrl: IMG,
      images: [IMG],
      rating: 4.5,
      highlights: ['a', 'b', 'c'],
      description: 'Тайлбар',
      sourceUrl: SOURCE,
      priceCheckedAt: '2026-10-25',
    })),
    hotels: [2, 3, 5].map((starRating) => ({
      id: `hotel-${code}-level-${starRating}`,
      name: `${starRating} одтой буудал`,
      starRating,
      pricePerNight: starRating * 40_000,
      imageUrl: IMG,
      locationDesc: 'Төв',
      amenities: ['Wi-Fi'],
      sourceUrl: SOURCE,
      priceCheckedAt: '2026-10-25',
    })),
    transports: [
      {
        id: `tr-${code}-flight`,
        type: 'flight',
        title: 'Дан нислэг',
        durationText: '3 цаг',
        pricePerPerson: 900_000,
        sourceUrl: SOURCE,
        priceCheckedAt: '2026-10-25',
      },
      {
        // a second route of the same type: a city may have several routes per type
        id: `tr-${code}-flight-2`,
        type: 'flight',
        title: 'Хөх хотоор дамжих нислэг',
        durationText: '6 цаг',
        pricePerPerson: 1_100_000,
        sourceUrl: SOURCE,
        priceCheckedAt: '2026-10-25',
      },
    ],
  };
}
