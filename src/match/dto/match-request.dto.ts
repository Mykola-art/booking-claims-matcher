import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { BookingDto } from './booking.dto';
import { ClaimDto } from './claim.dto';

export class MatchRequestDto {
  @ValidateNested({ each: true })
  @Type(() => BookingDto)
  bookings: BookingDto[];

  @ValidateNested({ each: true })
  @Type(() => ClaimDto)
  claims: ClaimDto[];
}
