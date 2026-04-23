import { Test, TestingModule } from '@nestjs/testing';
import { PersonsController } from './persons.controller';
import { PersonsService } from './persons.service';

const serviceMock = () => ({
  findAll:      jest.fn(),
  findAllAdmin: jest.fn(),
  findOne:      jest.fn(),
  create:       jest.fn(),
  update:       jest.fn(),
  remove:       jest.fn(),
});

describe('PersonsController', () => {
  let controller: PersonsController;
  let service: ReturnType<typeof serviceMock>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PersonsController],
      providers: [{ provide: PersonsService, useFactory: serviceMock }],
    }).compile();

    controller = module.get(PersonsController);
    service    = module.get(PersonsService);
  });

  describe('findAll', () => {
    it('passes userId and search term to the service', async () => {
      const persons = [{ id: '1', name: 'Alice' }];
      service.findAll.mockResolvedValue(persons);

      const result = await controller.findAll('u1', 'alice');

      expect(service.findAll).toHaveBeenCalledWith('u1', 'alice');
      expect(result).toEqual(persons);
    });

    it('passes undefined search when no search term is given', async () => {
      service.findAll.mockResolvedValue([]);

      await controller.findAll('u1', undefined);

      expect(service.findAll).toHaveBeenCalledWith('u1', undefined);
    });
  });

  describe('findAllAdmin', () => {
    it('returns all persons across all users', async () => {
      const all = [{ id: '1' }, { id: '2' }];
      service.findAllAdmin.mockResolvedValue(all);

      const result = await controller.findAllAdmin();

      expect(service.findAllAdmin).toHaveBeenCalledWith();
      expect(result).toEqual(all);
    });
  });

  describe('findOne', () => {
    it('returns the person for the given id and userId', async () => {
      const person = { id: '1', userId: 'u1', name: 'Alice' };
      service.findOne.mockResolvedValue(person);

      const result = await controller.findOne('1', 'u1');

      expect(service.findOne).toHaveBeenCalledWith('1', 'u1');
      expect(result).toEqual(person);
    });

    it('propagates NotFoundException from the service', async () => {
      service.findOne.mockRejectedValue(new Error('Not Found'));

      await expect(controller.findOne('999', 'u1')).rejects.toThrow('Not Found');
    });
  });

  describe('create', () => {
    it('delegates the DTO and userId to the service and returns the created person', async () => {
      const dto    = { name: 'Bob' } as any;
      const created = { id: '2', userId: 'u1', name: 'Bob' };
      service.create.mockResolvedValue(created);

      const result = await controller.create(dto, 'u1');

      expect(service.create).toHaveBeenCalledWith(dto, 'u1');
      expect(result).toEqual(created);
    });
  });

  describe('update', () => {
    it('passes id, userId, and DTO to the service', async () => {
      const dto     = { name: 'Alicia' } as any;
      const updated = { id: '1', name: 'Alicia' };
      service.update.mockResolvedValue(updated);

      const result = await controller.update('1', 'u1', dto);

      expect(service.update).toHaveBeenCalledWith('1', 'u1', dto);
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('passes id and userId to the service', async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.remove('1', 'u1');

      expect(service.remove).toHaveBeenCalledWith('1', 'u1');
    });

    it('propagates NotFoundException from the service', async () => {
      service.remove.mockRejectedValue(new Error('Not Found'));

      await expect(controller.remove('999', 'u1')).rejects.toThrow('Not Found');
    });
  });
});
