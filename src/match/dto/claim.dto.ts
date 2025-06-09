import { IsISO8601, IsString } from 'class-validator';

export class ClaimDto {
  @IsString() id: string;
  @IsString() medicalServiceCode: string;
  @IsISO8601() bookingDate: string;
  @IsString() insurance: string;
  @IsString() patient: string;
}
