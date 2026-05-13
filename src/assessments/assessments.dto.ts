import { IsString, IsNumber, IsArray, IsOptional, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { QuestionType } from '../entities/assessment.entity';
import type { AssessmentQuestion } from '../entities/assessment.entity';

export class GenerateDraftDto {
    @ApiProperty({ example: 'uuid-job-id' })
    @IsString()
    jobId: string;

    @ApiProperty({ example: 'Senior Full Stack Developer' })
    @IsString()
    jobTitle: string;

    @ApiProperty({ example: 'React, Node.js, TypeScript, PostgreSQL' })
    @IsString()
    requiredSkills: string;
}

export class UpdateAssessmentDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    instructions?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    durationMinutes?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    timeLimitPerQuestion?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsArray()
    questions?: AssessmentQuestion[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    passingScore?: number;
}

export class QuestionDto {
    @ApiProperty({ example: 1 })
    @IsNumber()
    id: number;

    @ApiProperty({ enum: QuestionType })
    @IsEnum(QuestionType)
    type: QuestionType;

    @ApiProperty({ example: 'Knowledge Check' })
    @IsString()
    category: string;

    @ApiProperty({ example: 'What is the purpose of React hooks?' })
    @IsString()
    question: string;

    @ApiProperty({ required: false, type: [String] })
    @IsOptional()
    @IsArray()
    options?: string[];

    @ApiProperty({ required: false, example: 'B' })
    @IsOptional()
    @IsString()
    correctAnswer?: string;

    @ApiProperty({ example: 6 })
    @IsNumber()
    marks: number;
}

export class AddQuestionDto {
    @ApiProperty({ type: QuestionDto })
    @ValidateNested()
    @Type(() => QuestionDto)
    question: AssessmentQuestion;
}

export class UpdateQuestionDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    question?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsArray()
    options?: string[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    correctAnswer?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    marks?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    category?: string;
}

export class LaunchAssessmentDto {
    @ApiProperty({ type: [String], example: ['uuid-1', 'uuid-2', 'uuid-3'], required: false })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    candidateIds?: string[];

    @ApiProperty({ required: false, example: 5 })
    @IsOptional()
    @IsNumber()
    topN?: number;
}

export class SubmitAnswerDto {
    @ApiProperty({ example: 1, required: false })
    @IsOptional()
    @IsNumber()
    questionId?: number;

    @ApiProperty({ example: 'B' })
    @IsString()
    answer: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    question?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    stepNumber?: number;
}

export class SubmitAssessmentDto {
    @ApiProperty({ example: 45 })
    @IsNumber()
    timeTakenMinutes: number;
}
