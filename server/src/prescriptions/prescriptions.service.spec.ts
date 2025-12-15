import { Test, TestingModule } from '@nestjs/testing';
import { PrescriptionsService } from './prescriptions.service';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from './pdf.service';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('PrescriptionsService', () => {
  let service: PrescriptionsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    doctor: {
      findUnique: jest.fn(),
    },
    patient: {
      findUnique: jest.fn(),
    },
    prescription: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockPdfService = {
    generatePrescriptionPdf: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'APP_ORIGIN') return 'http://localhost:3000';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrescriptionsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: PdfService,
          useValue: mockPdfService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<PrescriptionsService>(PrescriptionsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a prescription successfully', async () => {
      const createDto = {
        patientId: 'patient-id',
        notes: 'Test notes',
        items: [
          {
            name: 'Amoxicilina',
            dosage: '500mg',
            quantity: 10,
            instructions: 'Cada 8 horas',
          },
        ],
      };

      const mockDoctor = {
        id: 'doctor-id',
        userId: 'doctor-user-id',
        specialty: 'Cardiología',
      };

      const mockPatient = {
        id: 'patient-id',
        userId: 'patient-user-id',
        birthDate: new Date(),
      };

      const mockPrescription = {
        id: 'prescription-id',
        code: 'RX-2025-1234',
        status: 'pending',
        notes: createDto.notes,
        patientId: createDto.patientId,
        authorId: mockDoctor.id,
        createdAt: new Date(),
        consumedAt: null,
        items: createDto.items.map((item, i) => ({ ...item, id: `item-${i}` })),
        patient: {
          ...mockPatient,
          user: {
            id: 'patient-user-id',
            name: 'Patient Name',
            email: 'patient@test.com',
          },
        },
        author: {
          ...mockDoctor,
          user: {
            id: 'doctor-user-id',
            name: 'Doctor Name',
            email: 'doctor@test.com',
          },
        },
      };

      mockPrismaService.doctor.findUnique.mockResolvedValue(mockDoctor);
      mockPrismaService.patient.findUnique.mockResolvedValue(mockPatient);
      mockPrismaService.prescription.findUnique.mockResolvedValue(null);
      mockPrismaService.prescription.create.mockResolvedValue(mockPrescription);

      const result = await service.create(createDto, 'doctor-user-id');

      expect(result).toEqual(mockPrescription);
      expect(mockPrismaService.doctor.findUnique).toHaveBeenCalledWith({
        where: { userId: 'doctor-user-id' },
      });
      expect(mockPrismaService.patient.findUnique).toHaveBeenCalledWith({
        where: { id: createDto.patientId },
      });
    });

    it('should throw ForbiddenException if user is not a doctor', async () => {
      mockPrismaService.doctor.findUnique.mockResolvedValue(null);

      await expect(
        service.create(
          { patientId: 'patient-id', items: [] },
          'non-doctor-user-id',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if patient does not exist', async () => {
      mockPrismaService.doctor.findUnique.mockResolvedValue({ id: 'doctor-id' });
      mockPrismaService.patient.findUnique.mockResolvedValue(null);

      await expect(
        service.create({ patientId: 'invalid-patient-id', items: [] }, 'doctor-user-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('consume', () => {
    it('should mark prescription as consumed', async () => {
      const prescriptionId = 'prescription-id';
      const patientUserId = 'patient-user-id';

      const mockPatient = {
        id: 'patient-id',
        userId: patientUserId,
      };

      const mockPrescription = {
        id: prescriptionId,
        status: 'pending',
        patientId: mockPatient.id,
      };

      const mockUpdatedPrescription = {
        ...mockPrescription,
        status: 'consumed',
        consumedAt: new Date(),
        items: [],
        author: {
          user: { id: 'doctor-id', name: 'Dr. Test', email: 'dr@test.com' },
        },
      };

      mockPrismaService.patient.findUnique.mockResolvedValue(mockPatient);
      mockPrismaService.prescription.findUnique.mockResolvedValue(mockPrescription);
      mockPrismaService.prescription.update.mockResolvedValue(mockUpdatedPrescription);

      const result = await service.consume(prescriptionId, patientUserId);

      expect(result.status).toBe('consumed');
      expect(mockPrismaService.prescription.update).toHaveBeenCalledWith({
        where: { id: prescriptionId },
        data: {
          status: 'consumed',
          consumedAt: expect.any(Date),
        },
        include: expect.any(Object),
      });
    });

    it('should throw ForbiddenException if prescription does not belong to patient', async () => {
      const mockPatient = {
        id: 'patient-id',
        userId: 'patient-user-id',
      };

      const mockPrescription = {
        id: 'prescription-id',
        status: 'pending',
        patientId: 'different-patient-id',
      };

      mockPrismaService.patient.findUnique.mockResolvedValue(mockPatient);
      mockPrismaService.prescription.findUnique.mockResolvedValue(mockPrescription);

      await expect(
        service.consume('prescription-id', 'patient-user-id'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if prescription is already consumed', async () => {
      const mockPatient = {
        id: 'patient-id',
        userId: 'patient-user-id',
      };

      const mockPrescription = {
        id: 'prescription-id',
        status: 'consumed',
        patientId: mockPatient.id,
      };

      mockPrismaService.patient.findUnique.mockResolvedValue(mockPatient);
      mockPrismaService.prescription.findUnique.mockResolvedValue(mockPrescription);

      await expect(
        service.consume('prescription-id', 'patient-user-id'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAllForPatient', () => {
    it('should return paginated prescriptions for patient', async () => {
      const patientUserId = 'patient-user-id';
      const mockPatient = {
        id: 'patient-id',
        userId: patientUserId,
      };

      const mockPrescriptions = [
        {
          id: 'prescription-1',
          code: 'RX-2025-0001',
          status: 'pending',
          patientId: mockPatient.id,
          items: [],
          author: {
            user: { id: 'doctor-id', name: 'Dr. Test', email: 'dr@test.com' },
          },
        },
      ];

      mockPrismaService.patient.findUnique.mockResolvedValue(mockPatient);
      mockPrismaService.prescription.findMany.mockResolvedValue(mockPrescriptions);
      mockPrismaService.prescription.count.mockResolvedValue(1);

      const result = await service.findAllForPatient(patientUserId, {});

      expect(result.data).toEqual(mockPrescriptions);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
    });
  });
});
