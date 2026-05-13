import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Job } from './job.entity';

export enum ApplicationStatus {
    PENDING = 'pending',
    REVIEWED = 'reviewed',
    SHORTLISTED = 'shortlisted',
    REJECTED = 'rejected',
    HIRED = 'hired',
}

@Entity('applications')
export class Application {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'candidate_id' })
    candidateId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'candidate_id' })
    candidate: User;

    @Column({ name: 'job_id' })
    jobId: string;

    @ManyToOne(() => Job, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'job_id' })
    job: Job;

    @Column({
        type: 'varchar',
        length: 50,
        default: ApplicationStatus.PENDING,
    })
    status: ApplicationStatus;

    @Column({ name: 'cover_letter', type: 'text', nullable: true })
    coverLetter: string;

    @CreateDateColumn({ name: 'applied_at' })
    appliedAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
