import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto } from './event.dto';

@Controller('events')
export class EventsController {
  constructor(private service: EventsService) {}

  @Get()
  findByPerson(@Query('personId') personId: string, @Query('userId') userId: string) {
    return this.service.findByPerson(personId, userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query('userId') userId: string) {
    return this.service.findOne(id, userId);
  }

  @Post()
  create(@Body() dto: CreateEventDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Query('userId') userId: string, @Body() dto: UpdateEventDto) {
    return this.service.update(id, userId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Query('userId') userId: string) {
    return this.service.remove(id, userId);
  }
}
