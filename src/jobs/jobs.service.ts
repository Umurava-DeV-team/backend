import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateJobDto, UpdateJobDto } from './job.dto';
import { Job } from '../entities/job.entity';
import { Application } from '../entities/application.entity';
import { Candidate } from '../entities/candidate.entity';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private jobRepo: Repository<Job>,
    @InjectRepository(Application)
    private applicationRepo: Repository<Application>,
    @InjectRepository(Candidate)
    private candidateRepo: Repository<Candidate>,
  ) { }

  async create(dto: CreateJobDto, file?: Express.Multer.File): Promise<any> {
    const job = this.jobRepo.create(dto);
    const saved = await this.jobRepo.save(job);

    // Ensure both 'id' and '_id' are returned for compatibility
    return {
      ...saved,
      _id: saved.id,
      applicantCount: 0,
    };
  }

  async findAll(): Promise<any[]> {
    const jobs = await this.jobRepo.find({
      order: { createdAt: 'DESC' },
      relations: ['creator'],
    });

    // Calculate applicant count for each job
    const jobsWithCounts = await Promise.all(
      jobs.map(async (job) => {
        const applicationCount = await this.applicationRepo.count({
          where: { jobId: job.id },
        });
        const candidateCount = await this.candidateRepo.count({
          where: { jobId: job.id },
        });

        // Ensure both 'id' and '_id' are returned for compatibility
        return {
          ...job,
          _id: job.id,
          applicantCount: applicationCount + candidateCount,
        };
      })
    );

    return jobsWithCounts;
  }

  async findOne(id: string): Promise<any> {
    const job = await this.jobRepo.findOne({
      where: { id },
      relations: ['creator'],
    });

    if (!job) throw new NotFoundException(`Job ${id} not found`);

    // Calculate applicant count
    const applicationCount = await this.applicationRepo.count({
      where: { jobId: id },
    });
    const candidateCount = await this.candidateRepo.count({
      where: { jobId: id },
    });

    // Ensure both 'id' and '_id' are returned for compatibility
    return {
      ...job,
      _id: job.id,
      applicantCount: applicationCount + candidateCount,
    };
  }

  async update(id: string, dto: UpdateJobDto, _file?: Express.Multer.File): Promise<any> {
    const job = await this.jobRepo.findOne({ where: { id } });
    if (!job) throw new NotFoundException(`Job ${id} not found`);

    Object.assign(job, dto);
    const updated = await this.jobRepo.save(job);

    // Ensure both 'id' and '_id' are returned for compatibility
    return {
      ...updated,
      _id: updated.id,
    };
  }

  async delete(id: string): Promise<void> {
    const result = await this.jobRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Job ${id} not found`);
    }
  }
}
