import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { DoseEvent } from './entities/dose-event.entity';
import { User } from '../users/entities/user.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { RefillStatusService } from '../../services/refill-status.service';

const FIRING_WINDOW_MS = 30 * 60_000; // 30 minutes

@Injectable()
export class RemindersService {
  constructor(
    @InjectRepository(DoseEvent)
    private readonly doseRepository: Repository<DoseEvent>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    private readonly refillStatusService: RefillStatusService,
  ) {}

  /**
   * Returns dose events that are currently "firing" relative to `now` —
   * i.e. PENDING doses whose scheduledFor falls in [now - 30m, now].
   *
   * Lazily materializes a DoseEvent for any active schedule whose computed
   * fire time today falls in the window but doesn't yet have a dose record.
   * This means: at server start there are zero today-PENDING doses; they
   * come into existence only when their time arrives (per the simulated
   * clock the caller passes in).
   */
  async getFiringForUser(userId: string, now: Date) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const windowStart = new Date(now.getTime() - FIRING_WINDOW_MS);
    const windowEnd = now;

    // Find active schedules for this user and lazy-create dose events for any
    // fire time that's in the firing window without an existing record.
    const schedules = await this.scheduleRepository.find({
      where: { userId, active: true },
    });

    for (const schedule of schedules) {
      for (const fireAt of computeFireTimesInWindow(
        schedule,
        windowStart,
        windowEnd,
      )) {
        const existing = await this.doseRepository.findOne({
          where: { scheduleId: schedule.id, scheduledFor: fireAt },
        });
        if (!existing) {
          await this.doseRepository.save(
            this.doseRepository.create({
              id: randomUUID(),
              scheduleId: schedule.id,
              scheduledFor: fireAt,
              status: 'PENDING',
              confirmedAt: null,
            }),
          );
        }
      }
    }

    // Now query all PENDING doses for this user inside the firing window.
    const doses = await this.doseRepository
      .createQueryBuilder('dose')
      .leftJoinAndSelect('dose.schedule', 'schedule')
      .leftJoinAndSelect('schedule.medication', 'medication')
      .where('schedule.userId = :userId', { userId })
      .andWhere('dose.status = :status', { status: 'PENDING' })
      .andWhere(
        'dose.scheduledFor >= :windowStart AND dose.scheduledFor <= :windowEnd',
        { windowStart, windowEnd },
      )
      .orderBy('dose.scheduledFor', 'ASC')
      .getMany();

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

    return { userId, now: now.toISOString(), reminders: enriched };
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

/**
 * Compute today's fire times for a schedule that fall within
 * [windowStart, windowEnd]. Anchors the day to windowEnd's local date
 * (so the simulated clock controls "today").
 */
function computeFireTimesInWindow(
  schedule: Schedule,
  windowStart: Date,
  windowEnd: Date,
): Date[] {
  const day = new Date(windowEnd);
  day.setHours(0, 0, 0, 0);

  if (schedule.daysOfWeek && !schedule.daysOfWeek.includes(day.getDay())) {
    return [];
  }

  const out: Date[] = [];
  for (const time of schedule.timesOfDay) {
    const [h, m] = time.split(':').map((n) => parseInt(n, 10));
    if (Number.isNaN(h) || Number.isNaN(m)) continue;
    const fireAt = new Date(day);
    fireAt.setHours(h, m, 0, 0);
    if (fireAt >= windowStart && fireAt <= windowEnd) {
      out.push(fireAt);
    }
  }
  return out;
}
