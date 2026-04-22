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
    let resumeText: string | undefined;
    if (file) {
      const parsed = await pdfParse(file.buffer);
      resumeText = parsed.text;
    }

    const dto: CreateCandidateDto = {
      ...body,
      skills: body.skills ? body.skills.split(',').map((s: string) => s.trim()) : [],
    };

    return this.candidatesService.create(dto, resumeText);
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
  delete(@Param('id') id: string) {
    this.candidatesService.delete(id);
    return { message: 'Candidate deleted' };
  }
}
