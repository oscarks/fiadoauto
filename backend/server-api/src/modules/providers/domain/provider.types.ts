import { ProviderStatus, UserRole, UserStatus } from '@prisma/client';

export interface ProviderEntity {
  id: string;
  legalName: string;
  tradeName: string;
  cnpj: string;
  email: string;
  phone: string | null;
  responsibleName: string;
  address: unknown;
  status: ProviderStatus;
  onboardingState: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProviderData {
  legalName: string;
  tradeName: string;
  cnpj: string;
  email: string;
  phone?: string;
  responsibleName: string;
  address: unknown;
  adminUser: {
    email: string;
    name: string;
    passwordHash: string;
    role: UserRole;
    status: UserStatus;
  };
}

export interface UpdateProviderData {
  legalName?: string;
  tradeName?: string;
  phone?: string | null;
  responsibleName?: string;
  address?: unknown;
}
