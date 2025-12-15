import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import {
  QueryPrescriptionDto,
  QueryDoctorPrescriptionDto,
  QueryAdminPrescriptionDto,
} from './dto/query-prescription.dto';
import { Roles, Role } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Prescriptions')
@ApiCookieAuth('cookie-auth')
@Controller()
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post('prescriptions')
  @Roles(Role.doctor)
  @ApiOperation({
    summary: 'Crear nueva prescripción (Doctor)',
    description: 'Permite a un doctor crear una prescripción para un paciente con múltiples medicamentos.',
  })
  @ApiResponse({
    status: 201,
    description: 'Prescripción creada exitosamente',
    schema: {
      example: {
        id: 'clg1h2j3k4l5m6n7o8p9',
        doctorId: 'clg1h2j3k4l5m6n7o8p9',
        patientId: 'clg9i0j1k2l3m4n5o6p7',
        notes: 'Tratamiento para dolor de cabeza',
        status: 'pending',
        createdAt: '2025-12-14T10:30:00Z',
        items: [
          {
            id: 'clh1i2j3k4l5m6n7o8p9',
            name: 'Ibuprofeno',
            dosage: '400mg',
            quantity: 20,
            instructions: 'Cada 8 horas',
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No autorizado - requiere rol doctor' })
  @ApiResponse({ status: 404, description: 'Paciente no encontrado' })
  create(
    @Body() createPrescriptionDto: CreatePrescriptionDto,
    @CurrentUser() user: any,
  ) {
    return this.prescriptionsService.create(createPrescriptionDto, user.id);
  }

  @Get('prescriptions')
  @Roles(Role.doctor)
  @ApiOperation({
    summary: 'Listar prescripciones del doctor (Doctor)',
    description: 'Obtiene todas las prescripciones creadas por el doctor autenticado con paginación y filtros.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Cantidad de resultados por página' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'consumed'], description: 'Estado de la prescripción' })
  @ApiQuery({ name: 'from', required: false, type: String, description: 'Fecha inicial (ISO format: YYYY-MM-DD)', example: '2025-01-01' })
  @ApiQuery({ name: 'to', required: false, type: String, description: 'Fecha final (ISO format: YYYY-MM-DD)', example: '2025-12-31' })
  @ApiQuery({ name: 'order', required: false, type: String, description: 'Orden de resultados', example: 'desc' })
  @ApiQuery({ name: 'mine', required: false, type: String, description: 'Filtrar prescripciones propias' })
  @ApiResponse({
    status: 200,
    description: 'Lista de prescripciones',
    schema: {
      example: {
        data: [
          {
            id: 'clg1h2j3k4l5m6n7o8p9',
            patientId: 'clg9i0j1k2l3m4n5o6p7',
            patient: { name: 'Juan Pérez' },
            status: 'pending',
            createdAt: '2025-12-14T10:30:00Z',
            itemsCount: 2,
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
  @ApiResponse({ status: 403, description: 'No autorizado - requiere rol doctor' })
  findAllDoctor(
    @Query() query: QueryDoctorPrescriptionDto,
    @CurrentUser() user: any,
  ) {
    return this.prescriptionsService.findAllForDoctor(user.id, query);
  }

  @Get('prescriptions/:id')
  @Roles(Role.doctor)
  @ApiOperation({
    summary: 'Ver detalle de prescripción (Doctor)',
    description: 'Obtiene el detalle completo de una prescripción específica creada por el doctor.',
  })
  @ApiParam({ name: 'id', description: 'ID de la prescripción' })
  @ApiResponse({
    status: 200,
    description: 'Detalle de la prescripción',
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Prescripción no encontrada' })
  findOneDoctor(@Param('id') id: string, @CurrentUser() user: any) {
    return this.prescriptionsService.findOne(id, user.id, user.role);
  }

  @Get('me/prescriptions')
  @Roles(Role.patient)
  @ApiOperation({
    summary: 'Listar mis prescripciones (Patient)',
    description: 'Obtiene todas las prescripciones del paciente autenticado con paginación.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Cantidad de resultados por página' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'consumed'], description: 'Estado de la prescripción' })
  @ApiQuery({ name: 'from', required: false, type: String, description: 'Fecha inicial (ISO format: YYYY-MM-DD)', example: '2025-01-01' })
  @ApiQuery({ name: 'to', required: false, type: String, description: 'Fecha final (ISO format: YYYY-MM-DD)', example: '2025-12-31' })
  @ApiQuery({ name: 'order', required: false, type: String, description: 'Orden de resultados', example: 'desc' })
  @ApiResponse({
    status: 200,
    description: 'Lista de prescripciones del paciente',
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No autorizado - requiere rol patient' })
  findAllPatient(
    @Query() query: QueryPrescriptionDto,
    @CurrentUser() user: any,
  ) {
    return this.prescriptionsService.findAllForPatient(user.id, query);
  }

  @Get('me/prescriptions/:id')
  @Roles(Role.patient)
  @ApiOperation({
    summary: 'Ver detalle de mi prescripción (Patient)',
    description: 'Obtiene el detalle completo de una prescripción específica del paciente autenticado.',
  })
  @ApiParam({ name: 'id', description: 'ID de la prescripción' })
  @ApiResponse({
    status: 200,
    description: 'Detalle de la prescripción',
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No autorizado - solo puedes ver tus propias prescripciones' })
  @ApiResponse({ status: 404, description: 'Prescripción no encontrada' })
  findOnePatient(@Param('id') id: string, @CurrentUser() user: any) {
    return this.prescriptionsService.findOne(id, user.id, user.role);
  }

  @Patch('prescriptions/:id/consume')
  @Roles(Role.patient)
  @ApiOperation({
    summary: 'Marcar prescripción como consumida (Patient)',
    description: 'Permite al paciente marcar una prescripción como consumida. Esta acción no es reversible.',
  })
  @ApiParam({ name: 'id', description: 'ID de la prescripción' })
  @ApiResponse({
    status: 200,
    description: 'Prescripción marcada como consumida',
    schema: {
      example: {
        id: 'clg1h2j3k4l5m6n7o8p9',
        status: 'consumed',
        consumedAt: '2025-12-14T15:45:00Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Prescripción no encontrada' })
  @ApiResponse({ status: 400, description: 'La prescripción ya fue consumida' })
  consume(@Param('id') id: string, @CurrentUser() user: any) {
    return this.prescriptionsService.consume(id, user.id);
  }

  @Get('prescriptions/:id/pdf')
  @Roles(Role.patient)
  @ApiOperation({
    summary: 'Descargar prescripción en PDF (Patient)',
    description: 'Genera y descarga la prescripción en formato PDF con código QR para verificación.',
  })
  @ApiParam({ name: 'id', description: 'ID de la prescripción' })
  @ApiResponse({
    status: 200,
    description: 'PDF generado exitosamente',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Prescripción no encontrada' })
  async downloadPdf(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const pdfBuffer = await this.prescriptionsService.generatePdf(id, user.id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="prescripcion-${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    return new StreamableFile(pdfBuffer);
  }

  @Get('admin/prescriptions')
  @Roles(Role.admin)
  @ApiOperation({
    summary: 'Listar todas las prescripciones (Admin)',
    description: 'Obtiene todas las prescripciones del sistema con filtros avanzados y paginación.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Número de página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Cantidad de resultados por página' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'consumed'], description: 'Estado de la prescripción' })
  @ApiQuery({ name: 'from', required: false, type: String, description: 'Fecha inicial (ISO format: YYYY-MM-DD)', example: '2025-01-01' })
  @ApiQuery({ name: 'to', required: false, type: String, description: 'Fecha final (ISO format: YYYY-MM-DD)', example: '2025-12-31' })
  @ApiQuery({ name: 'order', required: false, type: String, description: 'Orden de resultados', example: 'desc' })
  @ApiQuery({ name: 'doctorId', required: false, type: String, description: 'Filtrar por ID del doctor' })
  @ApiQuery({ name: 'patientId', required: false, type: String, description: 'Filtrar por ID del paciente' })
  @ApiResponse({
    status: 200,
    description: 'Lista completa de prescripciones',
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'No autorizado - requiere rol admin' })
  findAllAdmin(@Query() query: QueryAdminPrescriptionDto) {
    return this.prescriptionsService.findAllForAdmin(query);
  }
}
