import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Application, ApplicationDocument, ApplicationStatus } from './application.schema';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectModel(Application.name) private appModel: Model<ApplicationDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async apply(candidateId: string, jobId: string): Promise<ApplicationDocument> {
    console.log(`[ApplicationsService] Attempting application: candidateId=${candidateId}, jobId=${jobId}`);
    
    if (!jobId || jobId === 'undefined' || jobId === 'null') {
      console.error(`[ApplicationsService] CRITICAL: jobId is missing or invalid!`);
      throw new ConflictException('Job ID is required for application');
    }

    const existing = await this.appModel.findOne({

      candidateId: new Types.ObjectId(candidateId),
      jobId: new Types.ObjectId(jobId),
    });

    if (existing) throw new ConflictException('Already applied to this job');

    const newApp = await this.appModel.create({
      candidateId: new Types.ObjectId(candidateId),
      jobId: new Types.ObjectId(jobId),
    });

    const populated = await newApp.populate('jobId');
    const jobTitle = (populated.jobId as any)?.title || 'the position';

    // Notify the candidate that their application was submitted
    await this.notificationsService.create(
      candidateId,
      'Application Submitted',
      `Your application for "${jobTitle}" was successfully submitted. You'll hear back soon.`,
      'application',
    );

    return populated;
  }

  async getMyApplications(candidateId: string): Promise<ApplicationDocument[]> {
    const apps = await this.appModel
      .find({ 
        $or: [
          { candidateId: Types.ObjectId.isValid(candidateId) ? new Types.ObjectId(candidateId) : null },
          { candidateId: candidateId }
        ].filter(i => i.candidateId !== null)
      });
    console.log(`[ApplicationsService] Found ${apps.length} raw applications for candidateId=${candidateId}`);
    
    return this.appModel
      .find({ 
        $or: [
          { candidateId: Types.ObjectId.isValid(candidateId) ? new Types.ObjectId(candidateId) : null },
          { candidateId: candidateId }
        ].filter(i => i.candidateId !== null)
      })
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

    // Notify the candidate about the status change
    await this.notificationsService.create(
      app.candidateId.toString(),
      'Application Status Updated',
      `Your application status has been changed to "${status}". Log in to check your application details.`,
      'status',
    );

    return app;
  }
}

