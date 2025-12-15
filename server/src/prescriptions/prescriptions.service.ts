import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import {
  QueryPrescriptionDto,
  QueryDoctorPrescriptionDto,
  QueryAdminPrescriptionDto,
} from './dto/query-prescription.dto';
import { PrescriptionStatus } from '@prisma/client';
import { PdfService } from './pdf.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrescriptionsService {
  constructor(
    private prisma: PrismaService,
    private pdfService: PdfService,
    private configService: ConfigService,
  ) { }

  async create(createPrescriptionDto: CreatePrescriptionDto, doctorId: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { userId: doctorId },
    });

    if (!doctor) {
      throw new ForbiddenException('Solo los doctores pueden crear prescripciones');
    }

    const patient = await this.prisma.patient.findUnique({
      where: { id: createPrescriptionDto.patientId },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    const code = await this.generateUniqueCode();

    const prescription = await this.prisma.prescription.create({
      data: {
        code,
        patientId: createPrescriptionDto.patientId,
        authorId: doctor.id,
        notes: createPrescriptionDto.notes,
        items: {
          create: createPrescriptionDto.items,
        },
      },
      include: {
        items: true,
        patient: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        author: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return prescription;
  }

  async findAllForDoctor(
    doctorUserId: string,
    query: QueryDoctorPrescriptionDto,
  ) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { userId: doctorUserId },
    });

    if (!doctor) {
      throw new ForbiddenException('No tienes permisos de doctor');
    }

    const { mine, status, from, to, page = 1, limit = 10, order = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (mine === 'true') {
      where.authorId = doctor.id;
    }

    if (status) {
      where.status = status;
    }

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const [prescriptions, total] = await Promise.all([
      this.prisma.prescription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: order as 'asc' | 'desc' },
        include: {
          items: true,
          patient: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          author: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.prescription.count({ where }),
    ]);

    return {
      data: prescriptions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAllForPatient(
    patientUserId: string,
    query: QueryPrescriptionDto,
  ) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId: patientUserId },
    });

    if (!patient) {
      throw new ForbiddenException('No tienes permisos de paciente');
    }

    const { status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      patientId: patient.id,
    };

    if (status) {
      where.status = status;
    }

    const [prescriptions, total] = await Promise.all([
      this.prisma.prescription.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { status: 'asc' },
          { createdAt: 'desc' }
        ],
        include: {
          items: true,
          author: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.prescription.count({ where }),
    ]);

    return {
      data: prescriptions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAllForAdmin(query: QueryAdminPrescriptionDto) {
    const {
      status,
      doctorId,
      patientId,
      from,
      to,
      page = 1,
      limit = 10,
    } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (doctorId) {
      where.authorId = doctorId;
    }

    if (patientId) {
      where.patientId = patientId;
    }

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const [prescriptions, total] = await Promise.all([
      this.prisma.prescription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          patient: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          author: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.prescription.count({ where }),
    ]);

    return {
      data: prescriptions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string, role: string) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      include: {
        items: true,
        patient: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        author: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!prescription) {
      throw new NotFoundException('Prescripción no encontrada');
    }

    if (role === 'patient') {
      const patient = await this.prisma.patient.findUnique({
        where: { userId },
      });

      if (prescription.patientId !== patient?.id) {
        throw new ForbiddenException(
          'No tienes permiso para ver esta prescripción',
        );
      }
    } else if (role === 'doctor') {
      const doctor = await this.prisma.doctor.findUnique({
        where: { userId },
      });

      if (prescription.authorId !== doctor?.id) {
        throw new ForbiddenException(
          'No tienes permiso para ver esta prescripción',
        );
      }
    }

    return prescription;
  }

  async consume(id: string, patientUserId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId: patientUserId },
    });

    if (!patient) {
      throw new ForbiddenException('No tienes permisos de paciente');
    }

    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
    });

    if (!prescription) {
      throw new NotFoundException('Prescripción no encontrada');
    }

    if (prescription.patientId !== patient.id) {
      throw new ForbiddenException(
        'No tienes permiso para consumir esta prescripción',
      );
    }

    if (prescription.status === PrescriptionStatus.consumed) {
      throw new BadRequestException('Esta prescripción ya fue consumida');
    }

    const updated = await this.prisma.prescription.update({
      where: { id },
      data: {
        status: PrescriptionStatus.consumed,
        consumedAt: new Date(),
      },
      include: {
        items: true,
        author: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return updated;
  }

  async generatePdf(id: string, patientUserId: string): Promise<Buffer> {
    const patient = await this.prisma.patient.findUnique({
      where: { userId: patientUserId },
    });

    if (!patient) {
      throw new ForbiddenException('No tienes permisos de paciente');
    }

    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      include: {
        items: true,
        patient: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        author: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!prescription) {
      throw new NotFoundException('Prescripción no encontrada');
    }

    if (prescription.patientId !== patient.id) {
      throw new ForbiddenException(
        'No tienes permiso para descargar esta prescripción',
      );
    }

    const frontendUrl =
      this.configService.get('APP_ORIGIN') || 'http://localhost:3000';

    return this.pdfService.generatePrescriptionPdf(prescription, frontendUrl);
  }

  private async generateUniqueCode(): Promise<string> {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 9000) + 1000;
    const code = `RX-${year}-${randomNum}`;

    const existing = await this.prisma.prescription.findUnique({
      where: { code },
    });

    if (existing) {
      return this.generateUniqueCode();
    }

    return code;
  }
}
