import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Application, ApplicationDocument, ApplicationStatus } from './application.schema';

@Injectable()
export class ApplicationsService {
  constructor(@InjectModel(Application.name) private appModel: Model<ApplicationDocument>) {}

  async apply(candidateId: string, jobId: string): Promise<ApplicationDocument> {
    const existing = await this.appModel.findOne({
      candidateId: new Types.ObjectId(candidateId),
      jobId: new Types.ObjectId(jobId),
    });
    if (existing) throw new ConflictException('Already applied to this job');

    return this.appModel.create({
      candidateId: new Types.ObjectId(candidateId),
      jobId: new Types.ObjectId(jobId),
    });
  }

  async getMyApplications(candidateId: string): Promise<ApplicationDocument[]> {
    return this.appModel
      .find({ candidateId: new Types.ObjectId(candidateId) })
      .populate('jobId')
      .sort({ createdAt: -1 });
  }

  async getApplicationsForJob(jobId: string): Promise<ApplicationDocument[]> {
    return this.appModel
      .find({ jobId: new Types.ObjectId(jobId) })
      .populate('candidateId')
      .sort({ createdAt: -1 });
  }

  async updateStatus(applicationId: string, status: ApplicationStatus): Promise<ApplicationDocument> {
    const app = await this.appModel.findByIdAndUpdate(applicationId, { status }, { new: true });
    if (!app) throw new NotFoundException('Application not found');
    return app;
  }
}
