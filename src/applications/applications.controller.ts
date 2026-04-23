import { Body, Controller, Get, Param, Post, Patch, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApplicationsService } from './applications.service';
import { ApplicationStatus } from './application.schema';

class ApplyDto {
  @ApiProperty({ example: '664f1a2b3c4d5e6f7a8b9c0d' })
  jobId: string;
}

class UpdateStatusDto {
  @ApiProperty({ enum: ApplicationStatus })
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;
}

@ApiTags('Applications')
@Controller('applications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @ApiOperation({ summary: 'Apply to a job (candidate)' })
  apply(@Request() req: any, @Body() dto: ApplyDto) {
    return this.applicationsService.apply(req.user.id, dto.jobId);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my applications (candidate)' })
  getMyApplications(@Request() req: any) {
    return this.applicationsService.getMyApplications(req.user.id);
  }

  @Get('job/:jobId')
  @ApiOperation({ summary: 'Get all applications for a job (recruiter)' })
  getApplicationsForJob(@Param('jobId') jobId: string) {
    return this.applicationsService.getApplicationsForJob(jobId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update application status (recruiter)' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.applicationsService.updateStatus(id, dto.status);
  }
}
