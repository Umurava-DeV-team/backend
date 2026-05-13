import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobsController } from './jobs.controller';
import { Job } from '../entities/job.entity';
import { Application } from '../entities/application.entity';
import { Candidate } from '../entities/candidate.entity';
import { JobsService } from './jobs.service';

@Module({
  imports: [TypeOrmModule.forFeature([Job, Application, Candidate])],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule { }
