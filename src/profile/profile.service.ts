import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from '../entities/profile.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private profileRepo: Repository<Profile>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) { }

  async getOrCreateProfile(userId: string): Promise<Profile> {
    let profile = await this.profileRepo.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!profile) {
      // Create profile from user data
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      profile = new Profile();
      profile.userId = userId;
      profile.email = user.email;
      profile.firstName = user.name.split(' ')[0] || '';
      profile.lastName = user.name.split(' ').slice(1).join(' ') || '';
      profile.skills = [];
      profile.workExperience = [];
      profile.education = [];
      profile.certifications = [];
      profile.projects = [];
      profile.socialLinks = {};

      await this.profileRepo.save(profile);
    }

    return profile;
  }

  async updateBasicInfo(userId: string, dto: any): Promise<Profile> {
    const profile = await this.getOrCreateProfile(userId);
    Object.assign(profile, dto);
    return await this.profileRepo.save(profile);
  }

  async addSkill(userId: string, skill: any): Promise<Profile> {
    const profile = await this.getOrCreateProfile(userId);
    profile.skills = [...(profile.skills || []), skill];
    return await this.profileRepo.save(profile);
  }

  async addWorkExperience(userId: string, experience: any): Promise<Profile> {
    const profile = await this.getOrCreateProfile(userId);
    profile.workExperience = [...(profile.workExperience || []), experience];
    return await this.profileRepo.save(profile);
  }

  async addEducation(userId: string, education: any): Promise<Profile> {
    const profile = await this.getOrCreateProfile(userId);
    profile.education = [...(profile.education || []), education];
    return await this.profileRepo.save(profile);
  }

  async addCertification(userId: string, cert: any): Promise<Profile> {
    const profile = await this.getOrCreateProfile(userId);
    profile.certifications = [...(profile.certifications || []), cert];
    return await this.profileRepo.save(profile);
  }

  async addProject(userId: string, project: any): Promise<Profile> {
    const profile = await this.getOrCreateProfile(userId);
    profile.projects = [...(profile.projects || []), project];
    return await this.profileRepo.save(profile);
  }

  async updateAvailability(userId: string, availability: any): Promise<Profile> {
    const profile = await this.getOrCreateProfile(userId);
    if (availability.availability) {
      profile.availability = availability.availability;
    }
    return await this.profileRepo.save(profile);
  }

  async updateSocialLinks(userId: string, links: any): Promise<Profile> {
    const profile = await this.getOrCreateProfile(userId);
    // Merge new links with existing ones
    profile.socialLinks = {
      ...(profile.socialLinks || {}),
      ...links
    };
    return await this.profileRepo.save(profile);
  }

  async findAll(): Promise<Profile[]> {
    return await this.profileRepo.find({ relations: ['user'] });
  }

  async findByUsers(userIds: string[]): Promise<Profile[]> {
    if (!userIds || userIds.length === 0) return [];
    return await this.profileRepo
      .createQueryBuilder('profile')
      .where('profile.userId IN (:...userIds)', { userIds })
      .leftJoinAndSelect('profile.user', 'user')
      .getMany();
  }
}
