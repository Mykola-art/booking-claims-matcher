import { IsISO8601, IsString } from 'class-validator';

export class BookingDto {
  @IsString() id: string;
  @IsString() patient: string;
  @IsString() test: string;
  @IsString() insurance: string;
  @IsISO8601() reservationDate: string;
}
