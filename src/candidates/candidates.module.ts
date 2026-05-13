import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidatesController } from './candidates.controller';
import { Candidate } from '../entities/candidate.entity';
import { Application } from '../entities/application.entity';
import { Profile } from '../entities/profile.entity';
import { CandidatesService } from './candidates.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Candidate, Application, Profile]),
  ],
  controllers: [CandidatesController],
  providers: [CandidatesService],
  exports: [CandidatesService],
})
export class CandidatesModule { }
