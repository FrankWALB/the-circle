import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PersonsService } from './persons.service';
import { PrismaService } from '../prisma/prisma.service';

const prismaMock = () => ({
  person: {
    findMany:  jest.fn(),
    findFirst: jest.fn(),
    create:    jest.fn(),
    update:    jest.fn(),
    delete:    jest.fn(),
  },
});

describe('PersonsService', () => {
  let service: PersonsService;
  let prisma: ReturnType<typeof prismaMock>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonsService,
        { provide: PrismaService, useFactory: prismaMock },
      ],
    }).compile();

    service = module.get(PersonsService);
    prisma  = module.get(PrismaService);
  });

  describe('findAll', () => {
    it('returns all persons for a user without a search term', async () => {
      const persons = [{ id: '1', userId: 'u1', name: 'Alice' }];
      prisma.person.findMany.mockResolvedValue(persons);

      const result = await service.findAll('u1');

      expect(result).toEqual(persons);
      expect(prisma.person.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'u1' } }),
      );
    });

    it('searches by name/occupation when a search term is provided', async () => {
      const persons = [{ id: '1', userId: 'u1', name: 'Alice' }];
      prisma.person.findMany.mockResolvedValue(persons);

      const result = await service.findAll('u1', 'alice');

      expect(result).toEqual(persons);
      expect(prisma.person.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'u1', OR: expect.any(Array) }),
        }),
      );
    });
  });

  describe('findAllAdmin', () => {
    it('returns all persons across all users', async () => {
      const persons = [{ id: '1' }, { id: '2' }];
      prisma.person.findMany.mockResolvedValue(persons);

      const result = await service.findAllAdmin();

      expect(result).toEqual(persons);
    });
  });

  describe('findOne', () => {
    it('returns the person when found', async () => {
      const person = { id: '1', userId: 'u1', name: 'Alice' };
      prisma.person.findFirst.mockResolvedValue(person);

      expect(await service.findOne('1', 'u1')).toEqual(person);
    });

    it('throws NotFoundException when the person does not exist', async () => {
      prisma.person.findFirst.mockResolvedValue(null);

      await expect(service.findOne('999', 'u1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates a new person with the given userId', async () => {
      const dto     = { name: 'Bob' } as any;
      const created = { id: '2', userId: 'u1', name: 'Bob' };
      prisma.person.create.mockResolvedValue(created);

      const result = await service.create(dto, 'u1');

      expect(prisma.person.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: 'u1', name: 'Bob' }) }),
      );
      expect(result).toEqual(created);
    });
  });

  describe('update', () => {
    it('updates and returns the modified person', async () => {
      const existing = { id: '1', userId: 'u1', name: 'Alice' };
      const dto      = { name: 'Alicia' } as any;
      prisma.person.findFirst.mockResolvedValue(existing);
      prisma.person.update.mockResolvedValue({ ...existing, ...dto });

      const result = await service.update('1', 'u1', dto);

      expect(result.name).toBe('Alicia');
    });

    it('throws NotFoundException when the person does not exist', async () => {
      prisma.person.findFirst.mockResolvedValue(null);

      await expect(service.update('999', 'u1', { name: 'X' } as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('removes an existing person', async () => {
      const person = { id: '1', userId: 'u1', name: 'Alice' };
      prisma.person.findFirst.mockResolvedValue(person);
      prisma.person.delete.mockResolvedValue(undefined);

      await service.remove('1', 'u1');

      expect(prisma.person.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('throws NotFoundException when the person does not exist', async () => {
      prisma.person.findFirst.mockResolvedValue(null);

      await expect(service.remove('999', 'u1')).rejects.toThrow(NotFoundException);
    });
  });
});
