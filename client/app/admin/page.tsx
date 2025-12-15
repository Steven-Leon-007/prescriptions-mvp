'use client';

import { AuthGuard } from '@/lib/guards';
import { useEffect, useState } from 'react';
import { adminService } from '@/lib/admin';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@/components';
import { toast } from 'react-toastify';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface Metrics {
  totals: {
    doctors: number;
    patients: number;
    prescriptions: number;
  };
  byStatus: {
    pending: number;
    consumed: number;
  };
  byDay: Array<{
    date: string;
    count: number;
  }>;
  topDoctors: Array<{
    doctorId: string;
    doctorName: string;
    doctorEmail: string;
    specialty?: string | null;
    count: number;
  }>;
}

const AdminPage = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: '',
    to: '',
  });

  const router = useRouter();

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await adminService.getMetrics(dateRange.from || undefined, dateRange.to || undefined);
      setMetrics(data);
    } catch (err: any) {
      const errorMessage = err.message || 'Error al cargar las métricas';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = () => {
    loadMetrics();
  };

  if (isLoading) {
    return (
      <AuthGuard requiredRole="admin">
        <div className="min-h-screen bg-[#fffefe] py-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#361951]"></div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (error || !metrics) {
    return (
      <AuthGuard requiredRole="admin">
        <div className="min-h-screen bg-[#fffefe] py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
              {error || 'Error al cargar las métricas'}
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const statusChartData = {
    labels: ['Pendientes', 'Consumidas'],
    datasets: [
      {
        data: [metrics.byStatus.pending, metrics.byStatus.consumed],
        backgroundColor: ['#3B82F6', '#6B7280'],
        borderColor: ['#2563EB', '#4B5563'],
        borderWidth: 1,
      },
    ],
  };

  const dailyChartData = {
    labels: metrics.byDay.map((item) => {
      const date = new Date(item.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }).reverse(),
    datasets: [
      {
        label: 'Prescripciones',
        data: metrics.byDay.map((item) => item.count).reverse(),
        borderColor: '#bc862d',
        backgroundColor: 'rgba(188, 134, 45, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const topDoctorsChartData = {
    labels: metrics.topDoctors.slice(0, 5).map((doctor) => doctor.doctorName),
    datasets: [
      {
        label: 'Prescripciones',
        data: metrics.topDoctors.slice(0, 5).map((doctor) => doctor.count),
        backgroundColor: '#361951',
        borderColor: '#2a1340',
        borderWidth: 1,
      },
    ],
  };

  return (
    <AuthGuard requiredRole="admin">
      <div className="min-h-screen bg-[#fffefe] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[#361951] mb-2">
                Panel de Administración
              </h1>
              <p className="text-gray-600">
                Estadísticas y métricas del sistema
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push('/admin/users/new')}
            >
              + Crear Usuario
            </Button>
          </div>

          {/* Filtros de fecha */}
          <Card className="mb-6 rounded-lg border border-gray-200 bg-white">
            <div className="p-6">
              <h2 className="text-lg font-bold text-[#361951] mb-4">
                Filtrar por Rango de Fechas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Desde
                  </label>
                  <input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#361951]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hasta
                  </label>
                  <input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#361951]"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    variant="secondary"
                    onClick={handleFilterChange}
                    className="flex-1"
                  >
                    Aplicar
                  </Button>
                  <Button
                    variant="filter"
                    onClick={() => {
                      setDateRange({ from: '', to: '' });
                      setTimeout(loadMetrics, 100);
                    }}
                    className="flex-1"
                  >
                    Limpiar
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Tarjetas de Totales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="rounded-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Total Doctores</h3>
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-4xl font-bold text-[#361951]">{metrics.totals.doctors}</p>
              </div>
            </Card>

            <Card className="rounded-lg border border-gray-200 bg-gradient-to-br from-green-50 to-green-100">
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Total Pacientes</h3>
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <p className="text-4xl font-bold text-[#361951]">{metrics.totals.patients}</p>
              </div>
            </Card>

            <Card className="rounded-lg border border-gray-200 bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">Total Prescripciones</h3>
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-4xl font-bold text-[#361951]">{metrics.totals.prescriptions}</p>
              </div>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Estado de Prescripciones */}
            <Card className="rounded-lg border border-gray-200 bg-white">
              <div className="p-6">
                <h2 className="text-xl font-bold text-[#361951] mb-4">
                  Prescripciones por Estado
                </h2>
                <div className="flex justify-center">
                  <div style={{ maxWidth: '300px', width: '100%' }}>
                    <Doughnut 
                      data={statusChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                          legend: {
                            position: 'bottom',
                          },
                        },
                      }}
                    />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{metrics.byStatus.pending}</p>
                    <p className="text-sm text-gray-600">Pendientes</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-600">{metrics.byStatus.consumed}</p>
                    <p className="text-sm text-gray-600">Consumidas</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Top Doctores */}
            <Card className="rounded-lg border border-gray-200 bg-white">
              <div className="p-6">
                <h2 className="text-xl font-bold text-[#361951] mb-4">
                  Top 5 Doctores por Volumen
                </h2>
                <Bar 
                  data={topDoctorsChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          precision: 0,
                        },
                      },
                    },
                  }}
                />
              </div>
            </Card>
          </div>

          {/* Gráfico de Serie por Día */}
          <Card className="mb-6 rounded-lg border border-gray-200 bg-white">
            <div className="p-6">
              <h2 className="text-xl font-bold text-[#361951] mb-4">
                Prescripciones por Día (Últimos 30 días)
              </h2>
              <Line 
                data={dailyChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        precision: 0,
                      },
                    },
                  },
                }}
              />
            </div>
          </Card>

          {/* Lista de Top Doctores */}
          {metrics.topDoctors.length > 0 && (
            <Card className="rounded-lg border border-gray-200 bg-white">
              <div className="p-6">
                <h2 className="text-xl font-bold text-[#361951] mb-4">
                  Detalle de Top Doctores
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Doctor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Especialidad
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Prescripciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {metrics.topDoctors.map((doctor, index) => (
                        <tr key={doctor.doctorId}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{doctor.doctorName}</div>
                            <div className="text-sm text-gray-500">{doctor.doctorEmail}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {doctor.specialty || 'No especificada'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-[#361951] text-white">
                              {doctor.count}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </AuthGuard>
  );
};

export default AdminPage;
