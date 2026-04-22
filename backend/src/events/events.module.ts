import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { PersonsModule } from '../persons/persons.module';

@Module({
  imports: [PersonsModule],
  providers: [EventsService],
  controllers: [EventsController],
})
export class EventsModule {}
