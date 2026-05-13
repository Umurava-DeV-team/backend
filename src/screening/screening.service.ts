import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CandidatesService } from '../candidates/candidates.service';
import { JobsService } from '../jobs/jobs.service';
import { GeminiService } from './gemini.service';
import { ScreeningResult, ScreeningMatch } from '../entities/screening-result.entity';
import { AssessmentsService } from '../assessments/assessments.service';
import { ApplicationsService } from '../applications/applications.service';
import { ProfileService } from '../profile/profile.service';

@Injectable()
export class ScreeningService {
  constructor(
    @InjectRepository(ScreeningResult)
    private screeningResultRepo: Repository<ScreeningResult>,
    private readonly jobsService: JobsService,
    private readonly candidatesService: CandidatesService,
    private readonly geminiService: GeminiService,
    private readonly assessmentsService: AssessmentsService,
    private readonly applicationsService: ApplicationsService,
    private readonly profileService: ProfileService,
  ) { }

  async screenJob(jobId: string, topN = 10): Promise<ScreeningResult> {
    console.log(`[ScreeningService] Starting screening for jobId=${jobId}, topN=${topN}`);

    const job = await this.jobsService.findOne(jobId);
    console.log(`[ScreeningService] Job found: ${job.title}`);

    // 1. Fetch Manual Candidates
    const manualCandidates = await this.candidatesService.findByJob(jobId);
    console.log(`[ScreeningService] Found ${manualCandidates.length} manual candidates`);

    // 2. Fetch Portal Applicants
    const applications = await this.applicationsService.getApplicationsForJob(jobId);
    console.log(`[ScreeningService] Found ${applications.length} portal applications`);

    const applicantUserIds = applications.map(a => a.candidateId);
    console.log(`[ScreeningService] Applicant user IDs:`, applicantUserIds);

    const applicantProfiles = await this.profileService.findByUsers(applicantUserIds);
    console.log(`[ScreeningService] Found ${applicantProfiles.length} profiles`);

    // 3. Unify Data for AI
    const combined: any[] = [
      ...manualCandidates.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        skills: c.skills,
        experience: c.experience,
        education: c.education,
        summary: c.summary,
        resumeText: c.resumeText,
      })),
      ...applications.map(app => {
        const profile = applicantProfiles.find(p => p.userId === app.candidateId);
        return {
          id: app.candidateId,
          name: profile ? `${profile.firstName} ${profile.lastName}` : app.candidate?.name || 'Unknown',
          email: profile?.email || app.candidate?.email || '',
          skills: profile?.skills?.map(s => s.name) || [],
          experience: profile?.workExperience?.map(e => `${e.role} at ${e.companyName}`).join(', ') || '',
          education: profile?.education?.map(e => `${e.degree} from ${e.institution}`).join(', ') || '',
          summary: profile?.bio || profile?.headline || '',
          resumeText: '',
        };
      })
    ];

    console.log(`[ScreeningService] Combined ${combined.length} total candidates for screening`);

    if (combined.length === 0) {
      console.error(`[ScreeningService] ERROR: No candidates found for jobId=${jobId}`);
      throw new BadRequestException('No candidates or applicants found for this job');
    }

    console.log(`[ScreeningService] Calling Gemini AI to score candidates...`);
    const scores = await this.geminiService.scoreCandidates(job, combined);
    console.log(`[ScreeningService] Received ${scores.length} scores from Gemini`);

    const shortlist = scores
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, topN);

    console.log(`[ScreeningService] Created shortlist of ${shortlist.length} candidates`);

    const result = this.screeningResultRepo.create({
      jobId,
      jobTitle: job.title,
      totalCandidates: combined.length,
      shortlist,
      screenedAt: new Date(),
    });

    // Persist result to database
    console.log(`[ScreeningService] Saving screening result to database...`);
    await this.screeningResultRepo.save(result);
    console.log(`[ScreeningService] Screening completed successfully for jobId=${jobId}`);

    return result;
  }

  async getScreeningHistory(jobId: string): Promise<ScreeningResult[]> {
    return this.screeningResultRepo.find({
      where: { jobId },
      order: { createdAt: 'DESC' },
    });
  }

  async getAllScreenings(): Promise<ScreeningResult[]> {
    return this.screeningResultRepo.find({
      order: { createdAt: 'DESC' },
    });
  }


  async createAssessmentDraft(jobId: string, userId: string): Promise<any> {
    const job = await this.jobsService.findOne(jobId);
    console.log(`[ScreeningService] Creating assessment draft for job: ${job.title}`);

    // Generate draft using AssessmentsService
    // We pass job title and description as the basis for AI question generation
    const assessment = await this.assessmentsService.generateDraftAssessment(
      jobId,
      job.title,
      job.description || job.title,
      userId
    );

    console.log(`[ScreeningService] Draft assessment created: ${assessment.id}`);
    return assessment;
  }
}
