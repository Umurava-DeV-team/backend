import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type JobDocument = Job & Document;

@Schema({ timestamps: true })
export class Job {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [String], default: [] })
  requiredSkills: string[];

  @Prop({ default: '' })
  experienceRequired: string;

  @Prop({ default: '' })
  educationRequired: string;

  @Prop({ default: '' })
  location: string;
}

export const JobSchema = SchemaFactory.createForClass(Job);
