import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Assessment, AssessmentDocument, AssessmentStatus } from './assessment.schema';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class AssessmentsService {
  constructor(
    @InjectModel(Assessment.name) private assessmentModel: Model<AssessmentDocument>,
    private notificationsGateway: NotificationsGateway
  ) {}

  async startAssessment(candidateId: string, jobId: string, questions: any[] = [], timeLimitPerQuestion: number = 30): Promise<AssessmentDocument> {
    const existing = await this.assessmentModel.findOne({
      candidateId: new Types.ObjectId(candidateId),

      jobId: new Types.ObjectId(jobId),
    });
    if (existing) return existing;

    return this.assessmentModel.create({
      candidateId: new Types.ObjectId(candidateId),
      jobId: new Types.ObjectId(jobId),
      questions,
      timeLimitPerQuestion
    });
  }

  async startTalentAssessment(targetId: string, jobId: string, questions: any[] = [], timeLimitPerQuestion: number = 30): Promise<AssessmentDocument> {
    const existing = await this.assessmentModel.findOne({
      $or: [
        { talentId: new Types.ObjectId(targetId), jobId: new Types.ObjectId(jobId) },
        { candidateId: new Types.ObjectId(targetId), jobId: new Types.ObjectId(jobId) }
      ]
    });
    if (existing) return existing;

    // Check if targetId is a User or a Candidate
    // We can use the connection to check collection existence
    const isUser = await this.assessmentModel.db.collection('users').findOne({ _id: new Types.ObjectId(targetId) });
    
    console.log(`[AssessmentsService] Starting assessment launch for: ${targetId}`);
    console.log(`  - Target Type: ${isUser ? 'Portal User' : 'Manual Candidate'}`);

    return this.assessmentModel.create({
      candidateId: isUser ? new Types.ObjectId(targetId) : undefined,
      talentId: !isUser ? new Types.ObjectId(targetId) : undefined,
      jobId: new Types.ObjectId(jobId),
      questions,
      timeLimitPerQuestion
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
    const assessment = await this.assessmentModel.findById(assessmentId);
    if (!assessment) throw new NotFoundException('Assessment not found');

    // Calculate Score
    let correct = 0;
    const total = assessment.questions.length;

    assessment.questions.forEach((q, idx) => {
      const stepNum = idx + 1;
      const candidateAns = assessment.answers.find(a => a.stepNumber === stepNum);
      
      console.log(`[AssessmentsService] Scoring Q${stepNum}:`, {
        question: q.text,
        correctAnswer: q.correctAnswer,
        candidateAnswer: candidateAns?.answer || 'MISSING'
      });

      if (candidateAns) {
        const cleanCandidate = candidateAns.answer.trim().toLowerCase();
        const cleanCorrect = q.correctAnswer.trim().toLowerCase();
        
        if (cleanCandidate === cleanCorrect) {
          console.log(`[AssessmentsService] Q${stepNum} MATCHED!`);
          correct++;
        }
      }
    });

    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    console.log(`[AssessmentsService] Final Score: ${correct}/${total} (${score}%)`);


    assessment.status = AssessmentStatus.SUBMITTED;
    assessment.timeTakenMinutes = timeTakenMinutes;
    assessment.score = score;
    assessment.correctAnswersCount = correct;
    assessment.totalQuestionsCount = total;

    return assessment.save();

  }

  async getMyAssessments(userId: string): Promise<AssessmentDocument[]> {
    return this.assessmentModel
      .find({
        $or: [
          { candidateId: new Types.ObjectId(userId) },
          { talentId: new Types.ObjectId(userId) },
        ],
      })
      .populate('jobId')
      .sort({ createdAt: -1 });
  }

  async getAssessment(assessmentId: string): Promise<AssessmentDocument> {
    const assessment = await this.assessmentModel.findById(assessmentId).populate('jobId');
    if (!assessment) throw new NotFoundException('Assessment not found');
    return assessment;
  }

  async findAll(): Promise<any[]> {
    const assessments = await this.assessmentModel
      .find()
      .populate('jobId')
      .lean()
      .sort({ createdAt: -1 });

    const results: any[] = [];
    for (const a of assessments) {
      let name = 'Anonymous Candidate';
      let email = 'No email provided';

      const userId = a.candidateId || a.talentId;
      if (userId) {
        const user = await this.assessmentModel.db.collection('users').findOne({ _id: new Types.ObjectId(userId) });
        if (user) {
          name = user.name;
          email = user.email;
        } else {
          const candidate = await this.assessmentModel.db.collection('candidates').findOne({ _id: new Types.ObjectId(userId) });
          if (candidate) {
            name = candidate.name;
            email = candidate.email;
          }
        }
      }

      results.push({
        ...a,
        verifiedCandidateName: name,
        verifiedCandidateEmail: email
      });
    }

    return results;
  }

  async findByJob(jobId: string): Promise<any[]> {
    const assessments = await this.assessmentModel
      .find({ jobId: new Types.ObjectId(jobId) })
      .lean()
      .sort({ score: -1 });

    const results: any[] = [];
    for (const a of assessments) {
      let name = 'Anonymous Candidate';
      let email = 'No email provided';

      // Check User collection
      const userId = a.candidateId || a.talentId;
      if (userId) {
        const user = await this.assessmentModel.db.collection('users').findOne({ _id: new Types.ObjectId(userId) });
        if (user) {
          name = user.name;
          email = user.email;
        } else {
          // Check Candidate collection
          const candidate = await this.assessmentModel.db.collection('candidates').findOne({ _id: new Types.ObjectId(userId) });
          if (candidate) {
            name = candidate.name;
            email = candidate.email;
          }
        }
      }

      results.push({
        ...a,
        verifiedCandidateName: name,
        verifiedCandidateEmail: email
      });
    }

    console.log(`[AssessmentsService] TRACE: findByJob(${jobId})`);
    console.log(`  - Found ${results.length} results`);
    results.forEach((r, i) => {
      console.log(`  [${i+1}] ID: ${r._id}`);
      console.log(`      Identity: ${r.verifiedCandidateName} <${r.verifiedCandidateEmail}>`);
      console.log(`      Fields: candidateId=${r.candidateId || 'none'}, talentId=${r.talentId || 'none'}`);
    });

    return results;
  }

  async delete(id: string): Promise<void> {
    console.log(`[AssessmentsService] DELETION REQUEST: ${id}`);
    const result = await this.assessmentModel.findByIdAndDelete(id);
    if (!result) {
      console.log(`  - Status: FAILED (Not Found)`);
      throw new NotFoundException('Assessment not found');
    }
    console.log(`  - Status: SUCCESS (Record Removed)`);
    this.notificationsGateway.sendNotification('notification', { message: `Assessment ${id} has been deleted by an administrator.` });
  }
}
