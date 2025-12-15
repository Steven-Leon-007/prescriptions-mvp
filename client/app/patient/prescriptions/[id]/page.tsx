'use client';

import { AuthGuard } from '@/lib/guards';

interface PatientPrescriptionDetailPageProps {
  params: {
    id: string;
  };
}

const PatientPrescriptionDetailPage = ({ params }: PatientPrescriptionDetailPageProps) => {
  return (
    <AuthGuard requiredRole="patient">
      <div>
        <h1>Detalle de Prescripción - {params.id}</h1>
        {/* Ver detalle de prescripción (solo lectura) */}
      </div>
    </AuthGuard>
  );
};

export default PatientPrescriptionDetailPage;
