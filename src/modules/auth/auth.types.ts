import type { Request } from 'express';
import type { UserRole } from './schemas/user.schema.js';

/** Identity attached to the request by the auth guards. Role comes from the database, not the token. */
export interface AuthenticatedUser {
  readonly sub: string;
  readonly email: string;
  readonly role: UserRole;
  readonly name?: string | undefined;
}

export type AuthenticatedRequest = Request & { user?: AuthenticatedUser | undefined };
