import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateCandidateDto, UpdateCandidateDto } from './candidate.dto';
import { Candidate, CandidateDocument } from './candidate.schema';

import { ProfileService } from '../profile/profile.service';
import { ApplicationsService } from '../applications/applications.service';

@Injectable()
export class CandidatesService {
  constructor(
    @InjectModel(Candidate.name) private candidateModel: Model<CandidateDocument>,
    private readonly profileService: ProfileService,
    private readonly applicationsService: ApplicationsService,
  ) {}


  async create(dto: CreateCandidateDto, resumeText?: string): Promise<CandidateDocument> {
    const candidate = new this.candidateModel({
      ...dto,
      jobId: dto.jobId ? new Types.ObjectId(dto.jobId) : undefined,
      resumeText: resumeText ?? '',
    });
    return candidate.save();
  }

  async findByJob(jobId: string): Promise<any[]> {
    const manual = await this.candidateModel.find({ jobId: new Types.ObjectId(jobId) }).sort({ createdAt: -1 });
    // Aggregating portal applicants is handled by ScreeningService/ApplicationsService for specific jobs
    return manual;
  }

  async findOne(id: string): Promise<any> {
    const candidate = await this.candidateModel.findById(id);
    if (!candidate) {
      // Try profile if not found in manual
      try {
        const profile = await this.profileService.getProfile(id); // assuming id is userId
        return {
          _id: profile.userId,
          name: `${profile.firstName} ${profile.lastName}`,
          email: profile.email,
          skills: profile.skills.map(s => s.name),
          currentRole: profile.headline,
          location: profile.location,
        };
      } catch (e) {
        throw new NotFoundException(`Talent ${id} not found`);
      }
    }
    return candidate;
  }

  async update(id: string, dto: UpdateCandidateDto): Promise<CandidateDocument> {
    const candidate = await this.candidateModel.findByIdAndUpdate(id, dto, { new: true });
    if (!candidate) throw new NotFoundException(`Candidate ${id} not found`);
    return candidate;
  }

  async findAll(): Promise<any[]> {
    const manual = await this.candidateModel.find().sort({ createdAt: -1 }).lean();
    const profiles = await this.profileService.findAll();
    
    const portalTalents = await Promise.all(profiles.map(async p => {
      console.log(`[CandidatesService] Mapping portal talent: name=${p.firstName} ${p.lastName}, userId=${p.userId}`);
      const apps = await this.applicationsService.getMyApplications(p.userId.toString());
      console.log(`[CandidatesService] Found ${apps.length} applications for userId=${p.userId}`);
      const jobTitles = apps.map(a => (a.jobId as any)?.title).filter(Boolean);


      return {
        _id: p.userId,
        name: `${p.firstName} ${p.lastName}`,
        email: p.email,
        skills: p.skills.map(s => s.name),
        currentRole: p.headline,
        location: p.location,
        experience: p.workExperience.map(e => `${e.role} at ${e.companyName}`).join(', '),
        education: p.education.map(e => `${e.degree} from ${e.institution}`).join(', '),
        summary: p.bio || p.headline,
        isPortalUser: true,
        jobApplied: jobTitles.length > 0 ? jobTitles.join(', ') : 'Not Applied'
      };
    }));

    console.log(`[CandidatesService] Final list prepared. Total portal talents: ${portalTalents.length}`);

    return [...manual, ...portalTalents];

  }

  async delete(id: string): Promise<void> {
    const manual = await this.candidateModel.findById(id);
    if (manual) {
      await this.candidateModel.findByIdAndDelete(id);
      return;
    }

    // Check if it's a portal user (User model)
    try {
      const profile = await this.profileService.getProfile(id);
      if (profile) {
        // We don't delete portal users from the global system via this endpoint
        // For now, we'll just ignore or could return a specific message
        return; 
      }
    } catch (e) {
      // Not a portal user either
    }

    throw new NotFoundException(`Candidate ${id} not found`);
  }
}
