import { IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateProviderDto {
  @IsString()
  @MinLength(3)
  @IsOptional()
  legalName?: string;

  @IsString()
  @MinLength(3)
  @IsOptional()
  tradeName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @MinLength(3)
  @IsOptional()
  responsibleName?: string;

  @IsObject()
  @IsOptional()
  address?: Record<string, unknown>;
}
