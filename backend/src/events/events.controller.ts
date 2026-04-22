import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { UserId } from '../common/user-id.decorator';

@Controller('events')
export class EventsController {
  constructor(private readonly service: EventsService) {}

  @Get()
  findByPerson(@Query('personId') personId: string, @UserId() userId: string) {
    return this.service.findByPerson(personId, userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @UserId() userId: string) {
    return this.service.findOne(id, userId);
  }

  @Post()
  create(@Body() dto: CreateEventDto, @UserId() userId: string) {
    return this.service.create(dto, userId);
  }

  @Put(':id')
  update(@Param('id') id: string, @UserId() userId: string, @Body() dto: UpdateEventDto) {
    return this.service.update(id, userId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @UserId() userId: string) {
    return this.service.remove(id, userId);
  }
}
