import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Person } from '../persons/person.entity';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  personId: string;

  @Column()
  userId: string;

  @Column()
  title: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ default: false })
  recurring: boolean;

  @Column({ nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Person, person => person.events, { onDelete: 'CASCADE' })
  person: Person;
}
