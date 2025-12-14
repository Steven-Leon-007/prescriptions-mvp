import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MetricsService {
  constructor(private prisma: PrismaService) {}

  async getMetrics(from?: string, to?: string) {
    const dateFilter: any = {};

    if (from || to) {
      dateFilter.createdAt = {};
      if (from) dateFilter.createdAt.gte = new Date(from);
      if (to) dateFilter.createdAt.lte = new Date(to);
    }

    // Totales
    const [totalDoctors, totalPatients, totalPrescriptions] = await Promise.all([
      this.prisma.doctor.count(),
      this.prisma.patient.count(),
      this.prisma.prescription.count({ where: dateFilter }),
    ]);

    // Por estado
    const [pendingCount, consumedCount] = await Promise.all([
      this.prisma.prescription.count({
        where: { ...dateFilter, status: 'pending' },
      }),
      this.prisma.prescription.count({
        where: { ...dateFilter, status: 'consumed' },
      }),
    ]);

    // Por día
    const prescriptionsByDay = await this.prisma.$queryRaw<
      Array<{ date: Date; count: bigint }>
    >`
      SELECT 
        DATE(created_at) as date,
        COUNT(*)::integer as count
      FROM "Prescription"
      ${from || to ? `WHERE ${from ? `created_at >= ${new Date(from)}::timestamp` : ''} ${from && to ? 'AND' : ''} ${to ? `created_at <= ${new Date(to)}::timestamp` : ''}` : ''}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `;

    // Top doctores
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
