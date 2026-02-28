import { ProviderStatus } from '@prisma/client';

export class ProviderResponseDto {
  id!: string;
  legalName!: string;
  tradeName!: string;
  cnpj!: string;
  email!: string;
  phone!: string | null;
  responsibleName!: string;
  address!: unknown;
  status!: ProviderStatus;
  onboardingState!: unknown;
  createdAt!: Date;
  updatedAt!: Date;
}
