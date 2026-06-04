import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

/** Withdraw (cut) an amount from an account's savings balance. */
export class WithdrawDto {
  @ApiProperty({ example: 50000, description: 'Amount to withdraw from savings' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  amount: number;

  @ApiProperty({
    enum: PaymentMethod,
    default: PaymentMethod.Cash,
    example: PaymentMethod.Cash,
    description: 'Payment method: Cash or BankTransfer',
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod = PaymentMethod.Cash;

  @ApiPropertyOptional({ example: '0101001', description: 'Expected vbCode (ownership guard)' })
  @IsOptional()
  @IsString()
  vbCode?: string;

  @ApiPropertyOptional({ example: 'QR withdraw', description: 'Optional note' })
  @IsOptional()
  @IsString()
  note?: string;
}
