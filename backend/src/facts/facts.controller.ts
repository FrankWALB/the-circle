import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { FactsService } from './facts.service';
import { CreateFactDto } from './dto/create-fact.dto';
import { UpdateFactDto } from './dto/update-fact.dto';
import { UserId } from '../common/user-id.decorator';

@Controller('facts')
export class FactsController {
  constructor(private readonly service: FactsService) {}

  @Get()
  findByPerson(@Query('personId') personId: string, @UserId() userId: string) {
    return this.service.findByPerson(personId, userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @UserId() userId: string) {
    return this.service.findOne(id, userId);
  }

  @Post()
  create(@Body() dto: CreateFactDto, @UserId() userId: string) {
    return this.service.create(dto, userId);
  }

  @Put(':id')
  update(@Param('id') id: string, @UserId() userId: string, @Body() dto: UpdateFactDto) {
    return this.service.update(id, userId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @UserId() userId: string) {
    return this.service.remove(id, userId);
  }
}
