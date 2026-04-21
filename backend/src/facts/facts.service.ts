import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fact } from './fact.entity';
import { CreateFactDto, UpdateFactDto } from './fact.dto';

@Injectable()
export class FactsService {
  constructor(@InjectRepository(Fact) private repo: Repository<Fact>) {}

  findByPerson(personId: string, userId: string): Promise<Fact[]> {
    return this.repo.find({ where: { personId, userId }, order: { updatedAt: 'DESC' } });
  }

  async findOne(id: string, userId: string): Promise<Fact> {
    const f = await this.repo.findOne({ where: { id, userId } });
    if (!f) throw new NotFoundException();
    return f;
  }

  create(dto: CreateFactDto): Promise<Fact> {
    const f = this.repo.create(dto);
    return this.repo.save(f);
  }

  async update(id: string, userId: string, dto: UpdateFactDto): Promise<Fact> {
    const f = await this.findOne(id, userId);
    Object.assign(f, dto);
    return this.repo.save(f);
  }

  async remove(id: string, userId: string): Promise<void> {
    const f = await this.findOne(id, userId);
    await this.repo.remove(f);
  }
}
