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

export enum ExperienceLevel {
    JUNIOR = 'Junior',
    MID_LEVEL = 'Mid-Level',
    SENIOR = 'Senior',
}

export enum JobStatus {
    DRAFT = 'draft',
    ACTIVE = 'active',
    CLOSED = 'closed',
    ARCHIVED = 'archived',
}

@Entity('jobs')
export class Job {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'varchar', length: 255 })
    company: string;

    @Column({ type: 'varchar', length: 255 })
    department: string;

    @Column({
        name: 'experience_level',
        type: 'enum',
        enum: ExperienceLevel,
    })
    experienceLevel: ExperienceLevel;

    @Column({ name: 'applicants_target', type: 'integer' })
    applicantsTarget: number;

    @Column({ type: 'varchar', length: 255 })
    location: string;

    @Column({ name: 'salary_range', type: 'varchar', length: 100 })
    salaryRange: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ name: 'description_file_url', type: 'text', nullable: true })
    descriptionFileUrl: string;

    @Column({
        type: 'enum',
        enum: JobStatus,
        default: JobStatus.ACTIVE,
    })
    status: JobStatus;

    @Column({ name: 'created_by', nullable: true })
    createdBy: string;

    @ManyToOne(() => User, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'created_by' })
    creator: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
