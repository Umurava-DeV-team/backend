import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Assessment, AssessmentDocument, AssessmentStatus } from './assessment.schema';

@Injectable()
export class AssessmentsService {
  constructor(@InjectModel(Assessment.name) private assessmentModel: Model<AssessmentDocument>) {}

  async startAssessment(candidateId: string, jobId: string): Promise<AssessmentDocument> {
    return this.assessmentModel.create({
      candidateId: new Types.ObjectId(candidateId),
      jobId: new Types.ObjectId(jobId),
    });
  }

  async submitAnswer(
    assessmentId: string,
    question: string,
    answer: string,
    stepNumber: number,
  ): Promise<AssessmentDocument> {
    const assessment = await this.assessmentModel.findById(assessmentId);
    if (!assessment) throw new NotFoundException('Assessment not found');
    assessment.answers.push({ question, answer, stepNumber });
    return assessment.save();
  }

  async submitAssessment(
    assessmentId: string,
    timeTakenMinutes: number,
  ): Promise<AssessmentDocument> {
    const assessment = await this.assessmentModel.findByIdAndUpdate(
      assessmentId,
      { status: AssessmentStatus.SUBMITTED, timeTakenMinutes },
      { new: true },
    );
    if (!assessment) throw new NotFoundException('Assessment not found');
    return assessment;
  }

  async getMyAssessments(candidateId: string): Promise<AssessmentDocument[]> {
    return this.assessmentModel
      .find({ candidateId: new Types.ObjectId(candidateId) })
      .populate('jobId')
      .sort({ createdAt: -1 });
  }

  async getAssessment(assessmentId: string): Promise<AssessmentDocument> {
    const assessment = await this.assessmentModel.findById(assessmentId).populate('jobId');
    if (!assessment) throw new NotFoundException('Assessment not found');
    return assessment;
  }
}
