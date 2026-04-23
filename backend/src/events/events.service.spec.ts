import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';

const prismaMock = () => ({
  event: {
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

describe('EventsService', () => {
  let service: EventsService;
  let prisma: ReturnType<typeof prismaMock>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: PrismaService, useFactory: prismaMock },
      ],
    }).compile();

    service = module.get(EventsService);
    prisma  = module.get(PrismaService);
  });

  describe('findByPerson', () => {
    it('returns events for a person ordered by date ascending', async () => {
      const events = [{ id: 'e1', personId: 'p1', title: 'Geburtstag' }];
      prisma.event.findMany.mockResolvedValue(events);

      const result = await service.findByPerson('p1', 'u1');

      expect(result).toEqual(events);
      expect(prisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { personId: 'p1', person: { userId: 'u1' } } }),
      );
    });
  });

  describe('findOne', () => {
    it('returns the event when found', async () => {
      const event = { id: 'e1', title: 'Geburtstag' };
      prisma.event.findFirst.mockResolvedValue(event);

      expect(await service.findOne('e1', 'u1')).toEqual(event);
    });

    it('throws NotFoundException when the event does not exist', async () => {
      prisma.event.findFirst.mockResolvedValue(null);

      await expect(service.findOne('e999', 'u1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates an event after verifying person ownership', async () => {
      const dto     = { personId: 'p1', title: 'Geburtstag', date: '1990-03-15', recurring: true } as any;
      const created = { id: 'e1', ...dto };
      prisma.person.findFirst.mockResolvedValue({ id: 'p1' });
      prisma.event.create.mockResolvedValue(created);

      const result = await service.create(dto, 'u1');

      expect(prisma.person.findFirst).toHaveBeenCalledWith({ where: { id: 'p1', userId: 'u1' } });
      expect(result).toEqual(created);
    });

    it('throws NotFoundException when the person does not belong to the user', async () => {
      prisma.person.findFirst.mockResolvedValue(null);

      await expect(
        service.create({ personId: 'p1', title: 'x', date: '2024-01-01' } as any, 'u1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates an existing event', async () => {
      const existing = { id: 'e1', title: 'old' };
      const dto      = { title: 'new' } as any;
      prisma.event.findFirst.mockResolvedValue(existing);
      prisma.event.update.mockResolvedValue({ ...existing, ...dto });

      const result = await service.update('e1', 'u1', dto);

      expect(result.title).toBe('new');
    });

    it('throws NotFoundException when the event does not exist', async () => {
      prisma.event.findFirst.mockResolvedValue(null);

      await expect(service.update('e999', 'u1', {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('removes an existing event', async () => {
      const event = { id: 'e1' };
      prisma.event.findFirst.mockResolvedValue(event);
      prisma.event.delete.mockResolvedValue(undefined);

      await service.remove('e1', 'u1');

      expect(prisma.event.delete).toHaveBeenCalledWith({ where: { id: 'e1' } });
    });

    it('throws NotFoundException when the event does not exist', async () => {
      prisma.event.findFirst.mockResolvedValue(null);

      await expect(service.remove('e999', 'u1')).rejects.toThrow(NotFoundException);
    });
  });
});
