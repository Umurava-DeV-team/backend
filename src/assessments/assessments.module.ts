import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssessmentsController } from './assessments.controller';
import { AssessmentsService } from './assessments.service';
import { Assessment } from '../entities/assessment.entity';
import { AssessmentAssignment } from '../entities/assessment-assignment.entity';

import { ScreeningResult } from '../entities/screening-result.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Assessment, AssessmentAssignment, ScreeningResult]),
        NotificationsModule
    ],
    controllers: [AssessmentsController],
    providers: [AssessmentsService],
    exports: [AssessmentsService],
})
export class AssessmentsModule { }
