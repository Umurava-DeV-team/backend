import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CandidateDocument = Candidate & Document;

@Schema({ timestamps: true })
export class Candidate {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop({ default: '' })
  currentRole: string;

  @Prop({ default: '' })
  location: string;

  @Prop({ default: '' })
  phone: string;

  @Prop({ type: [String], default: [] })
  skills: string[];

  @Prop({ default: '' })
  experience: string;

  @Prop({ default: '' })
  education: string;

  @Prop({ default: '' })
  summary: string;

  @Prop({ type: Types.ObjectId, ref: 'Job' })
  jobId?: Types.ObjectId;

  @Prop({ default: '' })
  resumeText: string;
}

export const CandidateSchema = SchemaFactory.createForClass(Candidate);
