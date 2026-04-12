import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateSaasPlanDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsNumber()
  @Min(0)
  baseMonthlyPrice: number;

  @IsInt()
  @IsOptional()
  maxConvenios?: number | null;

  @IsInt()
  @IsOptional()
  maxVehicles?: number | null;

  @IsInt()
  @IsOptional()
  maxTransactionsMonth?: number | null;

  @IsNumber()
  @IsOptional()
  extraTxPrice?: number | null;

  @IsString()
  @IsOptional()
  @IsEnum(['NONE', 'SUBDOMAIN', 'CUSTOM_DOMAIN'])
  whitelabelType?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  trialDays?: number;

  @IsInt()
  @IsOptional()
  trialMaxTransactions?: number | null;

  @IsString()
  @IsOptional()
  @IsEnum(['FULL_BLOCK', 'BLOCK_AUTH_ONLY'])
  suspensionMode?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  gracePeriodDays?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateSaasPlanDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  baseMonthlyPrice?: number;

  @IsInt()
  @IsOptional()
  maxConvenios?: number | null;

  @IsInt()
  @IsOptional()
  maxVehicles?: number | null;

  @IsInt()
  @IsOptional()
  maxTransactionsMonth?: number | null;

  @IsNumber()
  @IsOptional()
  extraTxPrice?: number | null;

  @IsString()
  @IsOptional()
  @IsEnum(['NONE', 'SUBDOMAIN', 'CUSTOM_DOMAIN'])
  whitelabelType?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  trialDays?: number;

  @IsInt()
  @IsOptional()
  trialMaxTransactions?: number | null;

  @IsString()
  @IsOptional()
  @IsEnum(['FULL_BLOCK', 'BLOCK_AUTH_ONLY'])
  suspensionMode?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  gracePeriodDays?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class ListSaasPlansDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 20;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  @IsEnum(['createdAt', 'name', 'baseMonthlyPrice'])
  sortBy?: string = 'createdAt';

  @IsString()
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
