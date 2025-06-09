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
    const validClaims = this.filterByMandatoryCriteria(bookings, claims);
    const candidates = this.generateCandidates(bookings, validClaims);
    const scored = this.scoreAllCandidates(candidates);
    const sorted = this.sortCandidates(scored);
    return this.assignMatches(sorted);
  }

  private filterByMandatoryCriteria(
    bookings: BookingDto[],
    claims: ClaimDto[],
  ): ClaimDto[] {
    const allowedDates = new Set<string>();
    bookings.forEach((b) =>
      allowedDates.add(this.getKey(b.patient, b.reservationDate)),
    );

    return claims.filter((c) =>
      allowedDates.has(this.getKey(c.patient, c.bookingDate)),
    );
  }

  private generateCandidates(
    bookings: BookingDto[],
    claims: ClaimDto[],
  ): Candidate[] {
    const candidates: Candidate[] = [];
    const claimsByKey = this.groupByKey(claims);
    for (const b of bookings) {
      const key = this.getKey(b.patient, b.reservationDate);
      const pool = claimsByKey.get(key) || [];
      pool.forEach((c) =>
        candidates.push({ booking: b, claim: c, score: 0, mismatches: [] }),
      );
    }
    return candidates;
  }

  private scoreAllCandidates(cands: Candidate[]): Candidate[] {
    return cands.map((cand) => this.scoreCandidate(cand));
  }

  private scoreCandidate(c: Candidate): Candidate {
    const { booking: b, claim: cl } = c;
    let score = 0;
    const mm: string[] = [];

    if (this.isTestMatch(b.test, cl.medicalServiceCode)) {
      score++;
    } else {
      mm.push('test');
    }

    if (b.reservationDate === cl.bookingDate) {
      score++;
    } else {
      mm.push('time');
    }

    if (b.insurance === cl.insurance) {
      score++;
    } else {
      mm.push('insurance');
    }

    return { ...c, score, mismatches: mm };
  }

  private isTestMatch(bookingTest: string, claimTest: string): boolean {
    return this.testsMap.some(
      (t) => t.bookingTestId === bookingTest && t.claimTestId === claimTest,
    );
  }

  private sortCandidates(cands: Candidate[]): Candidate[] {
    return cands
      .filter((c) => c.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.mismatches.length - b.mismatches.length;
      });
  }

  private assignMatches(cands: Candidate[]): MatchResponseDto[] {
    const usedB = new Set<string>();
    const usedC = new Set<string>();
    const results: MatchResponseDto[] = [];

    for (const cand of cands) {
      const { booking: b, claim: cl, mismatches } = cand;
      if (usedB.has(b.id) || usedC.has(cl.id)) continue;
      usedB.add(b.id);
      usedC.add(cl.id);

      const res: MatchResponseDto = { booking: b.id, claim: cl.id };
      if (mismatches.length) res.mismatch = mismatches;
      results.push(res);
    }

    return results;
  }

  private groupByKey<T extends { patient: string; [k: string]: any }>(
    items: T[],
  ): Map<string, T[]> {
    const map = new Map<string, T[]>();
    items.forEach((item) => {
      const date = item.bookingDate ?? item.reservationDate;
      const key = this.getKey(item.patient, date);
      const arr = map.get(key) ?? [];
      arr.push(item);
      map.set(key, arr);
    });
    return map;
  }

  private getKey(patient: string, isoDate: string): string {
    return `${patient}|${isoDate.slice(0, 10)}`;
  }
}
