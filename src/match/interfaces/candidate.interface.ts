import { BookingDto } from '../dto/booking.dto';
import { ClaimDto } from '../dto/claim.dto';

export interface Candidate {
  booking: BookingDto;
  claim: ClaimDto;
  score: number;
  mismatches: string[];
}
