import {
  discountAmountFor,
  discountStatus,
  discountValueProblem,
  isDiscountLive,
  pickBestDiscount,
  type DiscountRule,
} from './pricing.calculator.js';
import { DiscountType } from './schemas/discount-type.js';

const NOW = new Date('2026-11-15T12:00:00.000Z');
const rule = (overrides: Partial<DiscountRule> = {}): DiscountRule => ({
  type: DiscountType.PERCENTAGE,
  value: 10,
  isActive: true,
  ...overrides,
});

describe('discountAmountFor', () => {
  it('takes a whole-tögrög percentage off the price', () => {
    expect(discountAmountFor(20000, { type: DiscountType.PERCENTAGE, value: 10 })).toBe(2000);
    expect(discountAmountFor(19999, { type: DiscountType.PERCENTAGE, value: 10 })).toBe(1999);
  });

  it('takes a fixed amount off the price', () => {
    expect(discountAmountFor(20000, { type: DiscountType.FIXED, value: 5000 })).toBe(5000);
  });

  it('never leaves less than the minimum payable amount', () => {
    expect(discountAmountFor(20000, { type: DiscountType.FIXED, value: 50000 })).toBe(19900);
    expect(discountAmountFor(1000, { type: DiscountType.PERCENTAGE, value: 99 })).toBe(900);
  });

  it('is never negative', () => {
    expect(discountAmountFor(50, { type: DiscountType.FIXED, value: 10 })).toBe(0);
  });
});

describe('isDiscountLive / discountStatus', () => {
  it('requires the discount to be switched on', () => {
    expect(isDiscountLive(rule({ isActive: false }), NOW)).toBe(false);
    expect(discountStatus(rule({ isActive: false }), NOW)).toBe('inactive');
  });

  it('honours the validity window, start inclusive and end exclusive', () => {
    const startsAt = new Date('2026-11-15T12:00:00.000Z');
    expect(isDiscountLive(rule({ startsAt }), NOW)).toBe(true);
    expect(isDiscountLive(rule({ endsAt: NOW }), NOW)).toBe(false);
    expect(discountStatus(rule({ startsAt: new Date('2026-12-01T00:00:00.000Z') }), NOW)).toBe('scheduled');
    expect(discountStatus(rule({ endsAt: new Date('2026-11-01T00:00:00.000Z') }), NOW)).toBe('expired');
    expect(discountStatus(rule(), NOW)).toBe('active');
  });
});

describe('pickBestDiscount', () => {
  it('chooses the single largest saving and never stacks', () => {
    const small = rule({ type: DiscountType.FIXED, value: 1000 });
    const large = rule({ type: DiscountType.PERCENTAGE, value: 20 });
    const best = pickBestDiscount(20000, [small, large], NOW);
    expect(best?.discount).toBe(large);
    expect(best?.amount).toBe(4000);
  });

  it('ignores discounts that are not live', () => {
    const off = rule({ isActive: false, value: 50 });
    const expired = rule({ value: 50, endsAt: new Date('2026-01-01T00:00:00.000Z') });
    expect(pickBestDiscount(20000, [off, expired], NOW)).toBeNull();
  });

  it('returns null when nothing applies', () => {
    expect(pickBestDiscount(20000, [], NOW)).toBeNull();
  });
});

describe('discountValueProblem', () => {
  it('accepts sensible values', () => {
    expect(discountValueProblem({ type: DiscountType.PERCENTAGE, value: 90 })).toBeNull();
    expect(discountValueProblem({ type: DiscountType.FIXED, value: 5000 }, 20000)).toBeNull();
  });

  it('rejects zero, negative and fractional values', () => {
    expect(discountValueProblem({ type: DiscountType.PERCENTAGE, value: 0 })).not.toBeNull();
    expect(discountValueProblem({ type: DiscountType.FIXED, value: -5 })).not.toBeNull();
    expect(discountValueProblem({ type: DiscountType.PERCENTAGE, value: 10.5 })).not.toBeNull();
  });

  it('rejects percentages above the limit', () => {
    expect(discountValueProblem({ type: DiscountType.PERCENTAGE, value: 91 })).toMatch(/90%/);
  });

  it('rejects a fixed amount that would leave nothing to pay', () => {
    expect(discountValueProblem({ type: DiscountType.FIXED, value: 19950 }, 20000)).not.toBeNull();
    expect(discountValueProblem({ type: DiscountType.FIXED, value: 19900 }, 20000)).toBeNull();
  });
});
