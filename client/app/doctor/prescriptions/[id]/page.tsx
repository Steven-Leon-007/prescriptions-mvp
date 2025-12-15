'use client';

import { AuthGuard } from '@/lib/guards';
import { use, useEffect, useState } from 'react';
import { prescriptionsService } from '@/lib/prescriptions';
import { Prescription, PrescriptionStatus } from '@/types';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@/components';
import { toast } from 'react-toastify';

interface PrescriptionDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

const PrescriptionDetailPage = ({ params }: PrescriptionDetailPageProps) => {
  const { id } = use(params);
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const router = useRouter();

  useEffect(() => {
    loadPrescription();
  }, [id]);

  const loadPrescription = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await prescriptionsService.getDoctorPrescription(id);
      setPrescription(data);
    } catch (err: any) {
      const errorMessage = err.message || 'Error al cargar la prescripción';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <AuthGuard requiredRole="doctor">
        <div className="min-h-screen bg-[#fffefe] py-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#361951]"></div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (error && !prescription) {
    return (
      <AuthGuard requiredRole="doctor">
        <div className="min-h-screen bg-[#fffefe] py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
              {error}
            </div>
            <Button onClick={() => router.back()} variant="secondary">
              Volver
            </Button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!prescription) return null;

  return (
    <AuthGuard requiredRole="doctor">
      <div className="min-h-screen bg-[#fffefe] py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Button
              onClick={() => router.back()}
              variant="secondary"
              size="sm"
            >
              ← Volver
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
              {error}
            </div>
          )}

          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-bold text-[#361951] mb-2">
                  Prescripción #{prescription.code}
                </h1>
                <p className="text-gray-600">
                  Emitida el {formatDate(prescription.createdAt)}
                </p>
              </div>
              <span
                className={`px-4 py-2 rounded text-sm font-semibold self-start ${
                  prescription.status === PrescriptionStatus.pending
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {prescription.status === PrescriptionStatus.pending
                  ? 'Pendiente'
                  : 'Consumida'}
              </span>
            </div>
          </div>

          {prescription.patient?.user && (
            <Card className="mb-6 rounded-lg border border-gray-200 bg-white">
              <div className="p-6">
                <h2 className="text-xl font-bold text-[#361951] mb-4">
                  Información del Paciente
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nombre</p>
                    <p className="font-medium text-gray-800">
                      {prescription.patient.user.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-800">
                      {prescription.patient.user.email}
                    </p>
                  </div>
                  {prescription.patient.birthDate && (
                    <div>
                      <p className="text-sm text-gray-600">Fecha de nacimiento</p>
                      <p className="font-medium text-gray-800">
                        {formatDate(prescription.patient.birthDate)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {prescription.items && prescription.items.length > 0 && (
            <Card className="mb-6 rounded-lg border border-gray-200 bg-white">
              <div className="p-6">
                <h2 className="text-xl font-bold text-[#361951] mb-4">
                  Medicamentos Prescritos
                </h2>
                <div className="space-y-4">
                  {prescription.items.map((item, index) => (
                    <div
                      key={item.id}
                      className="border-l-4 border-[#bc862d] pl-4 py-2 bg-gray-50 rounded-r-md"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-gray-800 text-lg">
                          {index + 1}. {item.name}
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">Dosis</p>
                          <p className="font-medium text-gray-800">{item.dosage || 'No especificada'}</p>
                        </div>
                        {item.quantity && (
                          <div>
                            <p className="text-gray-600">Cantidad</p>
                            <p className="font-medium text-gray-800">{item.quantity}</p>
                          </div>
                        )}
                      </div>
                      {item.instructions && (
                        <div className="mt-3">
                          <p className="text-gray-600 text-sm">Instrucciones</p>
                          <p className="text-gray-800 text-sm">{item.instructions}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {prescription.notes && (
            <Card className="mb-6 rounded-lg border border-gray-200 bg-white">
              <div className="p-6">
                <h2 className="text-xl font-bold text-[#361951] mb-4">
                  Notas Adicionales
                </h2>
                <p className="text-gray-800 whitespace-pre-wrap">{prescription.notes}</p>
              </div>
            </Card>
          )}

          {prescription.consumedAt && (
            <Card className="mb-6 rounded-lg border border-gray-200 bg-gray-50">
              <div className="p-6">
                <h2 className="text-xl font-bold text-[#361951] mb-2">
                  Prescripción Consumida
                </h2>
                <p className="text-gray-600">
                  Esta prescripción fue consumida por el paciente el {formatDate(prescription.consumedAt)}
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </AuthGuard>
  );
};

export default PrescriptionDetailPage;
