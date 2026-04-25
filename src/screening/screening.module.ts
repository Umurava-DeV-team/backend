import { Module } from '@nestjs/common';
import { ScreeningController } from './screening.controller';
import { ScreeningService } from './screening.service';
import { GeminiService } from './gemini.service';
import { JobsModule } from '../jobs/jobs.module';
import { CandidatesModule } from '../candidates/candidates.module';
import { AssessmentsModule } from '../assessments/assessments.module';

import { ApplicationsModule } from '../applications/applications.module';
import { ProfileModule } from '../profile/profile.module';

import { MongooseModule } from '@nestjs/mongoose';
import { ScreeningResultModel, ScreeningResultSchema } from './screening-result.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ScreeningResultModel.name, schema: ScreeningResultSchema }]),
    JobsModule, 
    CandidatesModule, 
    AssessmentsModule, 
    ApplicationsModule, 
    ProfileModule
  ],
  controllers: [ScreeningController],
  providers: [ScreeningService, GeminiService],
})
export class ScreeningModule {}
