import { Test, TestingModule } from '@nestjs/testing';
import { FactsController } from './facts.controller';
import { FactsService } from './facts.service';

const serviceMock = () => ({
  findByPerson: jest.fn(),
  findOne:      jest.fn(),
  create:       jest.fn(),
  update:       jest.fn(),
  remove:       jest.fn(),
});

describe('FactsController', () => {
  let controller: FactsController;
  let service: ReturnType<typeof serviceMock>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FactsController],
      providers: [{ provide: FactsService, useFactory: serviceMock }],
    }).compile();

    controller = module.get(FactsController);
    service    = module.get(FactsService);
  });

  describe('findByPerson', () => {
    it('passes personId and userId to the service', async () => {
      const facts = [{ id: 'f1', key: 'beruf', value: 'Ärztin' }];
      service.findByPerson.mockResolvedValue(facts);

      const result = await controller.findByPerson('p1', 'u1');

      expect(service.findByPerson).toHaveBeenCalledWith('p1', 'u1');
      expect(result).toEqual(facts);
    });
  });

  describe('findOne', () => {
    it('returns the fact for the given id and userId', async () => {
      const fact = { id: 'f1', userId: 'u1', key: 'beruf', value: 'Arzt' };
      service.findOne.mockResolvedValue(fact);

      const result = await controller.findOne('f1', 'u1');

      expect(service.findOne).toHaveBeenCalledWith('f1', 'u1');
      expect(result).toEqual(fact);
    });

    it('propagates NotFoundException from the service', async () => {
      service.findOne.mockRejectedValue(new Error('Not Found'));

      await expect(controller.findOne('f999', 'u1')).rejects.toThrow('Not Found');
    });
  });

  describe('create', () => {
    it('delegates the DTO and userId to the service and returns the created fact', async () => {
      const dto    = { personId: 'p1', key: 'beruf', value: 'Pilot' } as any;
      const created = { id: 'f1', ...dto };
      service.create.mockResolvedValue(created);

      const result = await controller.create(dto, 'u1');

      expect(service.create).toHaveBeenCalledWith(dto, 'u1');
      expect(result).toEqual(created);
    });
  });

  describe('update', () => {
    it('passes id, userId, and DTO to the service', async () => {
      const dto     = { value: 'updated' } as any;
      const updated = { id: 'f1', value: 'updated' };
      service.update.mockResolvedValue(updated);

      const result = await controller.update('f1', 'u1', dto);

      expect(service.update).toHaveBeenCalledWith('f1', 'u1', dto);
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('passes id and userId to the service', async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.remove('f1', 'u1');

      expect(service.remove).toHaveBeenCalledWith('f1', 'u1');
    });

    it('propagates NotFoundException from the service', async () => {
      service.remove.mockRejectedValue(new Error('Not Found'));

      await expect(controller.remove('f999', 'u1')).rejects.toThrow('Not Found');
    });
  });
});
