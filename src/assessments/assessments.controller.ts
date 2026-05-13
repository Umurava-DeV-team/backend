import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AssessmentsService } from './assessments.service';
import {
    GenerateDraftDto,
    UpdateAssessmentDto,
    AddQuestionDto,
    UpdateQuestionDto,
    LaunchAssessmentDto,
    SubmitAnswerDto,
    SubmitAssessmentDto,
} from './assessments.dto';

import { ConfigService } from '@nestjs/config';

@ApiTags('Assessments (PostgreSQL + Draft Workflow)')
@Controller('assessments')
// @UseGuards(JwtAuthGuard) // Uncomment when auth is ready
export class AssessmentsController {
    constructor(
        private readonly assessmentsService: AssessmentsService,
        private readonly configService: ConfigService
    ) { }

    // ==================== RECRUITER ENDPOINTS ====================

    @Get()
    @ApiOperation({ summary: 'Get all active assessments' })
    async getAllAssessments() {
        return await this.assessmentsService.getAllAssessments();
    }

    @Post('generate-draft')
    @ApiOperation({
        summary: 'Generate draft assessment from AI (Step 1: Create draft for review)',
    })
    async generateDraft(@Body() dto: GenerateDraftDto) {
        // TODO: Get userId from JWT token
        const userId = this.configService.get('TEST_RECRUITER_ID') || 'f9ef13fb-2754-4d5a-9b92-19f1a959a0a5';
        return await this.assessmentsService.generateDraftAssessment(
            dto.jobId,
            dto.jobTitle,
            dto.requiredSkills,
            userId,
        );
    }

    @Get('drafts')
    @ApiOperation({ summary: 'Get all draft assessments for review' })
    async getDrafts(@Query('userId') userId?: string) {
        return await this.assessmentsService.getDraftAssessments(userId);
    }

    @Get('job/:jobId')
    @ApiOperation({ summary: 'Get all candidate assignments for a specific job (Level 2 results)' })
    async getAssignmentsByJob(@Param('jobId') jobId: string) {
        return await this.assessmentsService.getAssignmentsByJobId(jobId);
    }

    @Get('my')
    @ApiOperation({ summary: 'Alias for my/assignments for frontend compatibility' })
    async getMyAssessments(@Query('candidateId') candidateId: string) {
        return await this.getMyAssignments(candidateId);
    }

    @Get('my/assignments')
    @ApiOperation({ summary: 'Get my assigned assessments (candidate view)' })
    async getMyAssignments(@Query('candidateId') candidateId: string) {
        // TODO: Get candidateId from JWT token
        const id = candidateId || this.configService.get('TEST_CANDIDATE_ID') || '';
        const assignments = await this.assessmentsService.getMyCandidateAssignments(id);
        
        // Map to structure expected by frontend (legacy compatibility)
        return assignments.map(a => ({
            _id: a.id,
            jobId: a.assessment.job,
            status: a.status,
            createdAt: a.assignedAt,
            assessmentId: a.assessmentId,
            // Add other fields needed by frontend
            title: a.assessment.title,
            durationMinutes: a.assessment.durationMinutes,
            percentage: a.percentage,
        }));
    }

    @Patch(':id')
    @ApiOperation({
        summary: 'Update draft assessment (Step 2: Edit before launch)',
    })
    async updateDraft(@Param('id') id: string, @Body() dto: UpdateAssessmentDto) {
        return await this.assessmentsService.updateDraftAssessment(id, dto);
    }

    @Post(':id/questions')
    @ApiOperation({ summary: 'Add new question to draft assessment' })
    async addQuestion(@Param('id') id: string, @Body() dto: AddQuestionDto) {
        return await this.assessmentsService.addQuestion(id, dto.question);
    }

    @Patch(':id/questions/:questionId')
    @ApiOperation({ summary: 'Update specific question in draft assessment' })
    async updateQuestion(
        @Param('id') id: string,
        @Param('questionId') questionId: number,
        @Body() dto: UpdateQuestionDto,
    ) {
        return await this.assessmentsService.updateQuestion(id, questionId, dto);
    }

    @Delete(':id/questions/:questionId')
    @ApiOperation({ summary: 'Delete question from draft assessment' })
    async deleteQuestion(
        @Param('id') id: string,
        @Param('questionId') questionId: number,
    ) {
        return await this.assessmentsService.deleteQuestion(id, questionId);
    }

    @Post(':id/launch')
    @ApiOperation({
        summary: 'Launch assessment (Step 3: Confirm and send to candidates)',
    })
    async launchAssessment(@Param('id') id: string, @Body() dto: LaunchAssessmentDto) {
        // TODO: Get userId from JWT token
        const userId = this.configService.get('TEST_RECRUITER_ID') || 'f9ef13fb-2754-4d5a-9b92-19f1a959a0a5';
        return await this.assessmentsService.launchAssessment(
            id,
            dto.candidateIds ?? [],
            userId,
            dto.topN,
        );
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete draft assessment' })
    async deleteDraft(@Param('id') id: string) {
        await this.assessmentsService.deleteDraftAssessment(id);
        return { message: 'Draft assessment deleted successfully' };
    }

    @Post(':id/archive')
    @ApiOperation({ summary: 'Archive active assessment' })
    async archiveAssessment(@Param('id') id: string) {
        return await this.assessmentsService.archiveAssessment(id);
    }

    @Get(':id/assignments')
    @ApiOperation({ summary: 'Get all candidate assignments for an assessment' })
    async getAssignments(@Param('id') id: string) {
        return await this.assessmentsService.getAssessmentAssignments(id);
    }

    @Post('assignments/:assignmentId/evaluate')
    @ApiOperation({ summary: 'Evaluate assignment using AI (for open-ended questions)' })
    async evaluateAssignment(@Param('assignmentId') assignmentId: string) {
        return await this.assessmentsService.evaluateAssignment(assignmentId);
    }

    // ==================== CANDIDATE ALIASES ====================

    @Post(':id/start')
    @ApiOperation({ summary: 'Alias for assignments/:id/start' })
    async startAssessmentAlias(@Param('id') id: string) {
        return await this.assessmentsService.startAssessment(id);
    }

    @Post(':id/answer')
    @ApiOperation({ summary: 'Alias for assignments/:id/submit-answer' })
    async submitAnswerAlias(@Param('id') id: string, @Body() dto: SubmitAnswerDto) {
        const qId = dto.questionId || dto.stepNumber || 0;
        return await this.assessmentsService.submitAnswer(id, qId, dto.answer);
    }

    @Post(':id/submit')
    @ApiOperation({ summary: 'Alias for assignments/:id/submit' })
    async submitAssessmentAlias(@Param('id') id: string, @Body() dto: SubmitAssessmentDto) {
        const result = await this.assessmentsService.submitAssessment(id, dto.timeTakenMinutes);
        
        return {
            ...result,
            score: Math.round(result.percentage || 0),
            correctAnswersCount: result.correctAnswersCount || 0,
            totalQuestionsCount: result.assessment?.totalQuestions || 0,
        };
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get assessment by ID (any status)' })
    async getAssessment(@Param('id') id: string) {
        // For candidates using assignment tokens
        const assignment = await this.assessmentsService.getAssignmentWithAssessment(id);
        if (assignment) {
            const assessment = assignment.assessment;
            return {
                ...assessment,
                questions: assessment.questions.map(q => ({
                    ...q,
                    text: q.question // Mapping for frontend compatibility
                })),
                status: assignment.status, // Use assignment status (e.g. 'submitted')
                assignmentId: assignment.id,
            };
        }

        // For recruiters using direct assessment IDs
        const assessment = await this.assessmentsService.getAssessmentById(id);
        return {
            ...assessment,
            questions: assessment.questions.map(q => ({
                ...q,
                text: q.question // Mapping for frontend compatibility
            }))
        };
    }

    @Post('assignments/:assignmentId/start')
    @ApiOperation({ summary: 'Mark assignment as started' })
    async startAssessment(@Param('assignmentId') assignmentId: string) {
        return await this.assessmentsService.startAssessment(assignmentId);
    }

    @Post('assignments/:assignmentId/submit-answer')
    @ApiOperation({ summary: 'Submit an answer for a question' })
    async submitAnswer(
        @Param('assignmentId') assignmentId: string,
        @Body() dto: SubmitAnswerDto,
    ) {
        return await this.assessmentsService.submitAnswer(
            assignmentId,
            dto.questionId || 0,
            dto.answer,
        );
    }

    @Post('assignments/:assignmentId/submit')
    @ApiOperation({ summary: 'Final submit for assessment' })
    async submitAssessment(
        @Param('assignmentId') assignmentId: string,
        @Body() dto: SubmitAssessmentDto,
    ) {
        const result = await this.assessmentsService.submitAssessment(
            assignmentId,
            dto.timeTakenMinutes,
        );
        
        // Return structure compatible with frontend expectations
        return {
            ...result,
            score: Math.round(result.percentage || 0),
            correctAnswersCount: result.correctAnswersCount || 0,
            totalQuestionsCount: result.assessment?.totalQuestions || 0,
        };
    }

    @Delete('assignments/:id')
    @ApiOperation({ summary: 'Delete assessment assignment (Level 2 result)' })
    async deleteAssignment(@Param('id') id: string) {
        await this.assessmentsService.deleteAssignment(id);
        return { message: 'Assignment deleted successfully' };
    }
}
