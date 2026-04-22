import { Module } from '@nestjs/common';
import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';
import { PersonsModule } from '../persons/persons.module';

@Module({
  imports: [PersonsModule],
  providers: [NotesService],
  controllers: [NotesController],
})
export class NotesModule {}
