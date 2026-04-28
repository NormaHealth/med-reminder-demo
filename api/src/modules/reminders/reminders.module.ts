import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RemindersController } from './reminders.controller';
import { RemindersService } from './reminders.service';
import { DoseEvent } from './entities/dose-event.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { User } from '../users/entities/user.entity';
import { RefillStatusService } from '../../services/refill-status.service';

@Module({
  imports: [TypeOrmModule.forFeature([DoseEvent, Schedule, User])],
  controllers: [RemindersController],
  providers: [RemindersService, RefillStatusService],
  exports: [RemindersService],
})
export class RemindersModule {}
