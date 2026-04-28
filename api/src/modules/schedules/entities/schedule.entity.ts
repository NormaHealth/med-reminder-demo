import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Medication } from '../../medications/entities/medication.entity';
import { DoseEvent } from '../../reminders/entities/dose-event.entity';

@Entity()
export class Schedule {
  @PrimaryColumn()
  id: string;

  @Column()
  userId: string;

  @Column()
  medicationId: string;

  @Column()
  dosage: string;

  @Column({ type: 'simple-json' })
  timesOfDay: string[];

  @Column({ type: 'simple-json', nullable: true })
  daysOfWeek: number[] | null;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date', nullable: true })
  endDate: string | null;

  @Column({ default: true })
  active: boolean;

  @ManyToOne(() => User, (user) => user.schedules)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Medication, (medication) => medication.schedules)
  @JoinColumn({ name: 'medicationId' })
  medication: Medication;

  @OneToMany(() => DoseEvent, (dose) => dose.schedule)
  doseEvents: DoseEvent[];
}
