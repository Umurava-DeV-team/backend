import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    JoinColumn,
} from 'typeorm';
import { Job } from './job.entity';

@Entity('candidates')
export class Candidate {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'varchar', length: 255 })
    email: string;

    @Column({ type: 'varchar', length: 255, default: '' })
    role: string;

    @Column({ type: 'varchar', length: 255, default: '' })
    location: string;

    @Column({ type: 'varchar', length: 50, default: '' })
    phone: string;

    @Column({ type: 'text', array: true, default: '{}' })
    skills: string[];

    @Column({ type: 'text', default: '' })
    experience: string;

    @Column({ type: 'text', default: '' })
    education: string;

    @Column({ type: 'text', default: '' })
    summary: string;

    @Column({ name: 'job_id', nullable: true })
    jobId?: string;

    @ManyToOne(() => Job, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'job_id' })
    job: Job;

    @Column({ name: 'resume_text', type: 'text', default: '' })
    resumeText: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
