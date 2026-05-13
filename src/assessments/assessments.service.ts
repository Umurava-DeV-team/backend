import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Assessment, AssessmentStatus, AssessmentQuestion } from '../entities/assessment.entity';
import {
    AssessmentAssignment,
    AssignmentStatus,
    CandidateType,
    EvaluatedAnswer,
} from '../entities/assessment-assignment.entity';
import axios from 'axios';

import { ScreeningResult, ScreeningMatch } from '../entities/screening-result.entity';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AssessmentsService {
    constructor(
        @InjectRepository(Assessment)
        private assessmentRepo: Repository<Assessment>,
        @InjectRepository(AssessmentAssignment)
        private assignmentRepo: Repository<AssessmentAssignment>,
        @InjectRepository(ScreeningResult)
        private screeningResultRepo: Repository<ScreeningResult>,
        private configService: ConfigService,
        private notificationsGateway: NotificationsGateway,
        private notificationsService: NotificationsService,
    ) { }

    /**
     * Generate draft assessment from AI
     * This is called when recruiter clicks "Launch Assessment"
     * Assessment is created in DRAFT status for review/edit
     */
    async generateDraftAssessment(
        jobId: string,
        jobTitle: string,
        requiredSkills: string,
        userId: string,
    ): Promise<Assessment> {
        const aiServiceUrl = this.configService.get('AI_SERVICE_URL', 'http://localhost:4000');
        try {
            console.log('Calling AI service at:', aiServiceUrl);
            console.log('Request payload:', { jobId, jobTitle, requiredSkills });

            // Call AI service to generate questions
            const response = await axios.post(`${aiServiceUrl}/api/exam/generate-shared`, {
                jobDescription: {
                    jobId,
                    jobTitle,
                    requiredSkills,
                },
            });

            console.log('AI service response:', response.data);

            if (!response.data.success) {
                throw new BadRequestException('Failed to generate assessment questions');
            }

            const examData = response.data.exam;

            // Create assessment in DRAFT status
            const assessment = this.assessmentRepo.create({
                jobId,
                title: `${jobTitle} - Assessment`,
                instructions: examData.instructions,
                durationMinutes: examData.duration === '3 hours' ? 180 : 120,
                timeLimitPerQuestion: 30,
                status: AssessmentStatus.DRAFT,
                questions: examData.questions,
                jobType: examData.jobType,
                jobCategory: examData.jobCategory,
                totalQuestions: examData.totalQuestions,
                totalMarks: examData.totalMarks,
                passingScore: 70, // Default to 70 as a more common standard, or leave for user to set
                createdBy: userId,
            });

            return await this.assessmentRepo.save(assessment);
        } catch (error) {
            console.error('Error generating draft assessment:', error.message);
            console.error('Full error:', error.response?.data || error);
            throw new BadRequestException(
                error.message || 'Failed to generate assessment',
            );
        }
    }

    /**
     * Get all draft assessments for a recruiter
     */
    async getDraftAssessments(userId?: string): Promise<Assessment[]> {
        const query = this.assessmentRepo
            .createQueryBuilder('assessment')
            .leftJoinAndSelect('assessment.job', 'job')
            .where('assessment.status = :status', { status: AssessmentStatus.DRAFT })
            .orderBy('assessment.createdAt', 'DESC');

        if (userId) {
            query.andWhere('assessment.createdBy = :userId', { userId });
        }

        return await query.getMany();
    }

    /**
     * Get assessment by ID (any status)
     */
    async getAssessmentById(id: string): Promise<Assessment> {
        const assessment = await this.assessmentRepo.findOne({
            where: { id },
            relations: ['job', 'creator'],
        });

        if (!assessment) {
            throw new NotFoundException('Assessment not found');
        }

        return assessment;
    }

    async getAssignmentWithAssessment(id: string): Promise<AssessmentAssignment | null> {
        return await this.assignmentRepo.findOne({
            where: { id },
            relations: ['assessment', 'assessment.job', 'assessment.creator'],
        });
    }

    /**
     * Update draft assessment (edit questions, instructions, etc.)
     * Only allowed for DRAFT assessments
     */
    async updateDraftAssessment(
        id: string,
        updateData: Partial<Assessment>,
    ): Promise<Assessment> {
        const assessment = await this.getAssessmentById(id);

        if (assessment.status !== AssessmentStatus.DRAFT) {
            throw new BadRequestException(
                'Only draft assessments can be edited. This assessment has already been launched.',
            );
        }

        // Update allowed fields
        if (updateData.title) assessment.title = updateData.title;
        if (updateData.instructions) assessment.instructions = updateData.instructions;
        if (updateData.durationMinutes) assessment.durationMinutes = updateData.durationMinutes;
        if (updateData.timeLimitPerQuestion)
            assessment.timeLimitPerQuestion = updateData.timeLimitPerQuestion;
        if (updateData.questions) {
            assessment.questions = updateData.questions;
            assessment.totalQuestions = updateData.questions.length;
            assessment.totalMarks = updateData.questions.reduce(
                (sum, q) => sum + q.marks,
                0,
            );
        }
        if (updateData.passingScore) assessment.passingScore = updateData.passingScore;

        return await this.assessmentRepo.save(assessment);
    }

    /**
     * Get all active assessment assignments (for recruiter results view)
     */
    async getAllAssessments(): Promise<any[]> {
        const assignments = await this.assignmentRepo.find({
            relations: ['assessment', 'assessment.job'],
            order: { createdAt: 'DESC' },
        });

        // Map for frontend compatibility (slice expects _id and specific fields)
        return assignments.map(a => ({
            ...a,
            _id: a.id,
            jobId: a.assessment?.job,
            title: a.assessment?.title,
            totalQuestions: a.assessment?.totalQuestions || 0,
            durationMinutes: a.assessment?.durationMinutes || 0,
            passingScore: a.assessment?.passingScore || 0,
        }));
    }

    /**
     * Add a new question to draft assessment
     */
    async addQuestion(
        assessmentId: string,
        question: AssessmentQuestion,
    ): Promise<Assessment> {
        const assessment = await this.getAssessmentById(assessmentId);

        if (assessment.status !== AssessmentStatus.DRAFT) {
            throw new BadRequestException('Cannot modify launched assessment');
        }

        // Assign new ID
        const maxId = Math.max(...assessment.questions.map((q) => q.id), 0);
        question.id = maxId + 1;

        assessment.questions.push(question);
        assessment.totalQuestions = assessment.questions.length;
        assessment.totalMarks = assessment.questions.reduce((sum, q) => sum + q.marks, 0);

        return await this.assessmentRepo.save(assessment);
    }

    /**
     * Update a specific question in draft assessment
     */
    async updateQuestion(
        assessmentId: string,
        questionId: number,
        updatedQuestion: Partial<AssessmentQuestion>,
    ): Promise<Assessment> {
        const assessment = await this.getAssessmentById(assessmentId);

        if (assessment.status !== AssessmentStatus.DRAFT) {
            throw new BadRequestException('Cannot modify launched assessment');
        }

        const questionIndex = assessment.questions.findIndex((q) => q.id === questionId);
        if (questionIndex === -1) {
            throw new NotFoundException('Question not found');
        }

        assessment.questions[questionIndex] = {
            ...assessment.questions[questionIndex],
            ...updatedQuestion,
        };

        assessment.totalMarks = assessment.questions.reduce((sum, q) => sum + q.marks, 0);

        return await this.assessmentRepo.save(assessment);
    }

    /**
     * Delete a question from draft assessment
     */
    async deleteQuestion(assessmentId: string, questionId: number): Promise<Assessment> {
        const assessment = await this.getAssessmentById(assessmentId);

        if (assessment.status !== AssessmentStatus.DRAFT) {
            throw new BadRequestException('Cannot modify launched assessment');
        }

        assessment.questions = assessment.questions.filter((q) => q.id !== questionId);
        assessment.totalQuestions = assessment.questions.length;
        assessment.totalMarks = assessment.questions.reduce((sum, q) => sum + q.marks, 0);

        return await this.assessmentRepo.save(assessment);
    }

    /**
     * Launch assessment - change status from DRAFT to ACTIVE
     * Create assignments for selected candidates
     */
    async launchAssessment(
        assessmentId: string,
        candidateIds: string[],
        userId: string,
        topN?: number,
    ): Promise<{ assessment: Assessment; assignmentsCreated: number }> {
        const assessment = await this.getAssessmentById(assessmentId);

        if (assessment.status !== AssessmentStatus.DRAFT) {
            throw new BadRequestException('Assessment has already been launched');
        }

        // Create assignments for each candidate
        let assignmentsCreated = 0;
        const candidatesToAssign: ScreeningMatch[] = [];

        if (topN && topN > 0) {
            const latestScreening = await this.screeningResultRepo.findOne({
                where: { jobId: assessment.jobId },
                order: { createdAt: 'DESC' },
            });

            if (latestScreening && latestScreening.shortlist) {
                candidatesToAssign.push(...latestScreening.shortlist.slice(0, topN));
            }
        }

        // Also add manually provided candidate IDs if any
        // (For now we prioritize topN logic as per user request)

        for (const candidate of candidatesToAssign) {
            try {
                // Check if assignment already exists
                const existing = await this.assignmentRepo.findOne({
                    where: { 
                        assessmentId: assessment.id, 
                        candidateId: candidate.candidateId 
                    }
                });

                if (existing) {
                    console.log(`Assignment already exists for ${candidate.name}, skipping...`);
                    continue;
                }

                const assignment = this.assignmentRepo.create({
                    assessmentId: assessment.id,
                    candidateId: candidate.candidateId,
                    candidateName: candidate.name,
                    candidateEmail: candidate.email,
                    candidateType: CandidateType.PORTAL_USER, // Default to portal user for now
                    status: AssignmentStatus.ASSIGNED,
                    assignedAt: new Date(),
                });

                const savedAssignment = await this.assignmentRepo.save(assignment);
                assignmentsCreated++;

                // Create notification for candidate
                try {
                    const notification = await this.notificationsService.create(
                        candidate.candidateId,
                        'New Assessment Assigned',
                        `You have been assigned a new assessment: ${assessment.title}. Please complete it to proceed with your application.`,
                        'assessment',
                        savedAssignment.id // Link to the assignment
                    );
                    this.notificationsGateway.sendNotification('new_assessment', notification);
                } catch (err) {
                    console.error(`Failed to send notification to candidate ${candidate.name}:`, err);
                }
            } catch (error) {
                console.error(`Failed to create assignment for ${candidate.name}:`, error.message);
            }
        }

        // Update assessment status
        assessment.status = AssessmentStatus.ACTIVE;
        assessment.launchedAt = new Date();
        assessment.launchedBy = userId;

        await this.assessmentRepo.save(assessment);

        return { assessment, assignmentsCreated };
    }

    /**
     * Delete draft assessment
     */
    async deleteDraftAssessment(id: string): Promise<void> {
        const assessment = await this.getAssessmentById(id);

        if (assessment.status !== AssessmentStatus.DRAFT) {
            throw new BadRequestException(
                'Only draft assessments can be deleted. Active assessments must be archived.',
            );
        }

        await this.assessmentRepo.remove(assessment);
    }

    /**
     * Archive active assessment
     */
    async archiveAssessment(id: string): Promise<Assessment> {
        const assessment = await this.getAssessmentById(id);

        if (assessment.status === AssessmentStatus.DRAFT) {
            throw new BadRequestException('Cannot archive draft assessment. Delete it instead.');
        }

        assessment.status = AssessmentStatus.ARCHIVED;
        return await this.assessmentRepo.save(assessment);
    }

    /**
     * Get all assignments for an assessment
     */
    async getAssessmentAssignments(assessmentId: string): Promise<AssessmentAssignment[]> {
        return await this.assignmentRepo.find({
            where: { assessmentId },
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * Get candidate's assigned assessments
     */
    async getMyCandidateAssignments(candidateId: string): Promise<AssessmentAssignment[]> {
        return await this.assignmentRepo.find({
            where: { candidateId },
            relations: ['assessment', 'assessment.job'],
            order: { assignedAt: 'DESC' },
        });
    }

    /**
     * Start assessment (candidate begins taking it)
     */
    async startAssessment(assignmentId: string): Promise<AssessmentAssignment> {
        const assignment = await this.assignmentRepo.findOne({
            where: { id: assignmentId },
            relations: ['assessment'],
        });

        if (!assignment) {
            throw new NotFoundException('Assignment not found');
        }

        if (assignment.status !== AssignmentStatus.ASSIGNED) {
            throw new BadRequestException('Assessment has already been started');
        }

        assignment.status = AssignmentStatus.IN_PROGRESS;
        assignment.startedAt = new Date();

        return await this.assignmentRepo.save(assignment);
    }

    /**
     * Submit answer for a question
     */
    async submitAnswer(
        assignmentId: string,
        questionId: number,
        answer: string,
    ): Promise<AssessmentAssignment> {
        const assignment = await this.assignmentRepo.findOne({
            where: { id: assignmentId },
        });

        if (!assignment) {
            throw new NotFoundException('Assignment not found');
        }

        if (assignment.status === AssignmentStatus.SUBMITTED) {
            throw new BadRequestException('Assessment has already been submitted');
        }

        // Add or update answer
        const existingAnswerIndex = assignment.answers.findIndex(
            (a) => a.questionId === questionId,
        );

        const newAnswer = {
            questionId,
            answer,
            timestamp: new Date().toISOString(),
        };

        if (existingAnswerIndex >= 0) {
            assignment.answers[existingAnswerIndex] = newAnswer;
        } else {
            assignment.answers.push(newAnswer);
        }

        return await this.assignmentRepo.save(assignment);
    }

    /**
     * Submit final assessment
     */
    async submitAssessment(
        assignmentId: string,
        timeTakenMinutes: number,
    ): Promise<AssessmentAssignment> {
        const assignment = await this.assignmentRepo.findOne({
            where: { id: assignmentId },
            relations: ['assessment'],
        });

        if (!assignment) {
            throw new NotFoundException('Assignment not found');
        }

        if (assignment.status === AssignmentStatus.SUBMITTED) {
            throw new BadRequestException('Assessment has already been submitted');
        }

        assignment.status = AssignmentStatus.SUBMITTED;
        assignment.submittedAt = new Date();
        assignment.timeTakenMinutes = timeTakenMinutes;

        // Auto-grade multiple choice questions
        let correctCount = 0;
        let totalScore = 0;

        const evaluatedAnswers: EvaluatedAnswer[] = [];

        assignment.assessment.questions.forEach((question) => {
            const candidateAnswer = assignment.answers.find(
                (a) => a.questionId === question.id,
            );

            let isCorrect = false;
            let score = 0;

            if (question.type === 'multiple_choice' && candidateAnswer && question.correctAnswer) {
                const submitted = candidateAnswer.answer.trim().toLowerCase();
                const expected = question.correctAnswer.trim().toLowerCase();
                
                isCorrect = 
                    submitted === expected || 
                    submitted.startsWith(expected + ')') || 
                    submitted.startsWith(expected + '. ') ||
                    (expected.length === 1 && submitted.startsWith(expected + ' '));

                if (isCorrect) {
                    correctCount++;
                    score = question.marks;
                    totalScore += score;
                }
            }

            evaluatedAnswers.push({
                questionId: question.id,
                score,
                maxMarks: question.marks,
                feedback: isCorrect ? 'Correct answer' : candidateAnswer ? 'Incorrect answer' : 'No answer provided',
                isCorrect,
            });
        });

        assignment.score = totalScore;
        assignment.correctAnswersCount = correctCount;
        assignment.percentage = (totalScore / assignment.assessment.totalMarks) * 100;
        assignment.evaluatedAnswers = evaluatedAnswers;

        // Assign grade
        if (assignment.percentage >= 80) assignment.grade = 'A';
        else if (assignment.percentage >= 65) assignment.grade = 'B';
        else if (assignment.percentage >= 50) assignment.grade = 'C';
        else assignment.grade = 'F';

        assignment.passed = assignment.percentage >= (assignment.assessment.passingScore || 50);

        // For open-ended and coding questions, mark as needing evaluation
        const needsEvaluation = assignment.assessment.questions.some(
            (q) => q.type !== 'multiple_choice',
        );

        if (!needsEvaluation) {
            assignment.status = AssignmentStatus.EVALUATED;
        }

        const saved = await this.assignmentRepo.save(assignment);
        
        // Trigger AI evaluation in background if there are open-ended questions
        if (needsEvaluation) {
            this.evaluateAssignment(saved.id).catch(err => 
                console.error(`Background evaluation failed for ${saved.id}:`, err)
            );
        }

        // Notify recruiter via WebSocket
        try {
            const recruiterId = saved.assessment.createdBy || saved.assessment.launchedBy;
            if (recruiterId) {
                const notification = await this.notificationsService.create(
                    recruiterId,
                    'Assessment Submitted',
                    `Talent ${saved.candidateName} submitted assessment: ${saved.assessment.title}. Score: ${Math.round(saved.percentage)}%`,
                    'assessment'
                );
                this.notificationsGateway.sendNotification('assessment_submitted', notification);
            }
        } catch (err) {
            console.error('Failed to send notification:', err);
        }

        return saved;
    }

    /**
     * Evaluate open-ended questions using AI
     */
    async evaluateAssignment(assignmentId: string): Promise<AssessmentAssignment> {
        const aiServiceUrl = this.configService.get('AI_SERVICE_URL', 'http://localhost:4000');
        const assignment = await this.assignmentRepo.findOne({
            where: { id: assignmentId },
            relations: ['assessment'],
        });

        if (!assignment) {
            throw new NotFoundException('Assignment not found');
        }

        if (assignment.status !== AssignmentStatus.SUBMITTED) {
            throw new BadRequestException('Assessment must be submitted before evaluation');
        }

        try {
            // Call AI service for evaluation
            const response = await axios.post(`${aiServiceUrl}/api/exam/evaluate`, {
                examAnswers: assignment.answers,
                originalExam: {
                    examId: assignment.assessment.id,
                    jobTitle: assignment.assessment.title,
                    jobType: assignment.assessment.jobType,
                    questions: assignment.assessment.questions,
                },
                candidateName: assignment.candidateName || 'Candidate',
            });

            if (!response.data.success) {
                throw new BadRequestException('Failed to evaluate assessment');
            }

            const evaluation = response.data.evaluation;

            // Update assignment with evaluation results
            assignment.evaluatedAnswers = evaluation.evaluatedAnswers;
            assignment.score = evaluation.totalScore;
            assignment.percentage = evaluation.percentage;
            assignment.grade = evaluation.grade;
            assignment.passed = evaluation.passed;
            assignment.correctAnswersCount = evaluation.evaluatedAnswers.filter(
                (a: any) => a.isCorrect,
            ).length;
            assignment.strengths = evaluation.strengths;
            assignment.weaknesses = evaluation.weaknesses;
            assignment.overallFeedback = evaluation.overallFeedback;
            assignment.status = AssignmentStatus.EVALUATED;

            return await this.assignmentRepo.save(assignment);
        } catch (error) {
            console.error('Error evaluating assignment:', error.message);
            throw new BadRequestException('Failed to evaluate assessment');
        }
    }

    /**
     * Get all candidate assignments for a specific job
     * Used by recruiter to see "Level 2" results in screening hub
     */
    async getAssignmentsByJobId(jobId: string): Promise<any[]> {
        const assignments = await this.assignmentRepo
            .createQueryBuilder('assignment')
            .leftJoinAndSelect('assignment.assessment', 'assessment')
            .where('assessment.jobId = :jobId', { jobId })
            .orderBy('assignment.createdAt', 'DESC')
            .getMany();

        // Map id to _id for frontend compatibility and include helper fields
        return assignments.map((a) => ({
            ...a,
            _id: a.id,
            verifiedCandidateName: a.candidateName,
            verifiedCandidateEmail: a.candidateEmail,
            totalQuestionsCount: a.assessment?.totalQuestions || 0,
            totalQuestions: a.assessment?.totalQuestions || 0,
            durationMinutes: a.assessment?.durationMinutes || 0,
            passingScore: a.assessment?.passingScore || 0,
        }));
    }

    /**
     * Delete assessment assignment (Level 2 result)
     */
    async deleteAssignment(id: string): Promise<void> {
        const assignment = await this.assignmentRepo.findOne({ where: { id } });
        if (!assignment) {
            throw new NotFoundException('Assignment not found');
        }
        await this.assignmentRepo.remove(assignment);
    }
}
