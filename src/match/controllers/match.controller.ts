import { Body, Controller, Post } from '@nestjs/common';
import { MatcherService } from '../services/matcher.service';
import { MatchRequestDto } from '../dto/match-request.dto';
import { MatchResponseDto } from '../dto/match-response.dto';

@Controller('match')
export class MatchController {
  constructor(private readonly matcher: MatcherService) {}

  @Post()
  match(@Body() body: MatchRequestDto): MatchResponseDto[] {
    return this.matcher.matchAll(body.bookings, body.claims);
  }
}
