import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateJobDto, UpdateJobDto } from './job.dto';
import { Job, JobDocument } from './job.schema';


@Injectable()
export class JobsService {
  constructor(@InjectModel(Job.name) private jobModel: Model<JobDocument>) {}

  async create(dto: CreateJobDto, file?: Express.Multer.File): Promise<JobDocument> {
    const job = new this.jobModel(dto);
    return job.save();
  }

  async findAll(): Promise<any[]> {
    const results = await this.jobModel.aggregate([
      {
        $lookup: {
          from: 'applications',
          localField: '_id',
          foreignField: 'jobId',
          as: 'applications'
        }
      },
      {
        $lookup: {
          from: 'candidates',
          localField: '_id',
          foreignField: 'jobId',
          as: 'candidates'
        }
      },
      {
        $addFields: {
          applicantCount: {
            $add: [{ $size: '$applications' }, { $size: '$candidates' }]
          }
        }
      },
      {
        $project: {
          applications: 0,
          candidates: 0
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    console.log(`[JobsService] findAll results sample:`, results.slice(0, 2).map(r => ({ title: r.title, count: r.applicantCount })));
    return results;
  }

  async findOne(id: string): Promise<any> {
    const jobs = await this.jobModel.aggregate([
      { $match: { _id: new Types.ObjectId(id) } },


      {
        $lookup: {
          from: 'applications',
          localField: '_id',
          foreignField: 'jobId',
          as: 'applications'
        }
      },
      {
        $lookup: {
          from: 'candidates',
          localField: '_id',
          foreignField: 'jobId',
          as: 'candidates'
        }
      },
      {
        $addFields: {
          applicantCount: {
            $add: [{ $size: '$applications' }, { $size: '$candidates' }]
          }
        }
      },
      {
        $project: {
          applications: 0,
          candidates: 0
        }
      }
    ]);
    if (!jobs || jobs.length === 0) throw new NotFoundException(`Job ${id} not found`);
    return jobs[0];
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
