import { Inject, Injectable } from '@nestjs/common';
import { BookingDto } from '../dto/booking.dto';
import { ClaimDto } from '../dto/claim.dto';
import { MatchResponseDto } from '../dto/match-response.dto';
import { TestsMapItem } from '../interfaces/tests-map.interface';
import { TESTS_MAP } from '../constants/match.constants';
import { Candidate } from '../interfaces/candidate.interface';

@Injectable()
export class MatcherService {
  constructor(@Inject(TESTS_MAP) private readonly testsMap: TestsMapItem[]) {}

  matchAll(bookings: BookingDto[], claims: ClaimDto[]): MatchResponseDto[] {
    const index = this.buildIndexByPatientAndDate(claims);
    const results: MatchResponseDto[] = [];

    for (const b of bookings) {
      const key = this.getKey(b.patient, b.reservationDate);
      const pool = index.get(key) || [];
      const best = this.findBestCandidate(b, pool);
      if (!best) continue;
      results.push(this.buildResult(b.id, best));
      this.removeClaimFromPool(index, key, best.claim.id);
    }

    return results;
  }

  private buildIndexByPatientAndDate(
    claims: ClaimDto[],
  ): Map<string, ClaimDto[]> {
    const map = new Map<string, ClaimDto[]>();
    for (const c of claims) {
      const key = this.getKey(c.patient, c.bookingDate);
      const bucket = map.get(key) ?? [];
      bucket.push(c);
      map.set(key, bucket);
    }
    return map;
  }

  private getKey(patient: string, isoDate: string): string {
    return `${patient}|${isoDate.slice(0, 10)}`;
  }

  private scoreCandidates(booking: BookingDto, pool: ClaimDto[]): Candidate[] {
    return pool.map((claim) => {
      let score = 0;
      const mismatches: string[] = [];

      const isTestMatch = this.testsMap.some(
        (t) =>
          t.bookingTestId === booking.test &&
          t.claimTestId === claim.medicalServiceCode,
      );
      isTestMatch ? score++ : mismatches.push('test');

      booking.reservationDate === claim.bookingDate
        ? score++
        : mismatches.push('time');

      booking.insurance === claim.insurance
        ? score++
        : mismatches.push('insurance');

      return { claim, score, mismatches };
    });
  }

  private findBestCandidate(
    booking: BookingDto,
    pool: ClaimDto[],
  ): Candidate | null {
    const candidates = this.scoreCandidates(booking, pool).filter(
      (c) => c.score > 0,
    );
    if (!candidates.length) return null;
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0];
  }

  private buildResult(
    bookingId: string,
    candidate: Candidate,
  ): MatchResponseDto {
    const res: MatchResponseDto = {
      booking: bookingId,
      claim: candidate.claim.id,
    };
    if (candidate.mismatches.length) {
      res.mismatch = candidate.mismatches;
    }
    return res;
  }

  private removeClaimFromPool(
    index: Map<string, ClaimDto[]>,
    key: string,
    claimId: string,
  ) {
    const bucket = index.get(key) || [];
    index.set(
      key,
      bucket.filter((c) => c.id !== claimId),
    );
  }
}
