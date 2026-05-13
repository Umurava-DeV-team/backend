import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScreeningController } from './screening.controller';
import { ScreeningService } from './screening.service';
import { GeminiService } from './gemini.service';
import { JobsModule } from '../jobs/jobs.module';
import { CandidatesModule } from '../candidates/candidates.module';
import { AssessmentsModule } from '../assessments/assessments.module';
import { ApplicationsModule } from '../applications/applications.module';
import { ProfileModule } from '../profile/profile.module';
import { AuthModule } from '../auth/auth.module';
import { ScreeningResult } from '../entities/screening-result.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ScreeningResult]),
    JobsModule,
    CandidatesModule,
    AssessmentsModule,
    ApplicationsModule,
    ProfileModule,
    AuthModule
  ],
  controllers: [ScreeningController],
  providers: [ScreeningService, GeminiService],
})
export class ScreeningModule { }
