import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { Schedule } from '../../schedules/entities/schedule.entity';

@Entity()
export class Medication {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column()
  defaultDosage: string;

  @Column()
  instructions: string;

  @OneToMany(() => Schedule, (schedule) => schedule.medication)
  schedules: Schedule[];
}
