import { ProviderStatus } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CreateProviderAdminUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(3)
  name!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class CreateProviderDto {
  @IsString()
  @MinLength(3)
  legalName!: string;

  @IsString()
  @MinLength(3)
  tradeName!: string;

  @IsString()
  cnpj!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @MinLength(3)
  responsibleName!: string;

  @IsObject()
  address!: Record<string, unknown>;

  @ValidateNested()
  @Type(() => CreateProviderAdminUserDto)
  adminUser!: CreateProviderAdminUserDto;
}

export class ChangeProviderStatusDto {
  @IsEnum(ProviderStatus)
  status!: ProviderStatus;
}
