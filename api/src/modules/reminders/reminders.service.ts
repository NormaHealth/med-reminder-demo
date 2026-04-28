import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoseEvent } from './entities/dose-event.entity';
import { User } from '../users/entities/user.entity';
import { RefillStatusService } from '../../services/refill-status.service';

@Injectable()
export class RemindersService {
  constructor(
    @InjectRepository(DoseEvent)
    private readonly doseRepository: Repository<DoseEvent>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly refillStatusService: RefillStatusService,
  ) {}

  async getTodayForUser(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const doses = await this.doseRepository
      .createQueryBuilder('dose')
      .leftJoinAndSelect('dose.schedule', 'schedule')
      .leftJoinAndSelect('schedule.medication', 'medication')
      .where('schedule.userId = :userId', { userId })
      .andWhere('dose.scheduledFor >= :start AND dose.scheduledFor < :end', {
        start,
        end,
      })
      .orderBy('dose.scheduledFor', 'ASC')
      .getMany();

    // Attach refill status per dose - calls slow external service per medication
    const enriched = await Promise.all(
      doses.map(async (dose) => {
        const refillStatus = await this.refillStatusService.getStatus(
          dose.schedule.medication.name,
        );
        return {
          id: dose.id,
          scheduledFor: dose.scheduledFor,
          status: dose.status,
          confirmedAt: dose.confirmedAt,
          medication: {
            id: dose.schedule.medication.id,
            name: dose.schedule.medication.name,
            instructions: dose.schedule.medication.instructions,
          },
          dosage: dose.schedule.dosage,
          refillStatus,
        };
      }),
    );

    return { userId, reminders: enriched };
  }

  async confirm(id: string) {
    const dose = await this.doseRepository.findOne({ where: { id } });
    if (!dose) {
      throw new NotFoundException(`Reminder with ID ${id} not found`);
    }
    if (dose.status === 'TAKEN') {
      throw new ConflictException(`Reminder ${id} is already confirmed`);
    }
    dose.status = 'TAKEN';
    dose.confirmedAt = new Date();
    await this.doseRepository.save(dose);
    return {
      id: dose.id,
      status: dose.status,
      confirmedAt: dose.confirmedAt,
    };
  }
}
