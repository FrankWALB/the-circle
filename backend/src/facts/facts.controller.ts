import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { FactsService } from './facts.service';
import { CreateFactDto, UpdateFactDto } from './fact.dto';

@Controller('facts')
export class FactsController {
  constructor(private service: FactsService) {}

  @Get()
  findByPerson(@Query('personId') personId: string, @Query('userId') userId: string) {
    return this.service.findByPerson(personId, userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query('userId') userId: string) {
    return this.service.findOne(id, userId);
  }

  @Post()
  create(@Body() dto: CreateFactDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Query('userId') userId: string, @Body() dto: UpdateFactDto) {
    return this.service.update(id, userId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Query('userId') userId: string) {
    return this.service.remove(id, userId);
  }
}
