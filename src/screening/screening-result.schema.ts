import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ScreeningResultDocument = ScreeningResultModel & Document;

@Schema({ _id: false })
export class CandidateScoreEmbed {
  @Prop() candidateId: string;
  @Prop() name: string;
  @Prop() email: string;
  @Prop() matchScore: number;
  @Prop([String]) strengths: string[];
  @Prop([String]) missingSkills: string[];
  @Prop([String]) risks: string[];
  @Prop() summary: string;
}

@Schema({ collection: 'screeningresults', timestamps: true })
export class ScreeningResultModel {
  @Prop({ required: true }) jobId: string;
  @Prop({ required: true }) jobTitle: string;
  @Prop({ required: true }) totalCandidates: number;
  @Prop({ type: [Object], default: [] }) shortlist: CandidateScoreEmbed[];
  @Prop({ default: Date.now }) screenedAt: Date;
}

export const ScreeningResultSchema = SchemaFactory.createForClass(ScreeningResultModel);
