import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    JoinColumn,
} from 'typeorm';
import { Assessment } from './assessment.entity';

export enum AssignmentStatus {
    ASSIGNED = 'assigned',
    IN_PROGRESS = 'in_progress',
    SUBMITTED = 'submitted',
    EVALUATED = 'evaluated',
}

export enum CandidateType {
    PORTAL_USER = 'portal_user',
    MANUAL_CANDIDATE = 'manual_candidate',
}

export interface CandidateAnswer {
    questionId: number;
    answer: string;
    timestamp: string;
}

export interface EvaluatedAnswer {
    questionId: number;
    score: number;
    maxMarks: number;
    feedback: string;
    isCorrect: boolean;
}

@Entity('assessment_assignments')
export class AssessmentAssignment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'assessment_id' })
    assessmentId: string;

    @ManyToOne(() => Assessment, (assessment) => assessment.assignments, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'assessment_id' })
    assessment: Assessment;

    @Column({ name: 'candidate_id', type: 'uuid' })
    candidateId: string;

    @Column({
        name: 'candidate_type',
        type: 'enum',
        enum: CandidateType,
    })
    candidateType: CandidateType;

    @Column({ name: 'candidate_name', type: 'varchar', length: 255, nullable: true })
    candidateName: string;

    @Column({ name: 'candidate_email', type: 'varchar', length: 255, nullable: true })
    candidateEmail: string;

    @Column({
        type: 'enum',
        enum: AssignmentStatus,
        default: AssignmentStatus.ASSIGNED,
    })
    status: AssignmentStatus;

    @CreateDateColumn({ name: 'assigned_at' })
    assignedAt: Date;

    @Column({ name: 'started_at', type: 'timestamp', nullable: true })
    startedAt: Date;

    @Column({ name: 'submitted_at', type: 'timestamp', nullable: true })
    submittedAt: Date;

    @Column({ name: 'time_taken_minutes', type: 'integer', nullable: true })
    timeTakenMinutes: number;

    @Column({ type: 'jsonb', default: [] })
    answers: CandidateAnswer[];

    @Column({ type: 'integer', default: 0 })
    score: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    percentage: number;

    @Column({ type: 'varchar', length: 2, nullable: true })
    grade: string;

    @Column({ type: 'boolean', default: false })
    passed: boolean;

    @Column({ name: 'correct_answers_count', type: 'integer', default: 0 })
    correctAnswersCount: number;

    @Column({ name: 'evaluated_answers', type: 'jsonb', default: [] })
    evaluatedAnswers: EvaluatedAnswer[];

    @Column({ type: 'text', array: true, default: [] })
    strengths: string[];

    @Column({ type: 'text', array: true, default: [] })
    weaknesses: string[];

    @Column({ name: 'overall_feedback', type: 'text', nullable: true })
    overallFeedback: string;

    @Column({ name: 'session_integrity', type: 'integer', default: 100 })
    sessionIntegrity: number;

    @Column({
        name: 'session_status',
        type: 'varchar',
        length: 50,
        default: 'Verified Secure',
    })
    sessionStatus: string;

    @Column({ name: 'integrity_violations', type: 'jsonb', default: [] })
    integrityViolations: any[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
