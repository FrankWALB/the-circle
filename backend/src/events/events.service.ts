import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  findByPerson(personId: string, userId: string) {
    return this.prisma.event.findMany({
      where: { personId, person: { userId } },
      orderBy: { date: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const event = await this.prisma.event.findFirst({ where: { id, person: { userId } } });
    if (!event) throw new NotFoundException(`Event ${id} not found`);
    return event;
  }

  async create(dto: CreateEventDto, userId: string) {
    const person = await this.prisma.person.findFirst({ where: { id: dto.personId, userId } });
    if (!person) throw new NotFoundException(`Person ${dto.personId} not found`);
    return this.prisma.event.create({
      data: {
        ...(dto.id ? { id: dto.id } : {}),
        personId: dto.personId,
        title: dto.title,
        date: new Date(dto.date),
        recurring: dto.recurring ?? false,
        notes: dto.notes,
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateEventDto) {
    const event = await this.findOne(id, userId);
    return this.prisma.event.update({
      where: { id: event.id },
      data: { ...dto, date: dto.date ? new Date(dto.date) : undefined },
    });
  }

  async remove(id: string, userId: string) {
    const event = await this.findOne(id, userId);
    await this.prisma.event.delete({ where: { id: event.id } });
  }
}
