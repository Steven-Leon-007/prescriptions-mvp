import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class MetricsService {
  constructor(private prisma: PrismaService) { }

  async getMetrics(from?: string, to?: string) {
    const dateFilter: any = {};

    if (from || to) {
      dateFilter.createdAt = {};
      if (from) dateFilter.createdAt.gte = new Date(from);
      if (to) dateFilter.createdAt.lte = new Date(to);
    }

    const [totalDoctors, totalPatients, totalPrescriptions] = await Promise.all([
      this.prisma.doctor.count(),
      this.prisma.patient.count(),
      this.prisma.prescription.count({ where: dateFilter }),
    ]);

    const [pendingCount, consumedCount] = await Promise.all([
      this.prisma.prescription.count({
        where: { ...dateFilter, status: 'pending' },
      }),
      this.prisma.prescription.count({
        where: { ...dateFilter, status: 'consumed' },
      }),
    ]);

    const prescriptionsByDay = await this.prisma.$queryRaw<
      Array<{ date: Date; count: number }>
    >(
      Prisma.sql`
    SELECT 
      DATE("createdAt") as date,
      COUNT(*) as count
    FROM "Prescription"
    ${from || to
          ? Prisma.sql`
          WHERE
            ${from ? Prisma.sql`"createdAt" >= ${new Date(from)}` : Prisma.empty}
            ${from && to ? Prisma.sql`AND` : Prisma.empty}
            ${to ? Prisma.sql`"createdAt" <= ${new Date(to)}` : Prisma.empty}
        `
          : Prisma.empty
        }
    GROUP BY DATE("createdAt")
    ORDER BY date DESC
    LIMIT 30
  `,
    );
    const topDoctors = await this.prisma.prescription.groupBy({
      by: ['authorId'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
      where: dateFilter,
    });

    const topDoctorsWithDetails = await Promise.all(
      topDoctors.map(async (item) => {
        const doctor = await this.prisma.doctor.findUnique({
          where: { id: item.authorId },
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        });

        return {
          doctorId: item.authorId,
          doctorName: doctor?.user.name,
          doctorEmail: doctor?.user.email,
          specialty: doctor?.specialty,
          count: item._count.id,
        };
      }),
    );

    return {
      totals: {
        doctors: totalDoctors,
        patients: totalPatients,
        prescriptions: totalPrescriptions,
      },
      byStatus: {
        pending: pendingCount,
        consumed: consumedCount,
      },
      byDay: prescriptionsByDay.map((item) => ({
        date: item.date.toISOString().split('T')[0],
        count: Number(item.count),
      })),
      topDoctors: topDoctorsWithDetails,
    };
  }
}
