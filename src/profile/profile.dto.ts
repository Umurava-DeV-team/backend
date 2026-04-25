import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { LanguageProficiency, SkillLevel, SkillType } from './profile.schema';

// ── Basic Info ────────────────────────────────────────────────────────────────
export class UpdateBasicInfoDto {
  @ApiPropertyOptional({ example: 'Jane' })
  @IsString() @IsOptional() firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsString() @IsOptional() lastName?: string;

  @ApiPropertyOptional({ example: 'Full Stack Engineer' })
  @IsString() @IsOptional() headline?: string;

  @ApiPropertyOptional({ example: 'Kigali, Rwanda' })
  @IsString() @IsOptional() location?: string;

  @ApiPropertyOptional({ example: 'Passionate engineer...' })
  @IsString() @IsOptional() bio?: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/avatar.jpg' })
  @IsString() @IsOptional() avatarUrl?: string;
}

// ── Skills & Languages ────────────────────────────────────────────────────────
export class AddSkillDto {
  @ApiProperty({ enum: SkillType, example: SkillType.TECHNICAL })
  @IsEnum(SkillType) type: SkillType;

  @ApiProperty({ example: 'Node.js' })
  @IsString() @IsNotEmpty() name: string;

  @ApiPropertyOptional({ enum: SkillLevel, example: SkillLevel.EXPERT })
  @IsEnum(SkillLevel) @IsOptional() level?: SkillLevel;

  @ApiPropertyOptional({ enum: LanguageProficiency, example: LanguageProficiency.FLUENT })
  @IsEnum(LanguageProficiency) @IsOptional() proficiency?: LanguageProficiency;

  @ApiPropertyOptional({ example: 3 })
  @Type(() => Number) @IsNumber() @IsOptional() yearsOfExperience?: number;
}
export class UpdateSkillDto extends PartialType(AddSkillDto) {}

// ── Work Experience ───────────────────────────────────────────────────────────
export class AddWorkExperienceDto {
  @ApiProperty({ example: 'Backend Engineer' })
  @IsString() @IsNotEmpty() role: string;

  @ApiProperty({ example: 'TechCorp Africa' })
  @IsString() @IsNotEmpty() companyName: string;

  @ApiProperty({ example: '2022-01' })
  @IsString() @IsNotEmpty() startDate: string;

  @ApiPropertyOptional({ example: '2024-03' })
  @IsString() @IsOptional() endDate?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean() @IsOptional() currentlyWorkHere?: boolean;

  @ApiPropertyOptional({ example: 'Is Current' })
  @IsString() @IsOptional() status?: string;

  @ApiPropertyOptional({ example: 'Built and scaled microservices...' })
  @IsString() @IsOptional() description?: string;

  @ApiPropertyOptional({ example: 'Node.js,PostgreSQL,Docker' })
  @IsString() @IsOptional() technologies?: string;
}
export class UpdateWorkExperienceDto extends PartialType(AddWorkExperienceDto) {}

// ── Education ─────────────────────────────────────────────────────────────────
export class AddEducationDto {
  @ApiProperty({ example: 'University of Technology' })
  @IsString() @IsNotEmpty() institution: string;

  @ApiProperty({ example: "Bachelor's" })
  @IsString() @IsNotEmpty() degree: string;

  @ApiProperty({ example: 'Computer Science' })
  @IsString() @IsNotEmpty() fieldOfStudy: string;

  @ApiProperty({ example: '2018' })
  @IsString() @IsNotEmpty() startYear: string;

  @ApiPropertyOptional({ example: '2022' })
  @IsString() @IsOptional() endYear?: string;
}
export class UpdateEducationDto extends PartialType(AddEducationDto) {}

// ── Certifications ────────────────────────────────────────────────────────────
export class AddCertificationDto {
  @ApiProperty({ example: 'AWS Certified Developer' })
  @IsString() @IsNotEmpty() certificationName: string;

  @ApiProperty({ example: 'Amazon' })
  @IsString() @IsNotEmpty() issuingOrganization: string;

  @ApiProperty({ example: '2023-01' })
  @IsString() @IsNotEmpty() issueDate: string;
}
export class UpdateCertificationDto extends PartialType(AddCertificationDto) {}

// ── Projects ──────────────────────────────────────────────────────────────────
export class AddProjectDto {
  @ApiProperty({ example: 'AI Recruitment System' })
  @IsString() @IsNotEmpty() projectName: string;

  @ApiProperty({ example: 'Backend Engineer' })
  @IsString() @IsNotEmpty() role: string;

  @ApiPropertyOptional({ example: 'https://github.com/user/project' })
  @IsString() @IsOptional() link?: string;

  @ApiPropertyOptional({ example: '2023-01' })
  @IsString() @IsOptional() startDate?: string;

  @ApiPropertyOptional({ example: '2023-06' })
  @IsString() @IsOptional() endDate?: string;

  @ApiPropertyOptional({ example: 'AI-powered candidate screening platform...' })
  @IsString() @IsOptional() description?: string;

  @ApiPropertyOptional({ example: 'Next.js,Node.js,Gemini API' })
  @IsString() @IsOptional() technologies?: string;
}
export class UpdateProjectDto extends PartialType(AddProjectDto) {}

// ── Availability ──────────────────────────────────────────────────────────────
import { AvailabilityStatus, EmploymentType } from './profile.schema';

export class UpdateAvailabilityDto {
  @ApiProperty({ enum: AvailabilityStatus, example: AvailabilityStatus.AVAILABLE })
  @IsEnum(AvailabilityStatus) currentStatus: AvailabilityStatus;

  @ApiProperty({ enum: EmploymentType, example: EmploymentType.FULL_TIME })
  @IsEnum(EmploymentType) employmentType: EmploymentType;

  @ApiPropertyOptional({ example: '2024-06-01' })
  @IsString() @IsOptional() availableStartDate?: string;
}

// ── Social Links ──────────────────────────────────────────────────────────────
export class UpdateSocialLinksDto {
  @ApiPropertyOptional({ example: 'https://linkedin.com/in/username' })
  @IsString() @IsOptional() linkedin?: string;

  @ApiPropertyOptional({ example: 'https://github.com/username' })
  @IsString() @IsOptional() github?: string;

  @ApiPropertyOptional({ example: 'https://myportfolio.com' })
  @IsString() @IsOptional() personalPortfolio?: string;
}

// ── Security (Change Password) ────────────────────────────────────────────────
export class ChangePasswordDto {
  @ApiProperty({ example: 'oldpassword123' })
  @IsString() @IsNotEmpty() currentPassword: string;

  @ApiProperty({ example: 'newpassword123', minLength: 8 })
  @IsString() @MinLength(8) newPassword: string;
}
