import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateJobDto, UpdateJobDto } from './job.dto';
import { Job, JobDocument } from './job.schema';

@Injectable()
export class JobsService {
  constructor(@InjectModel(Job.name) private jobModel: Model<JobDocument>) {}

  async create(dto: CreateJobDto, file?: Express.Multer.File): Promise<JobDocument> {
    const job = new this.jobModel(dto);
    return job.save();
  }

  async findAll(): Promise<JobDocument[]> {
    return this.jobModel.find().sort({ createdAt: -1 });
  }

  async findOne(id: string): Promise<JobDocument> {
    const job = await this.jobModel.findById(id);
    if (!job) throw new NotFoundException(`Job ${id} not found`);
    return job;
  }

  async update(id: string, dto: UpdateJobDto, _file?: Express.Multer.File): Promise<JobDocument> {
    const job = await this.jobModel.findByIdAndUpdate(id, dto, { new: true });
    if (!job) throw new NotFoundException(`Job ${id} not found`);
    return job;
  }

  async delete(id: string): Promise<void> {
    const result = await this.jobModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException(`Job ${id} not found`);
  }
}
