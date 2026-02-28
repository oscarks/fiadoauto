import { UserRole } from '@prisma/client';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  providerId: string | null;
  conveniadoId: string | null;
}

export interface AuthenticatedRequestUser {
  userId: string;
  email: string;
  role: UserRole;
  providerId: string | null;
  conveniadoId: string | null;
}
