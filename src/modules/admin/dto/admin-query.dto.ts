import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto.js';

export const TRANSACTION_STATUS_FILTERS = ['all', 'pending', 'completed', 'failed', 'expired', 'refunded'] as const;

export class AdminUsersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Нэр эсвэл имэйлээр хайх' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}

export class AdminTransactionsQueryDto extends AdminUsersQueryDto {
  @ApiPropertyOptional({ enum: TRANSACTION_STATUS_FILTERS })
  @IsOptional()
  @IsIn(TRANSACTION_STATUS_FILTERS)
  status?: (typeof TRANSACTION_STATUS_FILTERS)[number];
}
