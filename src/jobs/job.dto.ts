import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreateJobDto {
  @ApiProperty({ example: 'Senior Backend Engineer' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'We are looking for a senior backend engineer...' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: ['Node.js', 'PostgreSQL', 'Docker'] })
  @IsArray()
  @IsOptional()
  requiredSkills?: string[];

  @ApiPropertyOptional({ example: '3+ years of backend development' })
  @IsString()
  @IsOptional()
  experienceRequired?: string;

  @ApiPropertyOptional({ example: "Bachelor's in Computer Science" })
  @IsString()
  @IsOptional()
  educationRequired?: string;

  @ApiPropertyOptional({ example: 'Kigali, Rwanda' })
  @IsString()
  @IsOptional()
  location?: string;
}
