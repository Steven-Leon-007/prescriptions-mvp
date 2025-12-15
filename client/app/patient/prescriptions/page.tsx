'use client';

import { AuthGuard } from '@/lib/guards';
import { useEffect, useState } from 'react';
import { prescriptionsService } from '@/lib/prescriptions';
import { Prescription, PrescriptionStatus } from '@/types';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components';
import { useAuthStore } from '@/store';

const PatientPrescriptionsPage = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'consumed'>('all');
  const { user } = useAuthStore();

  const router = useRouter();

  useEffect(() => {
    loadPrescriptions();
  }, [page, statusFilter]);

  const loadPrescriptions = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await prescriptionsService.getMyPrescriptions({
        page,
        limit: 10,
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });
      setPrescriptions(response.data);
      setTotalPages(response.meta.totalPages);
    } catch (err: any) {
      setError(err.message || 'Error al cargar las prescripciones');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrescriptionClick = (id: string) => {
    router.push(`/patient/prescriptions/${id}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <AuthGuard requiredRole="patient">
      <div className="min-h-screen bg-[#fffefe] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#361951] mb-2">
              Mis Prescripciones - {user?.name}
            </h1>
            <p className="text-gray-600">
              Consulta y descarga tus prescripciones médicas
            </p>
          </div>

          <div className="mb-6 flex flex-wrap gap-3">
            <Button
              variant="filter"
              isActive={statusFilter === 'all'}
              onClick={() => setStatusFilter('all')}
            >
              Todas
            </Button>
            <Button
              variant="filter"
              isActive={statusFilter === 'pending'}
              onClick={() => setStatusFilter('pending')}
            >
              Pendientes
            </Button>
            <Button
              variant="filter"
              isActive={statusFilter === 'consumed'}
              onClick={() => setStatusFilter('consumed')}
            >
              Consumidas
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#361951]"></div>
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No tienes prescripciones</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {prescriptions.map((prescription) => (
                  <Card
                    key={prescription.id}
                    onClick={() => handlePrescriptionClick(prescription.id)}
                    className="cursor-pointer hover:shadow-md transition-shadow duration-300 rounded-lg border border-gray-200 bg-gray-50"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <span
                          className={`px-3 py-1 rounded text-xs font-semibold ${prescription.status === PrescriptionStatus.pending
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                            }`}
                        >
                          {prescription.status === PrescriptionStatus.pending
                            ? 'Pendiente'
                            : 'Consumida'}
                        </span>
                        <span className="text-xs text-gray-500">
                          #{prescription.code}
                        </span>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm text-gray-600">Fecha de emisión</p>
                        <p className="font-semibold text-[#361951]">
                          {formatDate(prescription.createdAt)}
                        </p>
                      </div>

                      {prescription.author?.user && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600">Doctor</p>
                          <p className="font-medium text-gray-800">
                            {prescription.author.user.name}
                          </p>
                          {prescription.author.specialty && (
                            <p className="text-xs text-gray-500">
                              {prescription.author.specialty}
                            </p>
                          )}
                        </div>
                      )}

                      {prescription.items && prescription.items.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 mb-2">Medicamentos</p>
                          <div className="space-y-1">
                            {prescription.items.slice(0, 2).map((item) => (
                              <p key={item.id} className="text-sm text-gray-800">
                                - {item.name}
                              </p>
                            ))}
                            {prescription.items.length > 2 && (
                              <p className="text-xs text-gray-500">
                                +{prescription.items.length - 2} más
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {prescription.notes && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600">Notas</p>
                          <p className="text-sm text-gray-800 line-clamp-2">
                            {prescription.notes}
                          </p>
                        </div>
                      )}

                      {prescription.consumedAt && (
                        <div className="pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500">
                            Consumida el {formatDate(prescription.consumedAt)}
                          </p>
                        </div>
                      )}

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <button className="text-[#bc862d] hover:text-[#a67628] font-medium text-sm flex items-center gap-2 cursor-pointer">
                          Ver detalles
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Anterior
                  </button>
                  <span className="px-4 py-2 text-gray-700">
                    Página {page} de {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AuthGuard>
  );
};

export default PatientPrescriptionsPage;
