import { Module } from '@nestjs/common';
import { MatchController } from './controllers/match.controller';
import { MatcherService } from './services/matcher.service';
import { testsMap } from './config/tests-map.config';
import { TESTS_MAP } from './constants/match.constants';

@Module({
  controllers: [MatchController],
  providers: [{ provide: TESTS_MAP, useValue: testsMap }, MatcherService],
})
export class MatchModule {}
