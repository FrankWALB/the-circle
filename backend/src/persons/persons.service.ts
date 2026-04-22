import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';

const PERSON_RELATIONS = {
  facts: { orderBy: { createdAt: 'asc' as const } },
  events: { orderBy: { date: 'asc' as const } },
};

@Injectable()
export class PersonsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string, search?: string) {
    return this.prisma.person.findMany({
      where: search
        ? {
            userId,
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { occupation: { contains: search, mode: 'insensitive' } },
            ],
          }
        : { userId },
      include: PERSON_RELATIONS,
      orderBy: { updatedAt: 'desc' },
    });
  }

  findAllAdmin() {
    return this.prisma.person.findMany({
      include: PERSON_RELATIONS,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const person = await this.prisma.person.findFirst({
      where: { id, userId },
      include: {
        notes: { orderBy: { createdAt: 'desc' } },
        ...PERSON_RELATIONS,
      },
    });
    if (!person) throw new NotFoundException(`Person ${id} not found`);
    return person;
  }

  create(dto: CreatePersonDto, userId: string) {
    return this.prisma.person.create({
      data: {
        ...(dto.id ? { id: dto.id } : {}),
        userId,
        name: dto.name,
        nickname: dto.nickname,
        occupation: dto.occupation,
        company: dto.company,
        birthday: dto.birthday ? new Date(dto.birthday) : undefined,
        location: dto.location,
        phone: dto.phone,
        email: dto.email,
        metAt: dto.metAt,
      },
    });
  }

  async update(id: string, userId: string, dto: UpdatePersonDto) {
    await this.findOne(id, userId);
    return this.prisma.person.update({
      where: { id },
      data: {
        ...dto,
        birthday: dto.birthday ? new Date(dto.birthday) : undefined,
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    await this.prisma.person.delete({ where: { id } });
  }
}
