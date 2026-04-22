import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ExperienceLevel } from './job.schema';

export class CreateJobDto {
  @ApiProperty({ example: 'Backend Engineer' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Engineering' })
  @IsString()
  @IsNotEmpty()
  department: string;

  @ApiProperty({ enum: ExperienceLevel, example: ExperienceLevel.SENIOR })
  @IsEnum(ExperienceLevel)
  experienceLevel: ExperienceLevel;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsNumber()
  applicantsTarget: number;

  @ApiProperty({ example: 'Kigali, Rwanda' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({ example: '$3000 - $5000' })
  @IsString()
  @IsNotEmpty()
  salaryRange: string;

  @ApiPropertyOptional({ example: 'We are looking for...' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/jd.pdf' })
  @IsString()
  @IsOptional()
  descriptionFileUrl?: string;
}

export class UpdateJobDto extends PartialType(CreateJobDto) {}
