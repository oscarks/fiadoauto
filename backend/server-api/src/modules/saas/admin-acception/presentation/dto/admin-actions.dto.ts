import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ActivateSubscriptionDto {
  @IsString()
  planId: string;

  @IsString()
  @IsOptional()
  invoiceId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class SuspendProviderDto {
  @IsString()
  @IsEnum(['FULL_BLOCK', 'BLOCK_AUTH_ONLY'])
  suspensionMode: string;

  @IsString()
  reason: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class ReactivateProviderDto {
  @IsString()
  @IsOptional()
  notes?: string;
}

export class MarkInvoicePaidDto {
  @IsString()
  @IsOptional()
  paidDate?: string;

  @IsString()
  @IsOptional()
  externalRef?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
