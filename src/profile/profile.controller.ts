import { Body, Controller, Delete, Get, Param, Patch, Post, Request, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
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
import { ProfileService } from './profile.service';

@ApiTags('Profile')
@Controller('profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  // ── Basic Info ──────────────────────────────────────────────────────────────
  @Get()
  @ApiOperation({ summary: 'Get full talent profile' })
  getProfile(@Request() req: any) {
    return this.profileService.getProfile(req.user.id);
  }

  @Patch('basic-info')
  @ApiOperation({ summary: 'Save basic info' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('avatar', { storage: memoryStorage() }))
  updateBasicInfo(@Request() req: any, @Body() dto: UpdateBasicInfoDto, @UploadedFile() _avatar?: Express.Multer.File) {
    return this.profileService.updateBasicInfo(req.user.id, dto);
  }

  // ── Skills & Languages ──────────────────────────────────────────────────────
  @Post('skills')
  @ApiOperation({ summary: 'Add a skill or language' })
  addSkill(@Request() req: any, @Body() dto: AddSkillDto) {
    return this.profileService.addSkill(req.user.id, dto);
  }

  @Patch('skills/:skillId')
  @ApiOperation({ summary: 'Update a skill or language' })
  updateSkill(@Request() req: any, @Param('skillId') skillId: string, @Body() dto: UpdateSkillDto) {
    return this.profileService.updateSkill(req.user.id, skillId, dto);
  }

  @Delete('skills/:skillId')
  @ApiOperation({ summary: 'Delete a skill or language' })
  deleteSkill(@Request() req: any, @Param('skillId') skillId: string) {
    return this.profileService.deleteSkill(req.user.id, skillId);
  }

  // ── Work Experience ─────────────────────────────────────────────────────────
  @Post('work-experience')
  @ApiOperation({ summary: 'Add a work experience entry' })
  addWorkExperience(@Request() req: any, @Body() dto: AddWorkExperienceDto) {
    return this.profileService.addWorkExperience(req.user.id, dto);
  }

  @Patch('work-experience/:expId')
  @ApiOperation({ summary: 'Update a work experience entry' })
  updateWorkExperience(@Request() req: any, @Param('expId') expId: string, @Body() dto: UpdateWorkExperienceDto) {
    return this.profileService.updateWorkExperience(req.user.id, expId, dto);
  }

  @Delete('work-experience/:expId')
  @ApiOperation({ summary: 'Delete a work experience entry' })
  deleteWorkExperience(@Request() req: any, @Param('expId') expId: string) {
    return this.profileService.deleteWorkExperience(req.user.id, expId);
  }

  // ── Education ───────────────────────────────────────────────────────────────
  @Post('education')
  @ApiOperation({ summary: 'Add an education entry' })
  addEducation(@Request() req: any, @Body() dto: AddEducationDto) {
    return this.profileService.addEducation(req.user.id, dto);
  }

  @Patch('education/:eduId')
  @ApiOperation({ summary: 'Update an education entry' })
  updateEducation(@Request() req: any, @Param('eduId') eduId: string, @Body() dto: UpdateEducationDto) {
    return this.profileService.updateEducation(req.user.id, eduId, dto);
  }

  @Delete('education/:eduId')
  @ApiOperation({ summary: 'Delete an education entry' })
  deleteEducation(@Request() req: any, @Param('eduId') eduId: string) {
    return this.profileService.deleteEducation(req.user.id, eduId);
  }

  // ── Certifications ──────────────────────────────────────────────────────────
  @Post('certifications')
  @ApiOperation({ summary: 'Add a certification' })
  addCertification(@Request() req: any, @Body() dto: AddCertificationDto) {
    return this.profileService.addCertification(req.user.id, dto);
  }

  @Patch('certifications/:certId')
  @ApiOperation({ summary: 'Update a certification' })
  updateCertification(@Request() req: any, @Param('certId') certId: string, @Body() dto: UpdateCertificationDto) {
    return this.profileService.updateCertification(req.user.id, certId, dto);
  }

  @Delete('certifications/:certId')
  @ApiOperation({ summary: 'Delete a certification' })
  deleteCertification(@Request() req: any, @Param('certId') certId: string) {
    return this.profileService.deleteCertification(req.user.id, certId);
  }

  // ── Projects ────────────────────────────────────────────────────────────────
  @Post('projects')
  @ApiOperation({ summary: 'Add a portfolio project' })
  addProject(@Request() req: any, @Body() dto: AddProjectDto) {
    return this.profileService.addProject(req.user.id, dto);
  }

  @Patch('projects/:projectId')
  @ApiOperation({ summary: 'Update a portfolio project' })
  updateProject(@Request() req: any, @Param('projectId') projectId: string, @Body() dto: UpdateProjectDto) {
    return this.profileService.updateProject(req.user.id, projectId, dto);
  }

  @Delete('projects/:projectId')
  @ApiOperation({ summary: 'Delete a portfolio project' })
  deleteProject(@Request() req: any, @Param('projectId') projectId: string) {
    return this.profileService.deleteProject(req.user.id, projectId);
  }

  // ── Availability ────────────────────────────────────────────────────────────
  @Patch('availability')
  @ApiOperation({ summary: 'Save availability status' })
  updateAvailability(@Request() req: any, @Body() dto: UpdateAvailabilityDto) {
    return this.profileService.updateAvailability(req.user.id, dto);
  }

  // ── Social Links ────────────────────────────────────────────────────────────
  @Patch('social-links')
  @ApiOperation({ summary: 'Save social links' })
  updateSocialLinks(@Request() req: any, @Body() dto: UpdateSocialLinksDto) {
    return this.profileService.updateSocialLinks(req.user.id, dto);
  }

  // ── Security ────────────────────────────────────────────────────────────────
  @Patch('change-password')
  @ApiOperation({ summary: 'Update account password' })
  changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    return this.profileService.changePassword(req.user.id, dto);
  }
}
