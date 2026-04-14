import { BadRequestException, Injectable } from '@nestjs/common';
import { CandidatesService } from '../candidates/candidates.service';
import { JobsService } from '../jobs/jobs.service';
import { GeminiService } from './gemini.service';
import { ScreeningResult } from './screening.dto';

@Injectable()
export class ScreeningService {
  constructor(
    private readonly jobsService: JobsService,
    private readonly candidatesService: CandidatesService,
    private readonly geminiService: GeminiService,
  ) {}

  async screenJob(jobId: string, topN = 10): Promise<ScreeningResult> {
    const job = await this.jobsService.findOne(jobId);
    const candidates = await this.candidatesService.findByJob(jobId);

    if (candidates.length === 0) {
      throw new BadRequestException('No candidates found for this job');
    }

    const scores = await this.geminiService.scoreCandidates(job, candidates);

    const shortlist = scores
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, topN);

    return {
      jobId,
      jobTitle: job.title,
      totalCandidates: candidates.length,
      shortlist,
      screenedAt: new Date(),
    };
  }
}
