import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './event.entity';
import { CreateEventDto, UpdateEventDto } from './event.dto';

@Injectable()
export class EventsService {
  constructor(@InjectRepository(Event) private repo: Repository<Event>) {}

  findByPerson(personId: string, userId: string): Promise<Event[]> {
    return this.repo.find({ where: { personId, userId }, order: { date: 'ASC' } });
  }

  async findOne(id: string, userId: string): Promise<Event> {
    const e = await this.repo.findOne({ where: { id, userId } });
    if (!e) throw new NotFoundException();
    return e;
  }

  create(dto: CreateEventDto): Promise<Event> {
    const e = this.repo.create(dto);
    return this.repo.save(e);
  }

  async update(id: string, userId: string, dto: UpdateEventDto): Promise<Event> {
    const e = await this.findOne(id, userId);
    Object.assign(e, dto);
    return this.repo.save(e);
  }

  async remove(id: string, userId: string): Promise<void> {
    const e = await this.findOne(id, userId);
    await this.repo.remove(e);
  }
}
