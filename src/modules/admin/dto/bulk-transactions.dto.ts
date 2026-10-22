import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsIn, IsMongoId } from 'class-validator';

export const MAX_BULK_TRANSACTIONS = 50;
export const BULK_TRANSACTION_ACTIONS = ['recheck', 'expire-pending', 'mark-refunded'] as const;
export type BulkTransactionAction = (typeof BULK_TRANSACTION_ACTIONS)[number];

export class BulkTransactionsDto {
  @ApiProperty({ type: [String], description: `Сонгосон гүйлгээнүүдийн ID-ууд (1–${MAX_BULK_TRANSACTIONS})` })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_BULK_TRANSACTIONS)
  @ArrayUnique()
  @IsMongoId({ each: true })
  ids: string[];

  @ApiProperty({
    enum: BULK_TRANSACTION_ACTIONS,
    description:
      'recheck: QPay-ээр дахин шалгана. expire-pending: QPay-ээр шалгаад төлөгдөөгүйг "хугацаа дууссан" болгоно. mark-refunded: төлөгдсөнийг "буцаагдсан" гэж тэмдэглэнэ.',
  })
  @IsIn(BULK_TRANSACTION_ACTIONS)
  action: BulkTransactionAction;
}
