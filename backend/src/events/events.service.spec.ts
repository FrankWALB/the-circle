import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { EventsService } from './events.service';
import { Event } from './event.entity';

const repoMock = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

describe('EventsService', () => {
  let service: EventsService;
  let repo: ReturnType<typeof repoMock>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: getRepositoryToken(Event), useFactory: repoMock },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    repo = module.get(getRepositoryToken(Event));
  });

  describe('findByPerson', () => {
    it('returns events for a person ordered by date ascending', async () => {
      const events = [{ id: 'e1', personId: 'p1', userId: 'u1' }];
      repo.find.mockResolvedValue(events);

      const result = await service.findByPerson('p1', 'u1');

      expect(result).toEqual(events);
      expect(repo.find).toHaveBeenCalledWith({
        where: { personId: 'p1', userId: 'u1' },
        order: { date: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('returns the event when found', async () => {
      const event = { id: 'e1', userId: 'u1', title: 'Geburtstag' };
      repo.findOne.mockResolvedValue(event);

      expect(await service.findOne('e1', 'u1')).toEqual(event);
    });

    it('throws NotFoundException when the event does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOne('e999', 'u1')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the userId does not match', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOne('e1', 'other-user')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates and saves a new event', async () => {
      const dto = { personId: 'p1', userId: 'u1', title: 'Geburtstag', date: '1990-03-15', recurring: true } as any;
      const entity = { id: 'e1', ...dto };
      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);

      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(repo.save).toHaveBeenCalledWith(entity);
      expect(result).toEqual(entity);
    });
  });

  describe('update', () => {
    it('updates and returns the modified event', async () => {
      const existing = { id: 'e1', userId: 'u1', title: 'old' };
      const dto = { title: 'new' } as any;
      repo.findOne.mockResolvedValue(existing);
      repo.save.mockResolvedValue({ ...existing, ...dto });

      const result = await service.update('e1', 'u1', dto);

      expect(result.title).toBe('new');
      expect(repo.save).toHaveBeenCalledWith({ ...existing, ...dto });
    });

    it('throws NotFoundException when the event does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.update('e999', 'u1', {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('removes an existing event', async () => {
      const event = { id: 'e1', userId: 'u1' };
      repo.findOne.mockResolvedValue(event);
      repo.remove.mockResolvedValue(undefined);

      await service.remove('e1', 'u1');

      expect(repo.remove).toHaveBeenCalledWith(event);
    });

    it('throws NotFoundException when the event does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.remove('e999', 'u1')).rejects.toThrow(NotFoundException);
    });
  });
});
