import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ILike } from 'typeorm';
import { PersonsService } from './persons.service';
import { Person } from './person.entity';

const repoMock = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

describe('PersonsService', () => {
  let service: PersonsService;
  let repo: ReturnType<typeof repoMock>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonsService,
        { provide: getRepositoryToken(Person), useFactory: repoMock },
      ],
    }).compile();

    service = module.get<PersonsService>(PersonsService);
    repo = module.get(getRepositoryToken(Person));
  });

  describe('findAll', () => {
    it('returns all persons for a user without a search term', async () => {
      const persons = [{ id: '1', userId: 'u1', name: 'Alice' }];
      repo.find.mockResolvedValue(persons);

      const result = await service.findAll('u1');

      expect(result).toEqual(persons);
      expect(repo.find).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        relations: ['facts', 'events'],
        order: { updatedAt: 'DESC' },
      });
    });

    it('searches by name and occupation when a search term is provided', async () => {
      const persons = [{ id: '1', userId: 'u1', name: 'Alice' }];
      repo.find.mockResolvedValue(persons);

      const result = await service.findAll('u1', 'alice');

      expect(result).toEqual(persons);
      expect(repo.find).toHaveBeenCalledWith({
        where: [
          { userId: 'u1', name: ILike('%alice%') },
          { userId: 'u1', occupation: ILike('%alice%') },
        ],
        relations: ['facts', 'events'],
        order: { updatedAt: 'DESC' },
      });
    });
  });

  describe('findAllAdmin', () => {
    it('returns all persons across all users', async () => {
      const persons = [{ id: '1' }, { id: '2' }];
      repo.find.mockResolvedValue(persons);

      const result = await service.findAllAdmin();

      expect(result).toEqual(persons);
      expect(repo.find).toHaveBeenCalledWith({
        relations: ['facts', 'events'],
        order: { updatedAt: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('returns the person when found', async () => {
      const person = { id: '1', userId: 'u1', name: 'Alice' };
      repo.findOne.mockResolvedValue(person);

      expect(await service.findOne('1', 'u1')).toEqual(person);
    });

    it('throws NotFoundException when the person does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOne('999', 'u1')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the userId does not match', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOne('1', 'other-user')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates and saves a new person', async () => {
      const dto = { userId: 'u1', name: 'Bob' } as any;
      const entity = { id: '2', ...dto };
      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);

      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(repo.save).toHaveBeenCalledWith(entity);
      expect(result).toEqual(entity);
    });
  });

  describe('update', () => {
    it('updates and returns the modified person', async () => {
      const existing = { id: '1', userId: 'u1', name: 'Alice' };
      const dto = { name: 'Alicia' } as any;
      repo.findOne.mockResolvedValue(existing);
      repo.save.mockResolvedValue({ ...existing, ...dto });

      const result = await service.update('1', 'u1', dto);

      expect(result.name).toBe('Alicia');
      expect(repo.save).toHaveBeenCalledWith({ ...existing, ...dto });
    });

    it('throws NotFoundException when the person does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.update('999', 'u1', { name: 'X' } as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('removes an existing person', async () => {
      const person = { id: '1', userId: 'u1', name: 'Alice' };
      repo.findOne.mockResolvedValue(person);
      repo.remove.mockResolvedValue(undefined);

      await service.remove('1', 'u1');

      expect(repo.remove).toHaveBeenCalledWith(person);
    });

    it('throws NotFoundException when the person does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.remove('999', 'u1')).rejects.toThrow(NotFoundException);
    });
  });
});
