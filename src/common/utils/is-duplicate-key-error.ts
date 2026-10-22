const DUPLICATE_KEY_ERROR = 11000;

/** True for MongoDB's E11000 unique-index violation. */
export function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: unknown }).code === DUPLICATE_KEY_ERROR;
}
