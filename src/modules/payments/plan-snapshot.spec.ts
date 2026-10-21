import { sanitizePlanSnapshot } from './plan-snapshot.js';

describe('sanitizePlanSnapshot', () => {
  it('keeps only known display fields with valid types', () => {
    const clean = sanitizePlanSnapshot({
      destinationName: ' Бээжин ',
      daysCount: 5,
      grandTotalCost: 1_000_000,
      isAdmin: true,
      $where: 'sleep(1000)',
      hotelTitle: 42,
      travelersCount: -3,
      roomsCount: Number.POSITIVE_INFINITY,
    });
    expect(clean).toEqual({ destinationName: 'Бээжин', daysCount: 5, grandTotalCost: 1_000_000 });
  });

  it('bounds strings and attraction lists', () => {
    const clean = sanitizePlanSnapshot({
      destinationName: 'x'.repeat(500),
      attractions: Array.from({ length: 80 }, (_, i) => ({ id: `a${i}`, name: `Үзвэр ${i}`, price: 10, category: 'city' })),
    });
    expect(clean).toBeDefined();
    const snapshot = clean as Record<string, unknown>;
    expect((snapshot.destinationName as string).length).toBe(200);
    expect((snapshot.attractions as unknown[]).length).toBe(50);
  });

  it('returns undefined for non-objects and empty snapshots', () => {
    expect(sanitizePlanSnapshot(undefined)).toBeUndefined();
    expect(sanitizePlanSnapshot('text')).toBeUndefined();
    expect(sanitizePlanSnapshot([1, 2])).toBeUndefined();
    expect(sanitizePlanSnapshot({ unknown: 1 })).toBeUndefined();
  });
});
