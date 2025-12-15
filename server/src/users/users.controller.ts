import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import { Roles, Role } from '../common/decorators/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Users')
@ApiCookieAuth('cookie-auth')
@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post('users')
  @Roles(Role.admin)
  @ApiOperation({
    summary: 'Crear nuevo usuario (Admin)',
    description: 'Permite al administrador crear un nuevo usuario en el sistema.',
  })
  @ApiBody({
    type: CreateUserDto,
    description: 'Datos del usuario a crear',
    examples: {
      doctor: {
        summary: 'Crear Doctor',
        value: {
          email: 'doctor@example.com',
          password: 'Password123!',
          name: 'Dr. Juan Pérez',
          role: 'doctor',
          specialty: 'Cardiología',
        },
      },
      patient: {
        summary: 'Crear Paciente',
        value: {
          email: 'paciente@example.com',
          password: 'Password123!',
          name: 'María García',
          role: 'patient',
          birthDate: '1990-05-15',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No autorizado - requiere rol admin' })
  @ApiResponse({ status: 409, description: 'El email ya está registrado' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get('users')
  @Roles(Role.admin)
  @ApiOperation({
    summary: 'Listar todos los usuarios (Admin)',
    description: 'Obtiene lista paginada de usuarios con filtros por rol y búsqueda general.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Cantidad de resultados por página' })
  @ApiQuery({ name: 'role', required: false, enum: ['admin', 'doctor', 'patient'], description: 'Filtrar por rol' })
  @ApiQuery({ name: 'query', required: false, type: String, description: 'Búsqueda por nombre o email' })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuarios',
    schema: {
      example: {
        data: [
          {
            id: 'clg1h2j3k4l5m6n7o8p9',
            email: 'doctor@example.com',
            name: 'Dr. Juan Pérez',
            role: 'doctor',
            createdAt: '2025-12-14T10:30:00Z',
          },
        ],
        meta: {
          page: 1,
          limit: 10,
          total: 50,
          totalPages: 5,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No autorizado - requiere rol admin' })
  findAll(@Query() query: QueryUserDto) {
    return this.usersService.findAllWithFilters(query);
  }

  @Get('doctors')
  @Roles(Role.admin)
  @ApiOperation({
    summary: 'Listar doctores (Admin)',
    description: 'Obtiene lista paginada de usuarios con rol doctor.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'Lista de doctores' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No autorizado - requiere rol admin' })
  findDoctors(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.usersService.findDoctors(page, limit);
  }

  @Get('patients')
  @Roles(Role.admin, Role.doctor)
  @ApiOperation({
    summary: 'Listar pacientes (Admin)',
    description: 'Obtiene lista paginada de usuarios con rol patient.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'Lista de pacientes' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No autorizado - requiere rol admin' })
  findPatients(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.usersService.findPatients(page, limit);
  }

  @Get('users/:id')
  @Roles(Role.admin)
  @ApiOperation({
    summary: 'Obtener usuario por ID (Admin)',
    description: 'Obtiene el detalle completo de un usuario específico.',
  })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Detalle del usuario' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No autorizado - requiere rol admin' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch('users/:id')
  @Roles(Role.admin)
  @ApiOperation({
    summary: 'Actualizar usuario (Admin)',
    description: 'Actualiza la información de un usuario existente.',
  })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No autorizado - requiere rol admin' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete('users/:id')
  @Roles(Role.admin)
  @ApiOperation({
    summary: 'Eliminar usuario (Admin)',
    description: 'Elimina un usuario del sistema. Esta acción eliminará en cascada los registros relacionados.',
  })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario eliminado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No autorizado - requiere rol admin' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
