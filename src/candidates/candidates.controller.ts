import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');
import { CreateCandidateDto, UpdateCandidateDto } from './candidate.dto';
import { CandidatesService } from './candidates.service';

@ApiTags('Candidates')
@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Post()
  @ApiOperation({ summary: 'Add a candidate manually (with optional PDF resume)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        skills: { type: 'string', description: 'Comma-separated skills' },
        experience: { type: 'string' },
        education: { type: 'string' },
        summary: { type: 'string' },
        jobId: { type: 'string' },
        resume: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('resume', { storage: memoryStorage() }))
  async create(
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    try {
      console.log('Creating candidate with body:', body);
      let resumeText: string | undefined;
      if (file) {
        try {
          const parsed = await pdfParse(file.buffer);
          resumeText = parsed.text;
        } catch (pdfErr) {
          console.error('PDF Parse Error:', pdfErr);
          // If PDF fails, we still want to save the candidate data
          resumeText = '';
        }
      }

      const skillsStr = body.skills || '';
      const skills = typeof skillsStr === 'string' 
        ? skillsStr.split(',').map((s: string) => s.trim()).filter(Boolean)
        : Array.isArray(skillsStr) ? skillsStr : [];

      const dto: CreateCandidateDto = {
        name: body.name,
        email: body.email,
        currentRole: body.currentRole || '',
        location: body.location || '',
        phone: body.phone || '',
        skills,
        experience: body.experience || '',
        education: body.education || '',
        summary: body.summary || '',
        jobId: body.jobId,
      };

      return await this.candidatesService.create(dto, resumeText);
    } catch (error) {
      console.error('Candidate creation error:', error);
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'List candidates, optionally filter by jobId' })
  findAll(@Query('jobId') jobId?: string) {
    if (jobId) return this.candidatesService.findByJob(jobId);
    return this.candidatesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a candidate by ID' })
  findOne(@Param('id') id: string) {
    return this.candidatesService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a candidate' })
  async delete(@Param('id') id: string) {
    await this.candidatesService.delete(id);
    return { message: 'Candidate deleted' };
  }
}
