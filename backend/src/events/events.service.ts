import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PersonsService } from '../persons/persons.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly personsService: PersonsService,
  ) {}

  async create(personId: string, dto: CreateEventDto, userId: string) {
    await this.personsService.findOne(personId, userId);
    const { id, date, ...rest } = dto;
    return this.prisma.event.create({
      data: { ...(id ? { id } : {}), ...rest, date: new Date(date), personId },
    });
  }

  async update(personId: string, eventId: string, dto: UpdateEventDto, userId: string) {
    await this.personsService.findOne(personId, userId);
    const event = await this.prisma.event.findFirst({ where: { id: eventId, personId } });
    if (!event) throw new NotFoundException(`Event ${eventId} not found`);
    const { date, ...rest } = dto;
    return this.prisma.event.update({
      where: { id: eventId },
      data: { ...rest, ...(date ? { date: new Date(date) } : {}) },
    });
  }

  async remove(personId: string, eventId: string, userId: string) {
    await this.personsService.findOne(personId, userId);
    const event = await this.prisma.event.findFirst({ where: { id: eventId, personId } });
    if (!event) throw new NotFoundException(`Event ${eventId} not found`);
    return this.prisma.event.delete({ where: { id: eventId } });
  }
}
