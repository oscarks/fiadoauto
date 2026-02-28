import { IsDateString, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../../shared/pagination/pagination.dto';

export class AuditLogQueryDto extends PaginationDto {
  @IsString()
  @IsOptional()
  entity?: string;

  @IsString()
  @IsOptional()
  action?: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  providerId?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}
