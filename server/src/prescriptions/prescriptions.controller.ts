import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
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

@Controller()
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Post('prescriptions')
  @Roles(Role.DOCTOR)
  create(
    @Body() createPrescriptionDto: CreatePrescriptionDto,
    @CurrentUser() user: any,
  ) {
    return this.prescriptionsService.create(createPrescriptionDto, user.id);
  }

  @Get('prescriptions')
  @Roles(Role.DOCTOR)
  findAllDoctor(
    @Query() query: QueryDoctorPrescriptionDto,
    @CurrentUser() user: any,
  ) {
    return this.prescriptionsService.findAllForDoctor(user.id, query);
  }

  @Get('prescriptions/:id')
  @Roles(Role.DOCTOR)
  findOneDoctor(@Param('id') id: string, @CurrentUser() user: any) {
    return this.prescriptionsService.findOne(id, user.id, user.role);
  }

  @Get('me/prescriptions')
  @Roles(Role.PATIENT)
  findAllPatient(
    @Query() query: QueryPrescriptionDto,
    @CurrentUser() user: any,
  ) {
    return this.prescriptionsService.findAllForPatient(user.id, query);
  }

  @Patch('prescriptions/:id/consume')
  @Roles(Role.PATIENT)
  consume(@Param('id') id: string, @CurrentUser() user: any) {
    return this.prescriptionsService.consume(id, user.id);
  }

  @Get('admin/prescriptions')
  @Roles(Role.ADMIN)
  findAllAdmin(@Query() query: QueryAdminPrescriptionDto) {
    return this.prescriptionsService.findAllForAdmin(query);
  }
}
