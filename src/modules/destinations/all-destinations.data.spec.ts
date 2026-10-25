import { ALL_DESTINATIONS } from './all-destinations.data.js';

const CATEGORIES = ['nature', 'historical', 'cultural', 'adventure', 'city', 'culinary'];
const TRANSPORT_TYPES = ['flight', 'overland', 'combined'];
const HOTEL_TIERS = [2, 3, 5];

describe('seed catalog pricing rules (AGENTS.md: direct MNT, 3 hotel tiers, per-adult tickets)', () => {
  it('has at least one destination with unique keys', () => {
    expect(ALL_DESTINATIONS.length).toBeGreaterThan(0);
    const keys = ALL_DESTINATIONS.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  describe.each(ALL_DESTINATIONS.map((c) => [c.key, c] as const))('%s', (_key, city) => {
    it('has unique seed ids per collection (required for idempotent upserts)', () => {
      for (const list of [city.attractions, city.hotels, city.transports]) {
        const ids = list.map((item) => item.id);
        expect(ids.every((id) => typeof id === 'string' && id.length > 0)).toBe(true);
        expect(new Set(ids).size).toBe(ids.length);
      }
    });

    it('prices attractions as non-negative integer MNT with a valid category (free sites are 0)', () => {
      expect(city.attractions.length).toBeGreaterThan(0);
      for (const a of city.attractions) {
        expect(Number.isInteger(a.estimatedCost)).toBe(true);
        expect(a.estimatedCost).toBeGreaterThanOrEqual(0);
        expect(CATEGORIES).toContain(a.category);
        expect(a.estimatedHours).toBeGreaterThan(0);
      }
    });

    it('offers exactly the three hotel tiers 2, 3 and 5 star with positive integer nightly MNT prices', () => {
      expect(city.hotels.map((h) => h.starRating).sort()).toEqual(HOTEL_TIERS);
      for (const h of city.hotels) {
        expect(Number.isInteger(h.pricePerNight)).toBe(true);
        expect(h.pricePerNight).toBeGreaterThan(0);
      }
    });

    it('keeps a well-formed Trip.com source for prices that have one (internal, for price refreshes)', () => {
      for (const i of [...city.attractions, ...city.hotels, ...city.transports]) {
        if (i.sourceUrl !== undefined) expect(i.sourceUrl).toMatch(/^https:\/\/([a-z]+\.)?trip\.com\/\S+$/);
        if (i.priceCheckedAt !== undefined) {
          expect(i.priceCheckedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          expect(i.sourceUrl).toBeDefined(); // a checked price must say where it was checked
        }
      }
    });

    it('offers valid transport types with positive integer per-person MNT prices', () => {
      expect(city.transports.length).toBeGreaterThan(0);
      for (const t of city.transports) {
        expect(TRANSPORT_TYPES).toContain(t.type);
        expect(Number.isInteger(t.pricePerPerson)).toBe(true);
        expect(t.pricePerPerson).toBeGreaterThan(0);
      }
      const types = city.transports.map((t) => t.type);
      expect(new Set(types).size).toBe(types.length);
    });
  });
});
