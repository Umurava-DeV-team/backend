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
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  candidateId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Candidate', required: false })
  talentId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Job', required: true })
  jobId: Types.ObjectId;

  @Prop({ default: AssessmentStatus.IN_PROGRESS, enum: AssessmentStatus })
  status: AssessmentStatus;

  @Prop({
    type: [{
      text: String,
      options: [String],
      correctAnswer: String,
    }],
    default: [],
  })
  questions: any[];

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

  @Prop({ default: 30 })
  timeLimitPerQuestion: number;

  @Prop({ default: 0 })
  score: number;

  @Prop({ default: 0 })
  correctAnswersCount: number;

  @Prop({ default: 0 })
  totalQuestionsCount: number;

  @Prop({ default: 0 })
  sessionIntegrity: number;

}

export const AssessmentSchema = SchemaFactory.createForClass(Assessment);
