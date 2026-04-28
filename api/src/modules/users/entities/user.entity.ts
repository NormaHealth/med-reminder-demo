import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { Schedule } from '../../schedules/entities/schedule.entity';

@Entity()
export class User {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @OneToMany(() => Schedule, (schedule) => schedule.user)
  schedules: Schedule[];
}
