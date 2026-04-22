import { Test, TestingModule } from '@nestjs/testing';
import { PersonsService } from './persons.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  person: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('PersonsService', () => {
  let service: PersonsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PersonsService>(PersonsService);
    jest.clearAllMocks();
  });

  it('should return all persons for a user', async () => {
    const persons = [{ id: '1', name: 'Max', userId: 'u1' }];
    mockPrisma.person.findMany.mockResolvedValue(persons);
    const result = await service.findAll('u1');
    expect(result).toEqual(persons);
    expect(mockPrisma.person.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1' } }),
    );
  });

  it('should create a person', async () => {
    const person = { id: '1', name: 'Max', userId: 'u1' };
    mockPrisma.person.create.mockResolvedValue(person);
    const result = await service.create({ name: 'Max' }, 'u1');
    expect(result).toEqual(person);
  });
});
