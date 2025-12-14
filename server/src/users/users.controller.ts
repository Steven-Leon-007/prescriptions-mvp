import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import { Roles, Role } from '../common/decorators/roles.decorator';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('users')
  @Roles(Role.ADMIN)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get('users')
  @Roles(Role.ADMIN)
  findAll(@Query() query: QueryUserDto) {
    return this.usersService.findAllWithFilters(query);
  }

  @Get('doctors')
  @Roles(Role.ADMIN)
  findDoctors(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.usersService.findDoctors(page, limit);
  }

  @Get('patients')
  @Roles(Role.ADMIN)
  findPatients(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.usersService.findPatients(page, limit);
  }

  @Get('users/:id')
  @Roles(Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch('users/:id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete('users/:id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
