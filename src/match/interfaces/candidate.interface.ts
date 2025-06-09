import { ClaimDto } from '../dto/claim.dto';

export interface Candidate {
  claim: ClaimDto;
  score: number;
  mismatches: string[];
}
