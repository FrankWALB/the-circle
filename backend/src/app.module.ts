import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { PersonsModule } from './persons/persons.module';
import { NotesModule } from './notes/notes.module';
import { FactsModule } from './facts/facts.module';
import { EventsModule } from './events/events.module';
import { AdminModule } from './admin/admin.module';
import { UsersModule } from './users/users.module';
import { UserContextMiddleware } from './middleware/user-context.middleware';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    PersonsModule,
    NotesModule,
    FactsModule,
    EventsModule,
    AdminModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UserContextMiddleware).forRoutes('*');
  }
}
