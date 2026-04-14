import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class ScreenJobDto {
  @ApiProperty({ example: 'job-uuid-here' })
  @IsString()
  @IsNotEmpty()
  jobId: string;

  @ApiPropertyOptional({ example: 10, description: 'Number of top candidates to return (default 10)' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(50)
  topN?: number;
}

export interface CandidateScore {
  candidateId: string;
  name: string;
  email: string;
  matchScore: number; // 0-100
  strengths: string[];
  missingSkills: string[];
  risks: string[];
  summary: string;
}

export interface ScreeningResult {
  jobId: string;
  jobTitle: string;
  totalCandidates: number;
  shortlist: CandidateScore[];
  screenedAt: Date;
}
