import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    CreateDateColumn,
    UpdateDateColumn,
    JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export interface Skill {
    name: string;
    level: string;
}

export interface WorkExperience {
    role: string;
    companyName: string;
    duration: string;
    description: string;
}

export interface Education {
    degree: string;
    institution: string;
    year: string;
}

@Entity('profiles')
export class Profile {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id' })
    userId: string;

    @OneToOne(() => User, (user) => user.profile, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'first_name', type: 'varchar', length: 255, nullable: true })
    firstName: string;

    @Column({ name: 'last_name', type: 'varchar', length: 255, nullable: true })
    lastName: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    email: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    phone: string;

    @Column({ type: 'text', nullable: true })
    bio: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    headline: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    location: string;

    @Column({ type: 'jsonb', default: [] })
    skills: Skill[];

    @Column({ name: 'work_experience', type: 'jsonb', default: [] })
    workExperience: WorkExperience[];

    @Column({ type: 'jsonb', default: [] })
    education: Education[];

    @Column({ type: 'jsonb', default: [] })
    certifications: any[];

    @Column({ type: 'jsonb', default: [] })
    projects: any[];

    @Column({ name: 'social_links', type: 'jsonb', default: {} })
    socialLinks: Record<string, string>;

    @Column({ name: 'resume_url', type: 'varchar', length: 500, nullable: true })
    resumeUrl: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    availability: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
