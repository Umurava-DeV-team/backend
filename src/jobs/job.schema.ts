import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type JobDocument = Job & Document;

export enum ExperienceLevel {
  JUNIOR = 'Junior',
  MID_LEVEL = 'Mid-Level',
  SENIOR = 'Senior',
}

@Schema({ timestamps: true })
export class Job {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  department: string;

  @Prop({ required: true, enum: ExperienceLevel })
  experienceLevel: ExperienceLevel;

  @Prop({ required: true })
  applicantsTarget: number;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true })
  salaryRange: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: '' })
  descriptionFileUrl: string;
}

export const JobSchema = SchemaFactory.createForClass(Job);
