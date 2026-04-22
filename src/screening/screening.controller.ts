import { Body, Controller, Post, UploadedFile, UseInterceptors, Get, Param, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { parse } from 'csv-parse/sync';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');
import { ScreenJobDto } from './screening.dto';
import { ScreeningService } from './screening.service';
import { CandidatesService } from '../candidates/candidates.service';
import { JobsService } from '../jobs/jobs.service';

@ApiTags('Screening')
@Controller('screening')
export class ScreeningController {
  constructor(
    private readonly screeningService: ScreeningService,
    private readonly candidatesService: CandidatesService,
    private readonly jobsService: JobsService,
  ) {}

  @Post('run')
  @ApiOperation({ summary: 'Run AI screening for a job — returns ranked shortlist' })
  async run(@Body() dto: ScreenJobDto) {
    return this.screeningService.screenJob(dto.jobId, dto.topN ?? 10);
  }

  @Post('upload-csv')
  @ApiOperation({ summary: 'Bulk upload candidates via CSV for a job' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        jobId: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadCsv(
    @UploadedFile() file: Express.Multer.File,
    @Body('jobId') jobId: string,
  ) {
    // Validate job exists
    this.jobsService.findOne(jobId);

    const records: any[] = parse(file.buffer.toString(), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const created = records.map((row) =>
      this.candidatesService.create({
        name: row.name || row.Name || '',
        email: row.email || row.Email || '',
        currentRole: row.currentRole || row.CurrentRole || row['Current Role'] || '',
        location: row.location || row.Location || '',
        phone: row.phone || row.Phone || '',
        skills: (row.skills || row.Skills || '').split(',').map((s: string) => s.trim()),
        experience: row.experience || row.Experience || '',
        education: row.education || row.Education || '',
        summary: row.summary || row.Summary || '',
        jobId,
      }),
    );

    return { imported: created.length, candidates: created };
  }

  @Post('upload-resume/:jobId')
  @ApiOperation({ summary: 'Upload a single PDF resume for a job (auto-extracts text)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
        resume: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('resume', { storage: memoryStorage() }))
  async uploadResume(
    @Param('jobId') jobId: string,
    @Body('name') name: string,
    @Body('email') email: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    this.jobsService.findOne(jobId);
    const parsed = await pdfParse(file.buffer);
    const candidate = this.candidatesService.create(
      { name, email, currentRole: '', location: '', jobId },
      parsed.text,
    );
    return candidate;
  }
}
