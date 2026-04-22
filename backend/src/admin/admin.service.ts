import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const PERSON_INCLUDE = {
  notes: { orderBy: { createdAt: 'desc' as const } },
  facts: { orderBy: { createdAt: 'asc' as const } },
  events: { orderBy: { date: 'asc' as const } },
  user: { select: { id: true, name: true, email: true, externalId: true } },
};

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  private guard(role: string) {
    if (role !== 'ADMIN') throw new ForbiddenException('Admin access required');
  }

  async getStats(role: string) {
    this.guard(role);
    const [users, persons, notes] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.person.count(),
      this.prisma.note.count(),
    ]);
    return { users, persons, notes };
  }

  async findAllPersons(role: string, search?: string) {
    this.guard(role);
    return this.prisma.person.findMany({
      where: search
        ? { name: { contains: search, mode: 'insensitive' } }
        : undefined,
      include: PERSON_INCLUDE,
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
  }

  async findOnePerson(id: string, role: string) {
    this.guard(role);
    const person = await this.prisma.person.findUnique({
      where: { id },
      include: PERSON_INCLUDE,
    });
    if (!person) throw new NotFoundException(`Person ${id} not found`);
    return person;
  }

  async findAllUsers(role: string) {
    this.guard(role);
    return this.prisma.user.findMany({
      include: { _count: { select: { persons: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
