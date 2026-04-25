import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { JobDocument } from '../jobs/job.schema';
import { CandidateDocument } from '../candidates/candidate.schema';
import { CandidateScore } from './screening.dto';

export interface ScorableCandidate {
  id: string;
  name: string;
  email: string;
  skills: string[];
  experience: string;
  education: string;
  summary: string;
  resumeText?: string;
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);

  private genAI: GoogleGenerativeAI;
  private readonly modelName: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.modelName = this.configService.get<string>('GEMINI_MODEL') || 'gemini-flash-latest';


    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY is missing from environment variables!');
      throw new Error('GEMINI_API_KEY is not set in environment');
    }
    this.logger.log(`GeminiService initialized with model: ${this.modelName}`);
    this.logger.log(`API Key: ${apiKey.slice(0, 8)}...`);
    this.genAI = new GoogleGenerativeAI(apiKey);
  }



  private async withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err: any) {
        const isRateLimit = err?.status === 429;
        const isOverloaded = err?.status === 503;
        if ((isRateLimit || isOverloaded) && attempt < maxRetries) {
          let waitSeconds = 15; // default for 503
          if (isRateLimit) {
            const retryDelayMatch = JSON.stringify(err).match(/"retryDelay":"?(\d+)s/);
            waitSeconds = retryDelayMatch ? parseInt(retryDelayMatch[1]) + 2 : 30;
          }
          this.logger.warn(`${isRateLimit ? 'Rate limited' : 'Service overloaded'}. Retrying in ${waitSeconds}s (attempt ${attempt}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000));
        } else {
          throw err;
        }
      }
    }
    throw new Error('Max retries exceeded');
  }

  async scoreCandidates(job: JobDocument, candidates: ScorableCandidate[]): Promise<CandidateScore[]> {
    const model = this.genAI.getGenerativeModel({ model: this.modelName });


    const candidateProfiles = candidates.map((c, i) => ({
      index: i,
      id: c.id,
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
      const result = await this.withRetry(() => model.generateContent(prompt));
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
          candidateId: candidate.id,
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

  async generateAssessmentQuestions(job: JobDocument): Promise<any[]> {
    const model = this.genAI.getGenerativeModel({ model: this.modelName });


    const prompt = `
You are an expert technical interviewer. Generate exactly 10 multiple-choice questions to assess a candidate for the following job:
Title: ${job.title}
Department: ${job.department ?? ''}
Description: ${job.description}
Experience Level: ${job.experienceLevel ?? ''}

Return a JSON array of objects with exactly this structure:
[
  {
    "text": "What is the primary advantage of ...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option C"
  }
]
Do not include any other text or markdown formatting. Just the JSON array.
`;
    try {
      const result = await this.withRetry(() => model.generateContent(prompt));
      const text = result.response.text().trim();
      
      // Robust JSON extraction
      let cleaned = text.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
      const firstBracket = cleaned.indexOf('[');
      const lastBracket = cleaned.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1) {
        cleaned = cleaned.substring(firstBracket, lastBracket + 1);
      }
      
      const questions = JSON.parse(cleaned);
      console.log(`\n=== AI GENERATED QUESTIONS FOR JOB: ${job.title} ===`);
      console.log(`Successfully generated ${questions.length} questions`);
      console.log('===================================================\n');
      return questions;
    } catch (err) {
      this.logger.error('Gemini question generation failed', err);
      console.log('AI Question generation failed, using fallback. Error details:', err.message);
      // Return comprehensive fallback questions if AI fails
      return [
        {
          text: "What is your primary area of expertise regarding the job requirements?",
          options: ["Frontend", "Backend", "Fullstack", "Other"],
          correctAnswer: "Fullstack"
        },
        {
          text: "Which of the following best describes your experience level?",
          options: ["0-2 years", "3-5 years", "5-8 years", "8+ years"],
          correctAnswer: "3-5 years"
        },
        {
          text: "How do you handle conflict in a team setting?",
          options: ["Avoid it", "Report to manager", "Discuss openly", "Ignore it"],
          correctAnswer: "Discuss openly"
        },
        {
          text: "What is your preferred method of project management?",
          options: ["Agile", "Waterfall", "Kanban", "None"],
          correctAnswer: "Agile"
        },
        {
          text: "How do you stay updated with industry trends?",
          options: ["Reading blogs", "Attending conferences", "Taking courses", "All of the above"],
          correctAnswer: "All of the above"
        }
      ];
    }
  }
}
