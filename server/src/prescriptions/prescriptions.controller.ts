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

@Controller()
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post('prescriptions')
  @Roles(Role.doctor)
  create(
    @Body() createPrescriptionDto: CreatePrescriptionDto,
    @CurrentUser() user: any,
  ) {
    return this.prescriptionsService.create(createPrescriptionDto, user.id);
  }

  @Get('prescriptions')
  @Roles(Role.doctor)
  findAllDoctor(
    @Query() query: QueryDoctorPrescriptionDto,
    @CurrentUser() user: any,
  ) {
    return this.prescriptionsService.findAllForDoctor(user.id, query);
  }

  @Get('prescriptions/:id')
  @Roles(Role.doctor)
  findOneDoctor(@Param('id') id: string, @CurrentUser() user: any) {
    return this.prescriptionsService.findOne(id, user.id, user.role);
  }

  @Get('me/prescriptions')
  @Roles(Role.patient)
  findAllPatient(
    @Query() query: QueryPrescriptionDto,
    @CurrentUser() user: any,
  ) {
    return this.prescriptionsService.findAllForPatient(user.id, query);
  }

  @Patch('prescriptions/:id/consume')
  @Roles(Role.patient)
  consume(@Param('id') id: string, @CurrentUser() user: any) {
    return this.prescriptionsService.consume(id, user.id);
  }

  @Get('prescriptions/:id/pdf')
  @Roles(Role.patient)
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
  findAllAdmin(@Query() query: QueryAdminPrescriptionDto) {
    return this.prescriptionsService.findAllForAdmin(query);
  }
}
