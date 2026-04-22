import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { JobDocument } from '../jobs/job.schema';
import { CandidateDocument } from '../candidates/candidate.schema';
import { CandidateScore } from './screening.dto';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set in environment');
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async scoreCandidates(job: JobDocument, candidates: CandidateDocument[]): Promise<CandidateScore[]> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const candidateProfiles = candidates.map((c, i) => ({
      index: i,
      id: c._id.toString(),
      name: c.name,
      email: c.email,
      skills: c.skills,
      experience: c.experience,
      education: c.education,
      summary: c.summary,
      resumeText: c.resumeText ? c.resumeText.slice(0, 1500) : '',
    }));

    const prompt = `
You are an expert AI recruiter. Analyze the following job description and candidate profiles, then score each candidate.

JOB POSTING:
Title: ${job.title}
Department: ${job.department ?? ''}
Description: ${job.description}
Experience Level: ${job.experienceLevel ?? ''}
Location: ${job.location}
Salary Range: ${job.salaryRange ?? ''}

CANDIDATES:
${JSON.stringify(candidateProfiles, null, 2)}

For each candidate, return a JSON array with this exact structure:
[
  {
    "index": 0,
    "matchScore": 85,
    "strengths": ["Strong Node.js experience", "Relevant education"],
    "missingSkills": ["Docker", "Kubernetes"],
    "risks": ["No leadership experience mentioned"],
    "summary": "Strong technical candidate with 5 years relevant experience..."
  }
]

Rules:
- matchScore is 0-100 based on skills match, experience relevance, education fit, and overall profile quality
- strengths: 2-4 specific reasons this candidate fits
- missingSkills: skills from job requirements not found in candidate profile
- risks: 1-3 potential concerns or gaps
- summary: 1-2 sentence human-readable explanation
- Return ONLY the JSON array, no markdown, no extra text
`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();

      // Strip markdown code blocks if present
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const scores: Array<{
        index: number;
        matchScore: number;
        strengths: string[];
        missingSkills: string[];
        risks: string[];
        summary: string;
      }> = JSON.parse(cleaned);

      return scores.map((s) => {
        const candidate = candidates[s.index];
        return {
          candidateId: candidate._id.toString(),
          name: candidate.name,
          email: candidate.email,
          matchScore: s.matchScore,
          strengths: s.strengths,
          missingSkills: s.missingSkills,
          risks: s.risks,
          summary: s.summary,
        };
      });
    } catch (err) {
      this.logger.error('Gemini scoring failed', err);
      throw new InternalServerErrorException('AI scoring failed. Check your Gemini API key and quota.');
    }
  }
}
