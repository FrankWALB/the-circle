import {
  Controller, Post, Put, Delete,
  Param, Body, HttpCode, HttpStatus,
} from '@nestjs/common';
import { FactsService } from './facts.service';
import { CreateFactDto } from './dto/create-fact.dto';
import { UpdateFactDto } from './dto/update-fact.dto';
import { UserId } from '../common/user-id.decorator';

@Controller('persons/:personId/facts')
export class FactsController {
  constructor(private readonly factsService: FactsService) {}

  @Post()
  create(
    @Param('personId') personId: string,
    @Body() dto: CreateFactDto,
    @UserId() userId: string,
  ) {
    return this.factsService.create(personId, dto, userId);
  }

  @Put(':factId')
  update(
    @Param('personId') personId: string,
    @Param('factId') factId: string,
    @Body() dto: UpdateFactDto,
    @UserId() userId: string,
  ) {
    return this.factsService.update(personId, factId, dto, userId);
  }

  @Delete(':factId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('personId') personId: string,
    @Param('factId') factId: string,
    @UserId() userId: string,
  ) {
    return this.factsService.remove(personId, factId, userId);
  }
}
