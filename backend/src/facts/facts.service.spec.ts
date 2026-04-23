import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FactsService } from './facts.service';
import { PrismaService } from '../prisma/prisma.service';

const prismaMock = () => ({
  fact: {
    findMany:  jest.fn(),
    findFirst: jest.fn(),
    create:    jest.fn(),
    update:    jest.fn(),
    delete:    jest.fn(),
  },
  person: {
    findFirst: jest.fn(),
  },
});

describe('FactsService', () => {
  let service: FactsService;
  let prisma: ReturnType<typeof prismaMock>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FactsService,
        { provide: PrismaService, useFactory: prismaMock },
      ],
    }).compile();

    service = module.get(FactsService);
    prisma  = module.get(PrismaService);
  });

  describe('findByPerson', () => {
    it('returns all facts for a person', async () => {
      const facts = [{ id: 'f1', personId: 'p1', key: 'beruf', value: 'Ärztin' }];
      prisma.fact.findMany.mockResolvedValue(facts);

      const result = await service.findByPerson('p1', 'u1');

      expect(result).toEqual(facts);
      expect(prisma.fact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { personId: 'p1', person: { userId: 'u1' } } }),
      );
    });
  });

  describe('findOne', () => {
    it('returns the fact when found', async () => {
      const fact = { id: 'f1', key: 'beruf', value: 'Ärztin' };
      prisma.fact.findFirst.mockResolvedValue(fact);

      expect(await service.findOne('f1', 'u1')).toEqual(fact);
    });

    it('throws NotFoundException when the fact does not exist', async () => {
      prisma.fact.findFirst.mockResolvedValue(null);

      await expect(service.findOne('f999', 'u1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates a fact after verifying person ownership', async () => {
      const dto     = { personId: 'p1', key: 'beruf', value: 'Pilot' } as any;
      const created = { id: 'f1', ...dto };
      prisma.person.findFirst.mockResolvedValue({ id: 'p1' });
      prisma.fact.create.mockResolvedValue(created);

      const result = await service.create(dto, 'u1');

      expect(prisma.person.findFirst).toHaveBeenCalledWith({ where: { id: 'p1', userId: 'u1' } });
      expect(result).toEqual(created);
    });

    it('throws NotFoundException when the person does not belong to the user', async () => {
      prisma.person.findFirst.mockResolvedValue(null);

      await expect(
        service.create({ personId: 'p1', key: 'k', value: 'v' } as any, 'u1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates an existing fact', async () => {
      const existing = { id: 'f1', key: 'beruf', value: 'old' };
      const dto      = { value: 'new' } as any;
      prisma.fact.findFirst.mockResolvedValue(existing);
      prisma.fact.update.mockResolvedValue({ ...existing, ...dto });

      const result = await service.update('f1', 'u1', dto);

      expect(result.value).toBe('new');
    });

    it('throws NotFoundException when the fact does not exist', async () => {
      prisma.fact.findFirst.mockResolvedValue(null);

      await expect(service.update('f999', 'u1', {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('removes an existing fact', async () => {
      const fact = { id: 'f1' };
      prisma.fact.findFirst.mockResolvedValue(fact);
      prisma.fact.delete.mockResolvedValue(undefined);

      await service.remove('f1', 'u1');

      expect(prisma.fact.delete).toHaveBeenCalledWith({ where: { id: 'f1' } });
    });

    it('throws NotFoundException when the fact does not exist', async () => {
      prisma.fact.findFirst.mockResolvedValue(null);

      await expect(service.remove('f999', 'u1')).rejects.toThrow(NotFoundException);
    });
  });
});
