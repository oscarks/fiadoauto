import { ProviderStatus, UserRole, UserStatus } from '@prisma/client';

class UserProfileProviderDto {
  id!: string;
  tradeName!: string;
  status!: ProviderStatus;
}

export class UserProfileDto {
  id!: string;
  email!: string;
  name!: string;
  role!: UserRole;
  status!: UserStatus;
  providerId!: string | null;
  conveniadoId!: string | null;
  provider!: UserProfileProviderDto | null;
}
