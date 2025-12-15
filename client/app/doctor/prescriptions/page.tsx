'use client';

import { AuthGuard } from '@/lib/guards';

const DoctorPrescriptionsPage = () => {
  return (
    <AuthGuard requiredRole="doctor">
      <div>
        <h1>Doctor - Prescripciones</h1>
        {/* Lista de prescripciones del doctor */}
      </div>
    </AuthGuard>
  );
};

export default DoctorPrescriptionsPage;
