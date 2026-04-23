import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ApplicationDocument = Application & Document;

export enum ApplicationStatus {
  APPLIED = 'Applied',
  SCREENING = 'Screening',
  SHORTLISTED = 'Shortlisted',
  REJECTED = 'Rejected',
  HIRED = 'Hired',
}

@Schema({ timestamps: true })
export class Application {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  candidateId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Job', required: true })
  jobId: Types.ObjectId;

  @Prop({ default: ApplicationStatus.APPLIED, enum: ApplicationStatus })
  status: ApplicationStatus;
}

export const ApplicationSchema = SchemaFactory.createForClass(Application);

// Prevent duplicate applications
ApplicationSchema.index({ candidateId: 1, jobId: 1 }, { unique: true });
