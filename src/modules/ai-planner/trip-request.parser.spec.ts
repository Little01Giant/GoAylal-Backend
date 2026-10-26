import { parseTripRequest } from './trip-request.parser.js';

describe('parseTripRequest', () => {
  it('detects the city and falls back to defaults', () => {
    expect(parseTripRequest('Токио руу аялмаар байна')).toEqual({ cityKey: 'tokyo', days: 5, travelers: 2 });
  });

  it('detects Hanoi and Halong Bay before the country-level entries', () => {
    expect(parseTripRequest('Ханой 5 өдөр').cityKey).toBe('hanoi');
    expect(parseTripRequest('Halong bay руу явна').cityKey).toBe('hanoi');
  });

  it('returns no city instead of defaulting to beijing', () => {
    expect(parseTripRequest('Сайн байна уу').cityKey).toBeUndefined();
  });

  it('reads the number of days only when attached to a day unit', () => {
    expect(parseTripRequest('Бээжин 7 өдөр').days).toBe(7);
    expect(parseTripRequest('Бээжин 12 хоног').days).toBe(12);
    expect(parseTripRequest('Beijing 4 days').days).toBe(4);
    expect(parseTripRequest('Бээжин долоо хоног').days).toBe(7);
  });

  it('ignores digits that are not a trip length (regression: includes("3") matched anywhere)', () => {
    expect(parseTripRequest('Бээжин 1300000 төгрөгийн төсөвтэй').days).toBe(5);
    expect(parseTripRequest('Бээжин 2026 онд').days).toBe(5);
    expect(parseTripRequest('Бээжин 13 хүн').days).toBe(5);
  });

  it('clamps unreasonable values', () => {
    expect(parseTripRequest('Бээжин 99 өдөр').days).toBe(30);
    expect(parseTripRequest('Бээжин 0 өдөр').days).toBe(1);
    expect(parseTripRequest('Бээжин 80 хүн').travelers).toBe(20);
  });

  it('reads travelers from numbers and phrases', () => {
    expect(parseTripRequest('Бээжин 3 хүн').travelers).toBe(3);
    expect(parseTripRequest('Бээжин ганцаараа').travelers).toBe(1);
    expect(parseTripRequest('Бээжин гэр бүлээрээ').travelers).toBe(4);
  });
});
