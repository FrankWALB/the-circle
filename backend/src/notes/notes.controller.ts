import {
  Controller, Post, Put, Delete,
  Param, Body, HttpCode, HttpStatus,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { UserId } from '../common/user-id.decorator';

@Controller('persons/:personId/notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  create(
    @Param('personId') personId: string,
    @Body() dto: CreateNoteDto,
    @UserId() userId: string,
  ) {
    return this.notesService.create(personId, dto, userId);
  }

  @Put(':noteId')
  update(
    @Param('personId') personId: string,
    @Param('noteId') noteId: string,
    @Body() dto: UpdateNoteDto,
    @UserId() userId: string,
  ) {
    return this.notesService.update(personId, noteId, dto, userId);
  }

  @Delete(':noteId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('personId') personId: string,
    @Param('noteId') noteId: string,
    @UserId() userId: string,
  ) {
    return this.notesService.remove(personId, noteId, userId);
  }
}
