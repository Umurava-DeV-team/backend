import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application, ApplicationStatus } from '../entities/application.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private appRepo: Repository<Application>,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) { }

  async apply(candidateId: string, jobId: string): Promise<Application> {
    console.log(`[ApplicationsService] Attempting application: candidateId=${candidateId}, jobId=${jobId}`);

    if (!jobId || jobId === 'undefined' || jobId === 'null') {
      console.error(`[ApplicationsService] CRITICAL: jobId is missing or invalid!`);
      throw new ConflictException('Job ID is required for application');
    }

    const existing = await this.appRepo.findOne({
      where: {
        candidateId,
        jobId,
      },
    });

    if (existing) throw new ConflictException('Already applied to this job');

    const newApp = this.appRepo.create({
      candidateId,
      jobId,
      status: ApplicationStatus.PENDING,
    });

    const saved = await this.appRepo.save(newApp);

    // Load the job relation
    const populated = await this.appRepo.findOne({
      where: { id: saved.id },
      relations: ['job'],
    });

    if (!populated) {
      throw new NotFoundException('Failed to create application');
    }

    const jobTitle = populated.job?.title || 'the position';

    // Create notification for recruiter
    try {
      const notification = await this.notificationsService.create(
        populated.job.createdBy, // Recruiter ID
        'New Job Application',
        `Talent ${populated.candidateId} applied for "${jobTitle}".`,
        'application',
        saved.id
      );
      this.notificationsGateway.sendNotification('new_application', notification);
    } catch (err) {
      console.error('Failed to send recruiter notification:', err);
    }

    // Create notification for candidate
    try {
      await this.notificationsService.create(
        candidateId,
        'Application Submitted',
        `Your application for "${jobTitle}" was successfully submitted. You'll hear back soon.`,
        'application',
        saved.id
      );
    } catch (err) {
      console.error('Failed to send candidate notification:', err);
    }

    return populated;
  }

  async getMyApplications(candidateId: string): Promise<Application[]> {
    const apps = await this.appRepo.find({
      where: { candidateId },
      relations: ['job'],
      order: { appliedAt: 'DESC' },
    });

    console.log(`[ApplicationsService] Found ${apps.length} applications for candidateId=${candidateId}`);
    return apps;
  }

  async getApplicationsForJob(jobId: string): Promise<Application[]> {
    return this.appRepo.find({
      where: { jobId },
      relations: ['candidate'],
      order: { appliedAt: 'DESC' },
    });
  }

  async updateStatus(applicationId: string, status: ApplicationStatus): Promise<Application> {
    const app = await this.appRepo.findOne({ where: { id: applicationId } });
    if (!app) throw new NotFoundException('Application not found');

    app.status = status;
    await this.appRepo.save(app);

    // Send notification to candidate
    try {
      const notification = await this.notificationsService.create(
        app.candidateId,
        'Application Status Updated',
        `Your application status for job "${app.jobId}" has been changed to "${status}".`,
        'status',
        app.id
      );
      this.notificationsGateway.sendNotification('status_updated', notification);
    } catch (err) {
      console.error('Failed to send status update notification:', err);
    }

    return app;
  }
}