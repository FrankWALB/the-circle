import {
  Controller, Post, Put, Delete,
  Param, Body, HttpCode, HttpStatus,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { UserId } from '../common/user-id.decorator';

@Controller('persons/:personId/events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  create(
    @Param('personId') personId: string,
    @Body() dto: CreateEventDto,
    @UserId() userId: string,
  ) {
    return this.eventsService.create(personId, dto, userId);
  }

  @Put(':eventId')
  update(
    @Param('personId') personId: string,
    @Param('eventId') eventId: string,
    @Body() dto: UpdateEventDto,
    @UserId() userId: string,
  ) {
    return this.eventsService.update(personId, eventId, dto, userId);
  }

  @Delete(':eventId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('personId') personId: string,
    @Param('eventId') eventId: string,
    @UserId() userId: string,
  ) {
    return this.eventsService.remove(personId, eventId, userId);
  }
}
