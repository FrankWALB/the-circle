import { Module } from '@nestjs/common';
import { FactsService } from './facts.service';
import { FactsController } from './facts.controller';
import { PersonsModule } from '../persons/persons.module';

@Module({
  imports: [PersonsModule],
  providers: [FactsService],
  controllers: [FactsController],
})
export class FactsModule {}
