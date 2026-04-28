import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './modules/users/users.module';
import { MedicationsModule } from './modules/medications/medications.module';
import { RemindersModule } from './modules/reminders/reminders.module';
import { User } from './modules/users/entities/user.entity';
import { Medication } from './modules/medications/entities/medication.entity';
import { Schedule } from './modules/schedules/entities/schedule.entity';
import { DoseEvent } from './modules/reminders/entities/dose-event.entity';
import { SeedService } from './seed/seed.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: ':memory:',
      entities: [User, Medication, Schedule, DoseEvent],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([User, Medication, Schedule, DoseEvent]),
    UsersModule,
    MedicationsModule,
    RemindersModule,
  ],
  providers: [SeedService],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly seedService: SeedService) {}

  async onModuleInit() {
    await this.seedService.seed();
  }
}
