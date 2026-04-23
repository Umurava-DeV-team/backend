import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AssessmentDocument = Assessment & Document;

export enum AssessmentStatus {
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
}

export class AssessmentAnswer {
  question: string;
  answer: string;
  stepNumber: number;
}

@Schema({ timestamps: true })
export class Assessment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  candidateId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Job', required: true })
  jobId: Types.ObjectId;

  @Prop({ default: AssessmentStatus.IN_PROGRESS, enum: AssessmentStatus })
  status: AssessmentStatus;

  @Prop({
    type: [{
      question: String,
      answer: String,
      stepNumber: Number,
    }],
    default: [],
  })
  answers: AssessmentAnswer[];

  @Prop({ default: 0 })
  timeTakenMinutes: number;

  @Prop({ default: 'Verified Secure' })
  sessionStatus: string;

  @Prop({ default: 0 })
  sessionIntegrity: number;
}

export const AssessmentSchema = SchemaFactory.createForClass(Assessment);
