import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Fact } from '../facts/fact.entity';
import { Event } from '../events/event.entity';

@Entity('persons')
export class Person {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  occupation?: string;

  @Column({ nullable: true })
  notes?: string;

  @Column({ nullable: true })
  metAt?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Fact, fact => fact.person, { cascade: true })
  facts: Fact[];

  @OneToMany(() => Event, event => event.person, { cascade: true })
  events: Event[];
}
