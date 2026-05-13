import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
    JoinColumn,
} from 'typeorm';
import { Job } from './job.entity';
import { User } from './user.entity';
import { AssessmentAssignment } from './assessment-assignment.entity';

export enum AssessmentStatus {
    DRAFT = 'draft',
    ACTIVE = 'active',
    ARCHIVED = 'archived',
}

export enum JobType {
    CODING = 'coding',
    NON_CODING = 'non-coding',
}

export enum QuestionType {
    MULTIPLE_CHOICE = 'multiple_choice',
    OPEN_ENDED = 'open_ended',
    CODING_PROBLEM = 'coding_problem',
    REAL_WORLD_PROBLEM = 'real_world_problem',
}

export interface AssessmentQuestion {
    id: number;
    type: QuestionType;
    category: string;
    question: string;
    options?: string[]; // For multiple choice
    correctAnswer?: string; // For multiple choice
    marks: number;
}

@Entity('assessments')
export class Assessment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'job_id' })
    jobId: string;

    @ManyToOne(() => Job, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'job_id' })
    job: Job;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'text', nullable: true })
    instructions: string;

    @Column({ name: 'duration_minutes', type: 'integer', default: 120 })
    durationMinutes: number;

    @Column({ name: 'time_limit_per_question', type: 'integer', default: 30 })
    timeLimitPerQuestion: number;

    @Column({
        type: 'enum',
        enum: AssessmentStatus,
        default: AssessmentStatus.DRAFT,
    })
    status: AssessmentStatus;

    @Column({ type: 'jsonb', default: [] })
    questions: AssessmentQuestion[];

    @Column({ name: 'job_type', type: 'enum', enum: JobType, nullable: true })
    jobType: JobType;

    @Column({ name: 'job_category', type: 'varchar', length: 100, nullable: true })
    jobCategory: string;

    @Column({ name: 'total_questions', type: 'integer', default: 10 })
    totalQuestions: number;

    @Column({ name: 'total_marks', type: 'integer', default: 100 })
    totalMarks: number;

    @Column({ name: 'passing_score', type: 'integer', nullable: true })
    passingScore: number;

    @Column({ name: 'created_by', nullable: true })
    createdBy: string;

    @ManyToOne(() => User, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'created_by' })
    creator: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @Column({ name: 'launched_at', type: 'timestamp', nullable: true })
    launchedAt: Date;

    @Column({ name: 'launched_by', nullable: true })
    launchedBy: string;

    @ManyToOne(() => User, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'launched_by' })
    launcher: User;

    @OneToMany(() => AssessmentAssignment, (assignment) => assignment.assessment)
    assignments: AssessmentAssignment[];
}
