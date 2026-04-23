import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AssessmentsService } from './assessments.service';

class StartAssessmentDto {
  @ApiProperty({ example: '664f1a2b3c4d5e6f7a8b9c0d' })
  @IsString() @IsNotEmpty() jobId: string;
}

class SubmitAnswerDto {
  @ApiProperty({ example: 'Can you walk me through your experience...' })
  @IsString() @IsNotEmpty() question: string;

  @ApiProperty({ example: 'I have 3 years of experience building...' })
  @IsString() @IsNotEmpty() answer: string;

  @ApiProperty({ example: 1 })
  @IsNumber() stepNumber: number;
}

class SubmitAssessmentDto {
  @ApiProperty({ example: 42 })
  @IsNumber() timeTakenMinutes: number;
}

@ApiTags('Assessments')
@Controller('assessments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start a new assessment session' })
  start(@Request() req: any, @Body() dto: StartAssessmentDto) {
    return this.assessmentsService.startAssessment(req.user.id, dto.jobId);
  }

  @Post(':id/answer')
  @ApiOperation({ summary: 'Submit an answer for a step' })
  submitAnswer(@Param('id') id: string, @Body() dto: SubmitAnswerDto) {
    return this.assessmentsService.submitAnswer(id, dto.question, dto.answer, dto.stepNumber);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit the completed assessment' })
  submit(@Param('id') id: string, @Body() dto: SubmitAssessmentDto) {
    return this.assessmentsService.submitAssessment(id, dto.timeTakenMinutes);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my assessment history' })
  getMyAssessments(@Request() req: any) {
    return this.assessmentsService.getMyAssessments(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific assessment' })
  getAssessment(@Param('id') id: string) {
    return this.assessmentsService.getAssessment(id);
  }
}
