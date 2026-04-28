import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Schedule } from '../../schedules/entities/schedule.entity';

export type DoseStatus = 'PENDING' | 'TAKEN' | 'MISSED' | 'SKIPPED';

@Entity()
export class DoseEvent {
  @PrimaryColumn()
  id: string;

  @Column()
  scheduleId: string;

  @Column({ type: 'datetime' })
  scheduledFor: Date;

  @Column({ default: 'PENDING' })
  status: DoseStatus;

  @Column({ type: 'datetime', nullable: true })
  confirmedAt: Date | null;

  @ManyToOne(() => Schedule, (schedule) => schedule.doseEvents)
  @JoinColumn({ name: 'scheduleId' })
  schedule: Schedule;
}
