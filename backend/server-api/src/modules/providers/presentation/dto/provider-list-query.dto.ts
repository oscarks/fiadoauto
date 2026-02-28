import { ProviderStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../../../shared/pagination/pagination.dto';

export class ProviderListQueryDto extends PaginationDto {
  @IsEnum(ProviderStatus)
  @IsOptional()
  status?: ProviderStatus;
}
