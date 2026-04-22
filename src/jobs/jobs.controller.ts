import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateJobDto, UpdateJobDto } from './job.dto';
import { JobsService } from './jobs.service';

@ApiTags('Jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new job posting' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  create(@Body() dto: CreateJobDto, @UploadedFile() file?: Express.Multer.File) {
    return this.jobsService.create(dto, file);
  }

  @Get()
  @ApiOperation({ summary: 'List all job postings' })
  findAll() {
    return this.jobsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a job posting by ID' })
  findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a job posting' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  update(
    @Param('id') id: string,
    @Body() dto: UpdateJobDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.jobsService.update(id, dto, file);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a job posting' })
  delete(@Param('id') id: string) {
    this.jobsService.delete(id);
    return { message: 'Job deleted' };
  }
}
