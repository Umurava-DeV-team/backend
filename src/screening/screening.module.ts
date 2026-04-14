import { Module } from '@nestjs/common';
import { ScreeningController } from './screening.controller';
import { ScreeningService } from './screening.service';
import { GeminiService } from './gemini.service';
import { JobsModule } from '../jobs/jobs.module';
import { CandidatesModule } from '../candidates/candidates.module';

@Module({
  imports: [JobsModule, CandidatesModule],
  controllers: [ScreeningController],
  providers: [ScreeningService, GeminiService],
})
export class ScreeningModule {}
