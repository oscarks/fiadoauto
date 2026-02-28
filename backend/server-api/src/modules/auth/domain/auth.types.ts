import { ProviderStatus, UserRole, UserStatus } from '@prisma/client';

export interface AuthUser {
  id: string;
  providerId: string | null;
  conveniadoId: string | null;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
}

export interface AuthUserProfile {
  id: string;
  providerId: string | null;
  conveniadoId: string | null;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  provider: {
    id: string;
    tradeName: string;
    status: ProviderStatus;
  } | null;
}

export interface RefreshTokenRecord {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export interface ManagedUser {
  id: string;
  providerId: string | null;
  conveniadoId: string | null;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}

export interface EmailVerificationTokenRecord {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
}
