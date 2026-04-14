import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEmail, IsArray } from 'class-validator';

export class CreateCandidateDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+250788000000' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: ['Node.js', 'React', 'PostgreSQL'] })
  @IsArray()
  @IsOptional()
  skills?: string[];

  @ApiPropertyOptional({ example: '5 years of full-stack development' })
  @IsString()
  @IsOptional()
  experience?: string;

  @ApiPropertyOptional({ example: "Bachelor's in Software Engineering" })
  @IsString()
  @IsOptional()
  education?: string;

  @ApiPropertyOptional({ example: 'Experienced developer with a passion for clean code...' })
  @IsString()
  @IsOptional()
  summary?: string;

  @ApiProperty({ example: 'job-uuid-here' })
  @IsString()
  @IsNotEmpty()
  jobId: string;
}
