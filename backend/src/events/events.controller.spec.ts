import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

const serviceMock = () => ({
  findByPerson: jest.fn(),
  findOne:      jest.fn(),
  create:       jest.fn(),
  update:       jest.fn(),
  remove:       jest.fn(),
});

describe('EventsController', () => {
  let controller: EventsController;
  let service: ReturnType<typeof serviceMock>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [{ provide: EventsService, useFactory: serviceMock }],
    }).compile();

    controller = module.get(EventsController);
    service    = module.get(EventsService);
  });

  describe('findByPerson', () => {
    it('passes personId and userId to the service', async () => {
      const events = [{ id: 'e1', title: 'Geburtstag', date: '1990-03-15' }];
      service.findByPerson.mockResolvedValue(events);

      const result = await controller.findByPerson('p1', 'u1');

      expect(service.findByPerson).toHaveBeenCalledWith('p1', 'u1');
      expect(result).toEqual(events);
    });
  });

  describe('findOne', () => {
    it('returns the event for the given id and userId', async () => {
      const event = { id: 'e1', userId: 'u1', title: 'Geburtstag' };
      service.findOne.mockResolvedValue(event);

      const result = await controller.findOne('e1', 'u1');

      expect(service.findOne).toHaveBeenCalledWith('e1', 'u1');
      expect(result).toEqual(event);
    });

    it('propagates NotFoundException from the service', async () => {
      service.findOne.mockRejectedValue(new Error('Not Found'));

      await expect(controller.findOne('e999', 'u1')).rejects.toThrow('Not Found');
    });
  });

  describe('create', () => {
    it('delegates the DTO to the service and returns the created event', async () => {
      const dto    = { personId: 'p1', userId: 'u1', title: 'Geburtstag', date: '1990-03-15', recurring: true } as any;
      const created = { id: 'e1', ...dto };
      service.create.mockResolvedValue(created);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(created);
    });
  });

  describe('update', () => {
    it('passes id, userId, and DTO to the service', async () => {
      const dto     = { title: 'Hochzeitstag' } as any;
      const updated = { id: 'e1', title: 'Hochzeitstag' };
      service.update.mockResolvedValue(updated);

      const result = await controller.update('e1', 'u1', dto);

      expect(service.update).toHaveBeenCalledWith('e1', 'u1', dto);
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('passes id and userId to the service', async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.remove('e1', 'u1');

      expect(service.remove).toHaveBeenCalledWith('e1', 'u1');
    });

    it('propagates NotFoundException from the service', async () => {
      service.remove.mockRejectedValue(new Error('Not Found'));

      await expect(controller.remove('e999', 'u1')).rejects.toThrow('Not Found');
    });
  });
});
