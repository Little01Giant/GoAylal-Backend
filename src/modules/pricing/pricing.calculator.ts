import { MAX_DISCOUNT_PERCENT, MIN_PAYABLE_MNT } from './pricing.constants.js';
import { DiscountType } from './schemas/discount-type.js';

export interface DiscountRule {
  readonly type: DiscountType;
  readonly value: number;
  readonly isActive: boolean;
  readonly startsAt?: Date | null | undefined;
  readonly endsAt?: Date | null | undefined;
}

export interface AppliedDiscount<T extends DiscountRule> {
  readonly discount: T;
  readonly amount: number;
}

/** A discount is live when it is switched on and `now` is inside its optional [startsAt, endsAt) window. */
export function isDiscountLive(discount: DiscountRule, now: Date): boolean {
  if (!discount.isActive) {
    return false;
  }
  if (discount.startsAt && discount.startsAt.getTime() > now.getTime()) {
    return false;
  }
  if (discount.endsAt && discount.endsAt.getTime() <= now.getTime()) {
    return false;
  }
  return true;
}

export type DiscountStatus = 'active' | 'inactive' | 'scheduled' | 'expired';

/** Human-facing lifecycle state: switched off beats scheduled/expired, which beat active. */
export function discountStatus(discount: DiscountRule, now: Date): DiscountStatus {
  if (!discount.isActive) {
    return 'inactive';
  }
  if (discount.startsAt && discount.startsAt.getTime() > now.getTime()) {
    return 'scheduled';
  }
  if (discount.endsAt && discount.endsAt.getTime() <= now.getTime()) {
    return 'expired';
  }
  return 'active';
}

/** MNT taken off `price`. Whole tögrög, never negative, and never below MIN_PAYABLE_MNT left to pay. */
export function discountAmountFor(price: number, discount: Pick<DiscountRule, 'type' | 'value'>): number {
  const raw = discount.type === DiscountType.PERCENTAGE ? Math.floor((price * discount.value) / 100) : discount.value;
  return Math.max(0, Math.min(raw, price - MIN_PAYABLE_MNT));
}

/** Discounts never stack: the one saving the payer the most wins (the first listed wins a tie). */
export function pickBestDiscount<T extends DiscountRule>(
  price: number,
  discounts: readonly T[],
  now: Date,
): AppliedDiscount<T> | null {
  let best: AppliedDiscount<T> | null = null;
  for (const discount of discounts) {
    if (!isDiscountLive(discount, now)) {
      continue;
    }
    const amount = discountAmountFor(price, discount);
    if (amount > 0 && (!best || amount > best.amount)) {
      best = { discount, amount };
    }
  }
  return best;
}

/**
 * Why a discount value is unacceptable for a plan priced at `price`, or null when it is fine.
 * Percentages are whole numbers up to MAX_DISCOUNT_PERCENT; fixed amounts must leave MIN_PAYABLE_MNT to pay.
 */
export function discountValueProblem(
  discount: Pick<DiscountRule, 'type' | 'value'>,
  price?: number,
): string | null {
  if (!Number.isInteger(discount.value) || discount.value < 1) {
    return 'Хөнгөлөлтийн утга 1-ээс их бүхэл тоо байх ёстой.';
  }
  if (discount.type === DiscountType.PERCENTAGE) {
    return discount.value > MAX_DISCOUNT_PERCENT
      ? `Хувийн хөнгөлөлт ${MAX_DISCOUNT_PERCENT}%-иас хэтэрч болохгүй.`
      : null;
  }
  if (price !== undefined && discount.value > price - MIN_PAYABLE_MNT) {
    return `Тогтмол хөнгөлөлт үнээс (${price.toLocaleString('en-US')}₮) хэт их байна. Хамгийн багадаа ${MIN_PAYABLE_MNT}₮ төлөх үлдэх ёстой.`;
  }
  return null;
}
