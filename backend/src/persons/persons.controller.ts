import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { PersonsService } from './persons.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { UserId } from '../common/user-id.decorator';

@Controller('persons')
export class PersonsController {
  constructor(private readonly service: PersonsService) {}

  @Get()
  findAll(@UserId() userId: string, @Query('search') search?: string) {
    return this.service.findAll(userId, search);
  }

  @Get('admin')
  findAllAdmin() {
    return this.service.findAllAdmin();
  }

  @Get(':id')
  findOne(@Param('id') id: string, @UserId() userId: string) {
    return this.service.findOne(id, userId);
  }

  @Post()
  create(@Body() dto: CreatePersonDto, @UserId() userId: string) {
    return this.service.create(dto, userId);
  }

  @Put(':id')
  update(@Param('id') id: string, @UserId() userId: string, @Body() dto: UpdatePersonDto) {
    return this.service.update(id, userId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @UserId() userId: string) {
    return this.service.remove(id, userId);
  }
}
