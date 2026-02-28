import {
  AuthUser,
  AuthUserProfile,
  EmailVerificationTokenRecord,
  ManagedUser,
  RefreshTokenRecord,
} from './auth.types';
import { PaginatedResult } from '../../../shared/pagination/paginated-result';
import { UserRole, UserStatus } from '@prisma/client';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
export const REFRESH_TOKEN_REPOSITORY = Symbol('REFRESH_TOKEN_REPOSITORY');
export const EMAIL_VERIFICATION_TOKEN_REPOSITORY = Symbol('EMAIL_VERIFICATION_TOKEN_REPOSITORY');
export const HASHING_PORT = Symbol('HASHING_PORT');
export const EMAIL_PORT = Symbol('EMAIL_PORT');

export interface UserRepositoryPort {
  findByEmail(email: string): Promise<AuthUser | null>;
  findById(userId: string): Promise<AuthUser | null>;
  findProfileById(userId: string): Promise<AuthUserProfile | null>;
  updateLastLoginAt(userId: string, date: Date): Promise<void>;
  activateUser(userId: string, date: Date): Promise<void>;
  updatePasswordHash(userId: string, passwordHash: string): Promise<void>;
  findByIdInProvider(providerId: string, userId: string): Promise<ManagedUser | null>;
  findAllByProvider(
    providerId: string,
    filters: {
      role?: UserRole;
      status?: UserStatus;
      search?: string;
      page: number;
      limit: number;
    },
  ): Promise<PaginatedResult<ManagedUser>>;
  createInProvider(
    providerId: string,
    data: {
      email: string;
      passwordHash: string;
      name: string;
      role: UserRole;
      status: UserStatus;
    },
  ): Promise<ManagedUser>;
  updateInProvider(
    providerId: string,
    userId: string,
    data: {
      name?: string;
      role?: UserRole;
      status?: UserStatus;
    },
  ): Promise<ManagedUser>;
}

export interface RefreshTokenRepositoryPort {
  create(userId: string, token: string, expiresAt: Date): Promise<void>;
  findByToken(token: string): Promise<RefreshTokenRecord | null>;
  revoke(token: string, revokedAt: Date): Promise<void>;
  revokeAllByUserId(userId: string, revokedAt: Date): Promise<void>;
}

export interface EmailVerificationTokenRepositoryPort {
  create(userId: string, token: string, expiresAt: Date): Promise<void>;
  findByToken(token: string): Promise<EmailVerificationTokenRecord | null>;
  markUsed(token: string, usedAt: Date): Promise<void>;
  invalidateUnusedByUserId(userId: string, usedAt: Date): Promise<void>;
}

export interface HashingPort {
  hash(plain: string): Promise<string>;
  compare(plain: string, hashed: string): Promise<boolean>;
}

export interface EmailPort {
  send(
    to: string,
    templateCode: string,
    variables: Record<string, unknown>,
  ): Promise<void>;
}
