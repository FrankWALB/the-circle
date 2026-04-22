import { Controller, Get, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserRole } from '../common/user-id.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@UserRole() role: string) {
    if (role !== 'ADMIN') throw new ForbiddenException();
    return this.usersService.findAll();
  }
}
