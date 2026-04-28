import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../modules/users/entities/user.entity';
import { Medication } from '../modules/medications/entities/medication.entity';
import { Schedule } from '../modules/schedules/entities/schedule.entity';
import {
  DoseEvent,
  DoseStatus,
} from '../modules/reminders/entities/dose-event.entity';

interface SeedSchedule {
  id: string;
  userId: string;
  medicationId: string;
  dosage: string;
  timesOfDay: string[];
  daysOfWeek: number[] | null;
  startDate: string;
}

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Medication)
    private readonly medicationRepository: Repository<Medication>,
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    @InjectRepository(DoseEvent)
    private readonly doseRepository: Repository<DoseEvent>,
  ) {}

  async seed() {
    const users = [
      { id: '1', name: 'Eleanor Rigby', email: 'eleanor@example.com', phone: '+15555550101' },
      { id: '2', name: 'Walter Bishop', email: 'walter@example.com', phone: '+15555550102' },
      { id: '3', name: 'Marge Gunderson', email: 'marge@example.com', phone: '+15555550103' },
    ];
    for (const u of users) {
      await this.userRepository.save(this.userRepository.create(u));
    }

    const medications = [
      { id: '1', name: 'Lisinopril', defaultDosage: '10mg', instructions: 'Take with water' },
      { id: '2', name: 'Metformin', defaultDosage: '500mg', instructions: 'Take with food' },
      { id: '3', name: 'Atorvastatin', defaultDosage: '20mg', instructions: 'Take at bedtime' },
      { id: '4', name: 'Omeprazole', defaultDosage: '20mg', instructions: 'Take 30 min before breakfast' },
      { id: '5', name: 'Amlodipine', defaultDosage: '5mg', instructions: 'Take with or without food' },
      { id: '6', name: 'Levothyroxine', defaultDosage: '50mcg', instructions: 'Take on empty stomach' },
      { id: '7', name: 'Warfarin', defaultDosage: '2.5mg', instructions: 'Take same time daily' },
    ];
    for (const m of medications) {
      await this.medicationRepository.save(this.medicationRepository.create(m));
    }

    // Eleanor: Lisinopril qd, Metformin bid
    // Walter: Atorvastatin qhs, Omeprazole qd, Amlodipine qd
    // Marge: Levothyroxine qd, Warfarin Mon/Thu
    const schedules: SeedSchedule[] = [
      { id: '1', userId: '1', medicationId: '1', dosage: '10mg', timesOfDay: ['08:00'], daysOfWeek: null, startDate: '2024-01-15' },
      { id: '2', userId: '1', medicationId: '2', dosage: '500mg', timesOfDay: ['08:00', '20:00'], daysOfWeek: null, startDate: '2024-02-01' },
      { id: '3', userId: '2', medicationId: '3', dosage: '20mg', timesOfDay: ['22:00'], daysOfWeek: null, startDate: '2023-11-01' },
      { id: '4', userId: '2', medicationId: '4', dosage: '20mg', timesOfDay: ['07:30'], daysOfWeek: null, startDate: '2023-11-15' },
      { id: '5', userId: '2', medicationId: '5', dosage: '5mg', timesOfDay: ['09:00'], daysOfWeek: null, startDate: '2024-01-01' },
      { id: '6', userId: '3', medicationId: '6', dosage: '50mcg', timesOfDay: ['06:30'], daysOfWeek: null, startDate: '2024-03-01' },
      { id: '7', userId: '3', medicationId: '7', dosage: '2.5mg', timesOfDay: ['18:00'], daysOfWeek: [1, 4], startDate: '2024-03-01' },
    ];
    for (const s of schedules) {
      await this.scheduleRepository.save(
        this.scheduleRepository.create({ ...s, active: true, endDate: null }),
      );
    }

    // Materialize ONLY past historical dose events. Today's reminders are
    // not pre-created — they're lazy-materialized on demand by the firing
    // endpoint when a schedule's time enters the firing window.
    // Adherence pattern: ~85% taken, ~10% missed, ~5% skipped.
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let doseId = 1;
    for (const s of schedules) {
      for (let dayOffset = -30; dayOffset <= -1; dayOffset++) {
        const day = new Date(today);
        day.setDate(day.getDate() + dayOffset);
        if (s.daysOfWeek && !s.daysOfWeek.includes(day.getDay())) continue;
        for (const time of s.timesOfDay) {
          const [h, m] = time.split(':').map(Number);
          const scheduledFor = new Date(day);
          scheduledFor.setHours(h, m, 0, 0);

          let status: DoseStatus;
          let confirmedAt: Date | null = null;
          const r = pseudoRandom(`${s.id}-${dayOffset}-${time}`);
          if (r < 0.85) {
            status = 'TAKEN';
            const confirmed = new Date(scheduledFor);
            confirmed.setMinutes(confirmed.getMinutes() + Math.floor(r * 100) % 45);
            confirmedAt = confirmed;
          } else if (r < 0.95) {
            status = 'MISSED';
          } else {
            status = 'SKIPPED';
          }

          await this.doseRepository.save(
            this.doseRepository.create({
              id: String(doseId++),
              scheduleId: s.id,
              scheduledFor,
              status,
              confirmedAt,
            }),
          );
        }
      }
    }

    console.log('Database seeded successfully (no active reminders at boot)');
  }
}

function pseudoRandom(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}
