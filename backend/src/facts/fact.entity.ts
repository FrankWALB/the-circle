import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Person } from '../persons/person.entity';

@Entity('facts')
export class Fact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  personId: string;

  @Column()
  userId: string;

  @Column()
  key: string;

  @Column('text')
  value: string;

  @Column({ nullable: true })
  category?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Person, person => person.facts, { onDelete: 'CASCADE' })
  person: Person;
}
