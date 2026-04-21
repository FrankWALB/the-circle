import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { FactsService } from './facts.service';
import { Fact } from './fact.entity';

const repoMock = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

describe('FactsService', () => {
  let service: FactsService;
  let repo: ReturnType<typeof repoMock>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FactsService,
        { provide: getRepositoryToken(Fact), useFactory: repoMock },
      ],
    }).compile();

    service = module.get<FactsService>(FactsService);
    repo = module.get(getRepositoryToken(Fact));
  });

  describe('findByPerson', () => {
    it('returns all facts for a person ordered by updatedAt desc', async () => {
      const facts = [{ id: 'f1', personId: 'p1', userId: 'u1' }];
      repo.find.mockResolvedValue(facts);

      const result = await service.findByPerson('p1', 'u1');

      expect(result).toEqual(facts);
      expect(repo.find).toHaveBeenCalledWith({
        where: { personId: 'p1', userId: 'u1' },
        order: { updatedAt: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('returns the fact when found', async () => {
      const fact = { id: 'f1', userId: 'u1', key: 'beruf', value: 'Ärztin' };
      repo.findOne.mockResolvedValue(fact);

      expect(await service.findOne('f1', 'u1')).toEqual(fact);
    });

    it('throws NotFoundException when the fact does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOne('f999', 'u1')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the userId does not match', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOne('f1', 'other-user')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates and saves a new fact', async () => {
      const dto = { personId: 'p1', userId: 'u1', key: 'beruf', value: 'Ärztin' } as any;
      const entity = { id: 'f1', ...dto };
      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);

      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(repo.save).toHaveBeenCalledWith(entity);
      expect(result).toEqual(entity);
    });
  });

  describe('update', () => {
    it('updates and returns the modified fact', async () => {
      const existing = { id: 'f1', userId: 'u1', key: 'beruf', value: 'old' };
      const dto = { value: 'new' } as any;
      repo.findOne.mockResolvedValue(existing);
      repo.save.mockResolvedValue({ ...existing, ...dto });

      const result = await service.update('f1', 'u1', dto);

      expect(result.value).toBe('new');
      expect(repo.save).toHaveBeenCalledWith({ ...existing, ...dto });
    });

    it('throws NotFoundException when the fact does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.update('f999', 'u1', {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('removes an existing fact', async () => {
      const fact = { id: 'f1', userId: 'u1' };
      repo.findOne.mockResolvedValue(fact);
      repo.remove.mockResolvedValue(undefined);

      await service.remove('f1', 'u1');

      expect(repo.remove).toHaveBeenCalledWith(fact);
    });

    it('throws NotFoundException when the fact does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.remove('f999', 'u1')).rejects.toThrow(NotFoundException);
    });
  });
});
