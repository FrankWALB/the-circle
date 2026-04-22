import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';

const PERSON_INCLUDE = {
  notes: { orderBy: { createdAt: 'desc' as const } },
  facts: { orderBy: { createdAt: 'asc' as const } },
  events: { orderBy: { date: 'asc' as const } },
};

@Injectable()
export class PersonsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.person.findMany({
      where: { userId },
      include: PERSON_INCLUDE,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const person = await this.prisma.person.findFirst({
      where: { id, userId },
      include: PERSON_INCLUDE,
    });
    if (!person) throw new NotFoundException(`Person ${id} not found`);
    return person;
  }

  create(dto: CreatePersonDto, userId: string) {
    const { id, birthday, ...rest } = dto;
    return this.prisma.person.create({
      data: {
        ...(id ? { id } : {}),
        ...rest,
        birthday: birthday ? new Date(birthday) : undefined,
        userId,
      },
      include: PERSON_INCLUDE,
    });
  }

  async update(id: string, dto: UpdatePersonDto, userId: string) {
    await this.findOne(id, userId);
    const { birthday, id: _id, ...rest } = dto;
    return this.prisma.person.update({
      where: { id },
      data: {
        ...rest,
        birthday: birthday ? new Date(birthday) : undefined,
      },
      include: PERSON_INCLUDE,
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.person.delete({ where: { id } });
  }
}
