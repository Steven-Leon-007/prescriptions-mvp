'use client';

import { AuthGuard } from '@/lib/guards';

const PatientPrescriptionsPage = () => {
  return (
    <AuthGuard requiredRole="patient">
      <div>
        <h1>Mis Prescripciones</h1>
        {/* Lista de prescripciones del paciente */}
      </div>
    </AuthGuard>
  );
};

export default PatientPrescriptionsPage;
