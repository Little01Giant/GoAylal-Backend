import type { AuthenticatedUser } from '../../modules/auth/auth.types.js';

/** Narrows the user injected behind JwtAuthGuard without a non-null assertion. */
export function requireUser(user: AuthenticatedUser | undefined): AuthenticatedUser {
  if (!user) {
    throw new Error('Authenticated user missing after JwtAuthGuard');
  }
  return user;
}
