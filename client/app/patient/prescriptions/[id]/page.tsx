'use client';

import { AuthGuard } from '@/lib/guards';
import { use, useEffect, useState } from 'react';
import { prescriptionsService } from '@/lib/prescriptions';
import { Prescription, PrescriptionStatus } from '@/types';
import { useRouter } from 'next/navigation';
import { Button, Card, ConfirmDialog } from '@/components';
import { toast } from 'react-toastify';

interface PatientPrescriptionDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

const PatientPrescriptionDetailPage = ({ params }: PatientPrescriptionDetailPageProps) => {
  const { id } = use(params);
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isConsuming, setIsConsuming] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const router = useRouter();

  useEffect(() => {
    loadPrescription();
  }, [id]);

  const loadPrescription = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await prescriptionsService.getPrescription(id);
      setPrescription(data);
    }
    catch (err: any) {
      const errorMessage = err.message || 'Error al cargar la prescripción';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConsume = async () => {
    if (!prescription) return;

    setShowConfirmDialog(true);
  };

  const confirmConsume = async () => {
    setShowConfirmDialog(false);

    try {
      setIsConsuming(true);
      setError('');
      const updated = await prescriptionsService.consumePrescription(id);
      setPrescription(updated);
      toast.success('Prescripción marcada como consumida exitosamente');
    } catch (err: any) {
      const errorMessage = err.message || 'Error al consumir la prescripción';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsConsuming(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);
      setError('');
      const blob = await prescriptionsService.downloadPDF(id);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `prescripcion-${prescription?.code || id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('PDF descargado exitosamente');
    } catch (err: any) {
      const errorMessage = err.message || 'Error al descargar el PDF';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsDownloading(false);
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
      <AuthGuard requiredRole="patient">
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
      <AuthGuard requiredRole="patient">
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
    <AuthGuard requiredRole="patient">
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
                className={`px-4 py-2 rounded text-sm font-semibold self-start ${prescription.status === PrescriptionStatus.pending
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

          {prescription.author?.user && (
            <Card className="mb-6 rounded-lg border border-gray-200 bg-white">
              <div className="p-6">
                <h2 className="text-xl font-bold text-[#361951] mb-4">
                  Información del Doctor
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nombre</p>
                    <p className="font-medium text-gray-800">
                      {prescription.author.user.name}
                    </p>
                  </div>
                  {prescription.author.specialty && (
                    <div>
                      <p className="text-sm text-gray-600">Especialidad</p>
                      <p className="font-medium text-gray-800">
                        {prescription.author.specialty}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-800">
                      {prescription.author.user.email}
                    </p>
                  </div>
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
                          <p className="font-medium text-gray-800">{item.dosage}</p>
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
                  Esta prescripción fue consumida el {formatDate(prescription.consumedAt)}
                </p>
              </div>
            </Card>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            {prescription.status === PrescriptionStatus.pending && (
              <Button
                onClick={handleConsume}
                variant="secondary"
                size="lg"
                disabled={isConsuming}
                className="flex-1"
              >
                {isConsuming ? 'Procesando...' : 'Marcar como Consumida'}
              </Button>
            )}
            <Button
              onClick={handleDownloadPDF}
              variant="primary"
              size="lg"
              disabled={isDownloading}
              className="flex-1"
            >
              {isDownloading ? 'Descargando...' : 'Descargar PDF'}
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Confirmar consumo"
        message="¿Estás seguro de marcar esta prescripción como consumida? Esta acción no se puede deshacer."
        confirmLabel="Sí, marcar como consumida"
        cancelLabel="Cancelar"
        onConfirm={confirmConsume}
        onCancel={() => setShowConfirmDialog(false)}
        variant="secondary"
      />
    </AuthGuard>
  );
};

export default PatientPrescriptionDetailPage;
