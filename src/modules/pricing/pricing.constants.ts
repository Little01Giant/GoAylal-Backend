/** Hard limits for dashboard-managed pricing. Every amount is in MNT (₮). */
export const MIN_PLAN_PRICE_MNT = 1000;
export const MAX_PLAN_PRICE_MNT = 1_000_000_000;
/** The payer is never charged less than this, whatever discounts apply. */
export const MIN_PAYABLE_MNT = 100;
export const MAX_DISCOUNT_PERCENT = 90;
export const MAX_PLAN_DURATION_DAYS = 3650;
export const MAX_PLAN_FEATURES = 20;
export const MAX_BULK_SIZE = 100;

export const DEFAULT_PLAN_CODE = 'standard';
export const DEFAULT_PLAN_NAME = 'Төлөвлөгөө нээх';
