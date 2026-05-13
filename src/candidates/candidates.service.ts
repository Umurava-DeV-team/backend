import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCandidateDto, UpdateCandidateDto } from './candidate.dto';
import { Candidate } from '../entities/candidate.entity';
import { Application } from '../entities/application.entity';
import { Profile } from '../entities/profile.entity';

@Injectable()
export class CandidatesService {
  constructor(
    @InjectRepository(Candidate)
    private candidateRepo: Repository<Candidate>,
    @InjectRepository(Application)
    private applicationRepo: Repository<Application>,
    @InjectRepository(Profile)
    private profileRepo: Repository<Profile>,
  ) { }

  async create(dto: CreateCandidateDto, resumeText?: string): Promise<Candidate> {
    const candidate = this.candidateRepo.create({
      ...dto,
      resumeText: resumeText ?? '',
    });
    return await this.candidateRepo.save(candidate);
  }

  async findByJob(jobId: string): Promise<Candidate[]> {
    return await this.candidateRepo.find({
      where: { jobId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<any> {
    // 1. Try manual candidate repo
    const candidate = await this.candidateRepo.findOne({ where: { id }, relations: ['job'] });
    if (candidate) {
      return {
        _id: candidate.id,
        name: candidate.name,
        email: candidate.email,
        currentRole: candidate.role || 'N/A',
        location: candidate.location || 'Remote',
        skills: candidate.skills || [],
        experience: candidate.experience || '',
        education: candidate.education || '',
        summary: candidate.summary || '',
        jobApplied: candidate.job?.title || 'Manual Entry',
        source: 'manual',
      };
    }

    // 2. Try application repo or profile repo (portal users)
    const profile = await this.profileRepo.findOne({ where: { userId: id } });
    const application = await this.applicationRepo.findOne({
      where: { candidateId: id },
      relations: ['job', 'candidate'],
    });

    if (profile || application) {
      const user = application?.candidate;
      return {
        _id: id,
        name: profile ? `${profile.firstName} ${profile.lastName}` : user?.name || 'Unknown',
        email: profile?.email || user?.email || '',
        currentRole: profile?.headline || 'Portal Applicant',
        location: profile?.location || 'Remote',
        skills: profile?.skills?.map(s => s.name) || [],
        experience: profile?.workExperience?.map(e => `${e.role} at ${e.companyName}`).join(', ') || '',
        education: profile?.education?.map(e => `${e.degree} from ${e.institution}`).join(', ') || '',
        summary: profile?.bio || '',
        jobApplied: application?.job?.title || 'Portal Interest',
        source: 'portal',
      };
    }

    throw new NotFoundException(`Talent ${id} not found`);
  }

  async update(id: string, dto: UpdateCandidateDto): Promise<Candidate> {
    const candidate = await this.candidateRepo.findOne({ where: { id } });
    if (!candidate) throw new NotFoundException(`Candidate ${id} not found`);

    Object.assign(candidate, dto);
    return await this.candidateRepo.save(candidate);
  }

  async findAll(): Promise<any[]> {
    // 1. Get manual candidates
    const manualCandidates = await this.candidateRepo.find({
      order: { createdAt: 'DESC' },
      relations: ['job'],
    });

    // 2. Get portal applicants
    const applications = await this.applicationRepo.find({
      relations: ['job', 'candidate'],
      order: { appliedAt: 'DESC' },
    });

    // 3. Get profiles for applicants
    const applicantUserIds = applications.map(app => app.candidateId);
    const profiles = await this.profileRepo.find({
      where: applicantUserIds.map(userId => ({ userId })),
    });

    // 4. Transform manual candidates to unified format
    const manualCandidatesFormatted = manualCandidates.map(c => ({
      _id: c.id,
      name: c.name,
      email: c.email,
      currentRole: c.role || 'N/A',
      location: c.location || 'Remote',
      skills: c.skills || [],
      experience: c.experience || '',
      education: c.education || '',
      summary: c.summary || '',
      jobApplied: c.job?.title || 'Manual Entry',
      jobId: c.jobId,
      source: 'manual',
      createdAt: c.createdAt,
    }));

    // 5. Transform portal applicants to unified format
    const portalApplicantsFormatted = applications.map(app => {
      const profile = profiles.find(p => p.userId === app.candidateId);
      const user = app.candidate;

      return {
        _id: app.id,
        name: profile ? `${profile.firstName} ${profile.lastName}` : user?.name || 'Unknown',
        email: profile?.email || user?.email || '',
        currentRole: profile?.headline || 'Portal Applicant',
        location: profile?.location || 'Remote',
        skills: profile?.skills?.map(s => s.name) || [],
        experience: profile?.workExperience?.map(e => `${e.role} at ${e.companyName}`).join(', ') || '',
        education: profile?.education?.map(e => `${e.degree} from ${e.institution}`).join(', ') || '',
        summary: profile?.bio || '',
        jobApplied: app.job?.title || 'Unknown Job',
        jobId: app.jobId,
        source: 'portal',
        applicationStatus: app.status,
        createdAt: app.appliedAt,
      };
    });

    // 6. Merge and return
    return [...portalApplicantsFormatted, ...manualCandidatesFormatted];
  }

  async delete(id: string): Promise<void> {
    const result = await this.candidateRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Candidate ${id} not found`);
    }
  }
}
