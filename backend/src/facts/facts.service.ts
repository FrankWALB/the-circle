import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PersonsService } from '../persons/persons.service';
import { CreateFactDto } from './dto/create-fact.dto';
import { UpdateFactDto } from './dto/update-fact.dto';

@Injectable()
export class FactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly personsService: PersonsService,
  ) {}

  async create(personId: string, dto: CreateFactDto, userId: string) {
    await this.personsService.findOne(personId, userId);
    const { id, ...rest } = dto;
    return this.prisma.fact.create({
      data: { ...(id ? { id } : {}), ...rest, personId },
    });
  }

  async update(personId: string, factId: string, dto: UpdateFactDto, userId: string) {
    await this.personsService.findOne(personId, userId);
    const fact = await this.prisma.fact.findFirst({ where: { id: factId, personId } });
    if (!fact) throw new NotFoundException(`Fact ${factId} not found`);
    return this.prisma.fact.update({ where: { id: factId }, data: dto });
  }

  async remove(personId: string, factId: string, userId: string) {
    await this.personsService.findOne(personId, userId);
    const fact = await this.prisma.fact.findFirst({ where: { id: factId, personId } });
    if (!fact) throw new NotFoundException(`Fact ${factId} not found`);
    return this.prisma.fact.delete({ where: { id: factId } });
  }
}
