import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFactDto } from './dto/create-fact.dto';
import { UpdateFactDto } from './dto/update-fact.dto';

@Injectable()
export class FactsService {
  constructor(private readonly prisma: PrismaService) {}

  findByPerson(personId: string, userId: string) {
    return this.prisma.fact.findMany({
      where: { personId, person: { userId } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const fact = await this.prisma.fact.findFirst({ where: { id, person: { userId } } });
    if (!fact) throw new NotFoundException(`Fact ${id} not found`);
    return fact;
  }

  async create(dto: CreateFactDto, userId: string) {
    const person = await this.prisma.person.findFirst({ where: { id: dto.personId, userId } });
    if (!person) throw new NotFoundException(`Person ${dto.personId} not found`);
    return this.prisma.fact.create({
      data: {
        ...(dto.id ? { id: dto.id } : {}),
        personId: dto.personId,
        key: dto.key,
        value: dto.value,
        category: dto.category,
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateFactDto) {
    const fact = await this.findOne(id, userId);
    return this.prisma.fact.update({ where: { id: fact.id }, data: dto });
  }

  async remove(id: string, userId: string) {
    const fact = await this.findOne(id, userId);
    await this.prisma.fact.delete({ where: { id: fact.id } });
  }
}
