import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { PersonsService } from './persons.service';
import { CreatePersonDto, UpdatePersonDto } from './person.dto';

@Controller('persons')
export class PersonsController {
  constructor(private service: PersonsService) {}

  @Get()
  findAll(@Query('userId') userId: string, @Query('search') search?: string) {
    return this.service.findAll(userId, search);
  }

  @Get('admin')
  findAllAdmin() {
    return this.service.findAllAdmin();
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query('userId') userId: string) {
    return this.service.findOne(id, userId);
  }

  @Post()
  create(@Body() dto: CreatePersonDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Query('userId') userId: string, @Body() dto: UpdatePersonDto) {
    return this.service.update(id, userId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Query('userId') userId: string) {
    return this.service.remove(id, userId);
  }
}
