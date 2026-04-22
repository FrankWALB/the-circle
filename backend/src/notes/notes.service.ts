import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PersonsService } from '../persons/persons.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Injectable()
export class NotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly personsService: PersonsService,
  ) {}

  async create(personId: string, dto: CreateNoteDto, userId: string) {
    await this.personsService.findOne(personId, userId);
    const { id, ...rest } = dto;
    return this.prisma.note.create({
      data: { ...(id ? { id } : {}), ...rest, personId },
    });
  }

  async update(personId: string, noteId: string, dto: UpdateNoteDto, userId: string) {
    await this.personsService.findOne(personId, userId);
    const note = await this.prisma.note.findFirst({ where: { id: noteId, personId } });
    if (!note) throw new NotFoundException(`Note ${noteId} not found`);
    return this.prisma.note.update({ where: { id: noteId }, data: dto });
  }

  async remove(personId: string, noteId: string, userId: string) {
    await this.personsService.findOne(personId, userId);
    const note = await this.prisma.note.findFirst({ where: { id: noteId, personId } });
    if (!note) throw new NotFoundException(`Note ${noteId} not found`);
    return this.prisma.note.delete({ where: { id: noteId } });
  }
}
