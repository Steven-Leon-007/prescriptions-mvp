'use client';

import { AuthGuard } from '@/lib/guards';

interface PrescriptionDetailPageProps {
  params: {
    id: string;
  };
}

const PrescriptionDetailPage = ({ params }: PrescriptionDetailPageProps) => {
  return (
    <AuthGuard requiredRole="doctor">
      <div>
        <h1>Detalle de Prescripción - {params.id}</h1>
        {/* Detalle y edición de prescripción */}
      </div>
    </AuthGuard>
  );
};

export default PrescriptionDetailPage;
