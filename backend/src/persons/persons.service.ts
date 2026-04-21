import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Person } from './person.entity';
import { CreatePersonDto, UpdatePersonDto } from './person.dto';

@Injectable()
export class PersonsService {
  constructor(@InjectRepository(Person) private repo: Repository<Person>) {}

  findAll(userId: string, search?: string): Promise<Person[]> {
    if (search) {
      return this.repo.find({
        where: [
          { userId, name: ILike(`%${search}%`) },
          { userId, occupation: ILike(`%${search}%`) },
        ],
        relations: ['facts', 'events'],
        order: { updatedAt: 'DESC' },
      });
    }
    return this.repo.find({
      where: { userId },
      relations: ['facts', 'events'],
      order: { updatedAt: 'DESC' },
    });
  }

  findAllAdmin(): Promise<Person[]> {
    return this.repo.find({ relations: ['facts', 'events'], order: { updatedAt: 'DESC' } });
  }

  async findOne(id: string, userId: string): Promise<Person> {
    const p = await this.repo.findOne({ where: { id, userId }, relations: ['facts', 'events'] });
    if (!p) throw new NotFoundException();
    return p;
  }

  create(dto: CreatePersonDto): Promise<Person> {
    const p = this.repo.create(dto);
    return this.repo.save(p);
  }

  async update(id: string, userId: string, dto: UpdatePersonDto): Promise<Person> {
    const p = await this.findOne(id, userId);
    Object.assign(p, dto);
    return this.repo.save(p);
  }

  async remove(id: string, userId: string): Promise<void> {
    const p = await this.findOne(id, userId);
    await this.repo.remove(p);
  }
}
