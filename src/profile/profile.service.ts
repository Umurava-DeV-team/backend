import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Profile, ProfileDocument } from './profile.schema';
import { User, UserDocument } from '../auth/user.schema';
import {
  AddCertificationDto,
  AddEducationDto,
  AddProjectDto,
  AddSkillDto,
  AddWorkExperienceDto,
  ChangePasswordDto,
  UpdateAvailabilityDto,
  UpdateBasicInfoDto,
  UpdateCertificationDto,
  UpdateEducationDto,
  UpdateProjectDto,
  UpdateSkillDto,
  UpdateSocialLinksDto,
  UpdateWorkExperienceDto,
} from './profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  private uid(userId: string) {
    return new Types.ObjectId(userId);
  }

  private async getOrCreate(userId: string): Promise<ProfileDocument> {
    let profile = await this.profileModel.findOne({ userId: this.uid(userId) });
    if (!profile) profile = await this.profileModel.create({ userId: this.uid(userId) });
    return profile;
  }

  // ── Basic Info ──────────────────────────────────────────────────────────────
  async getProfile(userId: string): Promise<ProfileDocument> {
    return this.getOrCreate(userId);
  }

  async updateBasicInfo(userId: string, dto: UpdateBasicInfoDto): Promise<ProfileDocument> {
    return this.profileModel.findOneAndUpdate(
      { userId: this.uid(userId) },
      { $set: dto },
      { new: true, upsert: true },
    );
  }

  // ── Skills & Languages ──────────────────────────────────────────────────────
  async addSkill(userId: string, dto: AddSkillDto): Promise<ProfileDocument> {
    const profile = await this.getOrCreate(userId);
    profile.skills.push({ ...dto, _id: new Types.ObjectId() });
    return profile.save();
  }

  async updateSkill(userId: string, skillId: string, dto: UpdateSkillDto): Promise<ProfileDocument> {
    const profile = await this.profileModel.findOne({ userId: this.uid(userId) });
    if (!profile) throw new NotFoundException('Profile not found');
    const item = profile.skills.find((s) => s._id?.toString() === skillId);
    if (!item) throw new NotFoundException('Skill not found');
    Object.assign(item, dto);
    return profile.save();
  }

  async deleteSkill(userId: string, skillId: string): Promise<ProfileDocument> {
    const profile = await this.profileModel.findOne({ userId: this.uid(userId) });
    if (!profile) throw new NotFoundException('Profile not found');
    profile.skills = profile.skills.filter((s) => s._id?.toString() !== skillId);
    return profile.save();
  }

  // ── Work Experience ─────────────────────────────────────────────────────────
  private parseTech(tech?: string): string[] {
    return tech ? tech.split(',').map((t) => t.trim()).filter(Boolean) : [];
  }

  async addWorkExperience(userId: string, dto: AddWorkExperienceDto): Promise<ProfileDocument> {
    const profile = await this.getOrCreate(userId);
    profile.workExperience.push({
      ...dto,
      technologies: this.parseTech(dto.technologies),
      currentlyWorkHere: dto.currentlyWorkHere ?? false,
      _id: new Types.ObjectId(),
    });
    return profile.save();
  }

  async updateWorkExperience(userId: string, expId: string, dto: UpdateWorkExperienceDto): Promise<ProfileDocument> {
    const profile = await this.profileModel.findOne({ userId: this.uid(userId) });
    if (!profile) throw new NotFoundException('Profile not found');
    const item = profile.workExperience.find((e) => e._id?.toString() === expId);
    if (!item) throw new NotFoundException('Work experience not found');
    if (dto.technologies !== undefined) {
      item.technologies = this.parseTech(dto.technologies);
      delete dto.technologies;
    }
    Object.assign(item, dto);
    return profile.save();
  }

  async deleteWorkExperience(userId: string, expId: string): Promise<ProfileDocument> {
    const profile = await this.profileModel.findOne({ userId: this.uid(userId) });
    if (!profile) throw new NotFoundException('Profile not found');
    profile.workExperience = profile.workExperience.filter((e) => e._id?.toString() !== expId);
    return profile.save();
  }

  // ── Education ───────────────────────────────────────────────────────────────
  async addEducation(userId: string, dto: AddEducationDto): Promise<ProfileDocument> {
    const profile = await this.getOrCreate(userId);
    profile.education.push({ ...dto, _id: new Types.ObjectId() });
    return profile.save();
  }

  async updateEducation(userId: string, eduId: string, dto: UpdateEducationDto): Promise<ProfileDocument> {
    const profile = await this.profileModel.findOne({ userId: this.uid(userId) });
    if (!profile) throw new NotFoundException('Profile not found');
    const item = profile.education.find((e) => e._id?.toString() === eduId);
    if (!item) throw new NotFoundException('Education not found');
    Object.assign(item, dto);
    return profile.save();
  }

  async deleteEducation(userId: string, eduId: string): Promise<ProfileDocument> {
    const profile = await this.profileModel.findOne({ userId: this.uid(userId) });
    if (!profile) throw new NotFoundException('Profile not found');
    profile.education = profile.education.filter((e) => e._id?.toString() !== eduId);
    return profile.save();
  }

  // ── Certifications ──────────────────────────────────────────────────────────
  async addCertification(userId: string, dto: AddCertificationDto): Promise<ProfileDocument> {
    const profile = await this.getOrCreate(userId);
    profile.certifications.push({ ...dto, _id: new Types.ObjectId() });
    return profile.save();
  }

  async updateCertification(userId: string, certId: string, dto: UpdateCertificationDto): Promise<ProfileDocument> {
    const profile = await this.profileModel.findOne({ userId: this.uid(userId) });
    if (!profile) throw new NotFoundException('Profile not found');
    const item = profile.certifications.find((c) => c._id?.toString() === certId);
    if (!item) throw new NotFoundException('Certification not found');
    Object.assign(item, dto);
    return profile.save();
  }

  async deleteCertification(userId: string, certId: string): Promise<ProfileDocument> {
    const profile = await this.profileModel.findOne({ userId: this.uid(userId) });
    if (!profile) throw new NotFoundException('Profile not found');
    profile.certifications = profile.certifications.filter((c) => c._id?.toString() !== certId);
    return profile.save();
  }

  // ── Projects ────────────────────────────────────────────────────────────────
  async addProject(userId: string, dto: AddProjectDto): Promise<ProfileDocument> {
    const profile = await this.getOrCreate(userId);
    profile.projects.push({
      ...dto,
      technologies: this.parseTech(dto.technologies),
      _id: new Types.ObjectId(),
    });
    return profile.save();
  }

  async updateProject(userId: string, projectId: string, dto: UpdateProjectDto): Promise<ProfileDocument> {
    const profile = await this.profileModel.findOne({ userId: this.uid(userId) });
    if (!profile) throw new NotFoundException('Profile not found');
    const item = profile.projects.find((p) => p._id?.toString() === projectId);
    if (!item) throw new NotFoundException('Project not found');
    if (dto.technologies !== undefined) {
      item.technologies = this.parseTech(dto.technologies);
      delete dto.technologies;
    }
    Object.assign(item, dto);
    return profile.save();
  }

  async deleteProject(userId: string, projectId: string): Promise<ProfileDocument> {
    const profile = await this.profileModel.findOne({ userId: this.uid(userId) });
    if (!profile) throw new NotFoundException('Profile not found');
    profile.projects = profile.projects.filter((p) => p._id?.toString() !== projectId);
    return profile.save();
  }

  // ── Availability ────────────────────────────────────────────────────────────
  async updateAvailability(userId: string, dto: UpdateAvailabilityDto): Promise<ProfileDocument> {
    return this.profileModel.findOneAndUpdate(
      { userId: this.uid(userId) },
      {
        $set: {
          availabilityStatus: dto.currentStatus,
          employmentType: dto.employmentType,
          availableStartDate: dto.availableStartDate ?? '',
        },
      },
      { new: true, upsert: true },
    );
  }

  // ── Social Links ────────────────────────────────────────────────────────────
  async updateSocialLinks(userId: string, dto: UpdateSocialLinksDto): Promise<ProfileDocument> {
    return this.profileModel.findOneAndUpdate(
      { userId: this.uid(userId) },
      { $set: dto },
      { new: true, upsert: true },
    );
  }

  // ── Change Password ─────────────────────────────────────────────────────────
  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');
    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await user.save();
    return { message: 'Password updated successfully' };
  }
}
