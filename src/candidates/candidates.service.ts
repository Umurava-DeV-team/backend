import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateCandidateDto } from './candidate.dto';
import { Candidate, CandidateDocument } from './candidate.schema';

@Injectable()
export class CandidatesService {
  constructor(@InjectModel(Candidate.name) private candidateModel: Model<CandidateDocument>) {}

  async create(dto: CreateCandidateDto, resumeText?: string): Promise<CandidateDocument> {
    const candidate = new this.candidateModel({
      ...dto,
      jobId: dto.jobId ? new Types.ObjectId(dto.jobId) : undefined,
      resumeText: resumeText ?? '',
    });
    return candidate.save();
  }

  async findByJob(jobId: string): Promise<CandidateDocument[]> {
    return this.candidateModel.find({ jobId: new Types.ObjectId(jobId) }).sort({ createdAt: -1 });
  }

  async findOne(id: string): Promise<CandidateDocument> {
    const candidate = await this.candidateModel.findById(id);
    if (!candidate) throw new NotFoundException(`Candidate ${id} not found`);
    return candidate;
  }

  async findAll(): Promise<CandidateDocument[]> {
    return this.candidateModel.find().sort({ createdAt: -1 });
  }

  async delete(id: string): Promise<void> {
    const result = await this.candidateModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException(`Candidate ${id} not found`);
  }
}
