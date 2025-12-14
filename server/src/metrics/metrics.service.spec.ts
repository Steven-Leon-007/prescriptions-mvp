import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from './metrics.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MetricsService', () => {
  let service: MetricsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    doctor: {
      count: jest.fn(),
      findUnique: jest.fn(),
    },
    patient: {
      count: jest.fn(),
    },
    prescription: {
      count: jest.fn(),
      groupBy: jest.fn(),
      findUnique: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMetrics', () => {
    it('should return metrics with totals, byStatus, byDay and topDoctors', async () => {
      const mockByDay = [
        { date: new Date('2025-12-13'), count: 5 },
        { date: new Date('2025-12-12'), count: 3 },
      ];

      const mockTopDoctors = [
        {
          authorId: 'doctor-id-1',
          _count: { id: 10 },
        },
      ];

      const mockDoctor = {
        id: 'doctor-id-1',
        specialty: 'Cardiología',
        user: {
          name: 'Dr. Juan Pérez',
          email: 'dr@test.com',
        },
      };

      mockPrismaService.doctor.count.mockResolvedValue(5);
      mockPrismaService.patient.count.mockResolvedValue(20);
      mockPrismaService.prescription.count
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(30)
        .mockResolvedValueOnce(20);
      mockPrismaService.$queryRaw.mockResolvedValue(mockByDay);
      mockPrismaService.prescription.groupBy.mockResolvedValue(mockTopDoctors);
      mockPrismaService.doctor.findUnique.mockResolvedValue(mockDoctor);

      const result = await service.getMetrics();

      expect(result.totals).toEqual({
        doctors: 5,
        patients: 20,
        prescriptions: 50,
      });

      expect(result.byStatus).toEqual({
        pending: 30,
        consumed: 20,
      });

      expect(result.byDay).toHaveLength(2);
      expect(result.byDay[0].date).toBe('2025-12-13');
      expect(result.byDay[0].count).toBe(5);

      expect(result.topDoctors).toHaveLength(1);
      expect(result.topDoctors[0]).toEqual({
        doctorId: 'doctor-id-1',
        doctorName: 'Dr. Juan Pérez',
        doctorEmail: 'dr@test.com',
        specialty: 'Cardiología',
        count: 10,
      });
    });

    it('should handle date filters correctly', async () => {
      mockPrismaService.doctor.count.mockResolvedValue(5);
      mockPrismaService.patient.count.mockResolvedValue(20);
      mockPrismaService.prescription.count.mockResolvedValue(10);
      mockPrismaService.$queryRaw.mockResolvedValue([]);
      mockPrismaService.prescription.groupBy.mockResolvedValue([]);

      const result = await service.getMetrics('2025-01-01', '2025-12-31');

      expect(mockPrismaService.prescription.count).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: new Date('2025-01-01'),
            lte: new Date('2025-12-31'),
          },
        },
      });

      expect(result.totals.prescriptions).toBe(10);
    });
  });
});
