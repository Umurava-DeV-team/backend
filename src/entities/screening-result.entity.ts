import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    JoinColumn,
} from 'typeorm';
import { Job } from './job.entity';

export interface ScreeningMatch {
    candidateId: string;
    name: string;
    email: string;
    matchScore: number;
    strengths: string[];
    missingSkills: string[];
    risks: string[];
    summary: string;
}

@Entity('screening_results')
export class ScreeningResult {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'job_id' })
    jobId: string;

    @ManyToOne(() => Job, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'job_id' })
    job: Job;

    @Column({ name: 'job_title', type: 'varchar', length: 255 })
    jobTitle: string;

    @Column({ name: 'total_candidates', type: 'integer' })
    totalCandidates: number;

    @Column({ type: 'jsonb', default: [] })
    shortlist: ScreeningMatch[];

    @Column({ name: 'screened_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    screenedAt: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
