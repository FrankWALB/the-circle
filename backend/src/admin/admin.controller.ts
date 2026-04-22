import { Controller, Get, Param, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { UserRole } from '../common/user-id.decorator';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats(@UserRole() role: string) {
    return this.adminService.getStats(role);
  }

  @Get('persons')
  findAllPersons(@UserRole() role: string, @Query('search') search?: string) {
    return this.adminService.findAllPersons(role, search);
  }

  @Get('persons/:id')
  findOnePerson(@Param('id') id: string, @UserRole() role: string) {
    return this.adminService.findOnePerson(id, role);
  }

  @Get('users')
  findAllUsers(@UserRole() role: string) {
    return this.adminService.findAllUsers(role);
  }
}
