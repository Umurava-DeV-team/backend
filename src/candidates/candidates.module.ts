import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CandidatesController } from './candidates.controller';
import { Candidate, CandidateSchema } from './candidate.schema';
import { CandidatesService } from './candidates.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Candidate.name, schema: CandidateSchema }])],
  controllers: [CandidatesController],
  providers: [CandidatesService],
  exports: [CandidatesService],
})
export class CandidatesModule {}
