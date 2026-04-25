import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CandidatesService } from '../candidates/candidates.service';
import { JobsService } from '../jobs/jobs.service';
import { GeminiService } from './gemini.service';
import { ScreeningResult } from './screening.dto';
import { ScreeningResultDocument, ScreeningResultModel } from './screening-result.schema';

import { AssessmentsService } from '../assessments/assessments.service';
import { ApplicationsService } from '../applications/applications.service';
import { ProfileService } from '../profile/profile.service';

@Injectable()
export class ScreeningService {
  constructor(
    @InjectModel(ScreeningResultModel.name) private screeningResultModel: Model<ScreeningResultDocument>,
    private readonly jobsService: JobsService,
    private readonly candidatesService: CandidatesService,
    private readonly geminiService: GeminiService,
    private readonly assessmentsService: AssessmentsService,
    private readonly applicationsService: ApplicationsService,
    private readonly profileService: ProfileService,
  ) {}

  async screenJob(jobId: string, topN = 10): Promise<ScreeningResult> {
    const job = await this.jobsService.findOne(jobId);
    
    // 1. Fetch Manual Candidates
    const manualCandidates = await this.candidatesService.findByJob(jobId);
    
    // 2. Fetch Portal Applicants
    const applications = await this.applicationsService.getApplicationsForJob(jobId);
    const applicantUserIds = applications.map(a => 
      (a.candidateId as any)._id?.toString() || a.candidateId.toString()
    );
    const applicantProfiles = await this.profileService.findByUsers(applicantUserIds);

    // 3. Unify Data for AI
    const combined: any[] = [
      ...manualCandidates.map(c => ({
        id: c._id.toString(),
        name: c.name,
        email: c.email,
        skills: c.skills,
        experience: c.experience,
        education: c.education,
        summary: c.summary,
        resumeText: c.resumeText,
      })),
      ...applications.map(app => {
        const user = app.candidateId as any;
        const profile = applicantProfiles.find(p => p.userId.toString() === user._id?.toString());
        return {
          id: user._id?.toString() || user.toString(),
          name: profile ? `${profile.firstName} ${profile.lastName}` : user.name,
          email: profile?.email || user.email,
          skills: profile?.skills?.map(s => s.name) || [],
          experience: profile?.workExperience?.map(e => `${e.role} at ${e.companyName}`).join(', ') || '',
          education: profile?.education?.map(e => `${e.degree} from ${e.institution}`).join(', ') || '',
          summary: profile?.bio || profile?.headline || '',
          resumeText: '',
        };
      })
    ];

    if (combined.length === 0) {
      throw new BadRequestException('No candidates or applicants found for this job');
    }

    const scores = await this.geminiService.scoreCandidates(job, combined);

    const shortlist = scores
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, topN);

    // Assessments are now only created when explicitly launched by the recruiter via launchAssessment


    const result: ScreeningResult = {
      jobId,
      jobTitle: job.title,
      totalCandidates: combined.length,
      shortlist,
      screenedAt: new Date(),
    };

    // Persist result to database
    await this.screeningResultModel.create(result);

    return result;
  }

  async getScreeningHistory(jobId: string): Promise<ScreeningResult[]> {
    const results = await this.screeningResultModel
      .find({ jobId })
      .sort({ createdAt: -1 })
      .exec();
    
    return results.map(r => ({
      jobId: r.jobId,
      jobTitle: r.jobTitle,
      totalCandidates: r.totalCandidates,
      shortlist: r.shortlist as any,
      screenedAt: r.screenedAt
    }));
  }

  async getAllScreenings(): Promise<ScreeningResult[]> {
    const results = await this.screeningResultModel
      .find()
      .sort({ createdAt: -1 })
      .exec();
    
    return results.map(r => ({
      jobId: r.jobId,
      jobTitle: r.jobTitle,
      totalCandidates: r.totalCandidates,
      shortlist: r.shortlist as any,
      screenedAt: r.screenedAt
    }));
  }


  async launchAssessment(jobId: string, topN: number, candidateIds: string[], timeLimitPerQuestion: number = 30): Promise<{ message: string; created: number }> {
    const job = await this.jobsService.findOne(jobId);


    // Use the pre-ranked candidate IDs passed from the frontend — no re-scoring needed
    const targetIds = candidateIds.slice(0, topN);

    if (targetIds.length === 0) {
      throw new BadRequestException('No candidate IDs provided for assessment launch');
    }

    // Generate AI assessment questions for this job
    let questions: any[] = [];
    try {
      questions = await this.geminiService.generateAssessmentQuestions(job);
    } catch (e) {
      console.error('Failed to generate assessment questions:', e.message);
    }

    // Create assessments for each target candidate
    let created = 0;
    for (const candidateId of targetIds) {
      try {
        await this.assessmentsService.startTalentAssessment(candidateId, jobId, questions, timeLimitPerQuestion);
        created++;
      } catch (e) {
        console.error(`Skipping duplicate/failed assessment for ${candidateId}:`, e.message);
      }
    }

    return { message: `Assessment launched for ${created} candidates`, created };
  }
}
