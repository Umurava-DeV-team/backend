import { Controller, Get, Post, Patch, Body, Req, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Profile')
@Controller('profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProfileController {
  constructor(private readonly profileService: ProfileService) { }

  @Get()
  @ApiOperation({ summary: 'Get my profile' })
  async getProfile(@Request() req: any) {
    const userId = req.user.id;
    return await this.profileService.getOrCreateProfile(userId);
  }

  @Patch('basic-info')
  @ApiOperation({ summary: 'Update basic info' })
  async updateBasicInfo(@Request() req: any, @Body() dto: any) {
    const userId = req.user.id;
    return await this.profileService.updateBasicInfo(userId, dto);
  }

  @Post('skills')
  @ApiOperation({ summary: 'Add skill' })
  async addSkill(@Request() req: any, @Body() dto: any) {
    const userId = req.user.id;
    return await this.profileService.addSkill(userId, dto);
  }

  @Post('work-experience')
  @ApiOperation({ summary: 'Add work experience' })
  async addWorkExperience(@Request() req: any, @Body() dto: any) {
    const userId = req.user.id;
    return await this.profileService.addWorkExperience(userId, dto);
  }

  @Post('education')
  @ApiOperation({ summary: 'Add education' })
  async addEducation(@Request() req: any, @Body() dto: any) {
    const userId = req.user.id;
    return await this.profileService.addEducation(userId, dto);
  }

  @Post('certifications')
  @ApiOperation({ summary: 'Add certification' })
  async addCertification(@Request() req: any, @Body() dto: any) {
    const userId = req.user.id;
    return await this.profileService.addCertification(userId, dto);
  }

  @Post('projects')
  @ApiOperation({ summary: 'Add project' })
  async addProject(@Request() req: any, @Body() dto: any) {
    const userId = req.user.id;
    return await this.profileService.addProject(userId, dto);
  }

  @Patch('availability')
  @ApiOperation({ summary: 'Update availability' })
  async updateAvailability(@Request() req: any, @Body() dto: any) {
    const userId = req.user.id;
    return await this.profileService.updateAvailability(userId, dto);
  }

  @Post('resume')
  @ApiOperation({ summary: 'Upload resume' })
  async uploadResume(@Request() req: any, @Body() dto: any) {
    const userId = req.user.id;
    // TODO: Handle file upload
    return await this.profileService.getOrCreateProfile(userId);
  }

  @Patch('social-links')
  @ApiOperation({ summary: 'Update social links' })
  async updateSocialLinks(@Request() req: any, @Body() dto: any) {
    const userId = req.user.id;
    return await this.profileService.updateSocialLinks(userId, dto);
  }
}
