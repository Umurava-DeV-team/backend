import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProfileDocument = Profile & Document;

export enum SkillType {
  TECHNICAL = 'Technical Skill',
  LANGUAGE = 'Language',
}

export enum Proficiency {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced',
  EXPERT = 'Expert',
  FLUENT = 'Fluent',
  CONVERSATIONAL = 'Conversational',
}

export enum AvailabilityStatus {
  AVAILABLE = 'Available',
  OPEN = 'Open to Opportunities',
  NOT_AVAILABLE = 'Not Available',
}

export enum EmploymentType {
  FULL_TIME = 'Full-time',
  PART_TIME = 'Part-time',
  CONTRACT = 'Contract',
  FREELANCE = 'Freelance',
  INTERNSHIP = 'Internship',
}

export class Skill {
  _id?: Types.ObjectId;
  type: SkillType;
  name: string;
  proficiency: Proficiency;
  yearsOfExperience?: number;
}

export class WorkExperience {
  _id?: Types.ObjectId;
  role: string;
  companyName: string;
  startDate: string;
  endDate?: string;
  currentlyWorkHere: boolean;
  description?: string;
  technologies: string[];
}

export class Education {
  _id?: Types.ObjectId;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: string;
  endYear?: string;
}

export class Certification {
  _id?: Types.ObjectId;
  certificationName: string;
  issuingOrganization: string;
  issueDate: string;
}

export class Project {
  _id?: Types.ObjectId;
  projectName: string;
  role: string;
  projectUrl?: string;
  description?: string;
  technologies: string[];
}

@Schema({ timestamps: true })
export class Profile {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  // Basic Info
  @Prop({ default: '' }) avatarUrl: string;
  @Prop({ default: '' }) firstName: string;
  @Prop({ default: '' }) lastName: string;
  @Prop({ default: '' }) headline: string;
  @Prop({ default: '' }) location: string;
  @Prop({ default: '' }) bio: string;
  @Prop({ default: '' }) email: string;
  @Prop({ default: '' }) mobileNumber: string;

  // Skills & Languages
  @Prop({
    type: [{
      _id: { type: Types.ObjectId, default: () => new Types.ObjectId() },
      type: { type: String, enum: SkillType },
      name: String,
      proficiency: { type: String, enum: Proficiency },
      yearsOfExperience: Number,
    }],
    default: [],
  })
  skills: Skill[];

  // Work Experience
  @Prop({
    type: [{
      _id: { type: Types.ObjectId, default: () => new Types.ObjectId() },
      role: String,
      companyName: String,
      startDate: String,
      endDate: String,
      currentlyWorkHere: { type: Boolean, default: false },
      description: String,
      technologies: [String],
    }],
    default: [],
  })
  workExperience: WorkExperience[];

  // Education
  @Prop({
    type: [{
      _id: { type: Types.ObjectId, default: () => new Types.ObjectId() },
      institution: String,
      degree: String,
      fieldOfStudy: String,
      startYear: String,
      endYear: String,
    }],
    default: [],
  })
  education: Education[];

  // Certifications
  @Prop({
    type: [{
      _id: { type: Types.ObjectId, default: () => new Types.ObjectId() },
      certificationName: String,
      issuingOrganization: String,
      issueDate: String,
    }],
    default: [],
  })
  certifications: Certification[];

  // Projects
  @Prop({
    type: [{
      _id: { type: Types.ObjectId, default: () => new Types.ObjectId() },
      projectName: String,
      role: String,
      projectUrl: String,
      description: String,
      technologies: [String],
    }],
    default: [],
  })
  projects: Project[];

  // Availability
  @Prop({ default: AvailabilityStatus.AVAILABLE, enum: AvailabilityStatus })
  availabilityStatus: AvailabilityStatus;

  @Prop({ default: EmploymentType.FULL_TIME, enum: EmploymentType })
  employmentType: EmploymentType;

  @Prop({ default: '' })
  availableStartDate: string;

  // Social Links
  @Prop({ default: '' }) linkedin: string;
  @Prop({ default: '' }) github: string;
  @Prop({ default: '' }) personalPortfolio: string;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
